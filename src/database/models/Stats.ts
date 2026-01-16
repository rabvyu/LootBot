// Model de Estatísticas e Dashboard
import mongoose, { Schema, Document } from 'mongoose';

// Período de estatísticas
export type StatsPeriod = 'daily' | 'weekly' | 'monthly' | 'alltime';

// Interface de estatísticas do jogador
export interface IPlayerStats extends Document {
  odiscordId: string;

  // Estatísticas de combate
  combat: {
    totalDamageDealt: number;
    totalDamageTaken: number;
    totalHealingDone: number;
    monstersKilled: number;
    bossesKilled: number;
    worldBossesKilled: number;
    deaths: number;
    revives: number;
    criticalHits: number;
    dodges: number;
    blocks: number;
    highestHit: number;
    highestHeal: number;
    longestCombo: number;
  };

  // Estatísticas PvP
  pvp: {
    totalMatches: number;
    wins: number;
    losses: number;
    draws: number;
    winStreak: number;
    bestWinStreak: number;
    killDeathRatio: number;
    pvpDamageDealt: number;
    pvpDamageTaken: number;
    tournamentWins: number;
    arenaHighestRank: number;
  };

  // Estatísticas de economia
  economy: {
    totalCoinsEarned: number;
    totalCoinsSpent: number;
    itemsSold: number;
    itemsBought: number;
    auctionsWon: number;
    auctionsCreated: number;
    tradesCompleted: number;
    coinsGiven: number;
    coinsReceived: number;
    taxesPaid: number;
    bankInterestEarned: number;
    loansTaken: number;
  };

  // Estatísticas de progressão
  progression: {
    totalXpGained: number;
    questsCompleted: number;
    dailyQuestsCompleted: number;
    weeklyQuestsCompleted: number;
    achievementsUnlocked: number;
    achievementPoints: number;
    badgesEarned: number;
    titlesUnlocked: number;
    maxLevelReached: number;
    prestigeCount: number;
    totalPlaytime: number; // minutos
  };

  // Estatísticas de dungeons/raids
  dungeons: {
    dungeonsCompleted: number;
    dungeonsFailed: number;
    raidsCompleted: number;
    raidsFailed: number;
    towerFloorsCleared: number;
    towerHighestFloor: number;
    mythicPlusCompleted: number;
    mythicPlusHighestKey: number;
    secretsFound: number;
    chestsOpened: number;
  };

  // Estatísticas de mini-games
  minigames: {
    fishCaught: number;
    rareFishCaught: number;
    legendaryFishCaught: number;
    oresMined: number;
    rareOresMined: number;
    casinoWins: number;
    casinoLosses: number;
    casinoCoinsWon: number;
    casinoCoinsLost: number;
    triviaCorrect: number;
    triviaWrong: number;
    triviaStreak: number;
  };

  // Estatísticas de crafting
  crafting: {
    itemsCrafted: number;
    itemsEnchanted: number;
    itemsDisenchanted: number;
    upgradesSuccessful: number;
    upgradesFailed: number;
    materialsUsed: number;
    recipesLearned: number;
    masterworkCreated: number;
  };

  // Estatísticas sociais
  social: {
    messagesCount: number;
    reactionsGiven: number;
    reactionsReceived: number;
    guildContributions: number;
    playersHelped: number;
    partiesJoined: number;
    partiesCreated: number;
    friendsMade: number;
    giftsGiven: number;
    giftsReceived: number;
  };

  // Estatísticas de housing
  housing: {
    plantsHarvested: number;
    rarestPlantGrown: string;
    npcsHired: number;
    decorationsPlaced: number;
    upgradesPurchased: number;
    visitorsReceived: number;
  };

  // Recordes pessoais
  records: {
    fastestDungeonClear: number; // segundos
    fastestBossKill: number;
    highestDamageInOneRun: number;
    mostCoinsInOneDay: number;
    longestPlaySession: number; // minutos
    mostItemsInOneDay: number;
  };

  // Timestamps
  lastUpdated: Date;
  createdAt: Date;
}

// Interface de snapshot diário
export interface IDailySnapshot extends Document {
  odiscordId: string;
  date: Date;

  // Dados do dia
  xpGained: number;
  coinsGained: number;
  coinsSpent: number;
  monstersKilled: number;
  questsCompleted: number;
  dungeonsCompleted: number;
  pvpWins: number;
  pvpLosses: number;
  itemsObtained: number;
  playtime: number; // minutos

