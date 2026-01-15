import { User, UserDocument } from '../models';
import { IUser, UserBadge, LeaderboardPeriod } from '../../types';
import { startOfDay, startOfWeek, startOfMonth, isToday, levelFromXp } from '../../utils/helpers';

export class UserRepository {
  /**
   * Find or create a user
   */
  async findOrCreate(discordId: string, username: string, globalName: string | null, avatar: string | null): Promise<UserDocument> {
    let user = await User.findOne({ discordId });

    if (!user) {
      user = await User.create({
        discordId,
        username,
        globalName,
        avatar,
        joinedAt: new Date(),
      });
    } else {
      // Update user info if changed
      if (user.username !== username || user.globalName !== globalName || user.avatar !== avatar) {
        user.username = username;
        user.globalName = globalName;
        user.avatar = avatar;
        await user.save();
      }
    }

    return user;
  }

  /**
   * Find user by Discord ID
   */
  async findByDiscordId(discordId: string): Promise<UserDocument | null> {
    return User.findOne({ discordId });
  }

  /**
   * Add XP to user
   */
  async addXP(
    discordId: string,
    amount: number,
    source: 'messages' | 'voice' | 'reactions' | 'invites' | 'bonus'
  ): Promise<{ user: UserDocument; leveledUp: boolean; oldLevel: number }> {
    const user = await User.findOne({ discordId });

    if (!user) {
      throw new Error('User not found');
    }

    const oldLevel = user.level;

    // Reset daily XP if new day
    if (!isToday(user.dailyXP.date)) {
      user.dailyXP = {
        date: new Date(),
        messages: 0,
        voice: 0,
        reactions: 0,
        invites: 0,
        bonus: 0,
        total: 0,
      };
    }

    // Update XP
    user.xp += amount;
    user.totalXP += amount;
    user.dailyXP[source] += amount;
    user.dailyXP.total += amount;
    user.stats.lastActive = new Date();

    // Calculate new level from total XP
    const newLevel = levelFromXp(user.totalXP);
    const leveledUp = newLevel > oldLevel;

    // Always update level to correct value (fixes any desync)
    user.level = newLevel;

    await user.save();

    return {
      user,
      leveledUp,
      oldLevel,
    };
  }

  /**
   * Set user level
   */
  async setLevel(discordId: string, level: number): Promise<UserDocument | null> {
    return User.findOneAndUpdate(
      { discordId },
      { level },
      { new: true }
    );
  }

  /**
   * Add badge to user
   */
  async addBadge(discordId: string, badgeId: string): Promise<UserDocument | null> {
    return User.findOneAndUpdate(
      { discordId, 'badges.badgeId': { $ne: badgeId } },
      {
        $push: {
          badges: { badgeId, earnedAt: new Date() } as UserBadge,
        },
      },
      { new: true }
    );
  }

  /**
   * Remove badge from user
   */
  async removeBadge(discordId: string, badgeId: string): Promise<UserDocument | null> {
    return User.findOneAndUpdate(
      { discordId },
      { $pull: { badges: { badgeId } } },
      { new: true }
    );
  }

  /**
   * Check if user has badge
   */
  async hasBadge(discordId: string, badgeId: string): Promise<boolean> {
    const user = await User.findOne({
      discordId,
      'badges.badgeId': badgeId,
    });
    return !!user;
  }

  /**
   * Update user stats
   */
  async updateStats(
    discordId: string,
    updates: Partial<IUser['stats']>
  ): Promise<UserDocument | null> {
    const updateObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      updateObj[`stats.${key}`] = value;
    }

