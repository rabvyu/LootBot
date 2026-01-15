import mongoose, { Schema, Document } from 'mongoose';
import { IGuildConfig } from '../../types';

export interface ConfigDocument extends Omit<IGuildConfig, '_id'>, Document {}

const ConfigSchema = new Schema<ConfigDocument>({
  guildId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  xpBlacklistChannels: {
    type: [String],
    default: [],
  },
  xpBlacklistRoles: {
    type: [String],
    default: [],
  },
  levelUpChannel: {
    type: String,
    default: null,
  },
  logChannel: {
    type: String,
    default: null,
  },
  badgeNotificationChannel: {
    type: String,
    default: null,
  },
  eventMultiplier: {
    type: Number,
    default: 1,
  },
  eventActive: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export const Config = mongoose.model<ConfigDocument>('Config', ConfigSchema);
export default Config;
