// Testes do Sistema de Estatísticas e Dashboard
import { TestRunner, assert } from '../TestRunner';

export function registerStatsTests(runner: TestRunner): void {
  runner.suite('Stats - Estatísticas de Combate', () => {
    runner.test('Registrar dano causado', async () => {
      const combat = { totalDamageDealt: 10000 };
      const damageDealt = 500;

      combat.totalDamageDealt += damageDealt;
      assert.equals(combat.totalDamageDealt, 10500);
    });

    runner.test('Atualizar recorde de maior hit', async () => {
      const records = { highestHit: 1500 };

      const newHit = 2000;
      if (newHit > records.highestHit) {
        records.highestHit = newHit;
      }

      assert.equals(records.highestHit, 2000);
    });

    runner.test('Calcular K/D ratio', async () => {
      const combat = { monstersKilled: 1000, deaths: 50 };

      const kdRatio = combat.monstersKilled / combat.deaths;
      assert.equals(kdRatio, 20);
    });

    runner.test('Estatísticas de crítico', async () => {
      const combat = { criticalHits: 500, totalAttacks: 2000 };

      const critRate = (combat.criticalHits / combat.totalAttacks) * 100;
      assert.equals(critRate, 25);
    });
  });

  runner.suite('Stats - Estatísticas PvP', () => {
    runner.test('Registrar vitória PvP', async () => {
      const pvp = { wins: 50, losses: 30, winStreak: 3 };

      pvp.wins++;
      pvp.winStreak++;

      assert.equals(pvp.wins, 51);
      assert.equals(pvp.winStreak, 4);
    });

    runner.test('Registrar derrota e reset streak', async () => {
      const pvp = { wins: 50, losses: 30, winStreak: 5, bestWinStreak: 5 };

      pvp.losses++;
      if (pvp.winStreak > pvp.bestWinStreak) {
        pvp.bestWinStreak = pvp.winStreak;
      }
      pvp.winStreak = 0;

      assert.equals(pvp.losses, 31);
      assert.equals(pvp.winStreak, 0);
      assert.equals(pvp.bestWinStreak, 5);
    });

    runner.test('Calcular win rate', async () => {
      const pvp = { wins: 75, losses: 25 };

      const totalMatches = pvp.wins + pvp.losses;
      const winRate = (pvp.wins / totalMatches) * 100;

      assert.equals(winRate, 75);
    });
  });

  runner.suite('Stats - Estatísticas de Economia', () => {
    runner.test('Registrar coins ganhas', async () => {
      const economy = { totalCoinsEarned: 100000, totalCoinsSpent: 50000 };

      economy.totalCoinsEarned += 5000;
      assert.equals(economy.totalCoinsEarned, 105000);
    });

    runner.test('Calcular balanço líquido', async () => {
      const economy = { totalCoinsEarned: 100000, totalCoinsSpent: 60000 };

      const netBalance = economy.totalCoinsEarned - economy.totalCoinsSpent;
      assert.equals(netBalance, 40000);
    });

    runner.test('Estatísticas de trading', async () => {
      const economy = { tradesCompleted: 50, itemsSold: 200, itemsBought: 150 };

      assert.greaterThan(economy.tradesCompleted, 0);
      assert.greaterThan(economy.itemsSold, economy.itemsBought);
    });
  });

  runner.suite('Stats - Estatísticas de Progressão', () => {
    runner.test('Registrar XP ganho', async () => {
      const progression = { totalXpGained: 500000 };

      progression.totalXpGained += 10000;
      assert.equals(progression.totalXpGained, 510000);
    });

    runner.test('Contar quests completadas', async () => {
      const progression = {
        questsCompleted: 100,
        dailyQuestsCompleted: 50,
        weeklyQuestsCompleted: 20,
      };

      progression.questsCompleted++;
      progression.dailyQuestsCompleted++;

      assert.equals(progression.questsCompleted, 101);
      assert.equals(progression.dailyQuestsCompleted, 51);
    });

    runner.test('Formatar tempo de jogo', async () => {
      const totalMinutes = 3725; // 62 horas e 5 minutos

      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const formatted = `${hours}h ${minutes}m`;

      assert.equals(formatted, '62h 5m');
    });
  });

  runner.suite('Stats - Snapshots Diários', () => {
    runner.test('Criar snapshot do dia', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const snapshot = {
        date: today,
        xpGained: 5000,
        coinsGained: 10000,
        coinsSpent: 3000,
        monstersKilled: 200,
        questsCompleted: 5,
        playtime: 120,
      };

      assert.equals(snapshot.xpGained, 5000);
      assert.greaterThan(snapshot.playtime, 0);
    });

    runner.test('Atualizar snapshot existente', async () => {
      const snapshot = {
        xpGained: 5000,
        coinsGained: 10000,
        monstersKilled: 200,
      };

      // Adicionar mais atividade
      snapshot.xpGained += 1000;
      snapshot.coinsGained += 2000;
      snapshot.monstersKilled += 50;

      assert.equals(snapshot.xpGained, 6000);
      assert.equals(snapshot.monstersKilled, 250);
    });

    runner.test('Calcular médias de 7 dias', async () => {
      const snapshots = [
        { xpGained: 5000 },
        { xpGained: 6000 },
        { xpGained: 4000 },
        { xpGained: 7000 },
        { xpGained: 5500 },
        { xpGained: 6500 },
        { xpGained: 5000 },
      ];

      const totalXp = snapshots.reduce((sum, s) => sum + s.xpGained, 0);
      const avgXp = Math.floor(totalXp / snapshots.length);

      assert.equals(avgXp, 5571);
    });

    runner.test('Comparar com média', async () => {
      const avgXp = 5000;
      const todayXp = 7500;

      const comparedToAverage = Math.floor(((todayXp - avgXp) / avgXp) * 100);
      assert.equals(comparedToAverage, 50); // 50% acima da média
    });
  });

  runner.suite('Stats - Leaderboards', () => {
    runner.test('Ordenar por valor', async () => {
      const entries = [
        { username: 'Player1', value: 10000 },
        { username: 'Player2', value: 25000 },
        { username: 'Player3', value: 15000 },
      ];

      const sorted = [...entries].sort((a, b) => b.value - a.value);

      assert.equals(sorted[0].username, 'Player2');
      assert.equals(sorted[1].username, 'Player3');
      assert.equals(sorted[2].username, 'Player1');
    });

    runner.test('Atribuir ranks', async () => {
      const entries = [
        { username: 'Player1', value: 25000 },
        { username: 'Player2', value: 20000 },
        { username: 'Player3', value: 15000 },
      ];

      const ranked = entries.map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

      assert.equals(ranked[0].rank, 1);
      assert.equals(ranked[1].rank, 2);
      assert.equals(ranked[2].rank, 3);
    });

    runner.test('Detectar mudança de rank', async () => {
      const entry = { rank: 5, previousRank: 8 };

      const rankChange = entry.previousRank - entry.rank;
      const improved = rankChange > 0;

      assert.isTrue(improved);
      assert.equals(rankChange, 3);
    });

    runner.test('Top 10 leaderboard', async () => {
      const allEntries = Array.from({ length: 100 }, (_, i) => ({
        username: `Player${i + 1}`,
        value: Math.floor(Math.random() * 100000),
      }));

      const sorted = [...allEntries].sort((a, b) => b.value - a.value);
      const top10 = sorted.slice(0, 10);

      assert.lengthOf(top10, 10);
      assert.greaterThan(top10[0].value, top10[9].value);
    });
  });

  runner.suite('Stats - Milestones', () => {
    runner.test('Verificar milestone atingido', async () => {
      const stat = { monstersKilled: 1050 };
      const thresholds = [100, 500, 1000, 5000, 10000];

      const achievedThresholds = thresholds.filter(t => stat.monstersKilled >= t);
      assert.lengthOf(achievedThresholds, 3); // 100, 500, 1000
    });

    runner.test('Calcular progresso para próximo milestone', async () => {
      const current = 750;
      const nextThreshold = 1000;

      const progress = Math.floor((current / nextThreshold) * 100);
      assert.equals(progress, 75);
    });

    runner.test('Determinar tier do milestone', async () => {
      const thresholds = [100, 500, 1000, 5000, 10000];
      const current = 3500;

      let tier = 0;
      for (let i = 0; i < thresholds.length; i++) {
        if (current >= thresholds[i]) {
          tier = i + 1;
        }
      }

      assert.equals(tier, 3); // Passou 100, 500, 1000
    });

    runner.test('Calcular recompensa de milestone', async () => {
      const rewards = [
        { tier: 1, coins: 500 },
        { tier: 2, coins: 2000 },
        { tier: 3, coins: 5000 },
        { tier: 4, coins: 15000 },
        { tier: 5, coins: 50000 },
      ];

      const tier = 3;
      const reward = rewards.find(r => r.tier === tier);

      assert.notNull(reward);
      assert.equals(reward?.coins, 5000);
    });
  });

  runner.suite('Stats - Dashboard Completo', () => {
    runner.test('Gerar resumo de atividade', async () => {
      const stats = {
        combat: { monstersKilled: 5000 },
        pvp: { totalMatches: 100 },
        dungeons: { dungeonsCompleted: 50 },
        minigames: { fishCaught: 200 },
        progression: { questsCompleted: 150 },
      };

      const activities = [
        { name: 'Combate', value: stats.combat.monstersKilled },
        { name: 'PvP', value: stats.pvp.totalMatches },
        { name: 'Dungeons', value: stats.dungeons.dungeonsCompleted },
        { name: 'Pesca', value: stats.minigames.fishCaught },
        { name: 'Quests', value: stats.progression.questsCompleted },
      ];

      const favorite = activities.reduce((a, b) => (a.value > b.value ? a : b));
      assert.equals(favorite.name, 'Combate');
    });

    runner.test('Calcular rank geral', async () => {
      const ranks = {
        xp: 15,
        coins: 25,
        pvp: 10,
        dungeons: 30,
      };

      const rankValues = Object.values(ranks);
      const avgRank = Math.floor(
        rankValues.reduce((a, b) => a + b, 0) / rankValues.length
      );

      assert.equals(avgRank, 20);
    });

    runner.test('Identificar dia mais ativo', async () => {
      const snapshots = [
        { date: 'Monday', xpGained: 5000 },
        { date: 'Tuesday', xpGained: 8000 },
        { date: 'Wednesday', xpGained: 4000 },
        { date: 'Thursday', xpGained: 6000 },
      ];

      const mostActive = snapshots.reduce((a, b) =>
        a.xpGained > b.xpGained ? a : b
      );

      assert.equals(mostActive.date, 'Tuesday');
    });

    runner.test('Comparar dois jogadores', async () => {
      const player1 = { monstersKilled: 5000, wins: 100, coinsEarned: 500000 };
      const player2 = { monstersKilled: 4000, wins: 150, coinsEarned: 600000 };

      const comparison = [
        { stat: 'monstersKilled', p1: player1.monstersKilled, p2: player2.monstersKilled },
        { stat: 'wins', p1: player1.wins, p2: player2.wins },
        { stat: 'coinsEarned', p1: player1.coinsEarned, p2: player2.coinsEarned },
      ];

      const p1Wins = comparison.filter(c => c.p1 > c.p2).length;
      const p2Wins = comparison.filter(c => c.p2 > c.p1).length;

      assert.equals(p1Wins, 1);
      assert.equals(p2Wins, 2);
    });
  });

  runner.suite('Stats - Recordes Pessoais', () => {
    runner.test('Atualizar recorde se maior', async () => {
      const records = { highestDamageInOneRun: 50000 };
      const newDamage = 75000;

      if (newDamage > records.highestDamageInOneRun) {
        records.highestDamageInOneRun = newDamage;
      }

      assert.equals(records.highestDamageInOneRun, 75000);
    });

    runner.test('Não atualizar recorde se menor', async () => {
      const records = { highestDamageInOneRun: 50000 };
      const newDamage = 30000;

      if (newDamage > records.highestDamageInOneRun) {
        records.highestDamageInOneRun = newDamage;
      }

      assert.equals(records.highestDamageInOneRun, 50000);
    });

    runner.test('Formatar recorde de tempo', async () => {
      const fastestClear = 185; // segundos

      const minutes = Math.floor(fastestClear / 60);
      const seconds = fastestClear % 60;
      const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      assert.equals(formatted, '3:05');
    });
  });
}

export default registerStatsTests;
