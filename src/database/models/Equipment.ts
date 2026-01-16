import mongoose, { Document, Schema } from 'mongoose';

export type EquipmentSlot = 'weapon' | 'armor' | 'helmet' | 'boots' | 'gloves' | 'ring' | 'amulet';
export type EquipmentRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type EquipmentSource = 'drop' | 'crafting' | 'shop' | 'quest' | 'event' | 'dungeon';

export interface EquipmentStats {
  attack?: number;
  defense?: number;
  hp?: number;
  critChance?: number;
  critDamage?: number;
  evasion?: number;
  lifesteal?: number;
}

export interface EquipmentDocument extends Document {
  discordId: string;
  odiscordId: string; // Legacy field
  equipmentId: string;
  name: string;
  slot: EquipmentSlot;
  rarity: EquipmentRarity;
  tier: number;
  setName?: string;
  stats: EquipmentStats;
  enchantments?: Record<string, number>; // enchantmentId -> level
  isEquipped: boolean;
  equipped: boolean; // Alias for isEquipped
  source?: EquipmentSource;
  obtainedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const equipmentSchema = new Schema<EquipmentDocument>(
  {
    discordId: { type: String, index: true },
    odiscordId: { type: String, index: true }, // Legacy field
    equipmentId: { type: String, required: true },
    name: { type: String, required: true },
    slot: { type: String, required: true, enum: ['weapon', 'armor', 'helmet', 'boots', 'gloves', 'ring', 'amulet'] },
    rarity: { type: String, required: true, enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'] },
    tier: { type: Number, required: true, min: 1, max: 10 },
    setName: { type: String },
    stats: {
      attack: { type: Number, default: 0 },
      defense: { type: Number, default: 0 },
      hp: { type: Number, default: 0 },
      critChance: { type: Number, default: 0 },
      critDamage: { type: Number, default: 0 },
      evasion: { type: Number, default: 0 },
      lifesteal: { type: Number, default: 0 },
    },
    enchantments: { type: Schema.Types.Mixed, default: {} },
    isEquipped: { type: Boolean, default: false },
    equipped: { type: Boolean, default: false },
    source: { type: String, enum: ['drop', 'crafting', 'shop', 'quest', 'event', 'dungeon'] },
    obtainedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Ensure at least one of discordId or odiscordId is set
equipmentSchema.pre('save', function(next) {
  if (!this.discordId && this.odiscordId) {
    this.discordId = this.odiscordId;
  }
  if (this.isEquipped !== undefined) {
    this.equipped = this.isEquipped;
  }
  next();
});

equipmentSchema.index({ discordId: 1, slot: 1, isEquipped: 1 });
equipmentSchema.index({ odiscordId: 1, slot: 1, isEquipped: 1 });
equipmentSchema.index({ odiscordId: 1, setName: 1 });

export const Equipment = mongoose.model<EquipmentDocument>('Equipment', equipmentSchema);
export default Equipment;
