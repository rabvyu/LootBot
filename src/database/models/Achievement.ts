import mongoose, { Document, Schema } from 'mongoose';

// Categoria de conquista
export type AchievementCategory =
  | 'combat'       // Combate
  | 'progression'  // Progressão
  | 'social'       // Social/Guilda
  | 'crafting'     // Crafting
  | 'exploration'  // Exploração/Dungeons
  | 'collection'   // Coleção
  | 'pvp'          // PvP/Arena
  | 'events'       // Eventos
  | 'special';     // Especiais

// Raridade da conquista
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

// Interface para requisito de conquista
export interface AchievementRequirement {
  type: string;
  target: number;
  description: string;
}

// Interface para recompensa
export interface AchievementReward {
  type: 'coins' | 'xp' | 'material' | 'title' | 'badge';
  itemId?: string;
  quantity: number;
}

// Interface para definição de conquista
export interface IAchievementDefinition extends Document {
  achievementId: string;
  name: string;
  description: string;
  emoji: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  points: number; // Pontos de conquista
  secret: boolean; // Conquista secreta (não mostra descrição até desbloquear)
  requirement: AchievementRequirement;
  rewards: AchievementReward[];
  createdAt: Date;
}

// Interface para progresso do jogador
export interface IAchievementProgress extends Document {
  discordId: string;
  achievements: Array<{
    achievementId: string;
    progress: number;
    completed: boolean;
    completedAt?: Date;
    claimed: boolean;
    claimedAt?: Date;
  }>;
  totalPoints: number;
  completedCount: number;
  stats: {
    monstersKilled: number;
    bossesKilled: number;
    dungeonsCompleted: number;
    pvpWins: number;
    pvpLosses: number;
    itemsCrafted: number;
    enchantmentsApplied: number;
    coinsEarned: number;
    coinsSpent: number;
    questsCompleted: number;
    eventsParticipated: number;
    guildContribution: number;
    tradingVolume: number;
    loginDays: number;
    loginStreak: number;
    maxLevel: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Schema para definição de conquista
const AchievementDefinitionSchema = new Schema<IAchievementDefinition>({
  achievementId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  emoji: { type: String, default: '🏆' },
  category: {
    type: String,
    enum: ['combat', 'progression', 'social', 'crafting', 'exploration', 'collection', 'pvp', 'events', 'special'],
    required: true,
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'],
    default: 'common',
  },
  points: { type: Number, default: 10 },
  secret: { type: Boolean, default: false },
  requirement: {
    type: { type: String, required: true },
    target: { type: Number, required: true },
    description: { type: String, required: true },
  },
  rewards: [{
    type: { type: String, enum: ['coins', 'xp', 'material', 'title', 'badge'], required: true },
    itemId: String,
    quantity: { type: Number, required: true },
  }],
}, { timestamps: true });

// Schema para progresso do jogador
const AchievementProgressSchema = new Schema<IAchievementProgress>({
  discordId: { type: String, required: true, unique: true },
  achievements: [{
    achievementId: { type: String, required: true },
    progress: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: Date,
    claimed: { type: Boolean, default: false },
    claimedAt: Date,
  }],
  totalPoints: { type: Number, default: 0 },
  completedCount: { type: Number, default: 0 },
  stats: {
    monstersKilled: { type: Number, default: 0 },
    bossesKilled: { type: Number, default: 0 },
    dungeonsCompleted: { type: Number, default: 0 },
    pvpWins: { type: Number, default: 0 },
    pvpLosses: { type: Number, default: 0 },
    itemsCrafted: { type: Number, default: 0 },
    enchantmentsApplied: { type: Number, default: 0 },
    coinsEarned: { type: Number, default: 0 },
    coinsSpent: { type: Number, default: 0 },
    questsCompleted: { type: Number, default: 0 },
    eventsParticipated: { type: Number, default: 0 },
    guildContribution: { type: Number, default: 0 },
    tradingVolume: { type: Number, default: 0 },
    loginDays: { type: Number, default: 0 },
    loginStreak: { type: Number, default: 0 },
    maxLevel: { type: Number, default: 1 },
  },
}, { timestamps: true });

AchievementProgressSchema.index({ discordId: 1 });
AchievementProgressSchema.index({ totalPoints: -1 });

export const AchievementDefinition = mongoose.model<IAchievementDefinition>('AchievementDefinition', AchievementDefinitionSchema);
export const AchievementProgress = mongoose.model<IAchievementProgress>('AchievementProgress', AchievementProgressSchema);

export type AchievementDefinitionDocument = IAchievementDefinition & Document;
export type AchievementProgressDocument = IAchievementProgress & Document;
