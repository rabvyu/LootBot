import { Router, Request, Response } from 'express';
import { userRepository } from '../../database/repositories/userRepository';
import { badgeService } from '../../services/badgeService';
import { activityLogRepository } from '../../database/repositories/activityLogRepository';
import { apiKeyAuth } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimit';

const router = Router();

// Apply auth and rate limiting to all admin routes
router.use(apiKeyAuth);
router.use(adminLimiter);

/**
 * POST /api/admin/give-badge
 * Give a badge to a user via API
 */
router.post('/give-badge', async (req: Request, res: Response) => {
  try {
    const { discordId, badgeId } = req.body;

    if (!discordId || !badgeId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'discordId and badgeId are required',
      });
      return;
    }

    // Check if user exists
    const user = await userRepository.findByDiscordId(discordId);
    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    // Check if already has badge
    const hasBadge = await userRepository.hasBadge(discordId, badgeId);
    if (hasBadge) {
      res.status(409).json({
        error: 'Conflict',
        message: 'User already has this badge',
      });
      return;
    }

    // Add badge
    await userRepository.addBadge(discordId, badgeId);

    res.json({
      success: true,
      message: `Badge ${badgeId} given to user ${discordId}`,
    });
  } catch (error) {
    console.error('Admin give-badge error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to give badge',
    });
  }
});

/**
 * POST /api/admin/remove-badge
 * Remove a badge from a user via API
 */
router.post('/remove-badge', async (req: Request, res: Response) => {
  try {
    const { discordId, badgeId } = req.body;

    if (!discordId || !badgeId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'discordId and badgeId are required',
      });
      return;
    }

    // Remove badge
    await userRepository.removeBadge(discordId, badgeId);

    res.json({
      success: true,
      message: `Badge ${badgeId} removed from user ${discordId}`,
    });
  } catch (error) {
    console.error('Admin remove-badge error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to remove badge',
    });
  }
});

/**
 * GET /api/admin/logs
 * Get activity logs
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const discordId = req.query.discordId as string;
    const suspicious = req.query.suspicious === 'true';
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    let logs;

    if (discordId) {
      logs = await activityLogRepository.getUserLogs(discordId, limit);
    } else if (suspicious) {
      logs = await activityLogRepository.getSuspiciousLogs(limit);
    } else {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Either discordId or suspicious=true is required',
      });
      return;
    }

    res.json({
      success: true,
      count: logs.length,
      data: logs.map(log => ({
        discordId: log.discordId,
        action: log.action,
        xpGained: log.xpGained,
        suspicious: log.suspicious,
        timestamp: log.timestamp,
        details: log.details,
      })),
    });
  } catch (error) {
    console.error('Admin logs error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch logs',
    });
  }
});

/**
 * POST /api/admin/give-xp
 * Give XP to a user via API
 */
router.post('/give-xp', async (req: Request, res: Response) => {
  try {
    const { discordId, amount } = req.body;

    if (!discordId || !amount) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'discordId and amount are required',
      });
      return;
    }

    const xpAmount = parseInt(amount);
    if (isNaN(xpAmount) || xpAmount < 1 || xpAmount > 100000) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'amount must be between 1 and 100000',
      });
      return;
    }

    // Add XP
    const result = await userRepository.addXP(discordId, xpAmount, 'bonus');

    res.json({
      success: true,
      message: `${xpAmount} XP given to user ${discordId}`,
      data: {
        newLevel: result.user.level,
        newTotalXP: result.user.totalXP,
        leveledUp: result.leveledUp,
      },
    });
  } catch (error) {
    console.error('Admin give-xp error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to give XP',
    });
  }
});

export default router;
