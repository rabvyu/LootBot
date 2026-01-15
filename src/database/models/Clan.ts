import mongoose, { Schema, Document } from 'mongoose';

export interface IClan {
  id: string;
  name: string;
  tag: string;
  description: string;
  emoji: string;
  leaderId: string;
  coLeaderIds: string[];
  level: number;
  experience: number;
  totalXPContributed: number;
  coins: number;
  maxMembers: number;
  memberCount: number;
  wins: number;
  losses: number;
  warWins: number;
  isPublic: boolean;
  bannerUrl?: string;
  createdAt: Date;
}

export interface ClanDocument extends Document {
  id: string;
  name: string;
  tag: string;
  description: string;
  emoji: string;
  leaderId: string;
  coLeaderIds: string[];
  level: number;
  experience: number;
  totalXPContributed: number;
  coins: number;
  maxMembers: number;
  memberCount: number;
  wins: number;
  losses: number;
  warWins: number;
  isPublic: boolean;
  bannerUrl?: string;
  createdAt: Date;
}

const ClanSchema = new Schema<ClanDocument>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, unique: true },
  tag: { type: String, required: true, unique: true, maxlength: 5 },
  description: { type: String, default: 'Um clã incrível!' },
  emoji: { type: String, default: '⚔️' },
  leaderId: { type: String, required: true, index: true },
  coLeaderIds: [{ type: String }],
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  totalXPContributed: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  maxMembers: { type: Number, default: 10 },
  memberCount: { type: Number, default: 1 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  warWins: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: true },
  bannerUrl: { type: String, default: null },
}, { timestamps: true });

export const Clan = mongoose.model<ClanDocument>('Clan', ClanSchema);
export default Clan;
