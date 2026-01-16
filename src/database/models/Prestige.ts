// Model de Prestige/Rebirth
import mongoose, { Document, Schema } from 'mongoose';

export interface PrestigeUpgrade {
  upgradeId: string;
  name: string;
  level: number;
  maxLevel: number;
  effectPerLevel: number;
  costPerLevel: number;
}

export interface RebirthHistory {
  rebirthNumber: number;
  levelAtRebirth: number;
  pointsEarned: number;
  achievementBonus: number;
  raidBonus: number;
  otherBonus: number;
  coinsRetained: number;
  itemsRetained: string[];
  rebirthedAt: Date;
}

export interface IPrestige {
  odiscordId: string;
  prestigeLevel: string;
  totalRebirths: number;
  totalPrestigePoints: number;
  availablePoints: number;
  upgrades: PrestigeUpgrade[];
  heritageSlotsUsed: number;
  heritageItems: string[];
  rebirthHistory: RebirthHistory[];
  highestLevelReached: number;
  titleColor?: string;
  nameEffect?: string;
  xpMultiplier: number;
  lootMultiplier: number;
  goldMultiplier: number;
  statsMultiplier: number;
  createdAt: Date;
}

export interface PrestigeDocument extends IPrestige, Document {}

const prestigeUpgradeSchema = new Schema<PrestigeUpgrade>({
  upgradeId: { type: String, required: true },
  name: { type: String, required: true },
  level: { type: Number, default: 0 },
  maxLevel: { type: Number, required: true },
  effectPerLevel: { type: Number, required: true },
  costPerLevel: { type: Number, required: true },
}, { _id: false });

const rebirthHistorySchema = new Schema<RebirthHistory>({
  rebirthNumber: { type: Number, required: true },
  levelAtRebirth: { type: Number, required: true },
  pointsEarned: { type: Number, required: true },
  achievementBonus: { type: Number, default: 0 },
  raidBonus: { type: Number, default: 0 },
  otherBonus: { type: Number, default: 0 },
  coinsRetained: { type: Number, default: 0 },
  itemsRetained: [{ type: String }],
  rebirthedAt: { type: Date, default: Date.now },
}, { _id: false });

const prestigeSchema = new Schema<PrestigeDocument>(
  {
    odiscordId: { type: String, required: true, unique: true, index: true },
    prestigeLevel: { type: String, default: 'None' },
    totalRebirths: { type: Number, default: 0 },
    totalPrestigePoints: { type: Number, default: 0 },
    availablePoints: { type: Number, default: 0 },
    upgrades: [prestigeUpgradeSchema],
    heritageSlotsUsed: { type: Number, default: 0 },
    heritageItems: [{ type: String }],
    rebirthHistory: [rebirthHistorySchema],
    highestLevelReached: { type: Number, default: 0 },
    titleColor: { type: String },
    nameEffect: { type: String },
    xpMultiplier: { type: Number, default: 1 },
    lootMultiplier: { type: Number, default: 1 },
    goldMultiplier: { type: Number, default: 1 },
    statsMultiplier: { type: Number, default: 1 },
  },
  { timestamps: true }
);

prestigeSchema.index({ totalRebirths: -1 });
prestigeSchema.index({ totalPrestigePoints: -1 });

export const Prestige = mongoose.model<PrestigeDocument>('Prestige', prestigeSchema);
export default Prestige;
