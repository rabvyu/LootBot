import { ActivityLog, ActivityLogDocument } from '../models';
import { IActivityLog } from '../../types';

export class ActivityLogRepository {
  /**
   * Create log entry
   */
  async create(log: Omit<IActivityLog, 'timestamp'>): Promise<ActivityLogDocument> {
    return ActivityLog.create({
      ...log,
      timestamp: new Date(),
    });
  }

  /**
   * Log XP gain
   */
  async logXPGain(
    discordId: string,
    action: string,
    xpGained: number,
    details: Record<string, unknown> = {}
  ): Promise<ActivityLogDocument> {
    return this.create({
      discordId,
      action,
      xpGained,
      details,
      suspicious: false,
    });
  }

  /**
   * Log suspicious activity
   */
  async logSuspicious(
    discordId: string,
    action: string,
    details: Record<string, unknown> = {}
  ): Promise<ActivityLogDocument> {
    return this.create({
      discordId,
      action,
      xpGained: 0,
      details,
      suspicious: true,
    });
  }

  /**
   * Get user logs
   */
  async getUserLogs(
    discordId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ActivityLogDocument[]> {
    return ActivityLog.find({ discordId })
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit);
  }

  /**
   * Get suspicious logs
   */
  async getSuspiciousLogs(
    limit: number = 100,
    offset: number = 0
  ): Promise<ActivityLogDocument[]> {
    return ActivityLog.find({ suspicious: true })
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit);
  }

  /**
   * Get logs by action
   */
  async getLogsByAction(
    action: string,
    limit: number = 100
  ): Promise<ActivityLogDocument[]> {
    return ActivityLog.find({ action })
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  /**
   * Get user suspicious activity count
   */
  async getUserSuspiciousCount(discordId: string): Promise<number> {
    return ActivityLog.countDocuments({
      discordId,
      suspicious: true,
    });
  }

  /**
   * Get recent user actions count (for rate limiting)
   */
  async getRecentActionsCount(
    discordId: string,
    action: string,
    windowMs: number
  ): Promise<number> {
    const since = new Date(Date.now() - windowMs);
    return ActivityLog.countDocuments({
      discordId,
      action,
      timestamp: { $gte: since },
    });
  }

  /**
   * Get user XP in time window
   */
  async getUserXPInWindow(
    discordId: string,
    windowMs: number
  ): Promise<number> {
    const since = new Date(Date.now() - windowMs);
    const result = await ActivityLog.aggregate([
      {
        $match: {
          discordId,
          timestamp: { $gte: since },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$xpGained' },
        },
      },
    ]);
    return result[0]?.total || 0;
  }

  /**
   * Get total logs count
   */
  async getTotalCount(): Promise<number> {
    return ActivityLog.countDocuments();
  }

  /**
   * Delete old logs (manual cleanup)
   */
  async deleteOldLogs(daysOld: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    const result = await ActivityLog.deleteMany({
      timestamp: { $lt: cutoff },
    });

    return result.deletedCount;
  }
}

export const activityLogRepository = new ActivityLogRepository();
export default activityLogRepository;
