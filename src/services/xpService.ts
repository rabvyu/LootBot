import { GuildMember } from 'discord.js';
import { userRepository } from '../database/repositories/userRepository';
import { configRepository } from '../database/repositories/configRepository';
import { activityLogRepository } from '../database/repositories/activityLogRepository';
import { XP_CONFIG } from '../utils/constants';
import { randomXp, calculateMultiplier, isToday } from '../utils/helpers';
import { logger } from '../utils/logger';
import { XPSource, XPGain } from '../types';
import { levelService } from './levelService';

class XPService {
  /**
   * Award XP to a user
   */
  async awardXP(
    member: GuildMember,
    source: XPSource,
    baseAmount?: number
  ): Promise<XPGain | null> {
    const discordId = member.id;
    const guildId = member.guild.id;

    // Get or create user
    const user = await userRepository.findOrCreate(
      discordId,
      member.user.username,
      member.user.globalName,
      member.user.avatar
    );

    // Check daily limits
    const dailyXP = await userRepository.getDailyXP(discordId);
    if (dailyXP && dailyXP.total >= XP_CONFIG.DAILY_LIMITS.total) {
      logger.debug(`User ${discordId} hit daily XP limit`);
      return null;
    }

    // Check source-specific limits
    const sourceLimit = this.getSourceLimit(source);
    const sourceKey = this.getSourceKey(source);
    if (dailyXP && sourceKey && dailyXP[sourceKey] >= sourceLimit) {
      logger.debug(`User ${discordId} hit ${source} XP limit`);
      return null;
    }

    // Calculate base XP
    let amount = baseAmount ?? this.getBaseXP(source);

    // Get multipliers
    const config = await configRepository.findByGuildId(guildId);
    const isBooster = member.premiumSince !== null;
    const eventMultiplier = config?.eventActive ? config.eventMultiplier : 1;

    const multiplier = calculateMultiplier({
      isBooster,
      streakDays: user.stats.currentStreak,
      eventActive: config?.eventActive,
    });

    // Apply multiplier
    const finalAmount = Math.floor(amount * multiplier);

    // Add XP
    const result = await userRepository.addXP(discordId, finalAmount, sourceKey || 'bonus');

    // Log activity
    await activityLogRepository.logXPGain(discordId, source, finalAmount, {
      baseAmount: amount,
      multiplier,
      source,
    });

    // Log
    logger.xp(discordId, finalAmount, source, { multiplier });

    // Check for level up
    if (result.leveledUp) {
      await levelService.handleLevelUp(member, result.oldLevel, result.user.level);
    }

    return {
      amount,
      source,
      multiplier,
      finalAmount,
    };
  }

  /**
   * Get base XP for a source
   */
  private getBaseXP(source: XPSource): number {
    switch (source) {
      case 'message':
        return randomXp(XP_CONFIG.MESSAGE_XP_MIN, XP_CONFIG.MESSAGE_XP_MAX);
      case 'voice':
        return XP_CONFIG.VOICE_XP_PER_MINUTE;
      case 'reaction_given':
        return XP_CONFIG.REACTION_GIVEN_XP;
      case 'reaction_received':
        return XP_CONFIG.REACTION_RECEIVED_XP;
      case 'daily':
        return XP_CONFIG.DAILY_CHECK_IN_XP;
      case 'streak':
        return XP_CONFIG.STREAK_BONUS_XP;
      case 'invite':
        return XP_CONFIG.INVITE_XP;
      case 'boost':
        return XP_CONFIG.BOOST_XP;
      default:
        return 0;
    }
  }

  /**
   * Get daily limit for a source
   */
  private getSourceLimit(source: XPSource): number {
    switch (source) {
      case 'message':
        return XP_CONFIG.DAILY_LIMITS.messages;
      case 'voice':
        return XP_CONFIG.DAILY_LIMITS.voice;
      case 'reaction_given':
      case 'reaction_received':
        return XP_CONFIG.DAILY_LIMITS.reactions;
      case 'invite':
        return XP_CONFIG.DAILY_LIMITS.invites;
      default:
        return XP_CONFIG.DAILY_LIMITS.total;
    }
  }

