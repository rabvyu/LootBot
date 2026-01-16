import mongoose, { Schema, Document } from 'mongoose';

export interface IDuel extends Document {
  challengerId: string;
  challengerName: string;
  opponentId: string;
  opponentName: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'declined' | 'expired';
  betAmount: number;
  winnerId?: string;
  winnerName?: string;
  rounds: string[];
  challengerDamage: number;
  opponentDamage: number;
  challengerFinalHp: number;
  opponentFinalHp: number;
  xpRewardWinner: number;
  xpRewardLoser: number;
  createdAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}

const DuelSchema = new Schema<IDuel>({
  challengerId: { type: String, required: true, index: true },
  challengerName: { type: String, required: true },
  opponentId: { type: String, required: true, index: true },
  opponentName: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'declined', 'expired'],
    default: 'pending',
    index: true
  },
  betAmount: { type: Number, default: 0 },
  winnerId: { type: String },
  winnerName: { type: String },
  rounds: [{ type: String }],
  challengerDamage: { type: Number, default: 0 },
  opponentDamage: { type: Number, default: 0 },
  challengerFinalHp: { type: Number, default: 0 },
  opponentFinalHp: { type: Number, default: 0 },
  xpRewardWinner: { type: Number, default: 0 },
  xpRewardLoser: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  expiresAt: { type: Date, required: true, index: true },
});

// Index for finding pending duels
DuelSchema.index({ status: 1, expiresAt: 1 });
DuelSchema.index({ challengerId: 1, opponentId: 1, status: 1 });

export const Duel = mongoose.model<IDuel>('Duel', DuelSchema);
