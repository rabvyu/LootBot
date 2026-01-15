import mongoose, { Schema, Document } from 'mongoose';

export interface IUserInventoryItem {
  discordId: string;
  itemId: string;
  itemType: string;
  quantity: number;
  expiresAt: Date | null;
  active: boolean;
  data: Record<string, unknown>;
  purchasedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserInventoryDocument extends Omit<IUserInventoryItem, '_id'>, Document {}

const UserInventorySchema = new Schema<UserInventoryDocument>({
  discordId: {
    type: String,
    required: true,
    index: true,
  },
  itemId: {
    type: String,
    required: true,
  },
  itemType: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  active: {
    type: Boolean,
    default: true,
  },
  data: {
    type: Schema.Types.Mixed,
    default: {},
  },
  purchasedAt: {
    type: Date,
    default: () => new Date(),
  },
}, {
  timestamps: true,
});

// Compound index
UserInventorySchema.index({ discordId: 1, itemId: 1 });
UserInventorySchema.index({ expiresAt: 1 });

export const UserInventory = mongoose.model<UserInventoryDocument>('UserInventory', UserInventorySchema);
export default UserInventory;
