// Serviço de Estatísticas e Dashboard
import {
  PlayerStats,
  DailySnapshot,
  LeaderboardEntry,
  Milestone,
  IPlayerStats,
  IDailySnapshot,
  ILeaderboardEntry,
  IMilestone,
  StatsPeriod,
} from '../database/models/Stats';
import { v4 as uuidv4 } from 'uuid';

// Categorias de leaderboard
export const LEADERBOARD_CATEGORIES = [
  'xp',
  'level',
  'coins',
  'monstersKilled',
  'pvpWins',
  'dungeonsCompleted',
  'questsCompleted',
  'achievementPoints',
  'playtime',
  'fishCaught',
];

// Definições de milestones
const MILESTONE_DEFINITIONS = [
  // Combate
  { category: 'combat', name: 'Iniciante em Combate', stat: 'monstersKilled', thresholds: [100, 500, 1000, 5000, 10000] },
  { category: 'combat', name: 'Caçador de Bosses', stat: 'bossesKilled', thresholds: [10, 50, 100, 500, 1000] },
  { category: 'combat', name: 'Sobrevivente', stat: 'deaths', thresholds: [10, 50, 100, 500, 1000], inverse: true },

  // PvP
  { category: 'pvp', name: 'Gladiador', stat: 'wins', thresholds: [10, 50, 100, 500, 1000] },
  { category: 'pvp', name: 'Invicto', stat: 'bestWinStreak', thresholds: [5, 10, 20, 50, 100] },

  // Economia
  { category: 'economy', name: 'Milionário', stat: 'totalCoinsEarned', thresholds: [10000, 100000, 1000000, 10000000, 100000000] },
  { category: 'economy', name: 'Comerciante', stat: 'tradesCompleted', thresholds: [10, 50, 100, 500, 1000] },

  // Progressão
  { category: 'progression', name: 'Aventureiro', stat: 'questsCompleted', thresholds: [10, 50, 100, 500, 1000] },
  { category: 'progression', name: 'Dedicado', stat: 'totalPlaytime', thresholds: [60, 600, 3600, 10000, 50000] },

  // Dungeons
  { category: 'dungeons', name: 'Explorador', stat: 'dungeonsCompleted', thresholds: [10, 50, 100, 500, 1000] },
  { category: 'dungeons', name: 'Escalador', stat: 'towerHighestFloor', thresholds: [10, 25, 50, 75, 100] },

  // Mini-games
  { category: 'minigames', name: 'Pescador', stat: 'fishCaught', thresholds: [50, 200, 500, 1000, 5000] },
  { category: 'minigames', name: 'Minerador', stat: 'oresMined', thresholds: [100, 500, 1000, 5000, 10000] },
];

// ============= ESTATÍSTICAS DO JOGADOR =============

// Obter ou criar estatísticas
export async function getPlayerStats(discordId: string): Promise<IPlayerStats> {
  let stats = await PlayerStats.findOne({ odiscordId: discordId });

  if (!stats) {
    stats = new PlayerStats({ odiscordId: discordId });
    await stats.save();
  }

  return stats;
}

// Atualizar estatísticas
export async function updateStats(
  discordId: string,
  category: keyof IPlayerStats,
  updates: Record<string, number>,
  mode: 'set' | 'increment' = 'increment'
): Promise<IPlayerStats> {
  const updateOp: any = {};

  for (const [key, value] of Object.entries(updates)) {
    const path = `${category}.${key}`;
    if (mode === 'increment') {
      updateOp.$inc = updateOp.$inc || {};
      updateOp.$inc[path] = value;
    } else {
      updateOp.$set = updateOp.$set || {};
      updateOp.$set[path] = value;
    }
  }

  updateOp.$set = updateOp.$set || {};
  updateOp.$set.lastUpdated = new Date();

  const stats = await PlayerStats.findOneAndUpdate(
    { odiscordId: discordId },
    updateOp,
    { new: true, upsert: true }
  );

  // Verificar milestones
  await checkMilestones(discordId, stats!);

  return stats!;
}

// Atualizar recorde
export async function updateRecord(
  discordId: string,
  record: keyof IPlayerStats['records'],
  value: number
): Promise<boolean> {
  const stats = await getPlayerStats(discordId);

  if (value > (stats.records[record] || 0)) {
    stats.records[record] = value;
    stats.lastUpdated = new Date();
    await stats.save();
    return true;
  }

  return false;
}

// Incrementar estatísticas de combate
export async function incrementCombatStats(
  discordId: string,
  stats: Partial<IPlayerStats['combat']>
): Promise<void> {
  await updateStats(discordId, 'combat', stats as Record<string, number>);
}