    return User.findOneAndUpdate(
      { discordId },
      { $set: updateObj },
      { new: true }
    );
  }

  /**
   * Increment stat
   */
  async incrementStat(
    discordId: string,
    stat: keyof IUser['stats'],
    amount: number = 1
  ): Promise<UserDocument | null> {
    return User.findOneAndUpdate(
      { discordId },
      { $inc: { [`stats.${stat}`]: amount } },
      { new: true }
    );
  }

  /**
   * Get user rank
   */
  async getRank(discordId: string): Promise<number> {
    const user = await User.findOne({ discordId });
    if (!user) return 0;

    const count = await User.countDocuments({
      totalXP: { $gt: user.totalXP },
    });

    return count + 1;
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 10, period: LeaderboardPeriod = 'alltime'): Promise<UserDocument[]> {
    let query = {};

    if (period !== 'alltime') {
      let startDate: Date;

      switch (period) {
        case 'daily':
          startDate = startOfDay();
          break;
        case 'weekly':
          startDate = startOfWeek();
          break;
        case 'monthly':
          startDate = startOfMonth();
          break;
        default:
          startDate = new Date(0);
      }

      query = { 'dailyXP.date': { $gte: startDate } };
    }

    const sortField = period === 'alltime' ? 'totalXP' : 'dailyXP.total';

    return User.find(query)
      .sort({ [sortField]: -1 })
      .limit(limit);
  }

  /**
   * Get total registered users
   */
  async getTotalUsers(): Promise<number> {
    return User.countDocuments();
  }

  /**
   * Get total XP distributed
   */
  async getTotalXP(): Promise<number> {
    const result = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$totalXP' } } },
    ]);
    return result[0]?.total || 0;
  }

  /**
   * Get highest level
   */
  async getHighestLevel(): Promise<number> {
    const user = await User.findOne().sort({ level: -1 }).limit(1);
    return user?.level || 0;
  }

  /**
   * Update streak
   */
  async updateStreak(discordId: string): Promise<{ currentStreak: number; longestStreak: number }> {
    const user = await User.findOne({ discordId });
    if (!user) throw new Error('User not found');

    let newStreak = user.stats.currentStreak + 1;
    let longestStreak = user.stats.longestStreak;

    if (newStreak > longestStreak) {
      longestStreak = newStreak;
    }

    await User.updateOne(
      { discordId },
      {
        $set: {
          'stats.currentStreak': newStreak,
          'stats.longestStreak': longestStreak,
          'stats.lastDaily': new Date(),
        },
      }
    );

    return { currentStreak: newStreak, longestStreak };
  }

  /**
   * Reset streak
   */
  async resetStreak(discordId: string): Promise<void> {
    await User.updateOne(
      { discordId },
      { $set: { 'stats.currentStreak': 0 } }
    );
  }

  /**
   * Get daily XP for user
   */
  async getDailyXP(discordId: string): Promise<IUser['dailyXP'] | null> {
    const user = await User.findOne({ discordId });
    if (!user) return null;

    if (!isToday(user.dailyXP.date)) {
      return {
        date: new Date(),
        messages: 0,
        voice: 0,
        reactions: 0,
        invites: 0,
        bonus: 0,
        total: 0,
      };
    }

    return user.dailyXP;
  }

  /**
   * Reset user progress
   */
  async resetUser(discordId: string): Promise<UserDocument | null> {
    return User.findOneAndUpdate(
      { discordId },
      {
        $set: {
          xp: 0,
          level: 1,
          totalXP: 0,
          badges: [],
          stats: {
            messagesCount: 0,
            voiceMinutes: 0,
            reactionsGiven: 0,
            reactionsReceived: 0,
            invitesCount: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastDaily: null,
            lastActive: new Date(),
          },
          dailyXP: {
            date: new Date(),
            messages: 0,
            voice: 0,
            reactions: 0,
            invites: 0,
            bonus: 0,
            total: 0,
          },
        },
      },
      { new: true }
    );
  }

  /**
   * Get users with specific badge
   */
  async getUsersWithBadge(badgeId: string): Promise<number> {
    return User.countDocuments({ 'badges.badgeId': badgeId });
  }

  /**
   * Get early adopters (first N members)
   */
  async getEarlyAdopters(limit: number): Promise<UserDocument[]> {
    return User.find().sort({ joinedAt: 1 }).limit(limit);
  }

  /**
   * Get users by minimum level
   */
  async getUsersByMinLevel(minLevel: number): Promise<UserDocument[]> {
    return User.find({ level: { $gte: minLevel } });
  }
}

export const userRepository = new UserRepository();
export default userRepository;
