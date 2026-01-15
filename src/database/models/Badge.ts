import mongoose, { Schema, Document } from 'mongoose';
import { IBadge, BadgeCategory, BadgeRarity, BadgeRequirement } from '../../types';

export interface BadgeDocument extends Omit<IBadge, 'id'>, Document {
  badgeId: string;
}

const BadgeRequirementSchema = new Schema<BadgeRequirement>({
  type: { type: String, required: true },
  value: { type: Number, required: true },
}, { _id: false });

const BadgeSchema = new Schema<BadgeDocument>({
  badgeId: {
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
  icon: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['level', 'time', 'achievement', 'special'],
    required: true,
    index: true,
  },
  requirement: {
    type: BadgeRequirementSchema,
    required: true,
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

export const Badge = mongoose.model<BadgeDocument>('Badge', BadgeSchema);
export default Badge;