// Incrementar estatísticas de economia
export async function incrementEconomyStats(
  discordId: string,
  stats: Partial<IPlayerStats['economy']>
): Promise<void> {
  await updateStats(discordId, 'economy', stats as Record<string, number>);
}

// Incrementar estatísticas de progressão
export async function incrementProgressionStats(
  discordId: string,
  stats: Partial<IPlayerStats['progression']>
): Promise<void> {
  await updateStats(discordId, 'progression', stats as Record<string, number>);
}

// ============= SNAPSHOTS DIÁRIOS =============

// Criar ou atualizar snapshot diário
export async function updateDailySnapshot(
  discordId: string,
  updates: Partial<IDailySnapshot>
): Promise<IDailySnapshot> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const snapshot = await DailySnapshot.findOneAndUpdate(
    { odiscordId: discordId, date: today },
    {
      $inc: {
        xpGained: updates.xpGained || 0,
        coinsGained: updates.coinsGained || 0,
        coinsSpent: updates.coinsSpent || 0,
        monstersKilled: updates.monstersKilled || 0,
        questsCompleted: updates.questsCompleted || 0,
        dungeonsCompleted: updates.dungeonsCompleted || 0,
        pvpWins: updates.pvpWins || 0,
        pvpLosses: updates.pvpLosses || 0,
        itemsObtained: updates.itemsObtained || 0,
        playtime: updates.playtime || 0,
      },
    },
    { new: true, upsert: true }
  );

  return snapshot!;
}

// Obter snapshots de um período
export async function getSnapshots(
  discordId: string,
  days: number = 7
): Promise<any[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  return await DailySnapshot.find({
    odiscordId: discordId,
    date: { $gte: startDate },
  })
    .sort({ date: 1 })
    .lean();
}

// Calcular médias
export async function calculateAverages(
  discordId: string,
  days: number = 30
): Promise<{
  avgXp: number;
  avgCoins: number;
  avgPlaytime: number;
  avgMonstersKilled: number;
}> {
  const snapshots = await getSnapshots(discordId, days);

  if (snapshots.length === 0) {
    return { avgXp: 0, avgCoins: 0, avgPlaytime: 0, avgMonstersKilled: 0 };
  }

  const totals = snapshots.reduce(
    (acc, s) => ({
      xp: acc.xp + s.xpGained,
      coins: acc.coins + s.coinsGained,
      playtime: acc.playtime + s.playtime,
      monsters: acc.monsters + s.monstersKilled,
    }),
    { xp: 0, coins: 0, playtime: 0, monsters: 0 }
  );

  const count = snapshots.length;

  return {
    avgXp: Math.floor(totals.xp / count),
    avgCoins: Math.floor(totals.coins / count),
    avgPlaytime: Math.floor(totals.playtime / count),
    avgMonstersKilled: Math.floor(totals.monsters / count),
  };
}

// ============= LEADERBOARDS =============

// Atualizar leaderboard
export async function updateLeaderboard(
  category: string,
  period: StatsPeriod,
  entries: Array<{ odiscordId: string; username: string; value: number }>
): Promise<void> {
  // Obter ranks anteriores
  const previousEntries = await LeaderboardEntry.find({ category, period }).lean();
  const previousRanks: Record<string, number> = {};
  for (const e of previousEntries) {
    previousRanks[e.odiscordId] = e.rank;
  }

  // Remover entradas antigas
  await LeaderboardEntry.deleteMany({ category, period });

  // Criar novas entradas
  const sortedEntries = entries.sort((a, b) => b.value - a.value);

  const newEntries = sortedEntries.slice(0, 100).map((entry, index) => ({
    category,
    period,
    odiscordId: entry.odiscordId,
    username: entry.username,
    value: entry.value,
    rank: index + 1,
    previousRank: previousRanks[entry.odiscordId],
    updatedAt: new Date(),
  }));

  await LeaderboardEntry.insertMany(newEntries);
}

// Obter leaderboard
export async function getLeaderboard(
  category: string,
  period: StatsPeriod = 'alltime',
  limit: number = 10
): Promise<any[]> {
  return await LeaderboardEntry.find({ category, period })
    .sort({ rank: 1 })
    .limit(limit)
    .lean();
}

// Obter posição do jogador no leaderboard
export async function getPlayerRank(
  discordId: string,
  category: string,
  period: StatsPeriod = 'alltime'
): Promise<any> {
  return await LeaderboardEntry.findOne({
    category,
    period,
    odiscordId: discordId,
  }).lean();
}

// Obter todos os ranks do jogador
export async function getPlayerAllRanks(
  discordId: string,
  period: StatsPeriod = 'alltime'
): Promise<Record<string, any>> {
  const entries = await LeaderboardEntry.find({
    odiscordId: discordId,
    period,
  }).lean();

  const ranks: Record<string, any> = {};
  for (const entry of entries) {
    ranks[entry.category] = entry;
  }

  return ranks;
}

