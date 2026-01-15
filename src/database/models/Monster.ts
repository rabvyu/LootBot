import mongoose, { Schema, Document } from 'mongoose';

export type MonsterType = 'normal' | 'elite' | 'boss';

export interface MonsterDrop {
  resourceId: string;
  chance: number;
  minAmount: number;
  maxAmount: number;
}

export interface IMonster {
  id: string;
  name: string;
  emoji: string;
  description: string;
  type: MonsterType;
  level: number;
  hp: number;
  attack: number;
  defense: number;
  xpReward: number;
  coinsReward: { min: number; max: number };
  drops: MonsterDrop[];
  badgeReward?: string;
  isBoss: boolean;
  createdAt: Date;
}

export interface MonsterDocument extends Omit<IMonster, 'id'>, Document {
  id: string;
}

const MonsterDropSchema = new Schema({
  resourceId: { type: String, required: true },
  chance: { type: Number, required: true },
  minAmount: { type: Number, required: true },
  maxAmount: { type: Number, required: true },
}, { _id: false });

const MonsterSchema = new Schema<MonsterDocument>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  emoji: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['normal', 'elite', 'boss'],
  },
  level: { type: Number, required: true, default: 1 },
  hp: { type: Number, required: true },
  attack: { type: Number, required: true },
  defense: { type: Number, required: true },
  xpReward: { type: Number, required: true },
  coinsReward: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
  },
  drops: [MonsterDropSchema],
  badgeReward: { type: String, default: null },
  isBoss: { type: Boolean, default: false },
}, { timestamps: true });

export const Monster = mongoose.model<MonsterDocument>('Monster', MonsterSchema);
export default Monster;
