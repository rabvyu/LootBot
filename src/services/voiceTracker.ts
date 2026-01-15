import { VoiceState, GuildMember, VoiceChannel } from 'discord.js';
import { userRepository } from '../database/repositories/userRepository';
import { XP_CONFIG } from '../utils/constants';
import { logger } from '../utils/logger';
import { xpService } from './xpService';
import { antiExploitService } from './antiExploit';
import { VoiceSession } from '../types';

class VoiceTrackerService {
  // Track active voice sessions
  private sessions: Map<string, VoiceSession> = new Map();

  // Interval for XP distribution
  private xpInterval: NodeJS.Timeout | null = null;

  /**
   * Start voice tracking
   */
  start(): void {
    if (this.xpInterval) {
      clearInterval(this.xpInterval);
    }

    // Check voice sessions and award XP every minute
    this.xpInterval = setInterval(() => {
      this.processVoiceSessions();
    }, XP_CONFIG.VOICE_CHECK_INTERVAL);

    logger.info('Voice tracker started');
  }

  /**
   * Stop voice tracking
   */
  stop(): void {
    if (this.xpInterval) {
      clearInterval(this.xpInterval);
      this.xpInterval = null;
    }

    logger.info('Voice tracker stopped');
  }

  /**
   * Handle voice state update
   */
  async handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<void> {
    const userId = newState.member?.id || oldState.member?.id;
    if (!userId) return;

    const sessionKey = `${userId}-${newState.guild.id}`;

    // User joined a voice channel
    if (!oldState.channel && newState.channel) {
      await this.startSession(sessionKey, userId, newState.channel.id);
      return;
    }

    // User left all voice channels
    if (oldState.channel && !newState.channel) {
      await this.endSession(sessionKey, newState.member!);
      return;
    }

    // User switched channels
    if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
      // End old session and start new one
      await this.endSession(sessionKey, newState.member!);
      await this.startSession(sessionKey, userId, newState.channel.id);
      return;
    }
  }

  /**
   * Start a voice session
   */
  private async startSession(sessionKey: string, odiscordId: string, channelId: string): Promise<void> {
    this.sessions.set(sessionKey, {
      odiscordId,
      channelId,
      joinedAt: Date.now(),
      lastCheck: Date.now(),
      totalMinutes: 0,
    });

    logger.debug(`Voice session started: ${odiscordId} in channel ${channelId}`);
  }

  /**
   * End a voice session
   */
  private async endSession(sessionKey: string, member: GuildMember): Promise<void> {
    const session = this.sessions.get(sessionKey);
    if (!session) return;

    // Calculate final minutes
    const finalMinutes = Math.floor((Date.now() - session.joinedAt) / 60000);

    // Update user stats
    if (finalMinutes > 0) {
      await userRepository.incrementStat(member.id, 'voiceMinutes', finalMinutes);
      logger.debug(`Voice session ended: ${member.id}, total minutes: ${finalMinutes}`);
    }

    this.sessions.delete(sessionKey);
  }

  /**
   * Process all active voice sessions and award XP
   */
  private async processVoiceSessions(): Promise<void> {
    const now = Date.now();

    for (const [sessionKey, session] of this.sessions.entries()) {
      try {
        // Parse guild ID from session key
        const [userId, guildId] = sessionKey.split('-');

        // Get the guild and member
        const { client } = await import('../bot/client');
        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) {
          this.sessions.delete(sessionKey);
          continue;
        }

        // Get voice state
        const voiceState = member.voice;
        if (!voiceState.channel) {
          this.sessions.delete(sessionKey);
          continue;
        }

        // Count real members in channel (excluding bots)
        const membersInChannel = voiceState.channel.members.filter(m => !m.user.bot).size;

        // Validate voice session
        const validation = await antiExploitService.isValidVoiceSession(voiceState, membersInChannel);
        if (!validation.valid) {
          logger.debug(`Invalid voice session for ${userId}: ${validation.reason}`);
          continue;
        }

        // Calculate minutes since last check
        const minutesSinceLastCheck = Math.floor((now - session.lastCheck) / 60000);

        if (minutesSinceLastCheck >= 1) {
          // Calculate XP based on number of people in channel
          // Formula: (members - 1) XP per minute
          // 2 people = 1 XP, 3 people = 2 XP, 10 people = 9 XP, etc.
          const voiceXP = Math.max(1, membersInChannel - 1) * XP_CONFIG.VOICE_XP_BASE;

          // Award XP for each minute
          for (let i = 0; i < minutesSinceLastCheck; i++) {
            await xpService.awardXP(member, 'voice', voiceXP);
          }

          // Update session
          session.lastCheck = now;
          session.totalMinutes += minutesSinceLastCheck;

          logger.debug(`Voice XP: ${member.id} earned ${voiceXP} XP (${membersInChannel} members in channel)`);
        }
      } catch (error) {
        logger.error(`Error processing voice session ${sessionKey}:`, error);
      }
    }
  }

  /**
   * Get active session for user
   */
  getSession(userId: string, guildId: string): VoiceSession | undefined {
    return this.sessions.get(`${userId}-${guildId}`);
  }

  /**
   * Get all active sessions count
   */
  getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  /**
   * Get session duration in minutes
   */
  getSessionDuration(userId: string, guildId: string): number {
    const session = this.sessions.get(`${userId}-${guildId}`);
    if (!session) return 0;

    return Math.floor((Date.now() - session.joinedAt) / 60000);
  }

  /**
   * Force end all sessions (for shutdown)
   */
  async endAllSessions(): Promise<void> {
    logger.info(`Ending ${this.sessions.size} voice sessions...`);

    for (const [sessionKey] of this.sessions.entries()) {
      const [userId, guildId] = sessionKey.split('-');

      try {
        const { client } = await import('../bot/client');
        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;

        const member = await guild.members.fetch(userId).catch(() => null);
        if (member) {
          await this.endSession(sessionKey, member);
        }
      } catch (error) {
        logger.error(`Error ending session ${sessionKey}:`, error);
      }
    }

    this.sessions.clear();
    logger.info('All voice sessions ended');
  }
}

export const voiceTrackerService = new VoiceTrackerService();
export default voiceTrackerService;
