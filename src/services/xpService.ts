import { GuildMember } from 'discord.js';
import { userRepository } from '../database/repositories/userRepository';
import { configRepository } from '../database/repositories/configRepository';
import { activityLogRepository } from '../database/repositories/activityLogRepository';
import { XP_CONFIG } from '../utils/constants';
import { randomXp, calculateMultiplier, isToday } from '../utils/helpers';
import { logger } from '../utils/logger';
import { XPSource, XPGain } from '../types';
import { levelService } from './levelService';
import { economyService } from './economyService';
import { eventService } from './eventService';

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

    // Get event multiplier from event service
    const eventXPMultiplier = await eventService.getXPMultiplier();

    const multiplier = calculateMultiplier({
      isBooster,
      streakDays: user.stats.currentStreak,
      eventActive: eventXPMultiplier > 1,
    });

    // Apply base multiplier and event multiplier
    const finalAmount = Math.floor(amount * multiplier * eventXPMultiplier);

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

    // Award coins (only for certain sources)
    let coinsAwarded = 0;
    if (['message', 'voice', 'reaction_given', 'reaction_received'].includes(source)) {
      const eventCoinsMultiplier = await eventService.getCoinsMultiplier();
      coinsAwarded = await economyService.awardCoins(discordId, finalAmount, eventCoinsMultiplier);
    }

    // Track event gains
    await eventService.trackEventGains(discordId, finalAmount, coinsAwarded);

    // Track community goal contributions
    await this.trackCommunityGoalContribution(discordId, source, finalAmount);

    // Check for badge hunt
    await eventService.checkBadgeHunt(discordId);

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
   * Track contribution to community goals
   */
  private async trackCommunityGoalContribution(
    discordId: string,
    source: XPSource,
    xpAmount: number
  ): Promise<void> {
    try {
      const activeGoals = await eventService.getActiveEventsByType('community_goal');

      for (const event of activeGoals) {
        let contribution = 0;
        let matchType: 'messages' | 'voice_minutes' | 'reactions' | 'total_xp' | null = null;

        switch (event.goalType) {
          case 'messages':
            if (source === 'message') {
              contribution = 1;
              matchType = 'messages';
            }
            break;
          case 'voice_minutes':
            if (source === 'voice') {
              contribution = 1;
              matchType = 'voice_minutes';
            }
            break;
          case 'reactions':
            if (source === 'reaction_given' || source === 'reaction_received') {
              contribution = 1;
              matchType = 'reactions';
            }
            break;
          case 'total_xp':
            contribution = xpAmount;
            matchType = 'total_xp';
            break;
        }

        if (contribution > 0 && matchType) {
          const result = await eventService.addContribution(event.id, discordId, contribution, matchType);

          // If goal completed, process rewards
          if (result.goalComplete) {
            await eventService.processGoalCompletion(event.id);
          }
        }
      }
    } catch (error) {
      logger.error('Error tracking community goal contribution:', error);
    }
  }

  /**
   * Get base XP for a source
   */
  private getBaseXP(source: XPSource): number {
    switch (source) {
      case 'message':
        return randomXp(XP_CONFIG.MESSAGE_XP_MIN, XP_CONFIG.MESSAGE_XP_MAX);
      case 'voice':
        return XP_CONFIG.VOICE_XP_BASE; // Base XP, actual amount passed from voiceTracker
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
   * Award daily check-in XP and coins
   */
  async awardDaily(member: GuildMember): Promise<{
    xpGained: number;
    streakBonus: number;
    newStreak: number;
    coinsGained: number;
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

    // Get daily event multiplier
    const dailyMultiplier = await eventService.getDailyMultiplier();

    // Calculate XP
    const baseXP = XP_CONFIG.DAILY_CHECK_IN_XP;
    const streakBonus = currentStreak * XP_CONFIG.STREAK_BONUS_XP;

    // Apply daily multiplier to XP
    const finalBaseXP = Math.floor(baseXP * dailyMultiplier);
    const finalStreakBonus = Math.floor(streakBonus * dailyMultiplier);

    // Award XP
    await this.awardXP(member, 'daily', finalBaseXP);
    if (finalStreakBonus > 0) {
      await this.awardXP(member, 'streak', finalStreakBonus);
    }

    // Award coins with daily multiplier
    const coinsGained = await economyService.awardDailyCoins(discordId, currentStreak, dailyMultiplier);

    return {
      xpGained: finalBaseXP,
      streakBonus: finalStreakBonus,
      newStreak: currentStreak,
      coinsGained,
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
   * Admin give XP (does NOT count towards daily limits)
   * Use for events, competitions, manual rewards
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

    // Add XP directly (no multipliers, no daily limit impact)
    const result = await userRepository.addAdminXP(discordId, amount);

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
