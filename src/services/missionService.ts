import { GuildMember, TextChannel } from 'discord.js';
import { missionRepository } from '../database/repositories/missionRepository';
import { userMissionRepository } from '../database/repositories/userMissionRepository';
import { userRepository } from '../database/repositories/userRepository';
import { MissionDocument, UserMissionDocument } from '../database/models';
import { MissionType, MissionPeriod, IMission } from '../types';
import { logger } from '../utils/logger';
import { startOfDay, startOfWeek } from '../utils/helpers';

export interface MissionProgress {
  mission: MissionDocument;
  userMission: UserMissionDocument;
  percentComplete: number;
}

export interface CompletedMission {
  mission: MissionDocument;
  xpEarned: number;
  coinsEarned: number;
}

class MissionService {
  private dailyMissionsCount = 3;
  private weeklyMissionsCount = 5;

  /**
   * Initialize missions (create defaults)
   */
  async initialize(): Promise<void> {
    await missionRepository.initializeDefaults();
    logger.info('Missions initialized');
  }

  /**
   * Get user's daily missions (assign if needed)
   */
  async getDailyMissions(discordId: string): Promise<MissionProgress[]> {
    const dailyMissions = await missionRepository.findByPeriod('daily');
    const userMissions = await userMissionRepository.findByMissionIds(
      discordId,
      dailyMissions.map(m => m.id)
    );

    // Check if we need to assign new daily missions
    const todayStart = startOfDay();
    const activeDailyMissions = userMissions.filter(
      um => um.assignedAt >= todayStart
    );

    if (activeDailyMissions.length < this.dailyMissionsCount) {
      // Assign new random daily missions
      return this.assignDailyMissions(discordId);
    }

    // Get mission details for active missions
    const result: MissionProgress[] = [];
    for (const userMission of activeDailyMissions) {
      const mission = dailyMissions.find(m => m.id === userMission.missionId);
      if (mission) {
        result.push({
          mission,
          userMission,
          percentComplete: Math.min(100, (userMission.progress / mission.target) * 100),
        });
      }
    }

    return result;
  }

  /**
   * Get user's weekly missions (assign if needed)
   */
  async getWeeklyMissions(discordId: string): Promise<MissionProgress[]> {
    const weeklyMissions = await missionRepository.findByPeriod('weekly');
    const userMissions = await userMissionRepository.findByMissionIds(
      discordId,
      weeklyMissions.map(m => m.id)
    );

    // Check if we need to assign new weekly missions
    const weekStart = startOfWeek();
    const activeWeeklyMissions = userMissions.filter(
      um => um.assignedAt >= weekStart
    );

    if (activeWeeklyMissions.length < this.weeklyMissionsCount) {
      // Assign new random weekly missions
      return this.assignWeeklyMissions(discordId);
    }

    // Get mission details for active missions
    const result: MissionProgress[] = [];
    for (const userMission of activeWeeklyMissions) {
      const mission = weeklyMissions.find(m => m.id === userMission.missionId);
      if (mission) {
        result.push({
          mission,
          userMission,
          percentComplete: Math.min(100, (userMission.progress / mission.target) * 100),
        });
      }
    }

    return result;
  }

  /**
   * Assign daily missions to user
   */
  private async assignDailyMissions(discordId: string): Promise<MissionProgress[]> {
    const randomMissions = await missionRepository.findRandomByPeriod('daily', this.dailyMissionsCount);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const result: MissionProgress[] = [];

    for (const mission of randomMissions) {
      const userMission = await userMissionRepository.findOrCreate(
        discordId,
        mission.id,
        endOfDay
      );

      result.push({
        mission,
        userMission,
        percentComplete: Math.min(100, (userMission.progress / mission.target) * 100),
      });
    }

    return result;
  }

  /**
   * Assign weekly missions to user
   */
  private async assignWeeklyMissions(discordId: string): Promise<MissionProgress[]> {
    const randomMissions = await missionRepository.findRandomByPeriod('weekly', this.weeklyMissionsCount);

    // End of week (Sunday 23:59:59)
    const endOfWeek = new Date();
    const daysUntilSunday = 7 - endOfWeek.getDay();
    endOfWeek.setDate(endOfWeek.getDate() + daysUntilSunday);
    endOfWeek.setHours(23, 59, 59, 999);

    const result: MissionProgress[] = [];

    for (const mission of randomMissions) {
      const userMission = await userMissionRepository.findOrCreate(
        discordId,
        mission.id,
        endOfWeek
      );

      result.push({
        mission,
        userMission,
        percentComplete: Math.min(100, (userMission.progress / mission.target) * 100),
      });
    }

    return result;
  }