  /**
   * Map source to daily XP key
   */
  private getSourceKey(source: XPSource): 'messages' | 'voice' | 'reactions' | 'invites' | 'bonus' | null {
    switch (source) {
      case 'message':
        return 'messages';
      case 'voice':
        return 'voice';
      case 'reaction_given':
      case 'reaction_received':
        return 'reactions';
      case 'invite':
        return 'invites';
      case 'daily':
      case 'streak':
      case 'boost':
      case 'event':
      case 'admin':
        return 'bonus';
      default:
        return null;
    }
  }

  /**
   * Award daily check-in XP
   */
  async awardDaily(member: GuildMember): Promise<{
    xpGained: number;
    streakBonus: number;
    newStreak: number;
  } | null> {
    const discordId = member.id;

    // Get or create user
    const user = await userRepository.findOrCreate(
      discordId,
      member.user.username,
      member.user.globalName,
      member.user.avatar
    );

    // Check if already claimed today
    if (user.stats.lastDaily && isToday(user.stats.lastDaily)) {
      return null;
    }

    // Calculate streak
    const { currentStreak } = await userRepository.updateStreak(discordId);

    // Calculate XP
    const baseXP = XP_CONFIG.DAILY_CHECK_IN_XP;
    const streakBonus = currentStreak * XP_CONFIG.STREAK_BONUS_XP;
    const totalXP = baseXP + streakBonus;

    // Award XP
    await this.awardXP(member, 'daily', baseXP);
    if (streakBonus > 0) {
      await this.awardXP(member, 'streak', streakBonus);
    }

    return {
      xpGained: baseXP,
      streakBonus,
      newStreak: currentStreak,
    };
  }

  /**
   * Award boost XP
   */
  async awardBoostXP(member: GuildMember): Promise<XPGain | null> {
    return this.awardXP(member, 'boost', XP_CONFIG.BOOST_XP);
  }

  /**
   * Award invite XP
   */
  async awardInviteXP(member: GuildMember): Promise<XPGain | null> {
    return this.awardXP(member, 'invite', XP_CONFIG.INVITE_XP);
  }

  /**
   * Admin give XP
   */
  async adminGiveXP(member: GuildMember, amount: number): Promise<XPGain> {
    const discordId = member.id;

    // Get or create user
    await userRepository.findOrCreate(
      discordId,
      member.user.username,
      member.user.globalName,
      member.user.avatar
    );

    // Add XP directly (no multipliers)
    const result = await userRepository.addXP(discordId, amount, 'bonus');

    // Log
    await activityLogRepository.logXPGain(discordId, 'admin_give', amount, {
      adminAction: true,
    });

    logger.xp(discordId, amount, 'admin', { adminAction: true });

    // Check for level up
    if (result.leveledUp) {
      await levelService.handleLevelUp(member, result.oldLevel, result.user.level);
    }

    return {
      amount,
      source: 'admin',
      multiplier: 1,
      finalAmount: amount,
    };
  }

  /**
   * Admin remove XP
   */
  async adminRemoveXP(member: GuildMember, amount: number): Promise<number> {
    const discordId = member.id;
    const user = await userRepository.findByDiscordId(discordId);

    if (!user) {
      throw new Error('User not found');
    }

    const actualRemove = Math.min(amount, user.totalXP);

    // Update XP
    user.xp = Math.max(0, user.xp - actualRemove);
    user.totalXP = Math.max(0, user.totalXP - actualRemove);
    await user.save();

    // Recalculate level
    await levelService.recalculateLevel(member);

    // Log
    await activityLogRepository.logXPGain(discordId, 'admin_remove', -actualRemove, {
      adminAction: true,
    });

    logger.xp(discordId, -actualRemove, 'admin', { adminAction: true });

    return actualRemove;
  }
}

export const xpService = new XPService();
export default xpService;
