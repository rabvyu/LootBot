import mongoose, { Schema, Document } from 'mongoose';

// Dificuldade da dungeon
export type DungeonDifficulty = 'normal' | 'hard' | 'extreme' | 'impossible';

// Status de uma run de dungeon
export type DungeonRunStatus = 'forming' | 'in_progress' | 'completed' | 'failed' | 'abandoned';

// Participante da dungeon
export interface DungeonParticipant {
  discordId: string;
  username: string;
  level: number;
  class: string;
  damageDealt: number;
  healingDone: number;
  deaths: number;
  joinedAt: Date;
  isReady: boolean;
}

// Wave de monstros
export interface DungeonWave {
  waveNumber: number;
  monsters: Array<{
    monsterId: string;
    name: string;
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    isAlive: boolean;
  }>;
  completed: boolean;
  startedAt?: Date;
  completedAt?: Date;
}

// Boss da dungeon
export interface DungeonBoss {
  bossId: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  abilities: string[];
  isAlive: boolean;
  phase: number;
  enraged: boolean;
}

// Loot de um participante
export interface DungeonLoot {
  discordId: string;
  coins: number;
  xp: number;
  items: Array<{
    itemId: string;
    itemName: string;
    rarity: string;
    quantity: number;
  }>;
  materials: Array<{
    materialId: string;
    materialName: string;
    quantity: number;
  }>;
}

// Interface de uma run de dungeon
export interface IDungeonRun {
  runId: string;
  dungeonId: string;
  dungeonName: string;
  difficulty: DungeonDifficulty;
  guildId?: string;
  guildName?: string;
  leaderId: string;
  leaderUsername: string;
  participants: DungeonParticipant[];
  minPlayers: number;
  maxPlayers: number;

  // Status
  status: DungeonRunStatus;
  currentWave: number;
  totalWaves: number;

  // Waves e Boss
  waves: DungeonWave[];
  boss?: DungeonBoss;

  // Tempos
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;

  // Resultados
  success?: boolean;
  totalDamageDealt: number;
  totalHealingDone: number;
  totalDeaths: number;
  loot: DungeonLoot[];

  // Channel
  channelId: string;
  messageId?: string;
}

export interface DungeonRunDocument extends Document, IDungeonRun {}

const DungeonParticipantSchema = new Schema<DungeonParticipant>({
  discordId: { type: String, required: true },
  username: { type: String, required: true },
  level: { type: Number, required: true },
  class: { type: String, required: true },
  damageDealt: { type: Number, default: 0 },
  healingDone: { type: Number, default: 0 },
  deaths: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now },
  isReady: { type: Boolean, default: false },
}, { _id: false });

const DungeonWaveSchema = new Schema<DungeonWave>({
  waveNumber: { type: Number, required: true },
  monsters: [{
    monsterId: { type: String, required: true },
    name: { type: String, required: true },
    hp: { type: Number, required: true },
    maxHp: { type: Number, required: true },
    attack: { type: Number, required: true },
    defense: { type: Number, required: true },
    isAlive: { type: Boolean, default: true },
  }],
  completed: { type: Boolean, default: false },
  startedAt: { type: Date },
  completedAt: { type: Date },
}, { _id: false });

const DungeonBossSchema = new Schema<DungeonBoss>({
  bossId: { type: String, required: true },
  name: { type: String, required: true },
  hp: { type: Number, required: true },
  maxHp: { type: Number, required: true },
  attack: { type: Number, required: true },
  defense: { type: Number, required: true },
  abilities: [{ type: String }],
  isAlive: { type: Boolean, default: true },
  phase: { type: Number, default: 1 },
  enraged: { type: Boolean, default: false },
}, { _id: false });

const DungeonLootSchema = new Schema<DungeonLoot>({
  discordId: { type: String, required: true },
  coins: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  items: [{
    itemId: { type: String, required: true },
    itemName: { type: String, required: true },
    rarity: { type: String, required: true },
    quantity: { type: Number, default: 1 },
  }],
  materials: [{
    materialId: { type: String, required: true },
    materialName: { type: String, required: true },
    quantity: { type: Number, default: 1 },
  }],
}, { _id: false });

const DungeonRunSchema = new Schema<DungeonRunDocument>({
  runId: { type: String, required: true, unique: true, index: true },
  dungeonId: { type: String, required: true, index: true },
  dungeonName: { type: String, required: true },
  difficulty: { type: String, enum: ['normal', 'hard', 'extreme', 'impossible'], required: true },
  guildId: { type: String, index: true },
  guildName: { type: String },
  leaderId: { type: String, required: true, index: true },
  leaderUsername: { type: String, required: true },
  participants: [DungeonParticipantSchema],
  minPlayers: { type: Number, required: true },
  maxPlayers: { type: Number, required: true },

  status: { type: String, enum: ['forming', 'in_progress', 'completed', 'failed', 'abandoned'], default: 'forming' },
  currentWave: { type: Number, default: 0 },
  totalWaves: { type: Number, required: true },

  waves: [DungeonWaveSchema],
  boss: DungeonBossSchema,

  startedAt: { type: Date },
  completedAt: { type: Date },

  success: { type: Boolean },
  totalDamageDealt: { type: Number, default: 0 },
  totalHealingDone: { type: Number, default: 0 },
  totalDeaths: { type: Number, default: 0 },
  loot: [DungeonLootSchema],

  channelId: { type: String, required: true },
  messageId: { type: String },
}, { timestamps: true });

// Índices
DungeonRunSchema.index({ status: 1, createdAt: -1 });
DungeonRunSchema.index({ 'participants.discordId': 1 });
// TTL para limpar runs antigas após 7 dias
DungeonRunSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

export const DungeonRun = mongoose.model<DungeonRunDocument>('DungeonRun', DungeonRunSchema);
export default DungeonRun;
