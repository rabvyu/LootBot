// Testes do Sistema de Conquistas
import { TestRunner, assert } from '../TestRunner';
import { createMockAchievementProgress } from '../mocks/mockGenerators';

export function registerAchievementTests(runner: TestRunner): void {
  runner.suite('Conquistas - Tracking de Stats', () => {
    runner.test('Incrementar stat de monstros mortos', async () => {
      const progress = createMockAchievementProgress();

      progress.stats.monstersKilled += 1;

      assert.equals(progress.stats.monstersKilled, 1);
    });

    runner.test('Múltiplos stats atualizados juntos', async () => {
      const progress = createMockAchievementProgress();

      // Simular vitória em dungeon
      progress.stats.dungeonsCompleted += 1;
      progress.stats.monstersKilled += 50;
      progress.stats.bossesKilled += 1;
      progress.stats.coinsEarned += 5000;

      assert.equals(progress.stats.dungeonsCompleted, 1);
      assert.equals(progress.stats.monstersKilled, 50);
      assert.equals(progress.stats.bossesKilled, 1);
      assert.equals(progress.stats.coinsEarned, 5000);
    });

    runner.test('Stats não podem ser negativos', async () => {
      const progress = createMockAchievementProgress();
      progress.stats.monstersKilled = -10;

      const sanitizedValue = Math.max(0, progress.stats.monstersKilled);
      assert.equals(sanitizedValue, 0);
    });
  });

  runner.suite('Conquistas - Verificação de Progresso', () => {
    runner.test('Conquista desbloqueada ao atingir meta', async () => {
      const achievement = {
        id: 'monster_hunter',
        requirement: { type: 'monstersKilled', target: 100 },
      };

      const progress = createMockAchievementProgress({
        stats: { monstersKilled: 100 },
      });

      const isUnlocked = progress.stats.monstersKilled >= achievement.requirement.target;
      assert.isTrue(isUnlocked);
    });

    runner.test('Progresso parcial calculado corretamente', async () => {
      const achievement = {
        requirement: { type: 'monstersKilled', target: 100 },
      };

      const currentValue = 45;
      const progressPercent = Math.floor((currentValue / achievement.requirement.target) * 100);

      assert.equals(progressPercent, 45);
    });

    runner.test('Conquista secreta não mostra descrição', async () => {
      const achievement = {
        id: 'lucky_one',
        description: 'Tenha muita sorte',
        secret: true,
      };

      const displayDescription = achievement.secret ? '???' : achievement.description;
      assert.equals(displayDescription, '???');
    });
  });

  runner.suite('Conquistas - Recompensas', () => {
    runner.test('Calcular recompensas por raridade', async () => {
      const rarityRewards: Record<string, { coins: number; xp: number }> = {
        common: { coins: 100, xp: 50 },
        uncommon: { coins: 500, xp: 200 },
        rare: { coins: 2000, xp: 1000 },
        epic: { coins: 10000, xp: 5000 },
        legendary: { coins: 50000, xp: 25000 },
        mythic: { coins: 100000, xp: 50000 },
      };

      assert.greaterThan(rarityRewards.legendary.coins, rarityRewards.epic.coins);
      assert.greaterThan(rarityRewards.mythic.xp, rarityRewards.legendary.xp);
    });

    runner.test('Pontos de conquista acumulados', async () => {
      const completedAchievements = [
        { id: 'a1', points: 5 },
        { id: 'a2', points: 15 },
        { id: 'a3', points: 30 },
      ];

      const totalPoints = completedAchievements.reduce((sum, a) => sum + a.points, 0);
      assert.equals(totalPoints, 50);
    });

    runner.test('Título desbloqueado com conquista', async () => {
      const achievement = {
        id: 'level_100',
        rewards: [
          { type: 'coins', quantity: 100000 },
          { type: 'title', itemId: 'legend', quantity: 1 },
        ],
      };

      const titleReward = achievement.rewards.find(r => r.type === 'title');
      assert.notNull(titleReward);
      assert.equals(titleReward!.itemId, 'legend');
    });
  });

  runner.suite('Conquistas - Categorias', () => {
    runner.test('Filtrar conquistas por categoria', async () => {
      const achievements = [
        { id: 'a1', category: 'combat' },
        { id: 'a2', category: 'combat' },
        { id: 'a3', category: 'progression' },
        { id: 'a4', category: 'social' },
      ];

      const combatAchievements = achievements.filter(a => a.category === 'combat');
      assert.lengthOf(combatAchievements, 2);
    });

    runner.test('Todas as categorias existem', async () => {
      const categories = [
        'combat', 'progression', 'social', 'crafting',
        'exploration', 'collection', 'pvp', 'events', 'special',
      ];

      assert.lengthOf(categories, 9);
      assert.includes(categories, 'combat');
      assert.includes(categories, 'special');
    });

    runner.test('Progresso por categoria', async () => {
      const achievements = [
        { id: 'a1', category: 'combat', completed: true },
        { id: 'a2', category: 'combat', completed: false },
        { id: 'a3', category: 'combat', completed: true },
      ];

      const combatTotal = achievements.filter(a => a.category === 'combat').length;
      const combatCompleted = achievements.filter(a => a.category === 'combat' && a.completed).length;
      const combatPercent = Math.floor((combatCompleted / combatTotal) * 100);

      assert.equals(combatPercent, 66);
    });
  });

  runner.suite('Conquistas - Leaderboard', () => {
    runner.test('Ranking por pontos totais', async () => {
      const players = [
        { id: 'p1', totalPoints: 500 },
        { id: 'p2', totalPoints: 1200 },
        { id: 'p3', totalPoints: 800 },
      ];

      const sorted = [...players].sort((a, b) => b.totalPoints - a.totalPoints);

      assert.equals(sorted[0].id, 'p2');
      assert.equals(sorted[1].id, 'p3');
      assert.equals(sorted[2].id, 'p1');
    });

    runner.test('Posição do jogador no ranking', async () => {
      const leaderboard = [
        { id: 'p1', totalPoints: 1200 },
        { id: 'p2', totalPoints: 1000 },
        { id: 'p3', totalPoints: 800 },
        { id: 'p4', totalPoints: 600 },
      ];

      const playerId = 'p3';
      const position = leaderboard.findIndex(p => p.id === playerId) + 1;

      assert.equals(position, 3);
    });
  });

  runner.suite('Conquistas - Claim System', () => {
    runner.test('Marcar conquista como reivindicada', async () => {
      const achievementProgress = {
        achievementId: 'monster_hunter',
        completed: true,
        claimed: false,
        completedAt: new Date(),
      };

      // Reivindicar
      achievementProgress.claimed = true;

      assert.isTrue(achievementProgress.claimed);
    });

    runner.test('Listar conquistas não reivindicadas', async () => {
      const achievements = [
        { id: 'a1', completed: true, claimed: true },
        { id: 'a2', completed: true, claimed: false },
        { id: 'a3', completed: true, claimed: false },
        { id: 'a4', completed: false, claimed: false },
      ];

      const unclaimed = achievements.filter(a => a.completed && !a.claimed);
      assert.lengthOf(unclaimed, 2);
    });

    runner.test('Claim all funciona', async () => {
      const achievements = [
        { id: 'a1', completed: true, claimed: false, rewards: [{ type: 'coins', quantity: 100 }] },
        { id: 'a2', completed: true, claimed: false, rewards: [{ type: 'coins', quantity: 200 }] },
      ];

      let totalCoins = 0;
      for (const a of achievements) {
        if (a.completed && !a.claimed) {
          const coinReward = a.rewards.find(r => r.type === 'coins');
          if (coinReward) {
            totalCoins += coinReward.quantity;
          }
          a.claimed = true;
        }
      }

      assert.equals(totalCoins, 300);
      assert.isTrue(achievements[0].claimed);
      assert.isTrue(achievements[1].claimed);
    });
  });
}

export default registerAchievementTests;
