import { VoiceState } from 'discord.js';
import { voiceTrackerService } from '../../services/voiceTracker';
import { logger } from '../../utils/logger';

export async function handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<void> {
  // Ignore bots
  if (newState.member?.user.bot || oldState.member?.user.bot) return;

  try {
    await voiceTrackerService.handleVoiceStateUpdate(oldState, newState);
  } catch (error) {
    logger.error('Error handling voice state update:', error);
  }
}

export default handleVoiceStateUpdate;
