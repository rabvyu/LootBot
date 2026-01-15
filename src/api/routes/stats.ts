import { Router, Request, Response } from 'express';
import { userRepository } from '../../database/repositories/userRepository';
import { badgeRepository } from '../../database/repositories/badgeRepository';

const router = Router();

/**
 * GET /api/stats
 * Get server statistics
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get basic stats
    const totalMembers = await userRepository.getTotalUsers();
    const totalXP = await userRepository.getTotalXP();
    const totalBadges = await badgeRepository.getTotalCount();
    const topLevel = await userRepository.getHighestLevel();

    // Get top users
    const topUsers = await userRepository.getLeaderboard(3, 'alltime');

    res.json({
      success: true,
      data: {
        totalMembers,
        totalXP,
        activeBadges: totalBadges,
        topLevel,
        topUsers: topUsers.map((user, index) => ({
          rank: index + 1,
          username: user.username,
          globalName: user.globalName,
          level: user.level,
          totalXP: user.totalXP,
        })),
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch stats',
    });
  }
});

export default router;
