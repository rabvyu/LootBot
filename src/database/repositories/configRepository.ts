import { Config, ConfigDocument } from '../models';
import { IGuildConfig } from '../../types';

export class ConfigRepository {
  /**
   * Find or create guild config
   */
  async findOrCreate(guildId: string): Promise<ConfigDocument> {
    let config = await Config.findOne({ guildId });

    if (!config) {
      config = await Config.create({ guildId });
    }

    return config;
  }

  /**
   * Find guild config
   */
  async findByGuildId(guildId: string): Promise<ConfigDocument | null> {
    return Config.findOne({ guildId });
  }

  /**
   * Update config
   */
  async update(guildId: string, updates: Partial<IGuildConfig>): Promise<ConfigDocument | null> {
    return Config.findOneAndUpdate({ guildId }, updates, { new: true });
  }

  /**
   * Add channel to blacklist
   */
  async addBlacklistChannel(guildId: string, channelId: string): Promise<ConfigDocument | null> {
    return Config.findOneAndUpdate(
      { guildId },
      { $addToSet: { xpBlacklistChannels: channelId } },
      { new: true, upsert: true }
    );
  }

  /**
   * Remove channel from blacklist
   */
  async removeBlacklistChannel(guildId: string, channelId: string): Promise<ConfigDocument | null> {
    return Config.findOneAndUpdate(
      { guildId },
      { $pull: { xpBlacklistChannels: channelId } },
      { new: true }
    );
  }

  /**
   * Add role to blacklist
   */
  async addBlacklistRole(guildId: string, roleId: string): Promise<ConfigDocument | null> {
    return Config.findOneAndUpdate(
      { guildId },
      { $addToSet: { xpBlacklistRoles: roleId } },
      { new: true, upsert: true }
    );
  }

  /**
   * Remove role from blacklist
   */
  async removeBlacklistRole(guildId: string, roleId: string): Promise<ConfigDocument | null> {
    return Config.findOneAndUpdate(
      { guildId },
      { $pull: { xpBlacklistRoles: roleId } },
      { new: true }
    );
  }

  /**
   * Set level up channel
   */
  async setLevelUpChannel(guildId: string, channelId: string | null): Promise<ConfigDocument | null> {
    return Config.findOneAndUpdate(
      { guildId },
      { levelUpChannel: channelId },
      { new: true, upsert: true }
    );
  }

  /**
   * Set log channel
   */
  async setLogChannel(guildId: string, channelId: string | null): Promise<ConfigDocument | null> {
    return Config.findOneAndUpdate(
      { guildId },
      { logChannel: channelId },
      { new: true, upsert: true }
    );
  }

  /**
   * Set badge notification channel (for rare+ badges)
   */
  async setBadgeNotificationChannel(guildId: string, channelId: string | null): Promise<ConfigDocument | null> {
    return Config.findOneAndUpdate(
      { guildId },
      { badgeNotificationChannel: channelId },
      { new: true, upsert: true }
    );
  }

  /**
   * Start event with multiplier
   */
  async startEvent(guildId: string, multiplier: number = 2): Promise<ConfigDocument | null> {
    return Config.findOneAndUpdate(
      { guildId },
      { eventActive: true, eventMultiplier: multiplier },
      { new: true, upsert: true }
    );
  }

  /**
   * Stop event
   */
  async stopEvent(guildId: string): Promise<ConfigDocument | null> {
    return Config.findOneAndUpdate(
      { guildId },
      { eventActive: false, eventMultiplier: 1 },
      { new: true }
    );
  }

  /**
   * Check if channel is blacklisted
   */
  async isChannelBlacklisted(guildId: string, channelId: string): Promise<boolean> {
    const config = await Config.findOne({
      guildId,
      xpBlacklistChannels: channelId,
    });
    return !!config;
  }

  /**
   * Check if role is blacklisted
   */
  async isRoleBlacklisted(guildId: string, roleId: string): Promise<boolean> {
    const config = await Config.findOne({
      guildId,
      xpBlacklistRoles: roleId,
    });
    return !!config;
  }

  /**
   * Get event multiplier
   */
  async getEventMultiplier(guildId: string): Promise<number> {
    const config = await Config.findOne({ guildId });
    if (!config || !config.eventActive) return 1;
    return config.eventMultiplier;
  }
}

export const configRepository = new ConfigRepository();
export default configRepository;
