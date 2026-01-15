import { UserMission, UserMissionDocument } from '../models';

export class UserMissionRepository {
  /**
   * Find or create a user mission
   */
  async findOrCreate(
    discordId: string,
    missionId: string,
    expiresAt: Date | null = null
  ): Promise<UserMissionDocument> {
    let userMission = await UserMission.findOne({ discordId, missionId });

    if (!userMission) {
      userMission = await UserMission.create({
        discordId,
        missionId,
        progress: 0,
        completed: false,
        assignedAt: new Date(),
        expiresAt,
      });
    }

    return userMission;
  }

  /**
   * Find user mission
   */
  async find(discordId: string, missionId: string): Promise<UserMissionDocument | null> {
    return UserMission.findOne({ discordId, missionId });
  }

  /**
   * Find all active missions for a user
   */
  async findActiveForUser(discordId: string): Promise<UserMissionDocument[]> {
    return UserMission.find({
      discordId,
      completed: false,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    });
  }

  /**
   * Find all missions for a user (including completed)
   */
  async findAllForUser(discordId: string): Promise<UserMissionDocument[]> {
    return UserMission.find({ discordId });
  }

  /**
   * Find completed missions for a user
   */
  async findCompletedForUser(discordId: string): Promise<UserMissionDocument[]> {
    return UserMission.find({ discordId, completed: true });
  }

  /**
   * Update mission progress
   */
  async updateProgress(
    discordId: string,
    missionId: string,
    progress: number
  ): Promise<UserMissionDocument | null> {
    return UserMission.findOneAndUpdate(
      { discordId, missionId },
      { progress },
      { new: true }
    );
  }

  /**
   * Increment mission progress
   */
  async incrementProgress(
    discordId: string,
    missionId: string,
    amount: number = 1
  ): Promise<UserMissionDocument | null> {
    return UserMission.findOneAndUpdate(
      { discordId, missionId, completed: false },
      { $inc: { progress: amount } },
      { new: true }
    );
  }

  /**
   * Mark mission as completed
   */
  async complete(discordId: string, missionId: string): Promise<UserMissionDocument | null> {
    return UserMission.findOneAndUpdate(
      { discordId, missionId },
      { completed: true, completedAt: new Date() },
      { new: true }
    );
  }

  /**
   * Delete expired missions
   */
  async deleteExpired(): Promise<number> {
    const result = await UserMission.deleteMany({
      expiresAt: { $lte: new Date() },
      completed: false,
    });
    return result.deletedCount;
  }

  /**
   * Delete all missions for a user
   */
  async deleteAllForUser(discordId: string): Promise<number> {
    const result = await UserMission.deleteMany({ discordId });
    return result.deletedCount;
  }

  /**
   * Delete specific mission for user
   */
  async delete(discordId: string, missionId: string): Promise<boolean> {
    const result = await UserMission.deleteOne({ discordId, missionId });
    return result.deletedCount > 0;
  }

  /**
   * Check if user has completed a mission (ever)
   */
  async hasCompleted(discordId: string, missionId: string): Promise<boolean> {
    const mission = await UserMission.findOne({
      discordId,
      missionId,
      completed: true,
    });
    return !!mission;
  }

  /**
   * Reset daily missions for all users
   */
  async resetDailyMissions(missionIds: string[]): Promise<number> {
    const result = await UserMission.deleteMany({
      missionId: { $in: missionIds },
    });
    return result.deletedCount;
  }

  /**
   * Reset weekly missions for all users
   */
  async resetWeeklyMissions(missionIds: string[]): Promise<number> {
    const result = await UserMission.deleteMany({
      missionId: { $in: missionIds },
    });
    return result.deletedCount;
  }

  /**
   * Count completed missions for a user
   */
  async countCompletedForUser(discordId: string): Promise<number> {
    return UserMission.countDocuments({ discordId, completed: true });
  }

  /**
   * Get daily missions for user with mission IDs
   */
  async findByMissionIds(discordId: string, missionIds: string[]): Promise<UserMissionDocument[]> {
    return UserMission.find({
      discordId,
      missionId: { $in: missionIds },
    });
  }
}

export const userMissionRepository = new UserMissionRepository();
export default userMissionRepository;
