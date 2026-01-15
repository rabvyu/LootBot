import mongoose, { Schema, Document } from 'mongoose';

export interface IUserResource {
  discordId: string;
  resourceId: string;
  amount: number;
  totalCollected: number;
  updatedAt: Date;
}

export interface UserResourceDocument extends Document {
  discordId: string;
  resourceId: string;
  amount: number;
  totalCollected: number;
}

const UserResourceSchema = new Schema<UserResourceDocument>({
  discordId: { type: String, required: true, index: true },
  resourceId: { type: String, required: true },
  amount: { type: Number, default: 0, min: 0 },
  totalCollected: { type: Number, default: 0 },
}, { timestamps: true });

UserResourceSchema.index({ discordId: 1, resourceId: 1 }, { unique: true });

export const UserResource = mongoose.model<UserResourceDocument>('UserResource', UserResourceSchema);
export default UserResource;
