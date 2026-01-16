// Serviço de Conquistas
import {
  AchievementProgress,
  IAchievementProgress,
} from '../database/models/Achievement';
import { User, Character, CharacterInventory } from '../database/models';
import {
  AchievementData,
  getAchievementById,
  getAllAchievements,
  getAchievementsByCategory,
  ACHIEVEMENTS,
  RARITY_COLORS,
} from '../data/achievements';
import { logger } from '../utils/logger';

export interface AchievementCheckResult {
  newlyCompleted: Array<{
    achievement: AchievementData;
    progress: number;
  }>;
  updated: Array<{
    achievement: AchievementData;
    oldProgress: number;
    newProgress: number;
  }>;
}

export interface AchievementClaimResult {
  success: boolean;
  message: string;
  rewards?: Array<{ type: string; quantity: number; itemId?: string }>;
}

export interface PlayerAchievementProfile {
  totalPoints: number;
  completedCount: number;
  totalAchievements: number;
  completionPercentage: number;
  recentAchievements: Array<{
    achievement: AchievementData;
    completedAt: Date;
  }>;
  unclaimedRewards: number;
  stats: IAchievementProgress['stats'];
}

class AchievementService {
  // Obter ou criar progresso de conquistas
  async getOrCreateProgress(discordId: string): Promise<IAchievementProgress> {
    let progress = await AchievementProgress.findOne({ discordId });

    if (!progress) {
      progress = new AchievementProgress({
        discordId,
        achievements: [],
        totalPoints: 0,
        completedCount: 0,
        stats: {
          monstersKilled: 0,
          bossesKilled: 0,
          dungeonsCompleted: 0,
          pvpWins: 0,
          pvpLosses: 0,
          itemsCrafted: 0,
          enchantmentsApplied: 0,
          coinsEarned: 0,
          coinsSpent: 0,
          questsCompleted: 0,
          eventsParticipated: 0,
          guildContribution: 0,
          tradingVolume: 0,
          loginDays: 0,
          loginStreak: 0,
          maxLevel: 1,
        },
      });
      await progress.save();
    }

    return progress;
  }

  // Atualizar estatística e verificar conquistas
  async updateStat(
    discordId: string,
    statName: keyof IAchievementProgress['stats'],
    value: number,
    increment: boolean = true
  ): Promise<AchievementCheckResult> {
    const progress = await this.getOrCreateProgress(discordId);

    // Atualizar stat
    if (increment) {
      progress.stats[statName] = (progress.stats[statName] || 0) + value;
    } else {
      progress.stats[statName] = value;
    }

    await progress.save();

    // Verificar conquistas relacionadas
    return this.checkAchievements(discordId, statName);
  }

  // Verificar conquistas para uma stat específica
  async checkAchievements(
    discordId: string,
    statName: string
  ): Promise<AchievementCheckResult> {
    const progress = await this.getOrCreateProgress(discordId);
    const result: AchievementCheckResult = {
      newlyCompleted: [],
      updated: [],
    };

    // Encontrar conquistas relacionadas à stat
    const relevantAchievements = ACHIEVEMENTS.filter(
      a => a.requirement.type === statName
    );

    for (const achievement of relevantAchievements) {
      const currentValue = this.getStatValue(progress, achievement.requirement.type);
      let achievementProgress = progress.achievements.find(
        a => a.achievementId === achievement.achievementId
      );

      // Criar progresso se não existir
      if (!achievementProgress) {
        achievementProgress = {
          achievementId: achievement.achievementId,
          progress: 0,
          completed: false,
          claimed: false,
        };
        progress.achievements.push(achievementProgress);
      }

      // Já completou
      if (achievementProgress.completed) continue;

      const oldProgress = achievementProgress.progress;
      const newProgress = Math.min(currentValue, achievement.requirement.target);

      // Atualizar progresso
      if (newProgress > oldProgress) {
        achievementProgress.progress = newProgress;

        // Verificar se completou
        if (newProgress >= achievement.requirement.target) {
          achievementProgress.completed = true;
          achievementProgress.completedAt = new Date();
          progress.totalPoints += achievement.points;
          progress.completedCount += 1;

          result.newlyCompleted.push({
            achievement,
            progress: newProgress,
          });

          logger.info(`Achievement unlocked for ${discordId}: ${achievement.name}`);
        } else {
          result.updated.push({
            achievement,
            oldProgress,
            newProgress,
          });
        }
      }
    }

    await progress.save();
    return result;
  }

  // Obter valor de uma stat
  private getStatValue(progress: IAchievementProgress, statType: string): number {
    // Stats normais
    if (statType in progress.stats) {
      return progress.stats[statType as keyof IAchievementProgress['stats']] || 0;
    }

    // Stats especiais (verificadas de outra forma)
    return 0;
  }

