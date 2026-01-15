import mongoose, { Schema, Document } from 'mongoose';

export type ShopItemType =
  | 'role_temp'      // Temporary role
  | 'xp_booster'     // XP multiplier
  | 'title'          // Custom title
  | 'badge'          // Purchasable badge
  | 'lottery_ticket' // Lottery ticket
  | 'profile_color'; // Profile embed color

export interface IShopItem {
  id: string;
  name: string;
  description: string;
  type: ShopItemType;
  price: number;
  stock: number | null;        // null = unlimited
  roleId: string | null;       // For role items
  duration: number | null;     // Duration in hours (for temp items)
  multiplier: number | null;   // For XP boosters
  badgeId: string | null;      // For badge items
  color: string | null;        // For profile colors
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShopItemDocument extends Omit<IShopItem, 'id'>, Document {
  id: string;
}

const ShopItemSchema = new Schema<ShopItemDocument>({
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
    enum: ['role_temp', 'xp_booster', 'title', 'badge', 'lottery_ticket', 'profile_color'],
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  stock: {
    type: Number,
    default: null,
  },
  roleId: {
    type: String,
    default: null,
  },
  duration: {
    type: Number,
    default: null,
  },
  multiplier: {
    type: Number,
    default: null,
  },
  badgeId: {
    type: String,
    default: null,
  },
  color: {
    type: String,
    default: null,
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export const ShopItem = mongoose.model<ShopItemDocument>('ShopItem', ShopItemSchema);
export default ShopItem;
