import mongoose, { Schema, Document } from 'mongoose';

// Cargos da guilda
export type GuildRole = 'leader' | 'vice_leader' | 'officer' | 'member';

// Status da guilda
export type GuildStatus = 'active' | 'inactive' | 'at_war';

// Membro da guilda
export interface GuildMember {
  discordId: string;
  username: string;
  role: GuildRole;
  joinedAt: Date;
  contributionXP: number;
  contributionCoins: number;
  weeklyActivity: number;
  lastActive: Date;
}

// Log de atividade da guilda
export interface GuildActivityLog {
  type: 'join' | 'leave' | 'kick' | 'promote' | 'demote' | 'deposit' | 'withdraw' | 'war_start' | 'war_end' | 'dungeon_complete' | 'level_up';
  actorId: string;
  targetId?: string;
  details: string;
  timestamp: Date;
}

// Recurso do banco da guilda
export interface GuildBankResource {
  resourceId: string;
  quantity: number;
}

// Upgrade da guilda
export interface GuildUpgrade {
  upgradeId: string;
  level: number;
  purchasedAt: Date;
}

// Interface principal da guilda
export interface IGuild {
  guildId: string;
  name: string;
  tag: string; // Tag curta [TAG]
  description: string;
  emoji: string;
  leaderId: string;
  members: GuildMember[];
  level: number;
  experience: number;
  status: GuildStatus;
  createdAt: Date;

  // Banco da guilda
  bank: {
    coins: number;
    resources: GuildBankResource[];
  };

  // Upgrades
  upgrades: GuildUpgrade[];

  // Configurações
  settings: {
    isPublic: boolean;
    minLevelToJoin: number;
    autoAcceptInvites: boolean;
    bankWithdrawRole: GuildRole;
  };

  // Estatísticas
  stats: {
    totalXPEarned: number;
    totalCoinsEarned: number;
    dungeonsCompleted: number;
    bossesKilled: number;
    warsWon: number;
    warsLost: number;
    membersRecruited: number;
  };

  // Logs
  activityLogs: GuildActivityLog[];

  // Guerra atual (se houver)
  currentWar?: {
    enemyGuildId: string;
    startedAt: Date;
    endsAt: Date;
    ourScore: number;
    theirScore: number;
  };
}

export interface GuildDocument extends Document, IGuild {}

const GuildMemberSchema = new Schema<GuildMember>({
  discordId: { type: String, required: true },
  username: { type: String, required: true },
  role: { type: String, enum: ['leader', 'vice_leader', 'officer', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
  contributionXP: { type: Number, default: 0 },
  contributionCoins: { type: Number, default: 0 },
  weeklyActivity: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
}, { _id: false });

const GuildActivityLogSchema = new Schema<GuildActivityLog>({
  type: { type: String, required: true },
  actorId: { type: String, required: true },
  targetId: { type: String },
  details: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const GuildBankResourceSchema = new Schema<GuildBankResource>({
  resourceId: { type: String, required: true },
  quantity: { type: Number, required: true },
}, { _id: false });

const GuildUpgradeSchema = new Schema<GuildUpgrade>({
  upgradeId: { type: String, required: true },
  level: { type: Number, default: 1 },
  purchasedAt: { type: Date, default: Date.now },
}, { _id: false });

const GuildSchema = new Schema<GuildDocument>({
  guildId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, unique: true, maxlength: 32 },
  tag: { type: String, required: true, unique: true, maxlength: 5 },
  description: { type: String, default: '', maxlength: 256 },
  emoji: { type: String, default: '⚔️' },
  leaderId: { type: String, required: true, index: true },
  members: [GuildMemberSchema],
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive', 'at_war'], default: 'active' },

  bank: {
    coins: { type: Number, default: 0 },
    resources: [GuildBankResourceSchema],
  },

  upgrades: [GuildUpgradeSchema],

  settings: {
    isPublic: { type: Boolean, default: false },
    minLevelToJoin: { type: Number, default: 1 },
    autoAcceptInvites: { type: Boolean, default: false },
    bankWithdrawRole: { type: String, enum: ['leader', 'vice_leader', 'officer', 'member'], default: 'vice_leader' },
  },

  stats: {
    totalXPEarned: { type: Number, default: 0 },
    totalCoinsEarned: { type: Number, default: 0 },
    dungeonsCompleted: { type: Number, default: 0 },
    bossesKilled: { type: Number, default: 0 },
    warsWon: { type: Number, default: 0 },
    warsLost: { type: Number, default: 0 },
    membersRecruited: { type: Number, default: 0 },
  },

  activityLogs: [GuildActivityLogSchema],

  currentWar: {
    enemyGuildId: { type: String },
    startedAt: { type: Date },
    endsAt: { type: Date },
    ourScore: { type: Number, default: 0 },
    theirScore: { type: Number, default: 0 },
  },
}, { timestamps: true });

// Índices
GuildSchema.index({ name: 'text' });
GuildSchema.index({ level: -1 });
GuildSchema.index({ 'stats.totalXPEarned': -1 });
GuildSchema.index({ 'members.discordId': 1 });

// Métodos virtuais
GuildSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

GuildSchema.virtual('xpToNextLevel').get(function() {
  return Math.floor(1000 * Math.pow(this.level, 1.5));
});

export const Guild = mongoose.model<GuildDocument>('Guild', GuildSchema);
export default Guild;