  // Verificar conquistas especiais
  async checkSpecialAchievements(discordId: string): Promise<AchievementCheckResult> {
    const progress = await this.getOrCreateProgress(discordId);
    const result: AchievementCheckResult = {
      newlyCompleted: [],
      updated: [],
    };

    const now = new Date();
    const hour = now.getHours();

    // Verificar conquistas de horário
    if (hour >= 5 && hour < 6) {
      await this.unlockSpecialAchievement(discordId, 'early_bird', result);
    }

    if (hour >= 3 && hour < 4) {
      await this.unlockSpecialAchievement(discordId, 'night_owl', result);
    }

    return result;
  }

  // Desbloquear conquista especial
  private async unlockSpecialAchievement(
    discordId: string,
    achievementId: string,
    result: AchievementCheckResult
  ): Promise<void> {
    const progress = await this.getOrCreateProgress(discordId);
    const achievement = getAchievementById(achievementId);

    if (!achievement) return;

    let achievementProgress = progress.achievements.find(
      a => a.achievementId === achievementId
    );

    if (!achievementProgress) {
      achievementProgress = {
        achievementId,
        progress: 0,
        completed: false,
        claimed: false,
      };
      progress.achievements.push(achievementProgress);
    }

    if (!achievementProgress.completed) {
      achievementProgress.progress = achievement.requirement.target;
      achievementProgress.completed = true;
      achievementProgress.completedAt = new Date();
      progress.totalPoints += achievement.points;
      progress.completedCount += 1;

      result.newlyCompleted.push({
        achievement,
        progress: achievement.requirement.target,
      });

      await progress.save();
      logger.info(`Special achievement unlocked for ${discordId}: ${achievement.name}`);
    }
  }

  // Reivindicar recompensa de conquista
  async claimReward(discordId: string, achievementId: string): Promise<AchievementClaimResult> {
    const progress = await this.getOrCreateProgress(discordId);
    const achievementProgress = progress.achievements.find(
      a => a.achievementId === achievementId
    );

    if (!achievementProgress) {
      return { success: false, message: 'Conquista não encontrada.' };
    }

    if (!achievementProgress.completed) {
      return { success: false, message: 'Conquista ainda não foi completada.' };
    }

    if (achievementProgress.claimed) {
      return { success: false, message: 'Recompensa já foi reivindicada.' };
    }

    const achievement = getAchievementById(achievementId);
    if (!achievement) {
      return { success: false, message: 'Definição de conquista não encontrada.' };
    }

    // Dar recompensas
    const user = await User.findOne({ discordId });
    let inventory = await CharacterInventory.findOne({ discordId });

    if (!user) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    if (!inventory) {
      inventory = new CharacterInventory({ discordId, consumables: [], materials: [] });
    }

    const givenRewards: Array<{ type: string; quantity: number; itemId?: string }> = [];

    for (const reward of achievement.rewards) {
      switch (reward.type) {
        case 'coins':
          user.coins += reward.quantity;
          givenRewards.push({ type: 'coins', quantity: reward.quantity });
          break;
        case 'xp':
          user.xp += reward.quantity;
          givenRewards.push({ type: 'xp', quantity: reward.quantity });
          break;
        case 'material':
          if (reward.itemId) {
            const existing = inventory.materials.find(m => m.itemId === reward.itemId);
            if (existing) {
              existing.quantity += reward.quantity;
            } else {
              inventory.materials.push({
                itemId: reward.itemId,
                quantity: reward.quantity,
                acquiredAt: new Date(),
              });
            }
            givenRewards.push({ type: 'material', quantity: reward.quantity, itemId: reward.itemId });
          }
          break;
        case 'title':
          // Títulos são tratados pelo sistema de títulos
          givenRewards.push({ type: 'title', quantity: 1, itemId: reward.itemId });
          break;
      }
    }

    achievementProgress.claimed = true;
    achievementProgress.claimedAt = new Date();

    await user.save();
    await inventory.save();
    await progress.save();

    logger.info(`Achievement reward claimed for ${discordId}: ${achievement.name}`);

    return {
      success: true,
      message: `Recompensas de **${achievement.name}** reivindicadas!`,
      rewards: givenRewards,
    };
  }

  // Reivindicar todas as recompensas pendentes
  async claimAllRewards(discordId: string): Promise<{
    success: boolean;
    claimedCount: number;
    rewards: Array<{ type: string; quantity: number }>;
  }> {
    const progress = await this.getOrCreateProgress(discordId);
    const user = await User.findOne({ discordId });
    let inventory = await CharacterInventory.findOne({ discordId });

    if (!user) {
      return { success: false, claimedCount: 0, rewards: [] };
    }

    if (!inventory) {
      inventory = new CharacterInventory({ discordId, consumables: [], materials: [] });
    }

    const unclaimed = progress.achievements.filter(a => a.completed && !a.claimed);
    const rewardsSummary: Map<string, number> = new Map();
    let claimedCount = 0;

    for (const achievementProgress of unclaimed) {
      const achievement = getAchievementById(achievementProgress.achievementId);
      if (!achievement) continue;

      for (const reward of achievement.rewards) {
        switch (reward.type) {
          case 'coins':
            user.coins += reward.quantity;
            rewardsSummary.set('coins', (rewardsSummary.get('coins') || 0) + reward.quantity);
            break;
          case 'xp':
            user.xp += reward.quantity;
            rewardsSummary.set('xp', (rewardsSummary.get('xp') || 0) + reward.quantity);
            break;
          case 'material':
            if (reward.itemId) {
              const existing = inventory.materials.find(m => m.itemId === reward.itemId);
              if (existing) {
                existing.quantity += reward.quantity;
              } else {
                inventory.materials.push({
                  itemId: reward.itemId,
                  quantity: reward.quantity,
                  acquiredAt: new Date(),
                });
              }
              rewardsSummary.set(`material:${reward.itemId}`, (rewardsSummary.get(`material:${reward.itemId}`) || 0) + reward.quantity);
            }
            break;
        }
      }

      achievementProgress.claimed = true;
      achievementProgress.claimedAt = new Date();
      claimedCount++;
    }

    await user.save();
    await inventory.save();
    await progress.save();

    const rewards = Array.from(rewardsSummary.entries()).map(([type, quantity]) => ({
      type,
      quantity,
    }));

    return { success: true, claimedCount, rewards };
  }

