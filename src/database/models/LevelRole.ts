import mongoose, { Schema, Document } from 'mongoose';

export interface ILevelRole {
  guildId: string;
  roleId: string;
  requiredLevel: number;
  removeOnHigher: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LevelRoleDocument extends Omit<ILevelRole, '_id'>, Document {}

const LevelRoleSchema = new Schema<LevelRoleDocument>({
  guildId: {
    type: String,
    required: true,
    index: true,
  },
  roleId: {
    type: String,
    required: true,
  },
  requiredLevel: {
    type: Number,
    required: true,
    min: 1,
  },
  removeOnHigher: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
LevelRoleSchema.index({ guildId: 1, requiredLevel: 1 });
LevelRoleSchema.index({ guildId: 1, roleId: 1 }, { unique: true });

export const LevelRole = mongoose.model<LevelRoleDocument>('LevelRole', LevelRoleSchema);
export default LevelRole;
