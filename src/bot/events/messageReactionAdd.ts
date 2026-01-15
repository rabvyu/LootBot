import { MessageReaction, User, PartialMessageReaction, PartialUser } from 'discord.js';
import { xpService } from '../../services/xpService';
import { antiExploitService } from '../../services/antiExploit';
import { userRepository } from '../../database/repositories/userRepository';
import { badgeService } from '../../services/badgeService';
import { missionService } from '../../services/missionService';
import { logger } from '../../utils/logger';

export async function handleMessageReactionAdd(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser
): Promise<void> {
  // Ignore bots
  if (user.bot) return;

  try {
    // Fetch partial reaction if needed
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        logger.error('Error fetching reaction:', error);
        return;
      }
    }

    // Fetch partial user if needed
    if (user.partial) {
      try {
        user = await user.fetch();
      } catch (error) {
        logger.error('Error fetching user:', error);
        return;
      }
    }

    const message = reaction.message;
    if (!message.guild) return;

    // Get member who reacted
    const reactingMember = await message.guild.members.fetch(user.id).catch(() => null);
    if (!reactingMember) return;

    // Get message author
    const messageAuthorId = message.author?.id;
    if (!messageAuthorId) return;

    // Check if user can gain XP for giving reaction
    const canGainGiving = await antiExploitService.canGainReactionXP(
      user.id,
      message.guild.id,
      messageAuthorId,
      message.id
    );

    if (canGainGiving.allowed) {
      // Award XP to the person who reacted
      await xpService.awardXP(reactingMember, 'reaction_given');
      await userRepository.incrementStat(user.id, 'reactionsGiven', 1);

      // Track mission progress for giving reactions
      await missionService.trackReactionGiven(user.id);
    }

    // Award XP to message author for receiving reaction (if different from reactor)
    if (messageAuthorId !== user.id && !message.author?.bot) {
      const messageAuthorMember = await message.guild.members.fetch(messageAuthorId).catch(() => null);
      if (messageAuthorMember) {
        await xpService.awardXP(messageAuthorMember, 'reaction_received');
        await userRepository.incrementStat(messageAuthorId, 'reactionsReceived', 1);

        // Track mission progress for receiving reactions
        await missionService.trackReactionReceived(messageAuthorId);
      }
    }

    // Check achievement badges for both users
    await badgeService.checkAchievementBadges(reactingMember);
  } catch (error) {
    logger.error('Error handling reaction:', error);
  }
}

export default handleMessageReactionAdd;
