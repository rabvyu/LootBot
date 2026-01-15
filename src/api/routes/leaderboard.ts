import { Router, Request, Response } from 'express';
import { userRepository } from '../../database/repositories/userRepository';
import { LeaderboardPeriod, LeaderboardEntry } from '../../types';
import { leaderboardLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * GET /api/leaderboard
 * Get leaderboard with optional period filter
 */
router.get('/', leaderboardLimiter, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const period = (req.query.period as LeaderboardPeriod) || 'alltime';

    // Validate period
    const validPeriods: LeaderboardPeriod[] = ['daily', 'weekly', 'monthly', 'alltime'];
    if (!validPeriods.includes(period)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `Invalid period. Must be one of: ${validPeriods.join(', ')}`,
      });
      return;
    }

    // Get leaderboard
    const users = await userRepository.getLeaderboard(limit, period);

    // Transform to response format
    const entries: LeaderboardEntry[] = await Promise.all(
      users.map(async (user, index) => {
        return {
          rank: index + 1,
          discordId: user.discordId,
          username: user.username,
          globalName: user.globalName,
          avatar: user.avatar,
          xp: period === 'alltime' ? user.totalXP : user.dailyXP.total,
          level: user.level,
          badges: user.badges,
        };
      })
    );

    res.json({
      success: true,
      period,
      count: entries.length,
      data: entries,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch leaderboard',
    });
  }
});

export default router;
