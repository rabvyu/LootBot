import mongoose, { Schema, Document } from 'mongoose';
import { IUser, UserStats, DailyXP, UserBadge, ProfileSettings } from '../../types';

export interface UserDocument extends Omit<IUser, '_id'>, Document {}

const UserBadgeSchema = new Schema<UserBadge>({
  badgeId: { type: String, required: true },
  earnedAt: { type: Date, default: Date.now },
}, { _id: false });

const UserStatsSchema = new Schema<UserStats>({
  messagesCount: { type: Number, default: 0 },
  voiceMinutes: { type: Number, default: 0 },
  reactionsGiven: { type: Number, default: 0 },
  reactionsReceived: { type: Number, default: 0 },
  invitesCount: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastDaily: { type: Date, default: null },
  lastActive: { type: Date, default: Date.now },
}, { _id: false });

const DailyXPSchema = new Schema<DailyXP>({
  date: { type: Date, default: Date.now },
  messages: { type: Number, default: 0 },
  voice: { type: Number, default: 0 },
  reactions: { type: Number, default: 0 },
  invites: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
}, { _id: false });

const ProfileSettingsSchema = new Schema<ProfileSettings>({
  showStats: { type: Boolean, default: true },
  showBadges: { type: Boolean, default: true },
  showStreak: { type: Boolean, default: true },
  showCoins: { type: Boolean, default: true },
  showRank: { type: Boolean, default: true },
  privateProfile: { type: Boolean, default: false },
}, { _id: false });

const UserSchema = new Schema<UserDocument>({
  discordId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  username: {
    type: String,
    required: true,
  },
  globalName: {
    type: String,
    default: null,
  },
  avatar: {
    type: String,
    default: null,
  },
  xp: {
    type: Number,
    default: 0,
    index: true,
  },
  level: {
    type: Number,
    default: 1,
    index: true,
  },
  totalXP: {
    type: Number,
    default: 0,
    index: true,
  },
  coins: {
    type: Number,
    default: 0,
  },
  badges: {
    type: [UserBadgeSchema],
    default: [],
  },
  stats: {
    type: UserStatsSchema,
    default: () => ({}),
  },
  dailyXP: {
    type: DailyXPSchema,
    default: () => ({}),
  },
  // Profile customization
  profileColor: {
    type: String,
    default: null,
  },
  profileBio: {
    type: String,
    default: null,
    maxLength: 200,
  },
  profileSettings: {
    type: ProfileSettingsSchema,
    default: () => ({}),
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
UserSchema.index({ totalXP: -1 }); // For leaderboard
UserSchema.index({ level: -1 }); // For level-based queries
UserSchema.index({ 'stats.messagesCount': -1 }); // For message leaderboard
UserSchema.index({ 'stats.voiceMinutes': -1 }); // For voice leaderboard
UserSchema.index({ joinedAt: 1 }); // For time-based queries
UserSchema.index({ 'dailyXP.date': 1 }); // For daily stats

export const User = mongoose.model<UserDocument>('User', UserSchema);
export default User;
