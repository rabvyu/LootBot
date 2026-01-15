import { Expedition, ExpeditionDocument, ExpeditionDifficulty } from '../models/Expedition';
import { UserExpedition, UserExpeditionDocument, ExpeditionStatus } from '../models/UserExpedition';

class ExpeditionRepository {
  // Expedition definitions
  async getExpeditionById(id: string): Promise<ExpeditionDocument | null> {
    return Expedition.findOne({ id, active: true });
  }

  async getAllExpeditions(): Promise<ExpeditionDocument[]> {
    return Expedition.find({ active: true }).sort({ durationHours: 1 });
  }

  async getExpeditionsByDifficulty(difficulty: ExpeditionDifficulty): Promise<ExpeditionDocument[]> {
    return Expedition.find({ difficulty, active: true });
  }

  async createExpedition(data: Partial<ExpeditionDocument>): Promise<ExpeditionDocument> {
    return Expedition.create(data);
  }

  // User expeditions
  async getActiveExpedition(discordId: string): Promise<UserExpeditionDocument | null> {
    return UserExpedition.findOne({ discordId, status: 'active' });
  }

  async getCompletedExpeditions(discordId: string): Promise<UserExpeditionDocument[]> {
    return UserExpedition.find({
      discordId,
      status: { $in: ['completed', 'failed'] },
    }).sort({ completedAt: -1 }).limit(10);
  }

  async getUserExpeditionHistory(discordId: string, limit: number = 20): Promise<UserExpeditionDocument[]> {
    return UserExpedition.find({ discordId })
      .sort({ startedAt: -1 })
      .limit(limit);
  }

  async startExpedition(
    discordId: string,
    expeditionId: string,
    durationHours: number
  ): Promise<UserExpeditionDocument> {
    const now = new Date();
    const endsAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    return UserExpedition.create({
      discordId,
      expeditionId,
      status: 'active',
      startedAt: now,
      endsAt,
    });
  }

  async completeExpedition(
    discordId: string,
    success: boolean,
    rewards?: {
      coins: number;
      xp: number;
      resources?: { resourceId: string; amount: number }[];
      badgeAwarded?: string;
    }
  ): Promise<UserExpeditionDocument | null> {
    return UserExpedition.findOneAndUpdate(
      { discordId, status: 'active' },
      {
        status: success ? 'completed' : 'failed',
        completedAt: new Date(),
        success,
        rewards,
      },
      { new: true }
    );
  }

  async claimExpedition(discordId: string): Promise<UserExpeditionDocument | null> {
    return UserExpedition.findOneAndUpdate(
      { discordId, status: { $in: ['completed', 'failed'] } },
      { status: 'claimed' },
      { new: true }
    );
  }

  async getExpiredExpeditions(): Promise<UserExpeditionDocument[]> {
    return UserExpedition.find({
      status: 'active',
      endsAt: { $lte: new Date() },
    });
  }

  async countCompletedExpeditions(discordId: string): Promise<number> {
    return UserExpedition.countDocuments({
      discordId,
      status: 'claimed',
      success: true,
    });
  }

  async getTotalExpeditionRewards(discordId: string): Promise<{ coins: number; xp: number }> {
    const result = await UserExpedition.aggregate([
      { $match: { discordId, status: 'claimed', success: true } },
      {
        $group: {
          _id: null,
          totalCoins: { $sum: '$rewards.coins' },
          totalXp: { $sum: '$rewards.xp' },
        },
      },
    ]);

    return result[0] || { coins: 0, xp: 0 };
  }
}

export const expeditionRepository = new ExpeditionRepository();
export default expeditionRepository;
