import mongoose, { Document, Schema } from 'mongoose';

export type JobType = 'taverneiro' | 'limpador' | 'mensageiro' | 'guarda' | 'ferreiro' | 'pescador' | 'lenhador' | 'mineiro' | 'fazendeiro' | 'cozinheiro';

export interface JobDocument extends Document {
  odiscordId: string;
  currentJob: JobType | null;
  jobStartedAt: Date | null;
  shiftsCompleted: number;
  totalEarned: number;
  lastShiftEnd: Date | null;
  jobHistory: {
    job: JobType;
    earnings: number;
    shifts: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<JobDocument>(
  {
    odiscordId: { type: String, required: true, unique: true, index: true },
    currentJob: { type: String, default: null },
    jobStartedAt: { type: Date, default: null },
    shiftsCompleted: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    lastShiftEnd: { type: Date, default: null },
    jobHistory: [{
      job: { type: String },
      earnings: { type: Number },
      shifts: { type: Number },
    }],
  },
  { timestamps: true }
);

export const Job = mongoose.model<JobDocument>('Job', jobSchema);
export default Job;
