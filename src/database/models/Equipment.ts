import mongoose, { Document, Schema } from 'mongoose';

export type EquipmentSlot = 'weapon' | 'armor' | 'helmet' | 'boots' | 'gloves' | 'ring' | 'amulet';
export type EquipmentRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface EquipmentStats {
  attack?: number;
  defense?: number;
  hp?: number;
  critChance?: number;
  critDamage?: number;
}

export interface EquipmentDocument extends Document {
  odiscordId: string;
  equipmentId: string;
  name: string;
  slot: EquipmentSlot;
  rarity: EquipmentRarity;
  tier: number;
  setName?: string;
  stats: EquipmentStats;
  isEquipped: boolean;
  obtainedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const equipmentSchema = new Schema<EquipmentDocument>(
  {
    odiscordId: { type: String, required: true, index: true },
    equipmentId: { type: String, required: true },
    name: { type: String, required: true },
    slot: { type: String, required: true, enum: ['weapon', 'armor', 'helmet', 'boots', 'gloves', 'ring', 'amulet'] },
    rarity: { type: String, required: true, enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'] },
    tier: { type: Number, required: true, min: 1, max: 6 },
    setName: { type: String },
    stats: {
      attack: { type: Number, default: 0 },
      defense: { type: Number, default: 0 },
      hp: { type: Number, default: 0 },
      critChance: { type: Number, default: 0 },
      critDamage: { type: Number, default: 0 },
    },
    isEquipped: { type: Boolean, default: false },
    obtainedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

equipmentSchema.index({ odiscordId: 1, slot: 1, isEquipped: 1 });
equipmentSchema.index({ odiscordId: 1, setName: 1 });

export const Equipment = mongoose.model<EquipmentDocument>('Equipment', equipmentSchema);
export default Equipment;
