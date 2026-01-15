import { GuildMember, TextChannel, Role } from 'discord.js';
import { userRepository } from '../database/repositories/userRepository';
import { configRepository } from '../database/repositories/configRepository';
import { xpForLevel, totalXpForLevel, levelFromXp, progressToNextLevel, xpNeededForNextLevel } from '../utils/helpers';
import { createLevelUpEmbed } from '../utils/embeds';
import { logger } from '../utils/logger';
import { badgeService } from './badgeService';
import { levelRoleService } from './levelRoleService';
import { titleService } from './titleService';
import { IBadge } from '../types';

class LevelService {
  /**
   * Calculate level from XP
   */
  calculateLevel(totalXp: number): number {
    return levelFromXp(totalXp);
  }

  /**
   * Get XP required for a level
   */
  getXPForLevel(level: number): number {
    return xpForLevel(level);
  }

  /**
   * Get total XP required to reach a level
   */
  getTotalXPForLevel(level: number): number {
    return totalXpForLevel(level);
  }

  /**
   * Get progress to next level (0-100%)
   */
  getProgress(currentXp: number, level: number): number {
    return progressToNextLevel(currentXp, level);
  }

  /**
   * Get XP needed for next level
   */
  getXPNeeded(currentXp: number, level: number): number {
    return xpNeededForNextLevel(currentXp, level);
  }

  /**
   * Handle level up
   */
  async handleLevelUp(member: GuildMember, oldLevel: number, newLevel: number): Promise<void> {
    logger.levelUp(member.id, oldLevel, newLevel);

    // Check for new badges earned by leveling up
    const newBadges = await badgeService.checkLevelBadges(member, newLevel);

    // Handle level roles
    let newRole: Role | null = null;
    try {
      const roleResult = await levelRoleService.handleLevelUp(member, oldLevel, newLevel);
      newRole = roleResult.newRole;
    } catch (error) {
      logger.error('Error handling level roles:', error);
    }

    // Check for new titles earned by leveling up
    try {
      const newTitles = await titleService.checkLevelTitles(member.id, newLevel);
      if (newTitles.length > 0) {
        logger.info(`User ${member.id} earned ${newTitles.length} new title(s) at level ${newLevel}`);
      }
    } catch (error) {
      logger.error('Error checking level titles:', error);
    }

    // Send level up message
    await this.sendLevelUpMessage(member, oldLevel, newLevel, newBadges, newRole);
  }

  /**
   * Send level up message
   */
  private async sendLevelUpMessage(
    member: GuildMember,
    oldLevel: number,
    newLevel: number,
    newBadges: IBadge[],
    newRole: Role | null = null
  ): Promise<void> {
    try {
      const config = await configRepository.findByGuildId(member.guild.id);

      // Get channel to send message
      let channel: TextChannel | null = null;

      if (config?.levelUpChannel) {
        channel = member.guild.channels.cache.get(config.levelUpChannel) as TextChannel;
      }

      // If no configured channel, try to find a general channel
      if (!channel) {
        channel = member.guild.channels.cache.find(
          (ch) => ch.isTextBased() && ch.name.includes('general')
        ) as TextChannel;
      }

      if (channel) {
        const embed = createLevelUpEmbed(member.user, oldLevel, newLevel, newBadges, newRole);
        await channel.send({ embeds: [embed] });
      }
    } catch (error) {
      logger.error('Error sending level up message:', error);
    }
  }

  /**
   * Recalculate user level based on total XP
   */
  async recalculateLevel(member: GuildMember): Promise<{ oldLevel: number; newLevel: number }> {
    const user = await userRepository.findByDiscordId(member.id);
    if (!user) {
      throw new Error('User not found');
    }

    const oldLevel = user.level;
    const newLevel = this.calculateLevel(user.totalXP);

    if (oldLevel !== newLevel) {
      await userRepository.setLevel(member.id, newLevel);

      if (newLevel > oldLevel) {
        await this.handleLevelUp(member, oldLevel, newLevel);
      }
    }

    return { oldLevel, newLevel };
  }

  /**
   * Set user level manually (admin)
   */
  async setLevel(member: GuildMember, level: number): Promise<void> {
    const user = await userRepository.findByDiscordId(member.id);
    if (!user) {
      throw new Error('User not found');
    }

    const oldLevel = user.level;
    await userRepository.setLevel(member.id, level);

    logger.info(`Admin set level for ${member.id}: ${oldLevel} -> ${level}`);

    // Check for new badges if level increased
    if (level > oldLevel) {
      await badgeService.checkLevelBadges(member, level);
    }
  }

  /**
   * Get leaderboard with level info
   */
  async getLeaderboard(limit: number = 10): Promise<Array<{
    discordId: string;
    username: string;
    globalName: string | null;
    level: number;
    totalXP: number;
    progress: number;
  }>> {
    const users = await userRepository.getLeaderboard(limit);

    return users.map((user) => ({
      discordId: user.discordId,
      username: user.username,
      globalName: user.globalName,
      level: user.level,
      totalXP: user.totalXP,
      progress: this.getProgress(user.totalXP, user.level),
    }));
  }
}

export const levelService = new LevelService();
export default levelService;
