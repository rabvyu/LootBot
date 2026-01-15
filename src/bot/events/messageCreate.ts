import { Message } from 'discord.js';
import { xpService } from '../../services/xpService';
import { antiExploitService } from '../../services/antiExploit';
import { userRepository } from '../../database/repositories/userRepository';
import { badgeService } from '../../services/badgeService';
import { isNightTime } from '../../utils/helpers';
import { logger } from '../../utils/logger';

export async function handleMessageCreate(message: Message): Promise<void> {
  // Ignore bots
  if (message.author.bot) return;

  // Ignore DMs
  if (!message.guild || !message.member) return;

  try {
    // Check if user can gain XP
    const canGain = await antiExploitService.canGainMessageXP(message);

    if (!canGain.allowed) {
      logger.debug(`Message XP denied for ${message.author.id}: ${canGain.reason}`);
      return;
    }

    // Award XP
    const xpGain = await xpService.awardXP(message.member, 'message');

    if (xpGain) {
      // Increment message count
      await userRepository.incrementStat(message.author.id, 'messagesCount', 1);

      // Track night messages for badge
      if (isNightTime()) {
        const user = await userRepository.findByDiscordId(message.author.id);
        // Night message tracking would require additional field in stats
        // For now, we can check achievement badges periodically
      }

      // Check for achievement badges
      await badgeService.checkAchievementBadges(message.member);
    }
  } catch (error) {
    logger.error('Error handling message:', error);
  }
}

export default handleMessageCreate;