// ============= MILESTONES =============

// Verificar milestones
async function checkMilestones(discordId: string, stats: IPlayerStats): Promise<void> {
  const existingMilestones = await Milestone.find({ odiscordId: discordId }).lean();
  const existingIds = new Set(existingMilestones.map(m => m.milestoneId));

  for (const def of MILESTONE_DEFINITIONS) {
    const categoryStats = stats[def.category as keyof IPlayerStats];
    if (!categoryStats || typeof categoryStats !== 'object') continue;

    const currentValue = (categoryStats as any)[def.stat] || 0;

    for (let i = 0; i < def.thresholds.length; i++) {
      const threshold = def.thresholds[i];
      const milestoneId = `${def.category}_${def.stat}_${threshold}`;

      if (existingIds.has(milestoneId)) continue;

      if (currentValue >= threshold) {
        const milestone = new Milestone({
          milestoneId,
          odiscordId: discordId,
          category: def.category,
          name: `${def.name} ${i + 1}`,
          description: `Alcançou ${threshold} em ${def.stat}`,
          value: currentValue,
          threshold,
          achievedAt: new Date(),
          reward: calculateMilestoneReward(i),
        });

        await milestone.save();
      }
    }
  }
}

// Calcular recompensa de milestone
function calculateMilestoneReward(tier: number): { type: string; amount: number } {
  const rewards = [
    { type: 'coins', amount: 500 },
    { type: 'coins', amount: 2000 },
    { type: 'coins', amount: 5000 },
    { type: 'coins', amount: 15000 },
    { type: 'coins', amount: 50000 },
  ];

  return rewards[tier] || rewards[0];
}

// Obter milestones do jogador
export async function getPlayerMilestones(
  discordId: string,
  category?: string
): Promise<any[]> {
  const query: any = { odiscordId: discordId };
  if (category) {
    query.category = category;
  }

  return await Milestone.find(query)
    .sort({ achievedAt: -1 })
    .lean();
}

// Obter próximos milestones
export async function getNextMilestones(
  discordId: string,
  limit: number = 5
): Promise<Array<{ name: string; category: string; current: number; target: number; progress: number }>> {
  const stats = await getPlayerStats(discordId);
  const existingMilestones = await Milestone.find({ odiscordId: discordId }).lean();
  const existingIds = new Set(existingMilestones.map(m => m.milestoneId));

  const nextMilestones: Array<{
    name: string;
    category: string;
    current: number;
    target: number;
    progress: number;
  }> = [];

  for (const def of MILESTONE_DEFINITIONS) {
    const categoryStats = stats[def.category as keyof IPlayerStats];
    if (!categoryStats || typeof categoryStats !== 'object') continue;

    const currentValue = (categoryStats as any)[def.stat] || 0;

    for (let i = 0; i < def.thresholds.length; i++) {
      const threshold = def.thresholds[i];
      const milestoneId = `${def.category}_${def.stat}_${threshold}`;

      if (existingIds.has(milestoneId)) continue;

      if (currentValue < threshold) {
        nextMilestones.push({
          name: `${def.name} ${i + 1}`,
          category: def.category,
          current: currentValue,
          target: threshold,
          progress: Math.floor((currentValue / threshold) * 100),
        });
        break; // Só adiciona o próximo milestone de cada tipo
      }
    }
  }

  // Ordenar por progresso (mais próximo de completar primeiro)
  return nextMilestones
    .sort((a, b) => b.progress - a.progress)
    .slice(0, limit);
}

// ============= DASHBOARD =============

