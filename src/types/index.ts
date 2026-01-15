import { Collection } from 'discord.js';

// User Types
export interface UserStats {
  messagesCount: number;
  voiceMinutes: number;
  reactionsGiven: number;
  reactionsReceived: number;
  invitesCount: number;
  currentStreak: number;
  longestStreak: number;
  lastDaily: Date | null;
  lastActive: Date;
}

export interface DailyXP {
  date: Date;
  messages: number;
  voice: number;
  reactions: number;
  invites: number;
  bonus: number;
  total: number;
}

export interface UserBadge {
  badgeId: string;
  earnedAt: Date;
}

export interface IUser {
  discordId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  xp: number;
  level: number;
  totalXP: number;
  badges: UserBadge[];
  stats: UserStats;
  dailyXP: DailyXP;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Badge Types
export type BadgeCategory =
  | 'level'
  | 'time'
  | 'achievement'
  | 'special'
  | 'hardware'
  | 'overclocking'
  | 'setup'
  | 'peripherals'
  | '3dprint'
  | 'modding'
  | 'championship';

export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface BadgeRequirement {
  type: string;
  value: number;
}

export interface IBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  requirement: BadgeRequirement;
  rarity: BadgeRarity;
  createdAt: Date;
}

// Activity Log Types
export interface IActivityLog {
  discordId: string;
  action: string;
  xpGained: number;
  details: Record<string, unknown>;
  suspicious: boolean;
  timestamp: Date;
}

// Config Types
export interface IGuildConfig {
  guildId: string;
  xpBlacklistChannels: string[];
  xpBlacklistRoles: string[];
  levelUpChannel: string | null;
  logChannel: string | null;
  badgeNotificationChannel: string | null;
  eventMultiplier: number;
  eventActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// XP Types
export type XPSource = 'message' | 'voice' | 'reaction_given' | 'reaction_received' | 'daily' | 'streak' | 'invite' | 'event' | 'boost' | 'admin';

export interface XPGain {
  amount: number;
  source: XPSource;
  multiplier: number;
  finalAmount: number;
}

// Anti-Exploit Types
export interface CooldownData {
  lastAction: number;
  count: number;
}

export interface SpamDetectionResult {
  isSpam: boolean;
  reason?: string;
  penalty?: number;
}

// Voice Tracker Types
export interface VoiceSession {
  odiscordId: string;
  channelId: string;
  joinedAt: number;
  lastCheck: number;
  totalMinutes: number;
}

// API Types
export interface LeaderboardEntry {
  rank: number;
  discordId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  xp: number;
  level: number;
  badges: UserBadge[];
}

export interface ProfileResponse {
  discordId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  xp: number;
  level: number;
  totalXP: number;
  rank: number;
  xpForNextLevel: number;
  progress: number;
  badges: IBadge[];
  stats: UserStats;
  joinedAt: Date;
}

// Command Types
declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, Command>;
  }
}

export interface Command {
  data: {
    name: string;
    description: string;
    toJSON(): unknown;
  };
  execute: (interaction: unknown) => Promise<void>;
}

// Leaderboard Period
export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'alltime';
