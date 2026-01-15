import { Job, JobDocument, JobType } from '../models/Job';

class JobRepository {
  async getJob(discordId: string): Promise<JobDocument | null> {
    return Job.findOne({ odiscordId: discordId });
  }

  async getOrCreateJob(discordId: string): Promise<JobDocument> {
    let job = await Job.findOne({ odiscordId: discordId });
    if (!job) {
      job = new Job({ odiscordId: discordId });
      await job.save();
    }
    return job;
  }

  async startJob(discordId: string, jobType: JobType): Promise<JobDocument> {
    const job = await this.getOrCreateJob(discordId);
    job.currentJob = jobType;
    job.jobStartedAt = new Date();
    return job.save();
  }

  async endShift(discordId: string, earnings: number): Promise<void> {
    await Job.updateOne(
      { odiscordId: discordId },
      {
        $inc: { shiftsCompleted: 1, totalEarned: earnings },
        lastShiftEnd: new Date(),
      }
    );
  }

  async quitJob(discordId: string): Promise<void> {
    const job = await Job.findOne({ odiscordId: discordId });
    if (job && job.currentJob) {
      // Save to history
      const existingHistory = job.jobHistory.find(h => h.job === job.currentJob);
      if (existingHistory) {
        existingHistory.earnings += job.totalEarned;
        existingHistory.shifts += job.shiftsCompleted;
      } else {
        job.jobHistory.push({
          job: job.currentJob,
          earnings: job.totalEarned,
          shifts: job.shiftsCompleted,
        });
      }

      job.currentJob = null;
      job.jobStartedAt = null;
      job.shiftsCompleted = 0;
      await job.save();
    }
  }

  async getLeaderboard(limit: number = 10): Promise<JobDocument[]> {
    return Job.find({ totalEarned: { $gt: 0 } })
      .sort({ totalEarned: -1 })
      .limit(limit);
  }
}

export const jobRepository = new JobRepository();
export default jobRepository;
