import { Badge, BadgeDocument } from '../models';
import { IBadge, BadgeCategory, BadgeRarity } from '../../types';
import { BADGES } from '../../utils/constants';
import { logger } from '../../utils/logger';

export class BadgeRepository {
  /**
   * Find badge by ID
   */
  async findById(id: string): Promise<BadgeDocument | null> {
    return Badge.findOne({ badgeId: id });
  }

  /**
   * Get all badges
   */
  async findAll(): Promise<BadgeDocument[]> {
    return Badge.find().sort({ rarity: 1, name: 1 });
  }

  /**
   * Get badges by category
   */
  async findByCategory(category: BadgeCategory): Promise<BadgeDocument[]> {
    return Badge.find({ category }).sort({ rarity: 1, name: 1 });
  }

  /**
   * Get badges by rarity
   */
  async findByRarity(rarity: BadgeRarity): Promise<BadgeDocument[]> {
    return Badge.find({ rarity }).sort({ name: 1 });
  }

  /**
   * Get badges by IDs
   */
  async findByIds(ids: string[]): Promise<BadgeDocument[]> {
    return Badge.find({ badgeId: { $in: ids } });
  }

  /**
   * Get total badge count
   */
  async getTotalCount(): Promise<number> {
    return Badge.countDocuments();
  }

  /**
   * Create badge
   */
  async create(badge: Omit<IBadge, 'createdAt'>): Promise<BadgeDocument> {
    return Badge.create({ ...badge, badgeId: badge.id });
  }

  /**
   * Update badge
   */
  async update(id: string, updates: Partial<IBadge>): Promise<BadgeDocument | null> {
    return Badge.findOneAndUpdate({ badgeId: id }, updates, { new: true });
  }

  /**
   * Delete badge
   */
  async delete(id: string): Promise<boolean> {
    const result = await Badge.deleteOne({ badgeId: id });
    return result.deletedCount > 0;
  }

  /**
   * Seed initial badges from constants
   */
  async seedBadges(): Promise<void> {
    logger.info('Seeding badges...');

    // Level badges
    for (const badge of BADGES.LEVEL) {
      await Badge.findOneAndUpdate(
        { badgeId: badge.id },
        {
          badgeId: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: 'level',
          requirement: { type: 'level', value: badge.level },
          rarity: badge.rarity,
        },
        { upsert: true }
      );
    }

    // Time badges
    for (const badge of BADGES.TIME) {
      await Badge.findOneAndUpdate(
        { badgeId: badge.id },
        {
          badgeId: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: 'time',
          requirement: { type: 'days', value: badge.days },
          rarity: badge.rarity,
        },
        { upsert: true }
      );
    }

    // Achievement badges
    for (const badge of BADGES.ACHIEVEMENT) {
      await Badge.findOneAndUpdate(
        { badgeId: badge.id },
        {
          badgeId: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: 'achievement',
          requirement: badge.requirement,
          rarity: badge.rarity,
        },
        { upsert: true }
      );
    }

    // Special badges
    for (const badge of BADGES.SPECIAL) {
      await Badge.findOneAndUpdate(
        { badgeId: badge.id },
        {
          badgeId: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: 'special',
          requirement: { type: 'manual', value: 0 },
          rarity: badge.rarity,
        },
        { upsert: true }
      );
    }

    const count = await Badge.countDocuments();
    logger.info(`Badge seeding complete. Total badges: ${count}`);
  }
}

export const badgeRepository = new BadgeRepository();
export default badgeRepository;
