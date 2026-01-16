// Model de Quests
import mongoose, { Document, Schema } from 'mongoose';

export type QuestType = 'main' | 'side' | 'daily' | 'weekly' | 'guild' | 'event';
export type QuestStatus = 'available' | 'active' | 'completed' | 'failed' | 'ready_to_claim' | 'expired' | 'abandoned' | 'reset';
export type ObjectiveType = 'kill' | 'collect' | 'craft' | 'visit' | 'talk' | 'win_pvp' | 'complete_dungeon' | 'spend_coins' | 'earn_coins';

export interface QuestObjective {
  id: string;
  objectiveId: string; // Alias for id
  type: ObjectiveType;
  target: string;
  targetId?: string;
  targetName: string;
  quantity: number;
  requiredAmount: number; // Alias for quantity
  description: string;
}

export interface QuestReward {
  type: 'coins' | 'xp' | 'material' | 'equipment' | 'title' | 'badge';
  itemId?: string;
  quantity: number;
}

export interface QuestDialogue {
  npcId: string;
  npcName: string;
  npcEmoji: string;
  text: string;
  order: number;
}

// ==================== QUEST DEFINITION ====================
export interface IQuestDefinition {
  questId: string;
  title: string;
  name: string; // Alias for title
  description: string;
  type: QuestType;
  questType: QuestType; // Alias for type
  chapter?: number;
  prerequisites: string[];
  levelRequired: number;
  minLevel: number; // Alias for levelRequired
  maxLevel?: number;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  dialogues: QuestDialogue[];
  timeLimit?: number;
  repeatable: boolean;
  cooldown?: number;
  isActive: boolean;
  availableFrom?: Date;
  availableUntil?: Date;
}

export interface QuestDefinitionDocument extends IQuestDefinition, Document {}

const questObjectiveSchema = new Schema<QuestObjective>({
  id: { type: String, required: true },
  objectiveId: { type: String },
  type: { type: String, required: true, enum: ['kill', 'collect', 'craft', 'visit', 'talk', 'win_pvp', 'complete_dungeon', 'spend_coins', 'earn_coins'] },
  target: { type: String, required: true },
  targetId: { type: String },
  targetName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  requiredAmount: { type: Number },
  description: { type: String, required: true },
}, { _id: false });

const questRewardSchema = new Schema<QuestReward>({
  type: { type: String, required: true, enum: ['coins', 'xp', 'material', 'equipment', 'title', 'badge'] },
  itemId: { type: String },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const questDialogueSchema = new Schema<QuestDialogue>({
  npcId: { type: String, required: true },
  npcName: { type: String, required: true },
  npcEmoji: { type: String, required: true },
  text: { type: String, required: true },
  order: { type: Number, required: true },
}, { _id: false });

const questDefinitionSchema = new Schema<QuestDefinitionDocument>(
  {
    questId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    name: { type: String },
    description: { type: String, required: true },
    type: { type: String, required: true, enum: ['main', 'side', 'daily', 'weekly', 'guild', 'event'], index: true },
    questType: { type: String, enum: ['main', 'side', 'daily', 'weekly', 'guild', 'event'] },
    chapter: { type: Number },
    prerequisites: [{ type: String }],
    levelRequired: { type: Number, default: 1 },
    minLevel: { type: Number },
    maxLevel: { type: Number },
    objectives: [questObjectiveSchema],
    rewards: [questRewardSchema],
    dialogues: [questDialogueSchema],
    timeLimit: { type: Number },
    repeatable: { type: Boolean, default: false },
    cooldown: { type: Number },
    isActive: { type: Boolean, default: true },
    availableFrom: { type: Date },
    availableUntil: { type: Date },
  },
  { timestamps: true }
);

// ==================== QUEST PROGRESS ====================
export interface ObjectiveProgress {
  objectiveId: string;
  description?: string;
  current: number;
  currentProgress: number; // Alias for current
  requiredProgress: number;
  completed: boolean;
}

export interface IQuestProgress {
  discordId: string;
  odiscordId: string; // Alias for discordId
  questId: string;
  questName?: string;
  questType?: QuestType;
  status: QuestStatus;
  objectives: ObjectiveProgress[];
  startedAt: Date;
  acceptedAt: Date; // Alias for startedAt
  completedAt?: Date;
  rewardsClaimed: boolean;
  expiresAt?: Date;
}

export interface QuestProgressDocument extends IQuestProgress, Document {}

const objectiveProgressSchema = new Schema<ObjectiveProgress>({
  objectiveId: { type: String, required: true },
  description: { type: String },
  current: { type: Number, default: 0 },
  currentProgress: { type: Number, default: 0 },
  requiredProgress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
}, { _id: false });

const questProgressSchema = new Schema<QuestProgressDocument>(
  {
    discordId: { type: String, required: true, index: true },
    odiscordId: { type: String, index: true },
    questId: { type: String, required: true, index: true },
    questName: { type: String },
    questType: { type: String, enum: ['main', 'side', 'daily', 'weekly', 'guild', 'event'] },
    status: { type: String, required: true, enum: ['available', 'active', 'completed', 'failed', 'ready_to_claim', 'expired', 'abandoned', 'reset'], default: 'active' },
    objectives: [objectiveProgressSchema],
    startedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date },
    completedAt: { type: Date },
    rewardsClaimed: { type: Boolean, default: false },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

questProgressSchema.index({ discordId: 1, questId: 1 }, { unique: true });
questProgressSchema.index({ discordId: 1, status: 1 });

export const QuestDefinition = mongoose.model<QuestDefinitionDocument>('QuestDefinition', questDefinitionSchema);
export const QuestProgress = mongoose.model<QuestProgressDocument>('QuestProgress', questProgressSchema);
