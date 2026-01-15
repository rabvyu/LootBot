import { GuildMember, Role, Guild } from 'discord.js';
import { levelRoleRepository } from '../database/repositories/levelRoleRepository';
import { LevelRoleDocument } from '../database/models';
import { logger } from '../utils/logger';

class LevelRoleService {
  /**
   * Add a new level role configuration
   */
  async addLevelRole(
    guildId: string,
    roleId: string,
    requiredLevel: number,
    removeOnHigher: boolean = true
  ): Promise<LevelRoleDocument> {
    // Check if role is already configured
    const exists = await levelRoleRepository.exists(guildId, roleId);
    if (exists) {
      throw new Error('Este cargo ja esta configurado para outro nivel');
    }

    return levelRoleRepository.create({
      guildId,
      roleId,
      requiredLevel,
      removeOnHigher,
    });
  }

  /**
   * Remove a level role configuration
   */
  async removeLevelRole(guildId: string, roleId: string): Promise<boolean> {
    return levelRoleRepository.delete(guildId, roleId);
  }

  /**
   * Update a level role configuration
   */
  async updateLevelRole(
    guildId: string,
    roleId: string,
    updates: { requiredLevel?: number; removeOnHigher?: boolean }
  ): Promise<LevelRoleDocument | null> {
    return levelRoleRepository.update(guildId, roleId, updates);
  }

  /**
   * Get all level roles for a guild
   */
  async getLevelRoles(guildId: string): Promise<LevelRoleDocument[]> {
    return levelRoleRepository.findByGuildId(guildId);
  }

  /**
   * Sync roles for a member based on their level
   * This adds roles they should have and removes roles they shouldn't
   */
  async syncMemberRoles(member: GuildMember, level: number): Promise<{
    added: string[];
    removed: string[];
  }> {
    const result = { added: [] as string[], removed: [] as string[] };

    try {
      const allLevelRoles = await levelRoleRepository.findByGuildId(member.guild.id);
      if (allLevelRoles.length === 0) return result;

      // Separate roles into those to add and those to remove
      const rolesToAdd: string[] = [];
      const rolesToRemove: string[] = [];

      for (const lr of allLevelRoles) {
        const role = member.guild.roles.cache.get(lr.roleId);
        if (!role) continue;

        const hasRole = member.roles.cache.has(lr.roleId);
        const meetsRequirement = level >= lr.requiredLevel;

        if (meetsRequirement && !hasRole) {
          // Should have the role but doesn't
          if (!lr.removeOnHigher || lr.requiredLevel === this.getHighestRequiredLevel(allLevelRoles, level)) {
            rolesToAdd.push(lr.roleId);
          } else if (!lr.removeOnHigher) {
            // Keep all roles if removeOnHigher is false
            rolesToAdd.push(lr.roleId);
          }
        } else if (hasRole && !meetsRequirement) {
          // Has the role but shouldn't (level dropped)
          rolesToRemove.push(lr.roleId);
        } else if (hasRole && meetsRequirement && lr.removeOnHigher) {
          // Has the role but should be removed because a higher level role is available
          const higherRoles = allLevelRoles.filter(
            r => r.requiredLevel > lr.requiredLevel && level >= r.requiredLevel
          );
          if (higherRoles.length > 0) {
            rolesToRemove.push(lr.roleId);
          }
        }
      }

      // Find the highest role the user should have based on level
      const highestLevelRole = this.getHighestLevelRoleForLevel(allLevelRoles, level);
      if (highestLevelRole && !member.roles.cache.has(highestLevelRole.roleId)) {
        if (!rolesToAdd.includes(highestLevelRole.roleId)) {
          rolesToAdd.push(highestLevelRole.roleId);
        }
      }

      // Apply changes
      if (rolesToAdd.length > 0) {
        await member.roles.add(rolesToAdd, `Level ${level} - Auto role assignment`);
        result.added = rolesToAdd;
        logger.info(`Added roles to ${member.user.username}: ${rolesToAdd.join(', ')}`);
      }

      if (rolesToRemove.length > 0) {
        await member.roles.remove(rolesToRemove, `Level ${level} - Auto role removal`);
        result.removed = rolesToRemove;
        logger.info(`Removed roles from ${member.user.username}: ${rolesToRemove.join(', ')}`);
      }
    } catch (error) {
      logger.error('Error syncing member roles:', error);
    }

    return result;
  }

  /**
   * Get the highest required level that user has reached
   */
  private getHighestRequiredLevel(roles: LevelRoleDocument[], userLevel: number): number {
    const eligible = roles.filter(r => r.requiredLevel <= userLevel);
    if (eligible.length === 0) return 0;
    return Math.max(...eligible.map(r => r.requiredLevel));
  }

  /**
   * Get the highest level role configuration for a given user level
   */
  private getHighestLevelRoleForLevel(roles: LevelRoleDocument[], userLevel: number): LevelRoleDocument | null {
    const eligible = roles.filter(r => r.requiredLevel <= userLevel);
    if (eligible.length === 0) return null;
    return eligible.reduce((highest, current) =>
      current.requiredLevel > highest.requiredLevel ? current : highest
    );
  }

  /**
   * Handle level up - assign new role and optionally remove old ones
   */
  async handleLevelUp(member: GuildMember, oldLevel: number, newLevel: number): Promise<{
    newRole: Role | null;
    removedRoles: Role[];
  }> {
    const result: { newRole: Role | null; removedRoles: Role[] } = {
      newRole: null,
      removedRoles: [],
    };

    try {
      // Get roles that should be assigned at the new level
      const newLevelRoles = await levelRoleRepository.findByLevel(member.guild.id, newLevel);

      for (const lr of newLevelRoles) {
        const role = member.guild.roles.cache.get(lr.roleId);
        if (!role) continue;

        // Add the new role
        if (!member.roles.cache.has(lr.roleId)) {
          await member.roles.add(role, `Level up: ${oldLevel} -> ${newLevel}`);
          result.newRole = role;
          logger.info(`Added role ${role.name} to ${member.user.username} for reaching level ${newLevel}`);
        }

        // Remove lower level roles if configured to do so
        if (lr.removeOnHigher) {
          const lowerRoles = await levelRoleRepository.findRolesBelowLevel(member.guild.id, newLevel);
          for (const lowerLr of lowerRoles) {
            if (member.roles.cache.has(lowerLr.roleId)) {
              const lowerRole = member.guild.roles.cache.get(lowerLr.roleId);
              if (lowerRole) {
                await member.roles.remove(lowerRole, `Level up: Replacing with higher level role`);
                result.removedRoles.push(lowerRole);
                logger.info(`Removed role ${lowerRole.name} from ${member.user.username} (replaced by higher level role)`);
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error handling level up roles:', error);
    }

    return result;
  }

  /**
   * Sync all members in a guild (useful for retroactive assignment)
   */
  async syncAllMembers(
    guild: Guild,
    memberLevels: Map<string, number>
  ): Promise<{ synced: number; errors: number }> {
    const result = { synced: 0, errors: 0 };

    const levelRoles = await levelRoleRepository.findByGuildId(guild.id);
    if (levelRoles.length === 0) return result;

    for (const [memberId, level] of memberLevels) {
      try {
        const member = guild.members.cache.get(memberId);
        if (!member || member.user.bot) continue;

        await this.syncMemberRoles(member, level);
        result.synced++;
      } catch (error) {
        logger.error(`Error syncing roles for member ${memberId}:`, error);
        result.errors++;
      }
    }

    return result;
  }
}

export const levelRoleService = new LevelRoleService();
export default levelRoleService;
