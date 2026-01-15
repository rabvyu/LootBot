import mongoose, { Schema, Document } from 'mongoose';

export interface IUserMission {
  discordId: string;
  missionId: string;
  progress: number;
  completed: boolean;
  completedAt: Date | null;
  assignedAt: Date;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMissionDocument extends Omit<IUserMission, '_id'>, Document {}

const UserMissionSchema = new Schema<UserMissionDocument>({
  discordId: {
    type: String,
    required: true,
    index: true,
  },
  missionId: {
    type: String,
    required: true,
  },
  progress: {
    type: Number,
    default: 0,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  assignedAt: {
    type: Date,
    default: () => new Date(),
  },
  expiresAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
UserMissionSchema.index({ discordId: 1, missionId: 1 }, { unique: true });
UserMissionSchema.index({ discordId: 1, completed: 1 });
UserMissionSchema.index({ expiresAt: 1 });

export const UserMission = mongoose.model<UserMissionDocument>('UserMission', UserMissionSchema);
export default UserMission;