  /**
   * Update mission progress for a specific type
   */
  async updateProgress(
    discordId: string,
    type: MissionType,
    amount: number = 1
  ): Promise<CompletedMission[]> {
    const completedMissions: CompletedMission[] = [];

    // Get all user's active missions
    const activeMissions = await userMissionRepository.findActiveForUser(discordId);

    for (const userMission of activeMissions) {
      // Get mission details
      const mission = await missionRepository.findById(userMission.missionId);
      if (!mission || mission.type !== type) continue;

      // Skip if already completed
      if (userMission.completed) continue;

      // Update progress
      const newProgress = userMission.progress + amount;
      await userMissionRepository.updateProgress(discordId, mission.id, newProgress);

      // Check if completed
      if (newProgress >= mission.target) {
        await userMissionRepository.complete(discordId, mission.id);

        // Award rewards (XP)
        if (mission.xpReward > 0) {
          await userRepository.addXP(discordId, mission.xpReward, 'bonus');
        }

        completedMissions.push({
          mission,
          xpEarned: mission.xpReward,
          coinsEarned: mission.coinsReward,
        });

        logger.info(`User ${discordId} completed mission: ${mission.name}`);
      }
    }

    return completedMissions;
  }

  /**
   * Track message for missions
   */
  async trackMessage(discordId: string, isReply: boolean = false): Promise<CompletedMission[]> {
    const completed = await this.updateProgress(discordId, 'send_messages', 1);

    if (isReply) {
      const replyCompleted = await this.updateProgress(discordId, 'reply_messages', 1);
      completed.push(...replyCompleted);
    }

    return completed;
  }

  /**
   * Track voice minutes for missions
   */
  async trackVoiceMinutes(discordId: string, minutes: number): Promise<CompletedMission[]> {
    return this.updateProgress(discordId, 'voice_minutes', minutes);
  }

  /**
   * Track reaction given for missions
   */
  async trackReactionGiven(discordId: string): Promise<CompletedMission[]> {
    return this.updateProgress(discordId, 'give_reactions', 1);
  }

  /**
   * Track reaction received for missions
   */
  async trackReactionReceived(discordId: string): Promise<CompletedMission[]> {
    return this.updateProgress(discordId, 'receive_reactions', 1);
  }

  /**
   * Track command used for missions
   */
  async trackCommandUsed(discordId: string): Promise<CompletedMission[]> {
    return this.updateProgress(discordId, 'use_command', 1);
  }

  /**
   * Track daily collected for missions
   */
  async trackDailyCollected(discordId: string): Promise<CompletedMission[]> {
    return this.updateProgress(discordId, 'collect_daily', 1);
  }

  /**
   * Track leaderboard position for missions
   */
  async trackLeaderboardPosition(discordId: string, position: number): Promise<CompletedMission[]> {
    // Get missions that check for leaderboard position
    const activeMissions = await userMissionRepository.findActiveForUser(discordId);
    const completedMissions: CompletedMission[] = [];

    for (const userMission of activeMissions) {
      const mission = await missionRepository.findById(userMission.missionId);
      if (!mission || mission.type !== 'reach_leaderboard') continue;

      // Check if position meets target (target is the max position, e.g., top 10)
      if (position <= mission.target && !userMission.completed) {
        await userMissionRepository.updateProgress(discordId, mission.id, 1);
        await userMissionRepository.complete(discordId, mission.id);

        if (mission.xpReward > 0) {
          await userRepository.addXP(discordId, mission.xpReward, 'bonus');
        }

        completedMissions.push({
          mission,
          xpEarned: mission.xpReward,
          coinsEarned: mission.coinsReward,
        });
      }
    }

    return completedMissions;
  }

  /**
   * Get all missions for display
   */
  async getAllMissions(discordId: string): Promise<{
    daily: MissionProgress[];
    weekly: MissionProgress[];
    achievements: MissionProgress[];
  }> {
    const daily = await this.getDailyMissions(discordId);
    const weekly = await this.getWeeklyMissions(discordId);

    // Get achievement missions
    const achievementMissions = await missionRepository.findByPeriod('achievement');
    const achievementUserMissions = await userMissionRepository.findByMissionIds(
      discordId,
      achievementMissions.map(m => m.id)
    );

    const achievements: MissionProgress[] = [];
    for (const mission of achievementMissions) {
      let userMission = achievementUserMissions.find(um => um.missionId === mission.id);

      // Create user mission if doesn't exist
      if (!userMission) {
        userMission = await userMissionRepository.findOrCreate(discordId, mission.id, null);
      }

      achievements.push({
        mission,
        userMission,
        percentComplete: Math.min(100, (userMission.progress / mission.target) * 100),
      });
    }

    return { daily, weekly, achievements };
  }

  /**
   * Clean up expired missions
   */
  async cleanupExpiredMissions(): Promise<number> {
    return userMissionRepository.deleteExpired();
  }
}

export const missionService = new MissionService();
export default missionService;
