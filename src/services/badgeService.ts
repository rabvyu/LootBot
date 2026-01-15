import { GuildMember, TextChannel } from 'discord.js';
import { userRepository } from '../database/repositories/userRepository';
import { badgeRepository } from '../database/repositories/badgeRepository';
import { configRepository } from '../database/repositories/configRepository';
import { BadgeDocument } from '../database/models/Badge';
import { BADGES } from '../utils/constants';
import { daysBetween } from '../utils/helpers';
import { createBadgeEarnedEmbed } from '../utils/embeds';
import { logger } from '../utils/logger';
import { IBadge, BadgeCategory } from '../types';

// Helper to convert BadgeDocument to IBadge
function toIBadge(doc: BadgeDocument): IBadge {
  return {
    id: doc.badgeId,
    name: doc.name,
    description: doc.description,
    icon: doc.icon,
    category: doc.category as BadgeCategory,
    requirement: doc.requirement,
    rarity: doc.rarity as IBadge['rarity'],
    createdAt: doc.createdAt,
  };
}

class BadgeService {
  /**
   * Award badge to user
   */
  async awardBadge(member: GuildMember, badgeId: string): Promise<IBadge | null> {
    // Check if user already has badge
    const hasBadge = await userRepository.hasBadge(member.id, badgeId);
    if (hasBadge) {
      return null;
    }

    // Get badge info
    const badge = await badgeRepository.findById(badgeId);
    if (!badge) {
      logger.warn(`Badge not found: ${badgeId}`);
      return null;
    }

    // Add badge to user
    await userRepository.addBadge(member.id, badgeId);
    logger.badge(member.id, badgeId, 'earned');

    const badgeData = toIBadge(badge);

    // Send notification
    await this.sendBadgeNotification(member, badgeData);

    return badgeData;
  }

  /**
   * Remove badge from user
   */
  async removeBadge(member: GuildMember, badgeId: string): Promise<boolean> {
    const hasBadge = await userRepository.hasBadge(member.id, badgeId);
    if (!hasBadge) {
      return false;
    }

    await userRepository.removeBadge(member.id, badgeId);
    logger.badge(member.id, badgeId, 'removed');
    return true;
  }

  /**
   * Check and award level badges
   */
  async checkLevelBadges(member: GuildMember, level: number): Promise<IBadge[]> {
    const earnedBadges: IBadge[] = [];

    for (const badge of BADGES.LEVEL) {
      if (level >= badge.level) {
        const awarded = await this.awardBadge(member, badge.id);
        if (awarded) {
          earnedBadges.push(awarded);
        }
      }
    }

    return earnedBadges;
  }

  /**
   * Check and award time-based badges
   */
  async checkTimeBadges(member: GuildMember): Promise<IBadge[]> {
    const user = await userRepository.findByDiscordId(member.id);
    if (!user) return [];

    const earnedBadges: IBadge[] = [];
    const daysMember = daysBetween(user.joinedAt, new Date());

    for (const badge of BADGES.TIME) {
      if (daysMember >= badge.days) {
        const awarded = await this.awardBadge(member, badge.id);
        if (awarded) {
          earnedBadges.push(awarded);
        }
      }
    }

    return earnedBadges;
  }

  /**
   * Check and award achievement badges
   */
  async checkAchievementBadges(member: GuildMember): Promise<IBadge[]> {
    const user = await userRepository.findByDiscordId(member.id);
    if (!user) return [];

    const earnedBadges: IBadge[] = [];

    for (const badge of BADGES.ACHIEVEMENT) {
      let shouldAward = false;

      switch (badge.requirement.type) {
        case 'reactions_given':
          shouldAward = user.stats.reactionsGiven >= badge.requirement.value;
          break;
        case 'reactions_received':
          shouldAward = user.stats.reactionsReceived >= badge.requirement.value;
          break;
        case 'voice_hours':
          shouldAward = user.stats.voiceMinutes >= badge.requirement.value * 60;
          break;
        case 'streak':
          shouldAward = user.stats.longestStreak >= badge.requirement.value;
          break;
        case 'invites':
          shouldAward = user.stats.invitesCount >= badge.requirement.value;
          break;
        case 'messages':
          shouldAward = user.stats.messagesCount >= badge.requirement.value;
          break;
        case 'boost':
          shouldAward = member.premiumSince !== null;
          break;
        // night_messages, top_weekly, top_monthly, early_member - handled separately
      }

      if (shouldAward) {
        const awarded = await this.awardBadge(member, badge.id);
        if (awarded) {
          earnedBadges.push(awarded);
        }
      }
    }

    return earnedBadges;
  }

