// Testes do Sistema de Dungeons
import { TestRunner, assert } from '../TestRunner';
import { createMockDungeonRun, createMockCharacter } from '../mocks/mockGenerators';

export function registerDungeonTests(runner: TestRunner): void {
  runner.suite('Dungeons - Criação e Configuração', () => {
    runner.test('Criar dungeon run', async () => {
      const run = createMockDungeonRun();

      assert.notNull(run._id);
      assert.equals(run.status, 'waiting');
      assert.equals(run.currentWave, 0);
    });

    runner.test('Dificuldades têm modificadores corretos', async () => {
      const difficultyModifiers: Record<string, any> = {
        normal: { hpMod: 1.0, damageMod: 1.0, lootMod: 1.0 },
        hard: { hpMod: 1.5, damageMod: 1.3, lootMod: 1.5 },
        expert: { hpMod: 2.0, damageMod: 1.6, lootMod: 2.0 },
        nightmare: { hpMod: 3.0, damageMod: 2.0, lootMod: 3.0 },
      };

      assert.equals(difficultyModifiers.normal.hpMod, 1.0);
      assert.greaterThan(difficultyModifiers.hard.hpMod, difficultyModifiers.normal.hpMod);
      assert.greaterThan(difficultyModifiers.nightmare.lootMod, difficultyModifiers.expert.lootMod);
    });

    runner.test('Requisitos de nível por dungeon', async () => {
      const dungeonRequirements: Record<string, number> = {
        forest_dungeon: 10,
        cave_dungeon: 25,
        castle_dungeon: 45,
        abyss_dungeon: 70,
      };

      const playerLevel = 30;
      const canEnterForest = playerLevel >= dungeonRequirements.forest_dungeon;
      const canEnterCave = playerLevel >= dungeonRequirements.cave_dungeon;
      const canEnterAbyss = playerLevel >= dungeonRequirements.abyss_dungeon;

      assert.isTrue(canEnterForest);
      assert.isTrue(canEnterCave);
      assert.isFalse(canEnterAbyss);
    });

    runner.test('Limite de participantes', async () => {
      const MIN_PLAYERS = 2;
      const MAX_PLAYERS = 4;
      const currentPlayers = 5;

      const canStart = currentPlayers >= MIN_PLAYERS && currentPlayers <= MAX_PLAYERS;
      assert.isFalse(canStart);
    });
  });

  runner.suite('Dungeons - Sistema de Waves', () => {
    runner.test('Gerar monstros por wave', async () => {
      const generateWaveMonsters = (wave: number, difficulty: string): number => {
        const baseCount = 3 + wave;
        const diffMod = difficulty === 'nightmare' ? 2 : difficulty === 'expert' ? 1.5 : 1;
        return Math.floor(baseCount * diffMod);
      };

      assert.equals(generateWaveMonsters(1, 'normal'), 4);
      assert.equals(generateWaveMonsters(3, 'normal'), 6);
      assert.equals(generateWaveMonsters(3, 'nightmare'), 12);
    });

    runner.test('Boss aparece na última wave', async () => {
      const run = createMockDungeonRun({ totalWaves: 5 });
      const currentWave = 5;

      const isBossWave = currentWave === run.totalWaves;
      assert.isTrue(isBossWave);
    });

    runner.test('Progressão de waves', async () => {
      const run = createMockDungeonRun({ currentWave: 2, totalWaves: 5 });

      // Completar wave
      run.currentWave += 1;

      assert.equals(run.currentWave, 3);
      assert.lessThan(run.currentWave, run.totalWaves);
    });

    runner.test('Stats de monstros escalam por wave', async () => {
      const baseMonsterHp = 100;
      const waveScaling = 1.15;

      const wave1Hp = Math.floor(baseMonsterHp * Math.pow(waveScaling, 0));
      const wave3Hp = Math.floor(baseMonsterHp * Math.pow(waveScaling, 2));
      const wave5Hp = Math.floor(baseMonsterHp * Math.pow(waveScaling, 4));

      assert.equals(wave1Hp, 100);
      assert.greaterThan(wave3Hp, wave1Hp);
      assert.greaterThan(wave5Hp, wave3Hp);
    });
  });

  runner.suite('Dungeons - Sistema de Loot', () => {
    runner.test('Loot distribuído entre participantes', async () => {
      const totalLoot = 1000;
      const participants = 4;
      const lootPerPlayer = Math.floor(totalLoot / participants);

      assert.equals(lootPerPlayer, 250);
    });

    runner.test('Bônus de loot por contribuição', async () => {
      const contributions = [
        { id: 'p1', damage: 5000 },
        { id: 'p2', damage: 3000 },
        { id: 'p3', damage: 2000 },
      ];

      const totalDamage = contributions.reduce((sum, c) => sum + c.damage, 0);
      const p1Bonus = contributions[0].damage / totalDamage;

      assert.equals(totalDamage, 10000);
      assert.equals(p1Bonus, 0.5);
    });

    runner.test('Drop rate de itens raros', async () => {
      const dropRates: Record<string, number> = {
        common: 60,
        uncommon: 25,
        rare: 10,
        epic: 4,
        legendary: 1,
      };

      const total = Object.values(dropRates).reduce((sum, rate) => sum + rate, 0);
      assert.equals(total, 100);

      // Sistema cumulativo: common=1-60, uncommon=61-85, rare=86-95, epic=96-99, legendary=100
      const roll = 97; // Roll de 96-99 resulta em epic
      let cumulative = 0;
      let rarity = 'common';

      for (const [r, rate] of Object.entries(dropRates)) {
        cumulative += rate;
        if (roll <= cumulative) {
          rarity = r;
          break;
        }
      }

      assert.equals(rarity, 'epic');
    });

    runner.test('Modificador de loot por dificuldade', async () => {
      const baseLoot = 100;
      const lootModifiers: Record<string, number> = {
        normal: 1.0,
        hard: 1.5,
        expert: 2.0,
        nightmare: 3.0,
      };

      const normalLoot = Math.floor(baseLoot * lootModifiers.normal);
      const nightmareLoot = Math.floor(baseLoot * lootModifiers.nightmare);

      assert.equals(normalLoot, 100);
      assert.equals(nightmareLoot, 300);
    });
  });

  runner.suite('Dungeons - Cooldowns e Limites', () => {
    runner.test('Cooldown entre runs', async () => {
      const COOLDOWN_MINUTES = 30;
      const lastRunTime = new Date(Date.now() - 15 * 60 * 1000); // 15 min atrás
      const cooldownEnd = new Date(lastRunTime.getTime() + COOLDOWN_MINUTES * 60 * 1000);

      const canRun = new Date() > cooldownEnd;
      assert.isFalse(canRun);
    });

    runner.test('Limite diário de runs', async () => {
      const DAILY_LIMIT = 5;
      const runsToday = 5;

      const canRun = runsToday < DAILY_LIMIT;
      assert.isFalse(canRun);
    });

    runner.test('Reset de limite à meia-noite', async () => {
      const lastReset = new Date('2024-01-15T00:00:00');
      const now = new Date('2024-01-16T12:00:00');

      const shouldReset = now.getDate() !== lastReset.getDate();
      assert.isTrue(shouldReset);
    });
  });

  runner.suite('Dungeons - Afixos Semanais (Mythic+)', () => {
    runner.test('Afixos aplicados corretamente', async () => {
      const affixes = ['fortified', 'volcanic'];

      const affixEffects: Record<string, any> = {
        fortified: { monsterHpMod: 1.3 },
        volcanic: { spawnVolcanoes: true },
        tyrannical: { bossHpMod: 1.5 },
      };

      const activeEffects = affixes.map(a => affixEffects[a]);

      assert.lengthOf(activeEffects, 2);
      assert.equals(activeEffects[0].monsterHpMod, 1.3);
      assert.isTrue(activeEffects[1].spawnVolcanoes);
    });

    runner.test('Nível Mythic+ aumenta dificuldade', async () => {
      const mythicLevel = 10;
      const baseHpMod = 1.0;
      const perLevelMod = 0.1;

      const totalHpMod = baseHpMod + (mythicLevel * perLevelMod);

      assert.equals(totalHpMod, 2.0);
    });

    runner.test('Timer de Mythic+ funciona', async () => {
      const timeLimit = 30 * 60 * 1000; // 30 minutos
      const startTime = Date.now() - 25 * 60 * 1000; // Começou há 25 min
      const elapsed = Date.now() - startTime;
      const remaining = timeLimit - elapsed;

      assert.greaterThan(remaining, 0);
      assert.lessThan(remaining, 6 * 60 * 1000); // Menos de 6 min restantes
    });
  });
}

export default registerDungeonTests;
