// Model da Torre dos Desafios
import mongoose, { Document, Schema } from 'mongoose';

export type TowerRunStatus = 'active' | 'completed' | 'failed' | 'abandoned';

export interface TowerModifier {
  modifierId: string;
  name: string;
  effect: string;
}

export interface TowerFloorResult {
  floor: number;
  enemies: number;
  bossDefeated: boolean;
  damageDealt: number;
  damageTaken: number;
  timeSpent: number;
  modifiers: string[];
  completed: boolean;
}

export interface ITowerRun {
  runId: string;
  odiscordId: string;
  username: string;
  currentFloor: number;
  highestFloor: number;
  status: TowerRunStatus;
  hp: number;
  maxHp: number;
  activeModifiers: TowerModifier[];
  floorResults: TowerFloorResult[];
  totalDamageDealt: number;
  totalDamageTaken: number;
  totalTimeSpent: number;
  deaths: number;
  startedAt: Date;
  completedAt?: Date;
  seasonId?: string;
}

export interface TowerRunDocument extends ITowerRun, Document {}

const towerModifierSchema = new Schema<TowerModifier>({
  modifierId: { type: String, required: true },
  name: { type: String, required: true },
  effect: { type: String, required: true },
}, { _id: false });

const towerFloorResultSchema = new Schema<TowerFloorResult>({
  floor: { type: Number, required: true },
  enemies: { type: Number, required: true },
  bossDefeated: { type: Boolean, default: false },
  damageDealt: { type: Number, default: 0 },
  damageTaken: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 },
  modifiers: [{ type: String }],
  completed: { type: Boolean, default: false },
}, { _id: false });

const towerRunSchema = new Schema<TowerRunDocument>(
  {
    runId: { type: String, required: true, unique: true, index: true },
    odiscordId: { type: String, required: true, index: true },
    username: { type: String, required: true },
    currentFloor: { type: Number, default: 1 },
    highestFloor: { type: Number, default: 0 },
    status: { type: String, required: true, enum: ['active', 'completed', 'failed', 'abandoned'], default: 'active' },
    hp: { type: Number, required: true },
    maxHp: { type: Number, required: true },
    activeModifiers: [towerModifierSchema],
    floorResults: [towerFloorResultSchema],
    totalDamageDealt: { type: Number, default: 0 },
    totalDamageTaken: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 },
    deaths: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    seasonId: { type: String },
  },
  { timestamps: true }
);

towerRunSchema.index({ odiscordId: 1, status: 1 });
towerRunSchema.index({ seasonId: 1, highestFloor: -1 });

// ==================== TOWER RECORD ====================
export interface ITowerRecord {
  odiscordId: string;
  username: string;
  highestFloor: number;
  totalRuns: number;
  bestTime: number;
  seasonId: string;
  achievedAt: Date;
}

export interface TowerRecordDocument extends ITowerRecord, Document {}

const towerRecordSchema = new Schema<TowerRecordDocument>(
  {
    odiscordId: { type: String, required: true, index: true },
    username: { type: String, required: true },
    highestFloor: { type: Number, required: true },
    totalRuns: { type: Number, default: 1 },
    bestTime: { type: Number },
    seasonId: { type: String, required: true },
    achievedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

towerRecordSchema.index({ seasonId: 1, highestFloor: -1 });
towerRecordSchema.index({ odiscordId: 1, seasonId: 1 }, { unique: true });

export const TowerRun = mongoose.model<TowerRunDocument>('TowerRun', towerRunSchema);
export const TowerRecord = mongoose.model<TowerRecordDocument>('TowerRecord', towerRecordSchema);
