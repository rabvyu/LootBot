import { GuildMember } from 'discord.js';
import { userRepository } from '../../database/repositories/userRepository';
import { badgeService } from '../../services/badgeService';
import { logger } from '../../utils/logger';

export async function handleGuildMemberAdd(member: GuildMember): Promise<void> {
  // Ignore bots
  if (member.user.bot) return;

  try {
    // Create user in database
    await userRepository.findOrCreate(
      member.id,
      member.user.username,
      member.user.globalName,
      member.user.avatar
    );

    // Check for early adopter badge
    await badgeService.checkEarlyAdopterBadge(member);

    logger.info(`New member joined: ${member.user.username} (${member.id})`);
  } catch (error) {
    logger.error('Error handling new member:', error);
  }
}

export default handleGuildMemberAdd;
