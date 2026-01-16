// Testes do Sistema de PvP e Arena
import { TestRunner, assert } from '../TestRunner';
import { createMockArenaMatch, createMockCharacter } from '../mocks/mockGenerators';

export function registerPvPTests(runner: TestRunner): void {
  runner.suite('PvP - Sistema de Rating', () => {
    runner.test('Cálculo de rating Elo básico', async () => {
      const calculateEloChange = (
        playerRating: number,
        opponentRating: number,
        won: boolean,
        kFactor: number = 32
      ): number => {
        const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
        const actualScore = won ? 1 : 0;
        return Math.round(kFactor * (actualScore - expectedScore));
      };

      // Jogador com rating igual ganha
      const change1 = calculateEloChange(1000, 1000, true);
      assert.equals(change1, 16);

      // Jogador com rating igual perde
      const change2 = calculateEloChange(1000, 1000, false);
      assert.equals(change2, -16);

      // Underdog ganha (mais pontos)
      const change3 = calculateEloChange(800, 1200, true);
      assert.greaterThan(change3, 20);

      // Favorito perde (perde mais pontos)
      const change4 = calculateEloChange(1200, 800, false);
      assert.lessThan(change4, -20);
    });

    runner.test('Rating não pode ficar negativo', async () => {
      const currentRating = 50;
      const ratingLoss = -100;
      const newRating = Math.max(0, currentRating + ratingLoss);

      assert.equals(newRating, 0);
    });

    runner.test('Ranks baseados em rating', async () => {
      const getRank = (rating: number): string => {
        if (rating >= 2600) return 'legend';
        if (rating >= 2300) return 'master';
        if (rating >= 2000) return 'diamond';
        if (rating >= 1700) return 'platinum';
        if (rating >= 1400) return 'gold';
        if (rating >= 1000) return 'silver';
        return 'bronze';
      };

      assert.equals(getRank(500), 'bronze');
      assert.equals(getRank(1200), 'silver');
      assert.equals(getRank(1500), 'gold');
      assert.equals(getRank(2100), 'diamond');
      assert.equals(getRank(2700), 'legend');
    });
  });

  runner.suite('PvP - Matchmaking', () => {
    runner.test('Encontrar oponente em range de rating', async () => {
      const playerRating = 1500;
      const initialRange = 100;

      const queue = [
        { id: '1', rating: 1200 },
        { id: '2', rating: 1450 },
        { id: '3', rating: 1550 },
        { id: '4', rating: 2000 },
      ];

      const matchesInRange = queue.filter(
        p => Math.abs(p.rating - playerRating) <= initialRange
      );

      assert.lengthOf(matchesInRange, 2);
      assert.equals(matchesInRange[0].id, '2');
      assert.equals(matchesInRange[1].id, '3');
    });

    runner.test('Range expande com tempo de espera', async () => {
      const calculateRange = (waitTimeSeconds: number): number => {
        const baseRange = 100;
        const expansionRate = 50; // +50 a cada 30 segundos
        const expansions = Math.floor(waitTimeSeconds / 30);
        return baseRange + (expansions * expansionRate);
      };

      assert.equals(calculateRange(0), 100);
      assert.equals(calculateRange(30), 150);
      assert.equals(calculateRange(60), 200);
      assert.equals(calculateRange(120), 300);
    });

    runner.test('Timeout de matchmaking', async () => {
      const MAX_WAIT_TIME = 300; // 5 minutos
      const waitTime = 350;

      const shouldTimeout = waitTime > MAX_WAIT_TIME;
      assert.isTrue(shouldTimeout);
    });
  });

  runner.suite('PvP - Simulação de Combate', () => {
    runner.test('Primeiro ataque baseado em speed', async () => {
      const player1 = createMockCharacter({ stats: { speed: 100 } });
      const player2 = createMockCharacter({ stats: { speed: 80 } });

      const firstAttacker = player1.stats.speed >= player2.stats.speed ? player1 : player2;

      assert.equals(firstAttacker, player1);
    });

    runner.test('Dano reduzido por defesa', async () => {
      const calculatePvPDamage = (attack: number, defense: number): number => {
        const reduction = defense / (defense + 100);
        return Math.floor(attack * (1 - reduction));
      };

      const damage1 = calculatePvPDamage(100, 50);
      const damage2 = calculatePvPDamage(100, 100);
      const damage3 = calculatePvPDamage(100, 200);

      assert.greaterThan(damage1, damage2);
      assert.greaterThan(damage2, damage3);
    });

    runner.test('Vitória quando HP adversário <= 0', async () => {
      const player1Hp = 50;
      const player2Hp = 0;

      const winner = player2Hp <= 0 ? 'player1' : player1Hp <= 0 ? 'player2' : null;

      assert.equals(winner, 'player1');
    });

    runner.test('Empate após máximo de rounds', async () => {
      const MAX_ROUNDS = 30;
      const currentRound = 30;
      const player1Hp = 100;
      const player2Hp = 100;

      const isDraw = currentRound >= MAX_ROUNDS && player1Hp > 0 && player2Hp > 0;
      assert.isTrue(isDraw);
    });
  });

  runner.suite('PvP - Temporadas', () => {
    runner.test('Reset de rating no fim da temporada', async () => {
      const currentRating = 2500;
      const baseRating = 1000;
      const carryoverPercent = 0.2;

      const newSeasonRating = baseRating + Math.floor((currentRating - baseRating) * carryoverPercent);

      assert.equals(newSeasonRating, 1300);
    });

    runner.test('Recompensas por rank final', async () => {
      const rankRewards: Record<string, any> = {
        bronze: { coins: 1000, materials: 5 },
        silver: { coins: 5000, materials: 10 },
        gold: { coins: 15000, materials: 20, title: 'Gladiador' },
        platinum: { coins: 30000, materials: 30, title: 'Campeão' },
        diamond: { coins: 50000, materials: 50, title: 'Diamante' },
        master: { coins: 100000, materials: 75, title: 'Mestre' },
        legend: { coins: 250000, materials: 100, title: 'Lenda' },
      };

      const playerRank = 'gold';
      const rewards = rankRewards[playerRank];

      assert.notNull(rewards);
      assert.equals(rewards.coins, 15000);
      assert.equals(rewards.title, 'Gladiador');
    });

    runner.test('Decay de rating para inatividade', async () => {
      const rating = 2100;
      const daysSinceLastGame = 14;
      const decayPerWeek = 50;
      const minRatingForDecay = 2000;

      let finalRating = rating;
      if (rating >= minRatingForDecay && daysSinceLastGame >= 7) {
        const weeks = Math.floor(daysSinceLastGame / 7);
        const totalDecay = weeks * decayPerWeek;
        finalRating = Math.max(minRatingForDecay, rating - totalDecay);
      }

      assert.equals(finalRating, 2000);
    });
  });

  runner.suite('PvP - Guild Wars', () => {
    runner.test('Matchmaking de guildas por level', async () => {
      const guild1 = { level: 10, memberCount: 20 };
      const guild2 = { level: 8, memberCount: 25 };
      const guild3 = { level: 15, memberCount: 18 };

      const targetGuild = { level: 9, memberCount: 22 };
      const maxLevelDiff = 3;

      const validOpponents = [guild1, guild2, guild3].filter(
        g => Math.abs(g.level - targetGuild.level) <= maxLevelDiff
      );

      assert.lengthOf(validOpponents, 2);
    });

    runner.test('Pontuação de guild war', async () => {
      const battles = [
        { winnerId: 'guild1', loserId: 'guild2' },
        { winnerId: 'guild1', loserId: 'guild2' },
        { winnerId: 'guild2', loserId: 'guild1' },
      ];

      const scores: Record<string, number> = {};
      for (const battle of battles) {
        scores[battle.winnerId] = (scores[battle.winnerId] || 0) + 1;
      }

      assert.equals(scores['guild1'], 2);
      assert.equals(scores['guild2'], 1);
    });
  });
}

export default registerPvPTests;
