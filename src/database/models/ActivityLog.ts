import mongoose, { Schema, Document } from 'mongoose';
import { IActivityLog } from '../../types';

export interface ActivityLogDocument extends Omit<IActivityLog, '_id'>, Document {}

const ActivityLogSchema = new Schema<ActivityLogDocument>({
  discordId: {
    type: String,
    required: true,
    index: true,
  },
  action: {
    type: String,
    required: true,
    index: true,
  },
  xpGained: {
    type: Number,
    default: 0,
  },
  details: {
    type: Schema.Types.Mixed,
    default: {},
  },
  suspicious: {
    type: Boolean,
    default: false,
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    // Note: index is created via TTL index below (line 43)
  },
});

// Index for efficient queries
ActivityLogSchema.index({ discordId: 1, timestamp: -1 });
ActivityLogSchema.index({ suspicious: 1, timestamp: -1 });
ActivityLogSchema.index({ action: 1, timestamp: -1 });

// TTL index - automatically delete logs older than 90 days
ActivityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const ActivityLog = mongoose.model<ActivityLogDocument>('ActivityLog', ActivityLogSchema);
export default ActivityLog;
