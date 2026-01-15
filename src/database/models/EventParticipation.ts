import { Schema, model, Document } from 'mongoose';

export interface IEventParticipation {
  eventId: string;
  discordId: string;
  contribution: number;  // For community goals
  xpEarned: number;      // XP earned during event
  coinsEarned: number;   // Coins earned during event
  rewardsClaimed: boolean;
  joinedAt: Date;
  lastContribution: Date;
}

export interface EventParticipationDocument extends IEventParticipation, Document {}

const EventParticipationSchema = new Schema<EventParticipationDocument>({
  eventId: { type: String, required: true, index: true },
  discordId: { type: String, required: true, index: true },
  contribution: { type: Number, default: 0 },
  xpEarned: { type: Number, default: 0 },
  coinsEarned: { type: Number, default: 0 },
  rewardsClaimed: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now },
  lastContribution: { type: Date, default: Date.now },
}, { timestamps: true });

// Compound index for unique participation
EventParticipationSchema.index({ eventId: 1, discordId: 1 }, { unique: true });

export const EventParticipation = model<EventParticipationDocument>('EventParticipation', EventParticipationSchema);
