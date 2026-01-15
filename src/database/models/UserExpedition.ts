import mongoose, { Schema, Document } from 'mongoose';

export type ExpeditionStatus = 'active' | 'completed' | 'failed' | 'claimed';

export interface IUserExpedition {
  discordId: string;
  expeditionId: string;
  status: ExpeditionStatus;
  startedAt: Date;
  endsAt: Date;
  completedAt?: Date;
  success?: boolean;
  rewards?: {
    coins: number;
    xp: number;
    resources?: { resourceId: string; amount: number }[];
    badgeAwarded?: string;
  };
}

export interface UserExpeditionDocument extends Document {
  discordId: string;
  expeditionId: string;
  status: ExpeditionStatus;
  startedAt: Date;
  endsAt: Date;
  completedAt?: Date;
  success?: boolean;
  rewards?: {
    coins: number;
    xp: number;
    resources?: { resourceId: string; amount: number }[];
    badgeAwarded?: string;
  };
}

const UserExpeditionSchema = new Schema<UserExpeditionDocument>({
  discordId: { type: String, required: true, index: true },
  expeditionId: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ['active', 'completed', 'failed', 'claimed'],
    default: 'active',
  },
  startedAt: { type: Date, required: true, default: Date.now },
  endsAt: { type: Date, required: true },
  completedAt: { type: Date, default: null },
  success: { type: Boolean, default: null },
  rewards: {
    coins: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    resources: [{
      resourceId: String,
      amount: Number,
    }],
    badgeAwarded: { type: String, default: null },
  },
}, { timestamps: true });

UserExpeditionSchema.index({ discordId: 1, status: 1 });
UserExpeditionSchema.index({ endsAt: 1 });

export const UserExpedition = mongoose.model<UserExpeditionDocument>('UserExpedition', UserExpeditionSchema);
export default UserExpedition;
