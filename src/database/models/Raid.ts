// Model de Raids
import mongoose, { Document, Schema } from 'mongoose';

export type RaidDifficulty = 'normal' | 'heroic' | 'mythic';
export type RaidStatus = 'waiting' | 'forming' | 'in_progress' | 'completed' | 'failed' | 'abandoned';
export type RaidRunStatus = RaidStatus; // Alias
export type RaidRunParticipantData = RaidRunParticipant; // Alias

export interface RaidRunParticipant {
  odiscordId: string;
  username: string;
  characterClass: string;
  level: number;
  role: 'tank' | 'healer' | 'dps';
  damageDealt: number;
  healingDone: number;
  damageTaken: number;
  deaths: number;
  joinedAt: Date;
}

export interface RaidBossProgress {
  bossId: string;
  bossName: string;
  defeated: boolean;
  attempts: number;
  defeatedAt?: Date;
  lootDistributed: boolean;
  // Phase-related fields (for service compatibility)
  phaseNumber?: number;
  name?: string;
  bossCurrentHp?: number;
  bossMaxHp?: number;
  started?: boolean;
  startedAt?: Date;
  completed?: boolean;
  completedAt?: Date;
  timeSpent?: number;
}

export interface RaidPhase extends RaidBossProgress {} // Alias

export interface IRaidRun {
  runId: string;
  raidId: string;
  raidName: string;
  difficulty: RaidDifficulty;
  leaderId: string;
  leaderName: string;
  minPlayers: number;
  maxPlayers: number;
  participants: RaidRunParticipant[];
  bossProgress: RaidBossProgress[];
  phases: RaidBossProgress[]; // Alias for bossProgress
  currentBossIndex: number;
  currentPhase: number; // Alias for currentBossIndex
  status: RaidStatus;
  startedAt?: Date;
  completedAt?: Date;
  totalDamage: number;
  totalDamageDealt: number; // Alias for totalDamage
  totalHealing: number;
  totalHealingDone: number; // Alias for totalHealing
  wipes: number;
  totalDeaths: number; // Alias for wipes
  loot: any[];
  createdAt: Date;
}

export interface RaidRunDocument extends IRaidRun, Document {}

const raidParticipantSchema = new Schema<RaidRunParticipant>({
  odiscordId: { type: String, required: true },
  username: { type: String, required: true },
  characterClass: { type: String, required: true },
  level: { type: Number, required: true },
  role: { type: String, required: true, enum: ['tank', 'healer', 'dps'] },
  damageDealt: { type: Number, default: 0 },
  healingDone: { type: Number, default: 0 },
  damageTaken: { type: Number, default: 0 },
  deaths: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const raidBossProgressSchema = new Schema<RaidBossProgress>({
  bossId: { type: String, required: true },
  bossName: { type: String, required: true },
  defeated: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
  defeatedAt: { type: Date },
  lootDistributed: { type: Boolean, default: false },
  phaseNumber: { type: Number },
  name: { type: String },
  bossCurrentHp: { type: Number },
  bossMaxHp: { type: Number },
  started: { type: Boolean, default: false },
  startedAt: { type: Date },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  timeSpent: { type: Number, default: 0 },
}, { _id: false });

const raidRunSchema = new Schema<RaidRunDocument>(
  {
    runId: { type: String, required: true, unique: true, index: true },
    raidId: { type: String, required: true, index: true },
    raidName: { type: String, required: true },
    difficulty: { type: String, required: true, enum: ['normal', 'heroic', 'mythic'] },
    leaderId: { type: String, required: true, index: true },
    leaderName: { type: String, required: true },
    minPlayers: { type: Number, required: true },
    maxPlayers: { type: Number, required: true },
    participants: [raidParticipantSchema],
    bossProgress: [raidBossProgressSchema],
    phases: [raidBossProgressSchema],
    currentBossIndex: { type: Number, default: 0 },
    currentPhase: { type: Number, default: 1 },
    status: { type: String, required: true, enum: ['waiting', 'forming', 'in_progress', 'completed', 'failed', 'abandoned'], default: 'waiting' },
    startedAt: { type: Date },
    completedAt: { type: Date },
    totalDamage: { type: Number, default: 0 },
    totalDamageDealt: { type: Number, default: 0 },
    totalHealing: { type: Number, default: 0 },
    totalHealingDone: { type: Number, default: 0 },
    wipes: { type: Number, default: 0 },
    totalDeaths: { type: Number, default: 0 },
    loot: [{ type: Schema.Types.Mixed }],
  },
  { timestamps: true }
);

raidRunSchema.index({ status: 1 });
raidRunSchema.index({ leaderId: 1, status: 1 });

// ==================== RAID LOCKOUT ====================
export interface IRaidLockout {
  odiscordId: string;
  raidId: string;
  difficulty: RaidDifficulty;
  bossesDefeated: string[];
  completedPhases: number[]; // Alias (different type for service compatibility)
  resetAt: Date;
  expiresAt: Date; // Alias for resetAt
  createdAt: Date;
}

export interface RaidLockoutDocument extends IRaidLockout, Document {}

const raidLockoutSchema = new Schema<RaidLockoutDocument>(
  {
    odiscordId: { type: String, required: true, index: true },
    raidId: { type: String, required: true },
    difficulty: { type: String, required: true, enum: ['normal', 'heroic', 'mythic'] },
    bossesDefeated: [{ type: String }],
    completedPhases: [{ type: Number }],
    resetAt: { type: Date, required: true },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

raidLockoutSchema.index({ odiscordId: 1, raidId: 1, difficulty: 1 }, { unique: true });

export const RaidRun = mongoose.model<RaidRunDocument>('RaidRun', raidRunSchema);
export const RaidLockout = mongoose.model<RaidLockoutDocument>('RaidLockout', raidLockoutSchema);
