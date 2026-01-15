import { Message } from 'discord.js';
import { xpService } from '../../services/xpService';
import { antiExploitService } from '../../services/antiExploit';
import { userRepository } from '../../database/repositories/userRepository';
import { badgeService } from '../../services/badgeService';
import { missionService } from '../../services/missionService';
import { isNightTime } from '../../utils/helpers';
import { logger } from '../../utils/logger';

/**
 * Calculate XP based on message length
 * 1-20 chars: 1 XP
 * 21-50 chars: 2 XP
 * 51-100 chars: 3 XP
 * 101-200 chars: 4 XP
 * 200+ chars: 5 XP
 */
function calculateMessageXP(content: string): number {
  const length = content.trim().length;

  if (length <= 20) return 1;
  if (length <= 50) return 2;
  if (length <= 100) return 3;
  if (length <= 200) return 4;
  return 5;
}

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

    // Calculate XP based on message length
    const messageXP = calculateMessageXP(message.content);

    // Award XP
    const xpGain = await xpService.awardXP(message.member, 'message', messageXP);

    if (xpGain) {
      // Increment message count
      await userRepository.incrementStat(message.author.id, 'messagesCount', 1);

      // Track mission progress
      const isReply = message.reference !== null;
      await missionService.trackMessage(message.author.id, isReply);

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