// Gerar dashboard completo
export async function generateDashboard(discordId: string): Promise<{
  stats: IPlayerStats;
  recentActivity: IDailySnapshot[];
  averages: Awaited<ReturnType<typeof calculateAverages>>;
  ranks: Record<string, ILeaderboardEntry>;
  milestones: IMilestone[];
  nextMilestones: Awaited<ReturnType<typeof getNextMilestones>>;
  summary: {
    totalPlaytime: string;
    mostActiveDay: string;
    favoriteActivity: string;
    overallRank: number | null;
  };
}> {
  const [stats, recentActivity, averages, ranks, milestones, nextMilestones] = await Promise.all([
    getPlayerStats(discordId),
    getSnapshots(discordId, 7),
    calculateAverages(discordId),
    getPlayerAllRanks(discordId),
    getPlayerMilestones(discordId),
    getNextMilestones(discordId),
  ]);

  // Calcular sumário
  const totalMinutes = stats.progression.totalPlaytime;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const totalPlaytime = `${hours}h ${minutes}m`;

  // Encontrar dia mais ativo
  let mostActiveDay = 'N/A';
  if (recentActivity.length > 0) {
    const mostActive = recentActivity.reduce((a, b) =>
      a.xpGained > b.xpGained ? a : b
    );
    mostActiveDay = mostActive.date.toLocaleDateString('pt-BR', { weekday: 'long' });
  }

  // Determinar atividade favorita
  const activities = [
    { name: 'Combate', value: stats.combat.monstersKilled },
    { name: 'PvP', value: stats.pvp.totalMatches },
    { name: 'Dungeons', value: stats.dungeons.dungeonsCompleted },
    { name: 'Pesca', value: stats.minigames.fishCaught },
    { name: 'Mineração', value: stats.minigames.oresMined },
    { name: 'Quests', value: stats.progression.questsCompleted },
  ];
  const favoriteActivity = activities.reduce((a, b) => (a.value > b.value ? a : b)).name;

  // Calcular rank geral (média dos ranks)
  const rankValues = Object.values(ranks).map(r => r.rank);
  const overallRank = rankValues.length > 0
    ? Math.floor(rankValues.reduce((a, b) => a + b, 0) / rankValues.length)
    : null;

  return {
    stats,
    recentActivity,
    averages,
    ranks,
    milestones: milestones.slice(0, 10),
    nextMilestones,
    summary: {
      totalPlaytime,
      mostActiveDay,
      favoriteActivity,
      overallRank,
    },
  };
}

// Comparar com outros jogadores
export async function compareWithPlayer(
  discordId1: string,
  discordId2: string
): Promise<{
  player1: IPlayerStats;
  player2: IPlayerStats;
  comparison: Array<{
    category: string;
    stat: string;
    player1Value: number;
    player2Value: number;
    winner: 1 | 2 | 0;
  }>;
}> {
  const [player1, player2] = await Promise.all([
    getPlayerStats(discordId1),
    getPlayerStats(discordId2),
  ]);

  const comparison: Array<{
    category: string;
    stat: string;
    player1Value: number;
    player2Value: number;
    winner: 1 | 2 | 0;
  }> = [];

  const statsToCompare = [
    { category: 'combat', stat: 'monstersKilled' },
    { category: 'combat', stat: 'bossesKilled' },
    { category: 'pvp', stat: 'wins' },
    { category: 'economy', stat: 'totalCoinsEarned' },
    { category: 'progression', stat: 'questsCompleted' },
    { category: 'dungeons', stat: 'dungeonsCompleted' },
  ];

  for (const { category, stat } of statsToCompare) {
    const val1 = (player1[category as keyof IPlayerStats] as any)?.[stat] || 0;
    const val2 = (player2[category as keyof IPlayerStats] as any)?.[stat] || 0;

    comparison.push({
      category,
      stat,
      player1Value: val1,
      player2Value: val2,
      winner: val1 > val2 ? 1 : val2 > val1 ? 2 : 0,
    });
  }

  return { player1, player2, comparison };
}

// ============= CLEANUP =============

// Limpar snapshots antigos
export async function cleanupOldSnapshots(daysOld: number = 90): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);

  const result = await DailySnapshot.deleteMany({ date: { $lt: cutoff } });
  return result.deletedCount;
}

// Rebuild leaderboards (para ser chamado periodicamente)
export async function rebuildAllLeaderboards(): Promise<void> {
  // Buscar todos os jogadores com stats
  const allStats = await PlayerStats.find({}).lean();

  // Para cada categoria de leaderboard
  for (const category of LEADERBOARD_CATEGORIES) {
    const entries: Array<{ odiscordId: string; username: string; value: number }> = [];

    for (const stats of allStats) {
      let value = 0;

      switch (category) {
        case 'xp':
          value = stats.progression.totalXpGained;
          break;
        case 'level':
          value = stats.progression.maxLevelReached;
          break;
        case 'coins':
          value = stats.economy.totalCoinsEarned;
          break;
        case 'monstersKilled':
          value = stats.combat.monstersKilled;
          break;
        case 'pvpWins':
          value = stats.pvp.wins;
          break;
        case 'dungeonsCompleted':
          value = stats.dungeons.dungeonsCompleted;
          break;
        case 'questsCompleted':
          value = stats.progression.questsCompleted;
          break;
        case 'achievementPoints':
          value = stats.progression.achievementPoints;
          break;
        case 'playtime':
          value = stats.progression.totalPlaytime;
          break;
        case 'fishCaught':
          value = stats.minigames.fishCaught;
          break;
      }

      if (value > 0) {
        entries.push({
          odiscordId: stats.odiscordId,
          username: stats.odiscordId, // Idealmente buscar username real
          value,
        });
      }
    }

    await updateLeaderboard(category, 'alltime', entries);
  }
}
