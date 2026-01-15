import mongoose, { Document, Schema } from 'mongoose';

export interface TamedMonsterStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  loyalty: number; // 0-100, affects combat performance
  happiness: number; // 0-100, affects XP gain
}

export interface TamedMonsterDocument extends Document {
  odiscordId: string;
  monsterId: string;
  nickname: string;
  originalName: string;
  emoji: string;
  level: number;
  experience: number;
  stats: TamedMonsterStats;
  isActive: boolean; // Currently selected monster
  capturedAt: Date;
  lastFed: Date;
  lastTrained: Date;
  battlesWon: number;
  battlesLost: number;
  createdAt: Date;
  updatedAt: Date;
}

const tamedMonsterSchema = new Schema<TamedMonsterDocument>(
  {
    odiscordId: { type: String, required: true, index: true },
    monsterId: { type: String, required: true },
    nickname: { type: String, required: true },
    originalName: { type: String, required: true },
    emoji: { type: String, required: true },
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    stats: {
      hp: { type: Number, required: true },
      maxHp: { type: Number, required: true },
      attack: { type: Number, required: true },
      defense: { type: Number, required: true },
      loyalty: { type: Number, default: 50 },
      happiness: { type: Number, default: 50 },
    },
    isActive: { type: Boolean, default: false },
    capturedAt: { type: Date, default: Date.now },
    lastFed: { type: Date, default: Date.now },
    lastTrained: { type: Date, default: Date.now },
    battlesWon: { type: Number, default: 0 },
    battlesLost: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookup
tamedMonsterSchema.index({ odiscordId: 1, isActive: 1 });
tamedMonsterSchema.index({ odiscordId: 1, monsterId: 1 });

export const TamedMonster = mongoose.model<TamedMonsterDocument>('TamedMonster', tamedMonsterSchema);
export default TamedMonster;
