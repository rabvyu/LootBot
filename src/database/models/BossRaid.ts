import mongoose, { Document, Schema } from 'mongoose';

// Boss definitions
export const BOSSES: Record<string, BossDefinition> = {
  dragon: {
    id: 'dragon',
    name: 'Dragao Anciao',
    emoji: '🐉',
    description: 'Um dragao milenar que desperta de seu sono',
    baseHp: 50000,
    baseAttack: 150,
    baseDefense: 80,
    level: 50,
    rewards: {
      coins: { min: 500, max: 2000 },
      xp: { min: 200, max: 800 },
      resources: [
        { resourceId: 'diamond', chance: 0.3, amount: { min: 5, max: 15 } },
        { resourceId: 'essence', chance: 0.5, amount: { min: 10, max: 30 } },
      ],
    },
    minParticipants: 5,
    timeLimit: 30, // minutes
  },
  titan: {
    id: 'titan',
    name: 'Tita de Ferro',
    emoji: '🗿',
    description: 'Um colosso de metal que guarda tesouros antigos',
    baseHp: 75000,
    baseAttack: 120,
    baseDefense: 150,
    level: 60,
    rewards: {
      coins: { min: 800, max: 3000 },
      xp: { min: 300, max: 1000 },
      resources: [
        { resourceId: 'refined_iron', chance: 0.4, amount: { min: 10, max: 25 } },
        { resourceId: 'gold_bar', chance: 0.3, amount: { min: 5, max: 15 } },
      ],
    },
    minParticipants: 8,
    timeLimit: 45,
  },
  hydra: {
    id: 'hydra',
    name: 'Hidra das Profundezas',
    emoji: '🐍',
    description: 'Uma criatura de multiplas cabecas das aguas sombrias',
    baseHp: 100000,
    baseAttack: 200,
    baseDefense: 100,
    level: 75,
    rewards: {
      coins: { min: 1200, max: 5000 },
      xp: { min: 500, max: 1500 },
      resources: [
        { resourceId: 'fish_golden', chance: 0.4, amount: { min: 3, max: 10 } },
        { resourceId: 'essence', chance: 0.6, amount: { min: 20, max: 50 } },
        { resourceId: 'diamond', chance: 0.2, amount: { min: 10, max: 25 } },
      ],
    },
    minParticipants: 10,
    timeLimit: 60,
  },
  phoenix: {
    id: 'phoenix',
    name: 'Fenix Imortal',
    emoji: '🔥',
    description: 'Uma ave lendaria que renasce das cinzas',
    baseHp: 80000,
    baseAttack: 180,
    baseDefense: 60,
    level: 65,
    rewards: {
      coins: { min: 1000, max: 4000 },
      xp: { min: 400, max: 1200 },
      resources: [
        { resourceId: 'essence', chance: 0.7, amount: { min: 30, max: 60 } },
        { resourceId: 'gold', chance: 0.5, amount: { min: 50, max: 100 } },
      ],
    },
    minParticipants: 7,
    timeLimit: 40,
  },
  kraken: {
    id: 'kraken',
    name: 'Kraken Abissal',
    emoji: '🦑',
    description: 'O terror dos mares profundos',
    baseHp: 120000,
    baseAttack: 170,
    baseDefense: 130,
    level: 80,
    rewards: {
      coins: { min: 1500, max: 6000 },
      xp: { min: 600, max: 2000 },
      resources: [
        { resourceId: 'fish_golden', chance: 0.5, amount: { min: 5, max: 15 } },
        { resourceId: 'fish_rare', chance: 0.8, amount: { min: 20, max: 50 } },
        { resourceId: 'diamond', chance: 0.25, amount: { min: 15, max: 35 } },
      ],
    },
    minParticipants: 12,
    timeLimit: 75,
  },
};

export interface BossDefinition {
  id: string;
  name: string;
  emoji: string;
  description: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  level: number;
  rewards: {
    coins: { min: number; max: number };
    xp: { min: number; max: number };
    resources: Array<{
      resourceId: string;
      chance: number;
      amount: { min: number; max: number };
    }>;
  };
  minParticipants: number;
  timeLimit: number; // minutes
}

export interface RaidParticipant {
  discordId: string;
  username: string;
  damageDealt: number;
  attackCount: number;
  lastAttack: Date;
  rewards?: {
    coins: number;
    xp: number;
    resources: Array<{ resourceId: string; amount: number }>;
  };
}

export interface IBossRaid extends Document {
  bossId: string;
  bossName: string;
  bossEmoji: string;
  guildId: string;
  channelId: string;

  // Boss stats (scaled by difficulty)
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
  level: number;

  // Raid info
  difficulty: number; // 1-5, affects HP and rewards
  status: 'recruiting' | 'active' | 'completed' | 'failed' | 'expired';
  participants: RaidParticipant[];

  // Time tracking
  startedAt?: Date;
  endsAt?: Date;
  completedAt?: Date;
  createdAt: Date;

  // Rewards pool
  totalCoinsPool: number;
  totalXpPool: number;
}

const RaidParticipantSchema = new Schema<RaidParticipant>({
  discordId: { type: String, required: true },
  username: { type: String, required: true },
  damageDealt: { type: Number, default: 0 },
  attackCount: { type: Number, default: 0 },
  lastAttack: { type: Date },
  rewards: {
    coins: Number,
    xp: Number,
    resources: [{
      resourceId: String,
      amount: Number,
    }],
  },
}, { _id: false });

const BossRaidSchema = new Schema<IBossRaid>({
  bossId: { type: String, required: true },
  bossName: { type: String, required: true },
  bossEmoji: { type: String, required: true },
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },

  currentHp: { type: Number, required: true },
  maxHp: { type: Number, required: true },
  attack: { type: Number, required: true },
  defense: { type: Number, required: true },
  level: { type: Number, required: true },

  difficulty: { type: Number, default: 1, min: 1, max: 5 },
  status: {
    type: String,
    enum: ['recruiting', 'active', 'completed', 'failed', 'expired'],
    default: 'recruiting',
  },
  participants: [RaidParticipantSchema],

  startedAt: Date,
  endsAt: Date,
  completedAt: Date,
  createdAt: { type: Date, default: Date.now },

  totalCoinsPool: { type: Number, default: 0 },
  totalXpPool: { type: Number, default: 0 },
});

// Indexes
BossRaidSchema.index({ guildId: 1, status: 1 });
BossRaidSchema.index({ status: 1, endsAt: 1 });
BossRaidSchema.index({ 'participants.discordId': 1 });

export const BossRaid = mongoose.model<IBossRaid>('BossRaid', BossRaidSchema);
export default BossRaid;
