import { TamedMonster, TamedMonsterDocument, TamedMonsterStats } from '../models/TamedMonster';

class TamingRepository {
  async getTamedMonsters(discordId: string): Promise<TamedMonsterDocument[]> {
    return TamedMonster.find({ odiscordId: discordId }).sort({ isActive: -1, level: -1 });
  }

  async getActiveMonster(discordId: string): Promise<TamedMonsterDocument | null> {
    return TamedMonster.findOne({ odiscordId: discordId, isActive: true });
  }

  async getTamedMonsterById(id: string): Promise<TamedMonsterDocument | null> {
    return TamedMonster.findById(id);
  }

  async getTamedMonsterByNickname(discordId: string, nickname: string): Promise<TamedMonsterDocument | null> {
    return TamedMonster.findOne({
      odiscordId: discordId,
      nickname: { $regex: new RegExp(`^${nickname}$`, 'i') },
    });
  }

  async countTamedMonsters(discordId: string): Promise<number> {
    return TamedMonster.countDocuments({ odiscordId: discordId });
  }

  async createTamedMonster(
    discordId: string,
    monsterId: string,
    nickname: string,
    originalName: string,
    emoji: string,
    stats: TamedMonsterStats
  ): Promise<TamedMonsterDocument> {
    const monster = new TamedMonster({
      odiscordId: discordId,
      monsterId,
      nickname,
      originalName,
      emoji,
      stats,
    });
    return monster.save();
  }

  async setActiveMonster(discordId: string, monsterId: string): Promise<void> {
    // Deactivate all monsters
    await TamedMonster.updateMany({ odiscordId: discordId }, { isActive: false });
    // Activate selected monster
    await TamedMonster.findByIdAndUpdate(monsterId, { isActive: true });
  }

  async updateMonsterStats(monsterId: string, stats: Partial<TamedMonsterStats>): Promise<void> {
    const updateObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(stats)) {
      updateObj[`stats.${key}`] = value;
    }
    await TamedMonster.findByIdAndUpdate(monsterId, { $set: updateObj });
  }

  async addExperience(monsterId: string, xp: number): Promise<TamedMonsterDocument | null> {
    return TamedMonster.findByIdAndUpdate(
      monsterId,
      { $inc: { experience: xp } },
      { new: true }
    );
  }

  async levelUp(monsterId: string, newLevel: number, newStats: TamedMonsterStats): Promise<void> {
    await TamedMonster.findByIdAndUpdate(monsterId, {
      level: newLevel,
      experience: 0,
      stats: newStats,
    });
  }

  async recordBattleWin(monsterId: string): Promise<void> {
    await TamedMonster.findByIdAndUpdate(monsterId, { $inc: { battlesWon: 1 } });
  }

  async recordBattleLoss(monsterId: string): Promise<void> {
    await TamedMonster.findByIdAndUpdate(monsterId, { $inc: { battlesLost: 1 } });
  }

  async feedMonster(monsterId: string, happinessGain: number, loyaltyGain: number): Promise<void> {
    await TamedMonster.findByIdAndUpdate(monsterId, {
      lastFed: new Date(),
      $inc: {
        'stats.happiness': happinessGain,
        'stats.loyalty': loyaltyGain,
      },
    });
    // Cap at 100
    await TamedMonster.findByIdAndUpdate(monsterId, {
      $min: { 'stats.happiness': 100, 'stats.loyalty': 100 },
    });
  }

  async trainMonster(monsterId: string): Promise<void> {
    await TamedMonster.findByIdAndUpdate(monsterId, { lastTrained: new Date() });
  }

  async healMonster(monsterId: string): Promise<void> {
    const monster = await TamedMonster.findById(monsterId);
    if (monster) {
      await TamedMonster.findByIdAndUpdate(monsterId, {
        'stats.hp': monster.stats.maxHp,
      });
    }
  }

  async damageMonster(monsterId: string, damage: number): Promise<void> {
    await TamedMonster.findByIdAndUpdate(monsterId, {
      $inc: { 'stats.hp': -damage },
    });
    // Don't go below 0
    await TamedMonster.findByIdAndUpdate(monsterId, {
      $max: { 'stats.hp': 0 },
    });
  }

  async releaseMonster(monsterId: string): Promise<void> {
    await TamedMonster.findByIdAndDelete(monsterId);
  }

  async renameMonster(monsterId: string, newNickname: string): Promise<void> {
    await TamedMonster.findByIdAndUpdate(monsterId, { nickname: newNickname });
  }

  async decayStats(discordId: string): Promise<void> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Decay happiness and loyalty for unfed monsters
    await TamedMonster.updateMany(
      { odiscordId: discordId, lastFed: { $lt: dayAgo } },
      { $inc: { 'stats.happiness': -5, 'stats.loyalty': -3 } }
    );

    // Don't go below 0
    await TamedMonster.updateMany(
      { odiscordId: discordId },
      { $max: { 'stats.happiness': 0, 'stats.loyalty': 0 } }
    );
  }

  async getLeaderboard(limit: number = 10): Promise<TamedMonsterDocument[]> {
    return TamedMonster.find()
      .sort({ level: -1, experience: -1 })
      .limit(limit);
  }
}

export const tamingRepository = new TamingRepository();
export default tamingRepository;
