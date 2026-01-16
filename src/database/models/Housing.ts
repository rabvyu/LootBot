// Model de Housing/Base Pessoal
import mongoose, { Document, Schema } from 'mongoose';

export interface HiredNpc {
  npcId: string;
  npcName: string;
  effect: string;
  costPerWeek: number;
  hiredAt: Date;
  lastPaidAt: Date;
}

export interface GardenPlot {
  plotIndex: number;
  seedId?: string;
  seedName?: string;
  plantedAt?: Date;
  readyAt?: Date;
  watered: boolean;
  fertilized: boolean;
  qualityBonus: number;
}

export interface StoredDecoration {
  decorationId: string;
  name: string;
  slot: string;
  placedAt: Date;
}

export interface CraftingStation {
  stationType: string;
  name: string;
  level: number;
  successBonus: number;
}

export interface IHousing {
  odiscordId: string;
  baseLevel: number;
  baseName: string;
  storageSlots: number;
  storedItems: Array<{ itemId: string; itemName: string; quantity: number; itemData?: any }>;
  hiredNpcs: HiredNpc[];
  maxNpcs: number;
  garden: GardenPlot[];
  maxGardenPlots: number;
  decorations: StoredDecoration[];
  craftingStations: CraftingStation[];
  hasPortal: boolean;
  portalCooldownReduction: number;
  totalUpgradeCost: number;
  createdAt: Date;
}

export interface HousingDocument extends IHousing, Document {}

const hiredNpcSchema = new Schema<HiredNpc>({
  npcId: { type: String, required: true },
  npcName: { type: String, required: true },
  effect: { type: String, required: true },
  costPerWeek: { type: Number, required: true },
  hiredAt: { type: Date, default: Date.now },
  lastPaidAt: { type: Date, default: Date.now },
}, { _id: false });

const gardenPlotSchema = new Schema<GardenPlot>({
  plotIndex: { type: Number, required: true },
  seedId: { type: String },
  seedName: { type: String },
  plantedAt: { type: Date },
  readyAt: { type: Date },
  watered: { type: Boolean, default: false },
  fertilized: { type: Boolean, default: false },
  qualityBonus: { type: Number, default: 0 },
}, { _id: false });

const storedDecorationSchema = new Schema<StoredDecoration>({
  decorationId: { type: String, required: true },
  name: { type: String, required: true },
  slot: { type: String, required: true },
  placedAt: { type: Date, default: Date.now },
}, { _id: false });

const craftingStationSchema = new Schema<CraftingStation>({
  stationType: { type: String, required: true },
  name: { type: String, required: true },
  level: { type: Number, default: 1 },
  successBonus: { type: Number, default: 0 },
}, { _id: false });

const housingSchema = new Schema<HousingDocument>(
  {
    odiscordId: { type: String, required: true, unique: true, index: true },
    baseLevel: { type: Number, default: 1, min: 1, max: 6 },
    baseName: { type: String, default: 'Tenda' },
    storageSlots: { type: Number, default: 10 },
    storedItems: [{
      itemId: { type: String, required: true },
      itemName: { type: String, required: true },
      quantity: { type: Number, required: true },
      itemData: { type: Schema.Types.Mixed },
    }],
    hiredNpcs: [hiredNpcSchema],
    maxNpcs: { type: Number, default: 0 },
    garden: [gardenPlotSchema],
    maxGardenPlots: { type: Number, default: 0 },
    decorations: [storedDecorationSchema],
    craftingStations: [craftingStationSchema],
    hasPortal: { type: Boolean, default: false },
    portalCooldownReduction: { type: Number, default: 0 },
    totalUpgradeCost: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Housing = mongoose.model<HousingDocument>('Housing', housingSchema);
export default Housing;
