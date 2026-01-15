import mongoose, { Document, Schema } from 'mongoose';

export type TrainingType = 'punch_tree' | 'kick_tree' | 'chop_tree' | 'mine_rock' | 'meditate' | 'run' | 'swim' | 'climb';

export interface TrainingDocument extends Document {
  odiscordId: string;
  trainingType: TrainingType;
  startedAt: Date;
  totalMinutes: number;
  xpEarned: number;
  isActive: boolean;
  lastCollected: Date;
  createdAt: Date;
  updatedAt: Date;
}

const trainingSchema = new Schema<TrainingDocument>(
  {
    odiscordId: { type: String, required: true, index: true },
    trainingType: { type: String, required: true },
    startedAt: { type: Date, default: Date.now },
    totalMinutes: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    isActive: { type: Boolean, default: false },
    lastCollected: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

trainingSchema.index({ odiscordId: 1, isActive: 1 });

export const Training = mongoose.model<TrainingDocument>('Training', trainingSchema);
export default Training;
