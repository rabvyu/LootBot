import { Router, Request, Response } from 'express';
import { userRepository } from '../../database/repositories/userRepository';
import { badgeService } from '../../services/badgeService';
import { levelService } from '../../services/levelService';
import { ProfileResponse } from '../../types';

const router = Router();

/**
 * GET /api/profile/:discordId
 * Get user profile by Discord ID
 */
router.get('/:discordId', async (req: Request, res: Response) => {
  try {
    const { discordId } = req.params;

    // Validate Discord ID format (snowflake)
    if (!/^\d{17,19}$/.test(discordId)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid Discord ID format',
      });
      return;
    }

    // Get user
    const user = await userRepository.findByDiscordId(discordId);

    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    // Get rank
    const rank = await userRepository.getRank(discordId);

    // Get badges with full info
    const badges = await badgeService.getUserBadges(discordId);

    // Calculate progress
    const xpForNextLevel = levelService.getXPNeeded(user.totalXP, user.level);
    const progress = levelService.getProgress(user.totalXP, user.level);

    // Build response
    const profile: ProfileResponse = {
      discordId: user.discordId,
      username: user.username,
      globalName: user.globalName,
      avatar: user.avatar,
      xp: user.xp,
      level: user.level,
      totalXP: user.totalXP,
      rank,
      xpForNextLevel,
      progress: Math.round(progress * 100) / 100,
      badges,
      stats: user.stats,
      joinedAt: user.joinedAt,
    };

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch profile',
    });
  }
});

export default router;