  // Comparação com média
  comparedToAverage: {
    xp: number; // percentual
    coins: number;
    activity: number;
  };
}

// Interface de leaderboard entry
export interface ILeaderboardEntry extends Document {
  category: string;
  period: StatsPeriod;
  odiscordId: string;
  username: string;
  value: number;
  rank: number;
  previousRank?: number;
  updatedAt: Date;
}

// Interface de milestone/marco
export interface IMilestone extends Document {
  milestoneId: string;
  odiscordId: string;
  category: string;
  name: string;
  description: string;
  value: number;
  threshold: number;
  achievedAt: Date;
  reward?: {
    type: string;
    amount: number;
  };
}

// Schema de estatísticas
const PlayerStatsSchema = new Schema<IPlayerStats>({
  odiscordId: { type: String, required: true, unique: true, index: true },

  combat: {
    totalDamageDealt: { type: Number, default: 0 },
    totalDamageTaken: { type: Number, default: 0 },
    totalHealingDone: { type: Number, default: 0 },
    monstersKilled: { type: Number, default: 0 },
    bossesKilled: { type: Number, default: 0 },
    worldBossesKilled: { type: Number, default: 0 },
    deaths: { type: Number, default: 0 },
    revives: { type: Number, default: 0 },
    criticalHits: { type: Number, default: 0 },
    dodges: { type: Number, default: 0 },
    blocks: { type: Number, default: 0 },
    highestHit: { type: Number, default: 0 },
    highestHeal: { type: Number, default: 0 },
    longestCombo: { type: Number, default: 0 },
  },

  pvp: {
    totalMatches: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    winStreak: { type: Number, default: 0 },
    bestWinStreak: { type: Number, default: 0 },
    killDeathRatio: { type: Number, default: 0 },
    pvpDamageDealt: { type: Number, default: 0 },
    pvpDamageTaken: { type: Number, default: 0 },
    tournamentWins: { type: Number, default: 0 },
    arenaHighestRank: { type: Number, default: 0 },
  },

  economy: {
    totalCoinsEarned: { type: Number, default: 0 },
    totalCoinsSpent: { type: Number, default: 0 },
    itemsSold: { type: Number, default: 0 },
    itemsBought: { type: Number, default: 0 },
    auctionsWon: { type: Number, default: 0 },
    auctionsCreated: { type: Number, default: 0 },
    tradesCompleted: { type: Number, default: 0 },
    coinsGiven: { type: Number, default: 0 },
    coinsReceived: { type: Number, default: 0 },
    taxesPaid: { type: Number, default: 0 },
    bankInterestEarned: { type: Number, default: 0 },
    loansTaken: { type: Number, default: 0 },
  },

  progression: {
    totalXpGained: { type: Number, default: 0 },
    questsCompleted: { type: Number, default: 0 },
    dailyQuestsCompleted: { type: Number, default: 0 },
    weeklyQuestsCompleted: { type: Number, default: 0 },
    achievementsUnlocked: { type: Number, default: 0 },
    achievementPoints: { type: Number, default: 0 },
    badgesEarned: { type: Number, default: 0 },
    titlesUnlocked: { type: Number, default: 0 },
    maxLevelReached: { type: Number, default: 1 },
    prestigeCount: { type: Number, default: 0 },
    totalPlaytime: { type: Number, default: 0 },
  },

  dungeons: {
    dungeonsCompleted: { type: Number, default: 0 },
    dungeonsFailed: { type: Number, default: 0 },
    raidsCompleted: { type: Number, default: 0 },
    raidsFailed: { type: Number, default: 0 },
    towerFloorsCleared: { type: Number, default: 0 },
    towerHighestFloor: { type: Number, default: 0 },
    mythicPlusCompleted: { type: Number, default: 0 },
    mythicPlusHighestKey: { type: Number, default: 0 },
    secretsFound: { type: Number, default: 0 },
    chestsOpened: { type: Number, default: 0 },
  },

  minigames: {
    fishCaught: { type: Number, default: 0 },
    rareFishCaught: { type: Number, default: 0 },
    legendaryFishCaught: { type: Number, default: 0 },
    oresMined: { type: Number, default: 0 },
    rareOresMined: { type: Number, default: 0 },
    casinoWins: { type: Number, default: 0 },
    casinoLosses: { type: Number, default: 0 },
    casinoCoinsWon: { type: Number, default: 0 },
    casinoCoinsLost: { type: Number, default: 0 },
    triviaCorrect: { type: Number, default: 0 },
    triviaWrong: { type: Number, default: 0 },
    triviaStreak: { type: Number, default: 0 },
  },

  crafting: {
    itemsCrafted: { type: Number, default: 0 },
    itemsEnchanted: { type: Number, default: 0 },
    itemsDisenchanted: { type: Number, default: 0 },
    upgradesSuccessful: { type: Number, default: 0 },
    upgradesFailed: { type: Number, default: 0 },
    materialsUsed: { type: Number, default: 0 },
    recipesLearned: { type: Number, default: 0 },
    masterworkCreated: { type: Number, default: 0 },
  },

  social: {
    messagesCount: { type: Number, default: 0 },
    reactionsGiven: { type: Number, default: 0 },
    reactionsReceived: { type: Number, default: 0 },
    guildContributions: { type: Number, default: 0 },
    playersHelped: { type: Number, default: 0 },
    partiesJoined: { type: Number, default: 0 },
    partiesCreated: { type: Number, default: 0 },
    friendsMade: { type: Number, default: 0 },
    giftsGiven: { type: Number, default: 0 },
    giftsReceived: { type: Number, default: 0 },
  },

  housing: {
    plantsHarvested: { type: Number, default: 0 },
    rarestPlantGrown: { type: String, default: '' },
    npcsHired: { type: Number, default: 0 },
    decorationsPlaced: { type: Number, default: 0 },
    upgradesPurchased: { type: Number, default: 0 },
    visitorsReceived: { type: Number, default: 0 },
  },

  records: {
    fastestDungeonClear: { type: Number, default: 0 },
    fastestBossKill: { type: Number, default: 0 },
    highestDamageInOneRun: { type: Number, default: 0 },
    mostCoinsInOneDay: { type: Number, default: 0 },
    longestPlaySession: { type: Number, default: 0 },
    mostItemsInOneDay: { type: Number, default: 0 },
  },

  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

// Schema de snapshot diário
const DailySnapshotSchema = new Schema<IDailySnapshot>({
  odiscordId: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  xpGained: { type: Number, default: 0 },
  coinsGained: { type: Number, default: 0 },
  coinsSpent: { type: Number, default: 0 },
  monstersKilled: { type: Number, default: 0 },
  questsCompleted: { type: Number, default: 0 },
  dungeonsCompleted: { type: Number, default: 0 },
  pvpWins: { type: Number, default: 0 },
  pvpLosses: { type: Number, default: 0 },
  itemsObtained: { type: Number, default: 0 },
  playtime: { type: Number, default: 0 },
  comparedToAverage: {
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    activity: { type: Number, default: 0 },
  },
});

// Schema de leaderboard
const LeaderboardEntrySchema = new Schema<ILeaderboardEntry>({
  category: { type: String, required: true, index: true },
  period: { type: String, required: true, index: true },
  odiscordId: { type: String, required: true },
  username: { type: String, required: true },
  value: { type: Number, required: true },
  rank: { type: Number, required: true },
  previousRank: { type: Number },
  updatedAt: { type: Date, default: Date.now },
});

// Schema de milestone
const MilestoneSchema = new Schema<IMilestone>({
  milestoneId: { type: String, required: true, unique: true },
  odiscordId: { type: String, required: true, index: true },
  category: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  value: { type: Number, required: true },
  threshold: { type: Number, required: true },
  achievedAt: { type: Date, default: Date.now },
  reward: {
    type: { type: String },
    amount: { type: Number },
  },
});

// Índices compostos
DailySnapshotSchema.index({ odiscordId: 1, date: -1 });
LeaderboardEntrySchema.index({ category: 1, period: 1, rank: 1 });
MilestoneSchema.index({ odiscordId: 1, category: 1 });

export const PlayerStats = mongoose.model<IPlayerStats>('PlayerStats', PlayerStatsSchema);
export const DailySnapshot = mongoose.model<IDailySnapshot>('DailySnapshot', DailySnapshotSchema);
export const LeaderboardEntry = mongoose.model<ILeaderboardEntry>('LeaderboardEntry', LeaderboardEntrySchema);
export const Milestone = mongoose.model<IMilestone>('Milestone', MilestoneSchema);

export type PlayerStatsDocument = IPlayerStats;
export type DailySnapshotDocument = IDailySnapshot;
export type LeaderboardEntryDocument = ILeaderboardEntry;
export type MilestoneDocument = IMilestone;
