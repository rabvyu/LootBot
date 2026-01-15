import mongoose, { Schema, Document } from 'mongoose';

// Types of mission objectives
export type MissionType =
  | 'send_messages'
  | 'voice_minutes'
  | 'give_reactions'
  | 'receive_reactions'
  | 'reply_messages'
  | 'use_command'
  | 'collect_daily'
  | 'reach_leaderboard';

// Mission period
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

export interface MissionDocument extends Omit<IMission, 'id'>, Document {
  id: string;
}

const MissionSchema = new Schema<MissionDocument>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'send_messages',
      'voice_minutes',
      'give_reactions',
      'receive_reactions',
      'reply_messages',
      'use_command',
      'collect_daily',
      'reach_leaderboard',
    ],
  },
  period: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'achievement'],
  },
  target: {
    type: Number,
    required: true,
    min: 1,
  },
  xpReward: {
    type: Number,
    default: 0,
  },
  coinsReward: {
    type: Number,
    default: 0,
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export const Mission = mongoose.model<MissionDocument>('Mission', MissionSchema);
export default Mission;