  /**
   * Check early adopter badge
   */
  async checkEarlyAdopterBadge(member: GuildMember): Promise<IBadge | null> {
    const earlyBadge = BADGES.ACHIEVEMENT.find((b) => b.id === 'early_adopter');
    if (!earlyBadge) return null;

    const earlyAdopters = await userRepository.getEarlyAdopters(earlyBadge.requirement.value);
    const isEarlyAdopter = earlyAdopters.some((u) => u.discordId === member.id);

    if (isEarlyAdopter) {
      return this.awardBadge(member, 'early_adopter');
    }

    return null;
  }

  /**
   * Award top weekly badge
   */
  async awardTopWeeklyBadge(member: GuildMember): Promise<IBadge | null> {
    return this.awardBadge(member, 'top_weekly');
  }

  /**
   * Award top monthly badge
   */
  async awardTopMonthlyBadge(member: GuildMember): Promise<IBadge | null> {
    return this.awardBadge(member, 'top_monthly');
  }

  /**
   * Award booster badge
   */
  async awardBoosterBadge(member: GuildMember): Promise<IBadge | null> {
    if (member.premiumSince) {
      return this.awardBadge(member, 'booster');
    }
    return null;
  }

  /**
   * Get user badges with full info
   */
  async getUserBadges(discordId: string): Promise<IBadge[]> {
    const user = await userRepository.findByDiscordId(discordId);
    if (!user || user.badges.length === 0) return [];

    const badgeIds = user.badges.map((b) => b.badgeId);
    const badges = await badgeRepository.findByIds(badgeIds);
    return badges.map(toIBadge);
  }

  /**
   * Get all available badges
   */
  async getAllBadges(): Promise<IBadge[]> {
    const badges = await badgeRepository.findAll();
    return badges.map(toIBadge);
  }

  /**
   * Get badges by category
   */
  async getBadgesByCategory(category: BadgeCategory): Promise<IBadge[]> {
    const badges = await badgeRepository.findByCategory(category);
    return badges.map(toIBadge);
  }

  /**
   * Get total badge count
   */
  async getTotalBadgeCount(): Promise<number> {
    return badgeRepository.getTotalCount();
  }

  /**
   * Send badge notification
   */
  private async sendBadgeNotification(member: GuildMember, badge: IBadge): Promise<void> {
    try {
      const config = await configRepository.findByGuildId(member.guild.id);

      let channel: TextChannel | null = null;

      if (config?.levelUpChannel) {
        channel = member.guild.channels.cache.get(config.levelUpChannel) as TextChannel;
      }

      if (!channel) {
        channel = member.guild.channels.cache.find(
          (ch) => ch.isTextBased() && ch.name.includes('general')
        ) as TextChannel;
      }

      if (channel) {
        const embed = createBadgeEarnedEmbed(member.user, badge);
        await channel.send({ embeds: [embed] });
      }
    } catch (error) {
      logger.error('Error sending badge notification:', error);
    }
  }

  /**
   * Check all badges for a user
   */
  async checkAllBadges(member: GuildMember): Promise<IBadge[]> {
    const user = await userRepository.findByDiscordId(member.id);
    if (!user) return [];

    const allEarned: IBadge[] = [];

    // Check level badges
    const levelBadges = await this.checkLevelBadges(member, user.level);
    allEarned.push(...levelBadges);

    // Check time badges
    const timeBadges = await this.checkTimeBadges(member);
    allEarned.push(...timeBadges);

    // Check achievement badges
    const achievementBadges = await this.checkAchievementBadges(member);
    allEarned.push(...achievementBadges);

    // Check early adopter
    const earlyBadge = await this.checkEarlyAdopterBadge(member);
    if (earlyBadge) allEarned.push(earlyBadge);

    // Check booster badge
    const boosterBadge = await this.awardBoosterBadge(member);
    if (boosterBadge) allEarned.push(boosterBadge);

    return allEarned;
  }

  /**
   * Initialize badges in database
   */
  async initializeBadges(): Promise<void> {
    await badgeRepository.seedBadges();
  }
}

export const badgeService = new BadgeService();
export default badgeService;
