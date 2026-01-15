import mongoose, { Schema, Document } from 'mongoose';

export type ClanRole = 'leader' | 'co-leader' | 'elder' | 'member';

export interface IClanMember {
  discordId: string;
  clanId: string;
  role: ClanRole;
  xpContributed: number;
  coinsContributed: number;
  warParticipations: number;
  warWins: number;
  joinedAt: Date;
}

export interface ClanMemberDocument extends Document {
  discordId: string;
  clanId: string;
  role: ClanRole;
  xpContributed: number;
  coinsContributed: number;
  warParticipations: number;
  warWins: number;
  joinedAt: Date;
}

const ClanMemberSchema = new Schema<ClanMemberDocument>({
  discordId: { type: String, required: true, unique: true, index: true },
  clanId: { type: String, required: true, index: true },
  role: {
    type: String,
    required: true,
    enum: ['leader', 'co-leader', 'elder', 'member'],
    default: 'member',
  },
  xpContributed: { type: Number, default: 0 },
  coinsContributed: { type: Number, default: 0 },
  warParticipations: { type: Number, default: 0 },
  warWins: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const ClanMember = mongoose.model<ClanMemberDocument>('ClanMember', ClanMemberSchema);
export default ClanMember;
