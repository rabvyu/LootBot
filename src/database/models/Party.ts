import mongoose, { Document, Schema } from 'mongoose';

export interface PartyMember {
  odiscordId: string;
  username: string;
  joinedAt: Date;
  contribution: number;
  damageDealt: number;
}

export interface PartyDocument extends Document {
  leaderId: string;
  leaderName: string;
  members: PartyMember[];
  maxSize: number;
  isActive: boolean;
  inBattle: boolean;
  currentBattleId: string | null;
  totalBattles: number;
  totalWins: number;
  createdAt: Date;
  updatedAt: Date;
}

const partySchema = new Schema<PartyDocument>(
  {
    leaderId: { type: String, required: true, index: true },
    leaderName: { type: String, required: true },
    members: [{
      odiscordId: { type: String, required: true },
      username: { type: String, required: true },
      joinedAt: { type: Date, default: Date.now },
      contribution: { type: Number, default: 0 },
      damageDealt: { type: Number, default: 0 },
    }],
    maxSize: { type: Number, default: 8 },
    isActive: { type: Boolean, default: true },
    inBattle: { type: Boolean, default: false },
    currentBattleId: { type: String, default: null },
    totalBattles: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
  },
  { timestamps: true }
);

partySchema.index({ 'members.odiscordId': 1 });

export const Party = mongoose.model<PartyDocument>('Party', partySchema);
export default Party;
