// Model de Temporadas e Battle Pass
import mongoose, { Document, Schema } from 'mongoose';

// ==================== SEASON ====================
export type SeasonStatus = 'upcoming' | 'active' | 'ended';

export interface SeasonReward {
  rankMin: number;
  rankMax: number;
  coins: number;
  materials: Array<{ itemId: string; quantity: number }>;
  title?: string;
  cosmetics?: string[];
}

export interface ISeason {
  seasonId: string;
  name: string;
  description: string;
  number: number;
  status: SeasonStatus;
  startsAt: Date;
  endsAt: Date;
  rewards: SeasonReward[];
  createdAt: Date;
}

export interface SeasonDocument extends ISeason, Document {}

const seasonRewardSchema = new Schema<SeasonReward>({
  rankMin: { type: Number, required: true },
  rankMax: { type: Number, required: true },
  coins: { type: Number, required: true },
  materials: [{
    itemId: { type: String, required: true },
    quantity: { type: Number, required: true },
  }],
  title: { type: String },
  cosmetics: [{ type: String }],
}, { _id: false });

const seasonSchema = new Schema<SeasonDocument>(
  {
    seasonId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    number: { type: Number, required: true },
    status: { type: String, required: true, enum: ['upcoming', 'active', 'ended'], default: 'upcoming' },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    rewards: [seasonRewardSchema],
  },
  { timestamps: true }
);

// ==================== BATTLE PASS ====================
export interface BattlePassReward {
  level: number;
  freeReward?: { type: string; itemId?: string; quantity: number };
  premiumReward?: { type: string; itemId?: string; quantity: number };
}

export interface IBattlePass {
  seasonId: string;
  name: string;
  maxLevel: number;
  xpPerLevel: number;
  rewards: BattlePassReward[];
  premiumPrice: number;
  isActive: boolean;
}

export interface BattlePassDocument extends IBattlePass, Document {}

const battlePassRewardSchema = new Schema<BattlePassReward>({
  level: { type: Number, required: true },
  freeReward: {
    type: { type: String },
    itemId: { type: String },
    quantity: { type: Number },
  },
  premiumReward: {
    type: { type: String },
    itemId: { type: String },
    quantity: { type: Number },
  },
}, { _id: false });

const battlePassSchema = new Schema<BattlePassDocument>(
  {
    seasonId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    maxLevel: { type: Number, default: 100 },
    xpPerLevel: { type: Number, default: 1000 },
    rewards: [battlePassRewardSchema],
    premiumPrice: { type: Number, default: 0 },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ==================== PLAYER BATTLE PASS ====================
export interface ClaimedReward {
  level: number;
  type: 'free' | 'premium';
  claimedAt: Date;
}

export interface IPlayerBattlePass {
  odiscordId: string;
  seasonId: string;
  level: number;
  xp: number;
  isPremium: boolean;
  purchasedAt?: Date;
  claimedRewards: ClaimedReward[];
  createdAt: Date;
}

export interface PlayerBattlePassDocument extends IPlayerBattlePass, Document {}

const claimedRewardSchema = new Schema<ClaimedReward>({
  level: { type: Number, required: true },
  type: { type: String, required: true, enum: ['free', 'premium'] },
  claimedAt: { type: Date, default: Date.now },
}, { _id: false });

const playerBattlePassSchema = new Schema<PlayerBattlePassDocument>(
  {
    odiscordId: { type: String, required: true, index: true },
    seasonId: { type: String, required: true, index: true },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    isPremium: { type: Boolean, default: false },
    purchasedAt: { type: Date },
    claimedRewards: [claimedRewardSchema],
  },
  { timestamps: true }
);

playerBattlePassSchema.index({ odiscordId: 1, seasonId: 1 }, { unique: true });

export const Season = mongoose.model<SeasonDocument>('Season', seasonSchema);
export const BattlePass = mongoose.model<BattlePassDocument>('BattlePass', battlePassSchema);
export const PlayerBattlePass = mongoose.model<PlayerBattlePassDocument>('PlayerBattlePass', playerBattlePassSchema);
