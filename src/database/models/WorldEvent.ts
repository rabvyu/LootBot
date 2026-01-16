import mongoose, { Document, Schema } from 'mongoose';

// Tipo de evento mundial
export type WorldEventType =
  | 'invasion'      // Invasão de monstros
  | 'treasure_hunt' // Caça ao tesouro
  | 'boss_world'    // Boss mundial
  | 'double_xp'     // Evento de XP dobrado
  | 'meteor_shower' // Chuva de meteoros (materiais raros)
  | 'guild_war'     // Guerra de guildas
  | 'tournament';   // Torneio automático

// Status do evento
export type WorldEventStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

// Interface para participante
export interface WorldEventParticipant {
  discordId: string;
  username: string;
  contribution: number;  // Contribuição total
  damage?: number;       // Dano causado (para boss)
  kills?: number;        // Monstros mortos (para invasão)
  itemsFound?: number;   // Itens encontrados (para treasure hunt)
  joinedAt: Date;
  lastActionAt: Date;
}

// Interface para recompensa
export interface WorldEventReward {
  type: 'coins' | 'xp' | 'material' | 'equipment' | 'title';
  itemId?: string;
  quantity: number;
  tier?: number;
}

// Interface para objetivo
export interface WorldEventObjective {
  objectiveId: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  rewards: WorldEventReward[];
}

// Interface principal
export interface IWorldEvent extends Document {
  eventId: string;
  type: WorldEventType;
  name: string;
  description: string;
  emoji: string;
  status: WorldEventStatus;

  // Datas
  scheduledStart: Date;
  actualStart?: Date;
  scheduledEnd: Date;
  actualEnd?: Date;

  // Configurações
  minLevel: number;
  maxParticipants?: number;
  cooldownHours?: number; // Cooldown entre participações

  // Dados do evento
  objectives: WorldEventObjective[];
  participants: WorldEventParticipant[];

  // Boss mundial (se aplicável)
  boss?: {
    name: string;
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    rewards: WorldEventReward[];
  };

  // Invasão (se aplicável)
  invasion?: {
    totalWaves: number;
    currentWave: number;
    monstersPerWave: number;
    monstersDefeated: number;
    monstersRemaining: number;
  };

  // Caça ao tesouro (se aplicável)
  treasureHunt?: {
    totalTreasures: number;
    foundTreasures: number;
    clues: string[];
    currentClue: number;
  };

  // Recompensas globais (distribuídas no fim)
  globalRewards: WorldEventReward[];

  // Ranking de contribuição
  topContributors: Array<{
    discordId: string;
    username: string;
    contribution: number;
    rank: number;
    bonusRewards: WorldEventReward[];
  }>;

  // Estatísticas
  stats: {
    totalParticipants: number;
    totalContribution: number;
    completionPercentage: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

const WorldEventSchema = new Schema<IWorldEvent>({
  eventId: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ['invasion', 'treasure_hunt', 'boss_world', 'double_xp', 'meteor_shower', 'guild_war', 'tournament'],
    required: true,
  },
  name: { type: String, required: true },
  description: { type: String, required: true },
  emoji: { type: String, default: '🌍' },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled',
  },

  scheduledStart: { type: Date, required: true },
  actualStart: Date,
  scheduledEnd: { type: Date, required: true },
  actualEnd: Date,

  minLevel: { type: Number, default: 1 },
  maxParticipants: Number,
  cooldownHours: Number,

  objectives: [{
    objectiveId: { type: String, required: true },
    description: { type: String, required: true },
    target: { type: Number, required: true },
    current: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    rewards: [{
      type: { type: String, enum: ['coins', 'xp', 'material', 'equipment', 'title'], required: true },
      itemId: String,
      quantity: { type: Number, required: true },
      tier: Number,
    }],
  }],

  participants: [{
    discordId: { type: String, required: true },
    username: { type: String, required: true },
    contribution: { type: Number, default: 0 },
    damage: Number,
    kills: Number,
    itemsFound: Number,
    joinedAt: { type: Date, default: Date.now },
    lastActionAt: { type: Date, default: Date.now },
  }],

  boss: {
    name: String,
    hp: Number,
    maxHp: Number,
    attack: Number,
    defense: Number,
    rewards: [{
      type: { type: String, enum: ['coins', 'xp', 'material', 'equipment', 'title'] },
      itemId: String,
      quantity: Number,
      tier: Number,
    }],
  },

  invasion: {
    totalWaves: Number,
    currentWave: Number,
    monstersPerWave: Number,
    monstersDefeated: Number,
    monstersRemaining: Number,
  },

  treasureHunt: {
    totalTreasures: Number,
    foundTreasures: Number,
    clues: [String],
    currentClue: Number,
  },

  globalRewards: [{
    type: { type: String, enum: ['coins', 'xp', 'material', 'equipment', 'title'], required: true },
    itemId: String,
    quantity: { type: Number, required: true },
    tier: Number,
  }],

  topContributors: [{
    discordId: { type: String, required: true },
    username: { type: String, required: true },
    contribution: { type: Number, required: true },
    rank: { type: Number, required: true },
    bonusRewards: [{
      type: { type: String, enum: ['coins', 'xp', 'material', 'equipment', 'title'] },
      itemId: String,
      quantity: Number,
      tier: Number,
    }],
  }],

  stats: {
    totalParticipants: { type: Number, default: 0 },
    totalContribution: { type: Number, default: 0 },
    completionPercentage: { type: Number, default: 0 },
  },
}, { timestamps: true });

WorldEventSchema.index({ status: 1 });
WorldEventSchema.index({ scheduledStart: 1 });
WorldEventSchema.index({ type: 1 });
WorldEventSchema.index({ 'participants.discordId': 1 });

export const WorldEvent = mongoose.model<IWorldEvent>('WorldEvent', WorldEventSchema);
export type WorldEventDocument = IWorldEvent & Document;
