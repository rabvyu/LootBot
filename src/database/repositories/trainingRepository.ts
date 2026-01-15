import { Training, TrainingDocument, TrainingType } from '../models/Training';

class TrainingRepository {
  async getActiveTraining(discordId: string): Promise<TrainingDocument | null> {
    return Training.findOne({ odiscordId: discordId, isActive: true });
  }

  async getAllTrainings(discordId: string): Promise<TrainingDocument[]> {
    return Training.find({ odiscordId: discordId });
  }

  async getTrainingByType(discordId: string, type: TrainingType): Promise<TrainingDocument | null> {
    return Training.findOne({ odiscordId: discordId, trainingType: type });
  }

  async startTraining(discordId: string, type: TrainingType): Promise<TrainingDocument> {
    // Stop any active training
    await Training.updateMany({ odiscordId: discordId, isActive: true }, { isActive: false });

    // Find or create training
    let training = await Training.findOne({ odiscordId: discordId, trainingType: type });
    if (!training) {
      training = new Training({
        odiscordId: discordId,
        trainingType: type,
        isActive: true,
        startedAt: new Date(),
        lastCollected: new Date(),
      });
    } else {
      training.isActive = true;
      training.startedAt = new Date();
      training.lastCollected = new Date();
    }
    return training.save();
  }

  async stopTraining(discordId: string): Promise<TrainingDocument | null> {
    const training = await Training.findOne({ odiscordId: discordId, isActive: true });
    if (!training) return null;

    training.isActive = false;
    return training.save();
  }

  async collectXP(discordId: string, xp: number, minutes: number): Promise<void> {
    await Training.updateOne(
      { odiscordId: discordId, isActive: true },
      {
        $inc: { xpEarned: xp, totalMinutes: minutes },
        lastCollected: new Date()
      }
    );
  }

  async getLeaderboard(type: TrainingType, limit: number = 10): Promise<TrainingDocument[]> {
    return Training.find({ trainingType: type })
      .sort({ totalMinutes: -1 })
      .limit(limit);
  }

  async getTotalTrainingTime(discordId: string): Promise<number> {
    const trainings = await Training.find({ odiscordId: discordId });
    return trainings.reduce((sum, t) => sum + t.totalMinutes, 0);
  }
}

export const trainingRepository = new TrainingRepository();
export default trainingRepository;
