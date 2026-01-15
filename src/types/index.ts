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

export interface ProfileSettings {
  showStats: boolean;
  showBadges: boolean;
  showStreak: boolean;
  showCoins: boolean;
  showRank: boolean;
  privateProfile: boolean;
}

export interface IUser {
  discordId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  xp: number;
  level: number;
  totalXP: number;
  coins: number;
  badges: UserBadge[];
  stats: UserStats;
  dailyXP: DailyXP;
  profileColor: string | null;
  profileBio: string | null;
  profileSettings: ProfileSettings;
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

// Level Role Types
export interface ILevelRole {
  guildId: string;
  roleId: string;
  requiredLevel: number;
  removeOnHigher: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Mission Types
export type MissionType =
  | 'send_messages'
  | 'voice_minutes'
  | 'give_reactions'
  | 'receive_reactions'
  | 'reply_messages'
  | 'use_command'
  | 'collect_daily'
  | 'reach_leaderboard';

export type MissionPeriod = 'daily' | 'weekly' | 'achievement';

export interface IMission {
  id: string;
  name: string;
  description: string;
  type: MissionType;
  period: MissionPeriod;
  target: number;
  xpReward: number;
  coinsReward: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMission {
  discordId: string;
  missionId: string;
  progress: number;
  completed: boolean;
  completedAt: Date | null;
  assignedAt: Date;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Economy Types
export type ShopItemType =
  | 'role_temp'
  | 'xp_booster'
  | 'title'
  | 'badge'
  | 'lottery_ticket'
  | 'profile_color';

export interface IShopItem {
  id: string;
  name: string;
  description: string;
  type: ShopItemType;
  price: number;
  stock: number | null;
  roleId: string | null;
  duration: number | null;
  multiplier: number | null;
  badgeId: string | null;
  color: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType =
  | 'earn'
  | 'spend'
  | 'transfer_out'
  | 'transfer_in'
  | 'lottery_win'
  | 'admin'
  | 'sell'
  | 'job'
  | 'party_battle';

export interface ITransaction {
  discordId: string;
  type: TransactionType;
  amount: number;
  balance: number;
  description: string;
  relatedUserId: string | null;
  relatedItemId: string | null;
  createdAt: Date;
}

// Event Types
export type EventType =
  | 'xp_boost'
  | 'coins_boost'
  | 'double_daily'
  | 'badge_hunt'
  | 'community_goal'
  | 'seasonal';

export interface IEvent {
  id: string;
  name: string;
  description: string;
  type: EventType;
  active: boolean;
  startDate: Date;
  endDate: Date;
  multiplier?: number;
  badgeId?: string;
  goalType?: 'messages' | 'voice_minutes' | 'reactions' | 'total_xp';
  goalTarget?: number;
  goalProgress?: number;
  goalReward?: {
    xp?: number;
    coins?: number;
    badgeId?: string;
  };
  seasonalTheme?: string;
  participants?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventParticipation {
  eventId: string;
  discordId: string;
  contribution: number;
  xpEarned: number;
  coinsEarned: number;
  rewardsClaimed: boolean;
  joinedAt: Date;
  lastContribution: Date;
}

// Title Types
export type TitleSource = 'shop' | 'event' | 'achievement' | 'admin' | 'level';
export type TitleRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface ITitle {
  id: string;
  name: string;
  displayName: string;
  description: string;
  source: TitleSource;
  requiredLevel?: number;
  requiredBadgeId?: string;
  price?: number;
  color?: string;
  rarity: TitleRarity;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserTitle {
  discordId: string;
  titleId: string;
  equipped: boolean;
  earnedAt: Date;
  expiresAt?: Date | null;
}
