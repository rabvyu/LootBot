import { LevelRole, LevelRoleDocument } from '../models';
import { ILevelRole } from '../../types';

export class LevelRoleRepository {
  /**
   * Create a new level role mapping
   */
  async create(data: Pick<ILevelRole, 'guildId' | 'roleId' | 'requiredLevel' | 'removeOnHigher'>): Promise<LevelRoleDocument> {
    return LevelRole.create(data);
  }

  /**
   * Find all level roles for a guild
   */
  async findByGuildId(guildId: string): Promise<LevelRoleDocument[]> {
    return LevelRole.find({ guildId }).sort({ requiredLevel: 1 });
  }

  /**
   * Find a level role by guild and role ID
   */
  async findByRoleId(guildId: string, roleId: string): Promise<LevelRoleDocument | null> {
    return LevelRole.findOne({ guildId, roleId });
  }

  /**
   * Find all roles for a specific level
   */
  async findByLevel(guildId: string, level: number): Promise<LevelRoleDocument[]> {
    return LevelRole.find({ guildId, requiredLevel: level });
  }

  /**
   * Find roles that user should have based on their level
   */
  async findRolesForLevel(guildId: string, userLevel: number): Promise<LevelRoleDocument[]> {
    return LevelRole.find({
      guildId,
      requiredLevel: { $lte: userLevel },
    }).sort({ requiredLevel: -1 });
  }

  /**
   * Find roles below a certain level (for removal when removeOnHigher is true)
   */
  async findRolesBelowLevel(guildId: string, level: number): Promise<LevelRoleDocument[]> {
    return LevelRole.find({
      guildId,
      requiredLevel: { $lt: level },
      removeOnHigher: true,
    });
  }

  /**
   * Update a level role
   */
  async update(
    guildId: string,
    roleId: string,
    updates: Partial<Pick<ILevelRole, 'requiredLevel' | 'removeOnHigher'>>
  ): Promise<LevelRoleDocument | null> {
    return LevelRole.findOneAndUpdate(
      { guildId, roleId },
      updates,
      { new: true }
    );
  }

  /**
   * Delete a level role
   */
  async delete(guildId: string, roleId: string): Promise<boolean> {
    const result = await LevelRole.deleteOne({ guildId, roleId });
    return result.deletedCount > 0;
  }

  /**
   * Delete all level roles for a guild
   */
  async deleteAllForGuild(guildId: string): Promise<number> {
    const result = await LevelRole.deleteMany({ guildId });
    return result.deletedCount;
  }

  /**
   * Check if a role is already configured
   */
  async exists(guildId: string, roleId: string): Promise<boolean> {
    const count = await LevelRole.countDocuments({ guildId, roleId });
    return count > 0;
  }

  /**
   * Get count of level roles for a guild
   */
  async countByGuild(guildId: string): Promise<number> {
    return LevelRole.countDocuments({ guildId });
  }
}

export const levelRoleRepository = new LevelRoleRepository();
export default levelRoleRepository;
