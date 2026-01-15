import mongoose, { Schema, Document } from 'mongoose';

export type PetRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface IPet {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rarity: PetRarity;
  baseCoinsPerHour: number;
  baseXpPerHour: number;
  price: number;
  maxLevel: number;
  evolveInto?: string;
  evolveLevel?: number;
  specialAbility?: string;
  feedCost: number;
  feedInterval: number; // hours between feedings
  createdAt: Date;
}

export interface PetDocument extends Omit<IPet, 'id'>, Document {
  id: string;
}

const PetSchema = new Schema<PetDocument>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  emoji: { type: String, required: true },
  description: { type: String, required: true },
  rarity: {
    type: String,
    required: true,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
  },
  baseCoinsPerHour: { type: Number, required: true, default: 1 },
  baseXpPerHour: { type: Number, required: true, default: 0 },
  price: { type: Number, required: true },
  maxLevel: { type: Number, default: 20 },
  evolveInto: { type: String, default: null },
  evolveLevel: { type: Number, default: null },
  specialAbility: { type: String, default: null },
  feedCost: { type: Number, default: 10 },
  feedInterval: { type: Number, default: 12 },
}, { timestamps: true });

export const Pet = mongoose.model<PetDocument>('Pet', PetSchema);
export default Pet;
