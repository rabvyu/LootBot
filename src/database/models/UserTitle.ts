import { Schema, model, Document } from 'mongoose';

export interface IUserTitle {
  discordId: string;
  titleId: string;
  equipped: boolean;
  earnedAt: Date;
  expiresAt?: Date | null;  // For temporary titles
}

export interface UserTitleDocument extends IUserTitle, Document {}

const UserTitleSchema = new Schema<UserTitleDocument>({
  discordId: { type: String, required: true, index: true },
  titleId: { type: String, required: true, index: true },
  equipped: { type: Boolean, default: false },
  earnedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });

// Compound index for unique user-title pairs
UserTitleSchema.index({ discordId: 1, titleId: 1 }, { unique: true });

// Index for finding equipped titles
UserTitleSchema.index({ discordId: 1, equipped: 1 });

export const UserTitle = model<UserTitleDocument>('UserTitle', UserTitleSchema);
