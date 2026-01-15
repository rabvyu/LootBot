import mongoose, { Schema, Document } from 'mongoose';

export type ExpeditionDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export interface ExpeditionReward {
  minCoins: number;
  maxCoins: number;
  minXp: number;
  maxXp: number;
  resourceDrops?: { resourceId: string; chance: number; minAmount: number; maxAmount: number }[];
  badgeChance?: number;
  badgeId?: string;
}

export interface IExpedition {
  id: string;
  name: string;
  emoji: string;
  description: string;
  difficulty: ExpeditionDifficulty;
  durationHours: number;
  successRate: number; // 0-100
  levelRequired: number;
  rewards: ExpeditionReward;
  active: boolean;
  createdAt: Date;
}

export interface ExpeditionDocument extends Omit<IExpedition, 'id'>, Document {
  id: string;
}

const ExpeditionRewardSchema = new Schema({
  minCoins: { type: Number, required: true },
  maxCoins: { type: Number, required: true },
  minXp: { type: Number, required: true },
  maxXp: { type: Number, required: true },
  resourceDrops: [{
    resourceId: String,
    chance: Number,
    minAmount: Number,
    maxAmount: Number,
  }],
  badgeChance: { type: Number, default: 0 },
  badgeId: { type: String, default: null },
}, { _id: false });

const ExpeditionSchema = new Schema<ExpeditionDocument>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  emoji: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard', 'extreme'],
  },
  durationHours: { type: Number, required: true },
  successRate: { type: Number, required: true, min: 0, max: 100 },
  levelRequired: { type: Number, default: 1 },
  rewards: { type: ExpeditionRewardSchema, required: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export const Expedition = mongoose.model<ExpeditionDocument>('Expedition', ExpeditionSchema);
export default Expedition;
