import mongoose, { Schema, Document } from 'mongoose';

export type ResourceRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface IResource {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rarity: ResourceRarity;
  baseValue: number; // sell value in coins
  stackable: boolean;
  maxStack: number;
  tradeable: boolean;
  createdAt: Date;
}

export interface ResourceDocument extends Omit<IResource, 'id'>, Document {
  id: string;
}

const ResourceSchema = new Schema<ResourceDocument>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  emoji: { type: String, required: true },
  description: { type: String, required: true },
  rarity: {
    type: String,
    required: true,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
  },
  baseValue: { type: Number, required: true, default: 1 },
  stackable: { type: Boolean, default: true },
  maxStack: { type: Number, default: 999 },
  tradeable: { type: Boolean, default: true },
}, { timestamps: true });

export const Resource = mongoose.model<ResourceDocument>('Resource', ResourceSchema);
export default Resource;
