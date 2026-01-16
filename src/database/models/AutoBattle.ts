// Model de Auto-Battle/Farming
import mongoose, { Schema, Document } from 'mongoose';

// Tipos de farming automático
export type FarmingType =
  | 'dungeon'
  | 'arena'
  | 'mining'
  | 'fishing'
  | 'gathering'
  | 'crafting'
  | 'tower';

// Status da sessão
export type FarmingSessionStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

// Interface de configuração de auto-farming
export interface IAutoFarmingConfig extends Document {
  odiscordId: string;
  type: FarmingType;
  name: string;
  isActive: boolean;

  // Configurações gerais
  settings: {
    targetLocation?: string; // Dungeon ID, Arena tier, etc.
    difficulty?: string;
    maxRuns?: number;
    maxDuration?: number; // minutos
    stopOnLowHp?: number; // % de HP para parar
    stopOnFullInventory?: boolean;
    useHealthPotions?: boolean;
    useManaPotions?: boolean;
    prioritizeRareDrops?: boolean;
  };

  // Configurações de loot
  lootSettings: {
    autoSell?: boolean;
    sellRarity?: string[]; // ['common', 'uncommon'] = vende esses
    autoDismantle?: boolean;
    dismantleRarity?: string[];
    keepItems?: string[]; // IDs de itens para sempre manter
  };

  // Limites
  limits: {
    dailyRuns: number;
    runsToday: number;
    lastResetDate: Date;
    maxEnergyUse: number;
    energyUsedToday: number;
  };

  // Requisitos
  requirements: {
    minLevel?: number;
    requiredItems?: string[];
    requiredStats?: Record<string, number>;
  };

  createdAt: Date;
  updatedAt: Date;
}

// Interface de sessão de farming
export interface IFarmingSession extends Document {
  sessionId: string;
  odiscordId: string;
  configId: string;
  type: FarmingType;
  status: FarmingSessionStatus;

  // Progresso
  progress: {
    currentRun: number;
    totalRuns: number;
    currentWave?: number;
    totalWaves?: number;
    elapsedTime: number; // segundos
    maxTime: number;
  };

  // Estatísticas da sessão
  stats: {
    monstersKilled: number;
    damageDealt: number;
    damageTaken: number;
    healingDone: number;
    deaths: number;
    xpGained: number;
    coinsGained: number;
    itemsCollected: number;
    itemsSold: number;
    itemsDismantled: number;
    energyUsed: number;
    potionsUsed: number;
  };

  // Loot coletado
  loot: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    rarity: string;
    action: 'kept' | 'sold' | 'dismantled';
    value?: number;
  }>;

  // Log de eventos
  eventLog: Array<{
    timestamp: Date;
    event: string;
    details?: Record<string, any>;
  }>;

  // Timestamps
  startedAt: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  completedAt?: Date;

  // Motivo de parada/falha
  endReason?: string;
}

// Interface de histórico resumido
export interface IFarmingHistory extends Document {
  odiscordId: string;
  type: FarmingType;
  configName: string;
  sessionId: string;
  status: FarmingSessionStatus;
  duration: number; // segundos
  runs: number;
  xpGained: number;
  coinsGained: number;
  itemsCollected: number;
  completedAt: Date;
}

// Schema de configuração
const AutoFarmingConfigSchema = new Schema<IAutoFarmingConfig>({
  odiscordId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  settings: {
    targetLocation: { type: String },
    difficulty: { type: String },
    maxRuns: { type: Number, default: 10 },
    maxDuration: { type: Number, default: 60 },
    stopOnLowHp: { type: Number, default: 20 },
    stopOnFullInventory: { type: Boolean, default: true },
    useHealthPotions: { type: Boolean, default: true },
    useManaPotions: { type: Boolean, default: true },
    prioritizeRareDrops: { type: Boolean, default: true },
  },
  lootSettings: {
    autoSell: { type: Boolean, default: false },
    sellRarity: { type: [String], default: [] },
    autoDismantle: { type: Boolean, default: false },
    dismantleRarity: { type: [String], default: [] },
    keepItems: { type: [String], default: [] },
  },
  limits: {
    dailyRuns: { type: Number, default: 50 },
    runsToday: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now },
    maxEnergyUse: { type: Number, default: 500 },
    energyUsedToday: { type: Number, default: 0 },
  },
  requirements: {
    minLevel: { type: Number },
    requiredItems: { type: [String] },
    requiredStats: { type: Schema.Types.Mixed },
  },
}, { timestamps: true });

