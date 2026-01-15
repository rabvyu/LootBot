import { GuildMember, PartialGuildMember } from 'discord.js';
import { xpService } from '../../services/xpService';
import { badgeService } from '../../services/badgeService';
import { logger } from '../../utils/logger';

export async function handleGuildMemberUpdate(
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember
): Promise<void> {
  // Ignore bots
  if (newMember.user.bot) return;

  try {
    // Check if member started boosting
    const wasBooster = oldMember.premiumSince !== null;
    const isBooster = newMember.premiumSince !== null;

    if (!wasBooster && isBooster) {
      // Member just started boosting!
      logger.info(`${newMember.user.username} boosted the server!`);

      // Award boost XP
      await xpService.awardBoostXP(newMember);

      // Award booster badge
      await badgeService.awardBoosterBadge(newMember);
    }
  } catch (error) {
    logger.error('Error handling member update:', error);
  }
}

export default handleGuildMemberUpdate;
