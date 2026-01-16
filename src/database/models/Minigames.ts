// Models de Mini-Games (Pesca, Mineração, Casino, Trivia)
import mongoose, { Document, Schema } from 'mongoose';

// ==================== FISHING ====================
export interface CaughtFish {
  fishId: string;
  name: string;
  rarity: string;
  weight: number;
  caughtAt: Date;
  zone: string;
}

export interface IFishingProfile {
  odiscordId: string;
  currentZone: string;
  fishingLevel: number;
  fishingXp: number;
  totalFishCaught: number;
  fishCollection: Array<{ fishId: string; count: number; bestWeight: number }>;
  recentCatches: CaughtFish[];
  equippedRod: string;
  equippedBait?: string;
  baitCount: number;
  lastFishedAt?: Date;
  dailyFishCount: number;
  lastDailyReset: Date;
}

export interface FishingProfileDocument extends IFishingProfile, Document {}

const caughtFishSchema = new Schema<CaughtFish>({
  fishId: { type: String, required: true },
  name: { type: String, required: true },
  rarity: { type: String, required: true },
  weight: { type: Number, required: true },
  caughtAt: { type: Date, default: Date.now },
  zone: { type: String, required: true },
}, { _id: false });

const fishingProfileSchema = new Schema<FishingProfileDocument>(
  {
    odiscordId: { type: String, required: true, unique: true, index: true },
    currentZone: { type: String, default: 'lake' },
    fishingLevel: { type: Number, default: 1 },
    fishingXp: { type: Number, default: 0 },
    totalFishCaught: { type: Number, default: 0 },
    fishCollection: [{
      fishId: { type: String, required: true },
      count: { type: Number, default: 1 },
      bestWeight: { type: Number, default: 0 },
    }],
    recentCatches: [caughtFishSchema],
    equippedRod: { type: String, default: 'basic_rod' },
    equippedBait: { type: String },
    baitCount: { type: Number, default: 0 },
    lastFishedAt: { type: Date },
    dailyFishCount: { type: Number, default: 0 },
    lastDailyReset: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ==================== MINING ====================
export interface MinedOre {
  oreId: string;
  name: string;
  rarity: string;
  quantity: number;
  minedAt: Date;
  mine: string;
}

export interface IMiningProfile {
  odiscordId: string;
  currentMine: string;
  miningLevel: number;
  miningXp: number;
  totalOresMined: number;
  oreCollection: Array<{ oreId: string; totalMined: number }>;
  equippedPickaxe: string;
  energy: number;
  maxEnergy: number;
  lastMinedAt?: Date;
  energyRegenAt: Date;
}

export interface MiningProfileDocument extends IMiningProfile, Document {}

const miningProfileSchema = new Schema<MiningProfileDocument>(
  {
    odiscordId: { type: String, required: true, unique: true, index: true },
    currentMine: { type: String, default: 'starter' },
    miningLevel: { type: Number, default: 1 },
    miningXp: { type: Number, default: 0 },
    totalOresMined: { type: Number, default: 0 },
    oreCollection: [{
      oreId: { type: String, required: true },
      totalMined: { type: Number, default: 0 },
    }],
    equippedPickaxe: { type: String, default: 'wooden_pickaxe' },
    energy: { type: Number, default: 100 },
    maxEnergy: { type: Number, default: 100 },
    lastMinedAt: { type: Date },
    energyRegenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ==================== CASINO ====================
export interface CasinoGame {
  gameType: 'roulette' | 'blackjack' | 'slots' | 'dice';
  betAmount: number;
  won: boolean;
  payout: number;
  playedAt: Date;
  details: any;
}

export interface ICasinoProfile {
  odiscordId: string;
  totalGamesPlayed: number;
  totalWins: number;
  totalLosses: number;
  totalBet: number;
  totalWon: number;
  totalLost: number;
  netProfit: number;
  biggestWin: number;
  currentStreak: number;
  longestWinStreak: number;
  longestLoseStreak: number;
  dailyLossToday: number;
  lastDailyReset: Date;
  recentGames: CasinoGame[];
  isSelfExcluded: boolean;
  selfExcludeUntil?: Date;
  personalDailyLimit?: number;
}

export interface CasinoProfileDocument extends ICasinoProfile, Document {}

const casinoGameSchema = new Schema<CasinoGame>({
  gameType: { type: String, required: true, enum: ['roulette', 'blackjack', 'slots', 'dice'] },
  betAmount: { type: Number, required: true },
  won: { type: Boolean, required: true },
  payout: { type: Number, required: true },
  playedAt: { type: Date, default: Date.now },
  details: { type: Schema.Types.Mixed },
}, { _id: false });

const casinoProfileSchema = new Schema<CasinoProfileDocument>(
  {
    odiscordId: { type: String, required: true, unique: true, index: true },
    totalGamesPlayed: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
    totalLosses: { type: Number, default: 0 },
    totalBet: { type: Number, default: 0 },
    totalWon: { type: Number, default: 0 },
    totalLost: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
    biggestWin: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestWinStreak: { type: Number, default: 0 },
    longestLoseStreak: { type: Number, default: 0 },
    dailyLossToday: { type: Number, default: 0 },
    lastDailyReset: { type: Date, default: Date.now },
    recentGames: [casinoGameSchema],
    isSelfExcluded: { type: Boolean, default: false },
    selfExcludeUntil: { type: Date },
    personalDailyLimit: { type: Number },
  },
  { timestamps: true }
);

// ==================== TRIVIA ====================
export interface ITriviaProfile {
  odiscordId: string;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  totalWrong: number;
  currentStreak: number;
  longestStreak: number;
  lastAnsweredAt?: Date;
  dailyAnswered: boolean;
  lastDailyReset: Date;
  totalXpEarned: number;
  totalCoinsEarned: number;
}

export interface TriviaProfileDocument extends ITriviaProfile, Document {}

const triviaProfileSchema = new Schema<TriviaProfileDocument>(
  {
    odiscordId: { type: String, required: true, unique: true, index: true },
    totalQuestionsAnswered: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    totalWrong: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastAnsweredAt: { type: Date },
    dailyAnswered: { type: Boolean, default: false },
    lastDailyReset: { type: Date, default: Date.now },
    totalXpEarned: { type: Number, default: 0 },
    totalCoinsEarned: { type: Number, default: 0 },
  },
  { timestamps: true }
);

triviaProfileSchema.index({ currentStreak: -1 });
triviaProfileSchema.index({ totalCorrect: -1 });

export const FishingProfile = mongoose.model<FishingProfileDocument>('FishingProfile', fishingProfileSchema);
export const MiningProfile = mongoose.model<MiningProfileDocument>('MiningProfile', miningProfileSchema);
export const CasinoProfile = mongoose.model<CasinoProfileDocument>('CasinoProfile', casinoProfileSchema);
export const TriviaProfile = mongoose.model<TriviaProfileDocument>('TriviaProfile', triviaProfileSchema);
