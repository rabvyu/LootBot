import { Router, Request, Response } from 'express';
import { badgeRepository } from '../../database/repositories/badgeRepository';
import { userRepository } from '../../database/repositories/userRepository';

const router = Router();

/**
 * GET /api/badges
 * Get all available badges
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string;

    let badges;
    if (category && ['level', 'time', 'achievement', 'special'].includes(category)) {
      badges = await badgeRepository.findByCategory(category as any);
    } else {
      badges = await badgeRepository.findAll();
    }

    // Get holder counts for each badge
    const badgesWithHolders = await Promise.all(
      badges.map(async (badge) => {
        const holders = await userRepository.getUsersWithBadge(badge.badgeId);
        return {
          id: badge.badgeId,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: badge.category,
          rarity: badge.rarity,
          holders,
        };
      })
    );

    res.json({
      success: true,
      count: badgesWithHolders.length,
      data: badgesWithHolders,
    });
  } catch (error) {
    console.error('Badges error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch badges',
    });
  }
});

/**
 * GET /api/badges/:id
 * Get specific badge info
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const badge = await badgeRepository.findById(id);

    if (!badge) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Badge not found',
      });
      return;
    }

    const holders = await userRepository.getUsersWithBadge(id);

    res.json({
      success: true,
      data: {
        id: badge.badgeId,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        requirement: badge.requirement,
        rarity: badge.rarity,
        holders,
      },
    });
  } catch (error) {
    console.error('Badge error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch badge',
    });
  }
});

export default router;
