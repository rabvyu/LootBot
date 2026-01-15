import { GuildMember, TextChannel, Client } from 'discord.js';
import { userRepository } from '../database/repositories/userRepository';
import { badgeRepository } from '../database/repositories/badgeRepository';
import { configRepository } from '../database/repositories/configRepository';
import { BadgeDocument } from '../database/models/Badge';
import { daysBetween } from '../utils/helpers';
import { createRareBadgeAnnouncementEmbed } from '../utils/embeds';
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

    // Get badge info from database
    const badge = await badgeRepository.findById(badgeId);
    if (!badge) {
      logger.warn(`Badge not found in database: ${badgeId}`);
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
   * Uses badges from database with category 'level'
   */
  async checkLevelBadges(member: GuildMember, level: number): Promise<IBadge[]> {
    const earnedBadges: IBadge[] = [];

    // Get all level badges from database
    const levelBadges = await badgeRepository.findByCategory('level');

    for (const badge of levelBadges) {
      // Level badges have requirement type 'level' with value = required level
      if (badge.requirement.type === 'level' && level >= badge.requirement.value) {
        const awarded = await this.awardBadge(member, badge.badgeId);
        if (awarded) {
          earnedBadges.push(awarded);
        }
      }
    }

    return earnedBadges;
  }

  /**
   * Check and award time-based badges
   * Uses badges from database with category 'time'
   */
  async checkTimeBadges(member: GuildMember): Promise<IBadge[]> {
    const user = await userRepository.findByDiscordId(member.id);
    if (!user) return [];

    const earnedBadges: IBadge[] = [];
    const daysMember = daysBetween(user.joinedAt, new Date());

    // Get all time badges from database
    const timeBadges = await badgeRepository.findByCategory('time');

    for (const badge of timeBadges) {
      if (badge.requirement.type === 'days_member' && daysMember >= badge.requirement.value) {
        const awarded = await this.awardBadge(member, badge.badgeId);
        if (awarded) {
          earnedBadges.push(awarded);
        }
      }
    }

    return earnedBadges;
  }

  /**
   * Check founder badge (first N members)
   */
  async checkFounderBadge(member: GuildMember): Promise<IBadge | null> {
    // Find founder badge from database
    const founderBadge = await badgeRepository.findById('time_founder');
    if (!founderBadge) {
      logger.debug('Founder badge not found in database');
      return null;
    }

    const earlyAdopters = await userRepository.getEarlyAdopters(founderBadge.requirement.value);
    const isEarlyAdopter = earlyAdopters.some((u) => u.discordId === member.id);

    if (isEarlyAdopter) {
      return this.awardBadge(member, 'time_founder');
    }

    return null;
  }

  /**
   * Check and award achievement badges (social, voice, messages, etc)
   * Uses badges from database with category 'achievement'
   */
  async checkAchievementBadges(member: GuildMember): Promise<IBadge[]> {
    const user = await userRepository.findByDiscordId(member.id);
    if (!user) return [];

    const earnedBadges: IBadge[] = [];

    // Get all achievement badges from database
    const achievementBadges = await badgeRepository.findByCategory('achievement');

    for (const badge of achievementBadges) {
      let shouldAward = false;

      switch (badge.requirement.type) {
        case 'messages':
          shouldAward = user.stats.messagesCount >= badge.requirement.value;
          break;
        case 'voice_hours':
          shouldAward = user.stats.voiceMinutes >= badge.requirement.value * 60;
          break;
        case 'reactions_given':
          shouldAward = user.stats.reactionsGiven >= badge.requirement.value;
          break;
        case 'reactions_received':
          shouldAward = user.stats.reactionsReceived >= badge.requirement.value;
          break;
        case 'streak':
          shouldAward = user.stats.longestStreak >= badge.requirement.value;
          break;
        case 'invites':
          shouldAward = user.stats.invitesCount >= badge.requirement.value;
          break;
        case 'boost':
          shouldAward = member.premiumSince !== null;
          break;
        // Manual badges are not auto-awarded
        case 'manual':
          shouldAward = false;
          break;
      }

      if (shouldAward) {
        const awarded = await this.awardBadge(member, badge.badgeId);
        if (awarded) {
          earnedBadges.push(awarded);
        }
      }
    }

    return earnedBadges;
  }

  /**
   * Award booster badge
   */
  async awardBoosterBadge(member: GuildMember): Promise<IBadge | null> {
    if (member.premiumSince) {
      // Try to find a boost badge in the database
      const boostBadge = await badgeRepository.findById('special_booster');
      if (boostBadge) {
        return this.awardBadge(member, 'special_booster');
      }
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
   * Only sends public notification for rare+ badges to the badge notification channel
   */
  private async sendBadgeNotification(member: GuildMember, badge: IBadge): Promise<void> {
    try {
      const config = await configRepository.findByGuildId(member.guild.id);

      // Only send public notifications for rare, epic, and legendary badges
      const isRarePlus = ['rare', 'epic', 'legendary'].includes(badge.rarity);

      if (!isRarePlus) {
        // For common/uncommon badges, just log it
        logger.debug(`Badge ${badge.name} earned by ${member.id} (${badge.rarity}) - no notification`);
        return;
      }

      // Get the badge notification channel
      let channel: TextChannel | null = null;

      if (config?.badgeNotificationChannel) {
        channel = member.guild.channels.cache.get(config.badgeNotificationChannel) as TextChannel;
      }

      // Fallback to level up channel if badge channel not configured
      if (!channel && config?.levelUpChannel) {
        channel = member.guild.channels.cache.get(config.levelUpChannel) as TextChannel;
      }

      // Fallback to any channel with "noticias" or "news" in the name
      if (!channel) {
        channel = member.guild.channels.cache.find(
          (ch) => ch.isTextBased() && (ch.name.includes('noticias') || ch.name.includes('news') || ch.name.includes('anuncio'))
        ) as TextChannel;
      }

      if (channel) {
        // Use the special announcement embed for rare+ badges
        const embed = createRareBadgeAnnouncementEmbed(member.user, badge);
        await channel.send({ embeds: [embed] });
        logger.info(`Rare+ badge announcement sent for ${member.user.username}: ${badge.name} (${badge.rarity})`);
      }
    } catch (error) {
      logger.error('Error sending badge notification:', error);
    }
  }

  /**
   * Check all automatic badges for a user
   * This is the main method that should be called to check all badges
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

    // Check founder badge (first N members)
    const founderBadge = await this.checkFounderBadge(member);
    if (founderBadge) allEarned.push(founderBadge);

    // Check achievement badges
    const achievementBadges = await this.checkAchievementBadges(member);
    allEarned.push(...achievementBadges);

    // Check booster badge
    const boosterBadge = await this.awardBoosterBadge(member);
    if (boosterBadge) allEarned.push(boosterBadge);

    return allEarned;
  }

  /**
   * Retroactively check badges for all users in a guild
   * Used by admin command to award missing badges
   */
  async checkAllUsersInGuild(client: Client, guildId: string): Promise<{ userId: string; badges: IBadge[] }[]> {
    const results: { userId: string; badges: IBadge[] }[] = [];

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      logger.error(`Guild ${guildId} not found`);
      return results;
    }

    // Get all users from database
    const users = await userRepository.getLeaderboard(10000, 'alltime');

    logger.info(`Checking badges for ${users.length} users in guild ${guildId}`);

    for (const user of users) {
      try {
        const member = await guild.members.fetch(user.discordId).catch(() => null);
        if (!member) {
          logger.debug(`Member ${user.discordId} not found in guild, skipping`);
          continue;
        }

        const earned = await this.checkAllBadges(member);
        if (earned.length > 0) {
          results.push({ userId: user.discordId, badges: earned });
          logger.info(`User ${user.username} earned ${earned.length} badges: ${earned.map(b => b.name).join(', ')}`);
        }
      } catch (error) {
        logger.error(`Error checking badges for user ${user.discordId}:`, error);
      }
    }

    return results;
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