  // Obter perfil de conquistas do jogador
  async getPlayerProfile(discordId: string): Promise<PlayerAchievementProfile> {
    const progress = await this.getOrCreateProgress(discordId);
    const totalAchievements = ACHIEVEMENTS.length;

    // Conquistas recentes
    const recentAchievements = progress.achievements
      .filter(a => a.completed && a.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 5)
      .map(a => ({
        achievement: getAchievementById(a.achievementId)!,
        completedAt: a.completedAt!,
      }))
      .filter(a => a.achievement);

    // Recompensas não reivindicadas
    const unclaimedRewards = progress.achievements.filter(
      a => a.completed && !a.claimed
    ).length;

    return {
      totalPoints: progress.totalPoints,
      completedCount: progress.completedCount,
      totalAchievements,
      completionPercentage: Math.floor((progress.completedCount / totalAchievements) * 100),
      recentAchievements,
      unclaimedRewards,
      stats: progress.stats,
    };
  }

  // Obter lista de conquistas com progresso
  async getAchievementsWithProgress(
    discordId: string,
    category?: string
  ): Promise<Array<{
    achievement: AchievementData;
    progress: number;
    completed: boolean;
    claimed: boolean;
    completedAt?: Date;
  }>> {
    const progressData = await this.getOrCreateProgress(discordId);
    let achievements = category
      ? getAchievementsByCategory(category as any)
      : getAllAchievements();

    return achievements.map(achievement => {
      const playerProgress = progressData.achievements.find(
        a => a.achievementId === achievement.achievementId
      );

      // Para conquistas secretas não completadas, esconder detalhes
      const isSecretAndIncomplete = achievement.secret && !playerProgress?.completed;

      return {
        achievement: isSecretAndIncomplete
          ? { ...achievement, description: '???', requirement: { ...achievement.requirement, description: '???' } }
          : achievement,
        progress: playerProgress?.progress || 0,
        completed: playerProgress?.completed || false,
        claimed: playerProgress?.claimed || false,
        completedAt: playerProgress?.completedAt,
      };
    });
  }

  // Obter ranking de conquistas
  async getLeaderboard(limit: number = 10): Promise<Array<{
    position: number;
    discordId: string;
    totalPoints: number;
    completedCount: number;
  }>> {
    const leaderboard = await AchievementProgress.find()
      .sort({ totalPoints: -1 })
      .limit(limit);

    return leaderboard.map((p, index) => ({
      position: index + 1,
      discordId: p.discordId,
      totalPoints: p.totalPoints,
      completedCount: p.completedCount,
    }));
  }

  // Sincronizar stats com dados existentes
  async syncStats(discordId: string): Promise<void> {
    const progress = await this.getOrCreateProgress(discordId);
    const character = await Character.findOne({ discordId });

    if (character) {
      progress.stats.maxLevel = Math.max(progress.stats.maxLevel, character.level);
    }

    await progress.save();
    await this.checkAllAchievements(discordId);
  }

  // Verificar todas as conquistas
  async checkAllAchievements(discordId: string): Promise<AchievementCheckResult> {
    const result: AchievementCheckResult = {
      newlyCompleted: [],
      updated: [],
    };

    const statsToCheck = [
      'monstersKilled', 'bossesKilled', 'dungeonsCompleted', 'pvpWins',
      'itemsCrafted', 'enchantmentsApplied', 'coinsEarned', 'eventsParticipated',
      'guildContribution', 'loginStreak', 'maxLevel',
    ];

    for (const stat of statsToCheck) {
      const checkResult = await this.checkAchievements(discordId, stat);
      result.newlyCompleted.push(...checkResult.newlyCompleted);
      result.updated.push(...checkResult.updated);
    }

    // Verificar conquistas especiais
    const specialResult = await this.checkSpecialAchievements(discordId);
    result.newlyCompleted.push(...specialResult.newlyCompleted);

    return result;
  }
}

export const achievementService = new AchievementService();
export default achievementService;