// Schema de sessão
const FarmingSessionSchema = new Schema<IFarmingSession>({
  sessionId: { type: String, required: true, unique: true, index: true },
  odiscordId: { type: String, required: true, index: true },
  configId: { type: String, required: true },
  type: { type: String, required: true },
  status: {
    type: String,
    enum: ['idle', 'running', 'paused', 'completed', 'failed', 'cancelled'],
    default: 'idle',
    index: true,
  },
  progress: {
    currentRun: { type: Number, default: 0 },
    totalRuns: { type: Number, default: 0 },
    currentWave: { type: Number },
    totalWaves: { type: Number },
    elapsedTime: { type: Number, default: 0 },
    maxTime: { type: Number, default: 3600 },
  },
  stats: {
    monstersKilled: { type: Number, default: 0 },
    damageDealt: { type: Number, default: 0 },
    damageTaken: { type: Number, default: 0 },
    healingDone: { type: Number, default: 0 },
    deaths: { type: Number, default: 0 },
    xpGained: { type: Number, default: 0 },
    coinsGained: { type: Number, default: 0 },
    itemsCollected: { type: Number, default: 0 },
    itemsSold: { type: Number, default: 0 },
    itemsDismantled: { type: Number, default: 0 },
    energyUsed: { type: Number, default: 0 },
    potionsUsed: { type: Number, default: 0 },
  },
  loot: [{
    itemId: { type: String },
    itemName: { type: String },
    quantity: { type: Number },
    rarity: { type: String },
    action: { type: String, enum: ['kept', 'sold', 'dismantled'] },
    value: { type: Number },
  }],
  eventLog: [{
    timestamp: { type: Date, default: Date.now },
    event: { type: String },
    details: { type: Schema.Types.Mixed },
  }],
  startedAt: { type: Date },
  pausedAt: { type: Date },
  resumedAt: { type: Date },
  completedAt: { type: Date },
  endReason: { type: String },
});

// Schema de histórico
const FarmingHistorySchema = new Schema<IFarmingHistory>({
  odiscordId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  configName: { type: String, required: true },
  sessionId: { type: String, required: true },
  status: { type: String, required: true },
  duration: { type: Number, default: 0 },
  runs: { type: Number, default: 0 },
  xpGained: { type: Number, default: 0 },
  coinsGained: { type: Number, default: 0 },
  itemsCollected: { type: Number, default: 0 },
  completedAt: { type: Date, default: Date.now, index: true },
});

// Índices compostos
AutoFarmingConfigSchema.index({ odiscordId: 1, type: 1 });
FarmingSessionSchema.index({ odiscordId: 1, status: 1 });
FarmingHistorySchema.index({ odiscordId: 1, completedAt: -1 });

export const AutoFarmingConfig = mongoose.model<IAutoFarmingConfig>('AutoFarmingConfig', AutoFarmingConfigSchema);
export const FarmingSession = mongoose.model<IFarmingSession>('FarmingSession', FarmingSessionSchema);
export const FarmingHistory = mongoose.model<IFarmingHistory>('FarmingHistory', FarmingHistorySchema);

export type AutoFarmingConfigDocument = IAutoFarmingConfig;
export type FarmingSessionDocument = IFarmingSession;
export type FarmingHistoryDocument = IFarmingHistory;
