import { Schema, model, Document } from 'mongoose';

export type TitleSource = 'shop' | 'event' | 'achievement' | 'admin' | 'level';

export interface ITitle {
  id: string;
  name: string;
  displayName: string;  // The actual title text shown (e.g., "⭐ Champion")
  description: string;
  source: TitleSource;
  requiredLevel?: number;
  requiredBadgeId?: string;
  price?: number;  // For shop titles
  color?: string;  // Hex color for styling
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TitleDocument extends Omit<ITitle, 'id'>, Document {}

const TitleSchema = new Schema<TitleDocument>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  displayName: { type: String, required: true },
  description: { type: String, required: true },
  source: {
    type: String,
    required: true,
    enum: ['shop', 'event', 'achievement', 'admin', 'level'],
  },
  requiredLevel: { type: Number },
  requiredBadgeId: { type: String },
  price: { type: Number },
  color: { type: String },
  rarity: {
    type: String,
    required: true,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common',
  },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export const Title = model<TitleDocument>('Title', TitleSchema);
