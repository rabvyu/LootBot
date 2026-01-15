import { expeditionRepository } from '../database/repositories/expeditionRepository';
import { economyRepository } from '../database/repositories/economyRepository';
import { userRepository } from '../database/repositories/userRepository';
import { ExpeditionDocument, ExpeditionDifficulty } from '../database/models/Expedition';
import { UserExpeditionDocument } from '../database/models/UserExpedition';
import { logger } from '../utils/logger';

const DIFFICULTY_NAMES: Record<ExpeditionDifficulty, string> = {
  easy: 'Facil',
  medium: 'Medio',
  hard: 'Dificil',
  extreme: 'Extremo',
};

// Default expeditions
const DEFAULT_EXPEDITIONS = [
  {
    id: 'forest',
    name: 'Floresta Tranquila',
    emoji: '🌲',
    description: 'Uma expedicao segura pela floresta local.',
    difficulty: 'easy' as ExpeditionDifficulty,
    durationHours: 1,
    successRate: 95,
    levelRequired: 1,
    rewards: {
      minCoins: 50,
      maxCoins: 150,
      minXp: 20,
      maxXp: 50,
      resourceDrops: [
        { resourceId: 'wood', chance: 80, minAmount: 1, maxAmount: 5 },
        { resourceId: 'stone', chance: 30, minAmount: 1, maxAmount: 2 },
      ],
    },
  },
  {
    id: 'cave',
    name: 'Caverna Sombria',
    emoji: '🕳️',
    description: 'Uma caverna com minerios valiosos.',
    difficulty: 'easy' as ExpeditionDifficulty,
    durationHours: 2,
    successRate: 90,
    levelRequired: 3,
    rewards: {
      minCoins: 100,
      maxCoins: 300,
      minXp: 40,
      maxXp: 100,
      resourceDrops: [
        { resourceId: 'stone', chance: 70, minAmount: 2, maxAmount: 6 },
        { resourceId: 'iron', chance: 40, minAmount: 1, maxAmount: 3 },
      ],
    },
  },
  {
    id: 'ruins',
    name: 'Ruinas Antigas',
    emoji: '🏛️',
    description: 'Ruinas misteriosas com tesouros escondidos.',
    difficulty: 'medium' as ExpeditionDifficulty,
    durationHours: 4,
    successRate: 80,
    levelRequired: 5,
    rewards: {
      minCoins: 250,
      maxCoins: 600,
      minXp: 100,
      maxXp: 250,
      resourceDrops: [
        { resourceId: 'gold', chance: 50, minAmount: 1, maxAmount: 3 },
        { resourceId: 'essence', chance: 20, minAmount: 1, maxAmount: 2 },
      ],
    },
  },
  {
    id: 'swamp',
    name: 'Pantano Sombrio',
    emoji: '🐊',
    description: 'Um pantano perigoso cheio de criaturas.',
    difficulty: 'medium' as ExpeditionDifficulty,
    durationHours: 6,
    successRate: 75,
    levelRequired: 8,
    rewards: {
      minCoins: 400,
      maxCoins: 900,
      minXp: 150,
      maxXp: 350,
      resourceDrops: [
        { resourceId: 'essence', chance: 40, minAmount: 1, maxAmount: 3 },
        { resourceId: 'diamond', chance: 10, minAmount: 1, maxAmount: 1 },
      ],
    },
  },
  {
    id: 'volcano',
    name: 'Vulcao Ardente',
    emoji: '🌋',
    description: 'Um vulcao ativo com minerios raros.',
    difficulty: 'hard' as ExpeditionDifficulty,
    durationHours: 8,
    successRate: 65,
    levelRequired: 12,
    rewards: {
      minCoins: 600,
      maxCoins: 1500,
      minXp: 250,
      maxXp: 500,
      resourceDrops: [
        { resourceId: 'diamond', chance: 30, minAmount: 1, maxAmount: 2 },
        { resourceId: 'essence', chance: 50, minAmount: 2, maxAmount: 5 },
      ],
      badgeChance: 5,
      badgeId: 'volcano_survivor',
    },
  },
  {
    id: 'dungeon',
    name: 'Masmorra Profunda',
    emoji: '⚔️',
    description: 'Uma masmorra cheia de monstros e tesouros.',
    difficulty: 'hard' as ExpeditionDifficulty,
    durationHours: 12,
    successRate: 55,
    levelRequired: 15,
    rewards: {
      minCoins: 1000,
      maxCoins: 2500,
      minXp: 400,
      maxXp: 800,
      resourceDrops: [
        { resourceId: 'gold', chance: 60, minAmount: 3, maxAmount: 8 },
        { resourceId: 'diamond', chance: 40, minAmount: 1, maxAmount: 3 },
        { resourceId: 'essence', chance: 60, minAmount: 2, maxAmount: 6 },
      ],
      badgeChance: 8,
      badgeId: 'dungeon_master',
    },
  },
  {
    id: 'abyss',
    name: 'Abismo Eterno',
    emoji: '🌑',
    description: 'O lugar mais perigoso e recompensador.',
    difficulty: 'extreme' as ExpeditionDifficulty,
    durationHours: 24,
    successRate: 40,
    levelRequired: 25,
    rewards: {
      minCoins: 2500,
      maxCoins: 6000,
      minXp: 800,
      maxXp: 1500,
      resourceDrops: [
        { resourceId: 'diamond', chance: 70, minAmount: 3, maxAmount: 8 },
        { resourceId: 'essence', chance: 80, minAmount: 5, maxAmount: 15 },
      ],
      badgeChance: 15,
      badgeId: 'abyss_walker',
    },
  },
];

export interface StartExpeditionResult {
  success: boolean;
  message: string;
  expedition?: UserExpeditionDocument;
  endsAt?: Date;
}

export interface ClaimExpeditionResult {
  success: boolean;
  message: string;
  wasSuccessful?: boolean;
  coins?: number;
  xp?: number;
  resources?: { resourceId: string; amount: number }[];
  badge?: string;
}

class ExpeditionService {
  async initialize(): Promise<void> {
    for (const expData of DEFAULT_EXPEDITIONS) {
      const existing = await expeditionRepository.getExpeditionById(expData.id);
      if (!existing) {
        await expeditionRepository.createExpedition(expData);
        logger.info(`Created expedition: ${expData.name}`);
      }
    }
    logger.info('Expedition system initialized');
  }

  async getAvailableExpeditions(): Promise<ExpeditionDocument[]> {
    return expeditionRepository.getAllExpeditions();
  }

  async getExpeditionById(id: string): Promise<ExpeditionDocument | null> {
    return expeditionRepository.getExpeditionById(id);
  }

  async getActiveExpedition(discordId: string): Promise<UserExpeditionDocument | null> {
    return expeditionRepository.getActiveExpedition(discordId);
  }

  async startExpedition(discordId: string, expeditionId: string): Promise<StartExpeditionResult> {
    // Check if already on expedition
    const active = await expeditionRepository.getActiveExpedition(discordId);
    if (active) {
      return {
        success: false,
        message: 'Voce ja esta em uma expedicao! Aguarde ela terminar.',
      };
    }

    // Check for unclaimed expeditions
    const unclaimed = await expeditionRepository.getCompletedExpeditions(discordId);
    const pendingClaim = unclaimed.find(e => e.status === 'completed' || e.status === 'failed');
    if (pendingClaim) {
      return {
        success: false,
        message: 'Voce tem uma expedicao pendente! Use `/expedicao resgatar` primeiro.',
      };
    }

    // Get expedition definition
    const expedition = await expeditionRepository.getExpeditionById(expeditionId);
    if (!expedition) {
      return { success: false, message: 'Expedicao nao encontrada.' };
    }

    // Check user level
    const user = await userRepository.findByDiscordId(discordId);
    if (!user || user.level < expedition.levelRequired) {
      return {
        success: false,
        message: `Voce precisa ser nivel ${expedition.levelRequired} para esta expedicao.`,
      };
    }

    // Start expedition
    const userExp = await expeditionRepository.startExpedition(
      discordId,
      expeditionId,
      expedition.durationHours
    );

    logger.info(`User ${discordId} started expedition ${expeditionId}`);

    return {
      success: true,
      message: `Voce partiu para **${expedition.name}** ${expedition.emoji}!`,
      expedition: userExp,
      endsAt: userExp.endsAt,
    };
  }

  async checkExpedition(discordId: string): Promise<{
    active: boolean;
    completed: boolean;
    expedition?: ExpeditionDocument;
    userExpedition?: UserExpeditionDocument;
    timeRemaining?: number;
  }> {
    const active = await expeditionRepository.getActiveExpedition(discordId);

    if (!active) {
      return { active: false, completed: false };
    }

    const expedition = await expeditionRepository.getExpeditionById(active.expeditionId);
    const now = new Date();

    if (now >= active.endsAt) {
      // Expedition completed, process results
      await this.processExpeditionCompletion(active, expedition!);
      const updated = await expeditionRepository.getCompletedExpeditions(discordId);
      return {
        active: false,
        completed: true,
        expedition: expedition || undefined,
        userExpedition: updated[0],
      };
    }

    const timeRemaining = active.endsAt.getTime() - now.getTime();
    return {
      active: true,
      completed: false,
      expedition: expedition || undefined,
      userExpedition: active,
      timeRemaining,
    };
  }

  private async processExpeditionCompletion(
    userExp: UserExpeditionDocument,
    expedition: ExpeditionDocument
  ): Promise<void> {
    // Determine success
    const roll = Math.random() * 100;
    const success = roll <= expedition.successRate;

    let rewards: {
      coins: number;
      xp: number;
      resources?: { resourceId: string; amount: number }[];
      badgeAwarded?: string;
    } | undefined;

    if (success) {
      // Calculate rewards
      const coins = this.randomBetween(expedition.rewards.minCoins, expedition.rewards.maxCoins);
      const xp = this.randomBetween(expedition.rewards.minXp, expedition.rewards.maxXp);
      const resources: { resourceId: string; amount: number }[] = [];

      // Process resource drops
      if (expedition.rewards.resourceDrops) {
        for (const drop of expedition.rewards.resourceDrops) {
          if (Math.random() * 100 <= drop.chance) {
            const amount = this.randomBetween(drop.minAmount, drop.maxAmount);
            resources.push({ resourceId: drop.resourceId, amount });
          }
        }
      }

      // Check for badge drop
      let badgeAwarded: string | undefined;
      if (expedition.rewards.badgeChance && expedition.rewards.badgeId) {
        if (Math.random() * 100 <= expedition.rewards.badgeChance) {
          badgeAwarded = expedition.rewards.badgeId;
        }
      }

      rewards = {
        coins,
        xp,
        resources: resources.length > 0 ? resources : undefined,
        badgeAwarded,
      };
    }

    await expeditionRepository.completeExpedition(userExp.discordId, success, rewards);
  }

  async claimExpeditionRewards(discordId: string): Promise<ClaimExpeditionResult> {
    const completed = await expeditionRepository.getCompletedExpeditions(discordId);
    const toClaim = completed.find(e => e.status === 'completed' || e.status === 'failed');

    if (!toClaim) {
      return {
        success: false,
        message: 'Voce nao tem recompensas para resgatar.',
      };
    }

    const expedition = await expeditionRepository.getExpeditionById(toClaim.expeditionId);

    if (toClaim.success && toClaim.rewards) {
      // Award coins
      if (toClaim.rewards.coins > 0) {
        await economyRepository.addCoins(
          discordId,
          toClaim.rewards.coins,
          'earn',
          `Expedicao: ${expedition?.name || toClaim.expeditionId}`
        );
      }

      // Award XP
      if (toClaim.rewards.xp > 0) {
        await userRepository.addXP(discordId, toClaim.rewards.xp, 'bonus');
      }

      // Award badge if any
      if (toClaim.rewards.badgeAwarded) {
        await userRepository.addBadge(discordId, toClaim.rewards.badgeAwarded);
      }
    }

    await expeditionRepository.claimExpedition(discordId);

    logger.info(`User ${discordId} claimed expedition rewards: success=${toClaim.success}`);

    if (toClaim.success) {
      return {
        success: true,
        message: `Expedicao **${expedition?.name}** concluida com sucesso!`,
        wasSuccessful: true,
        coins: toClaim.rewards?.coins || 0,
        xp: toClaim.rewards?.xp || 0,
        resources: toClaim.rewards?.resources,
        badge: toClaim.rewards?.badgeAwarded,
      };
    } else {
      return {
        success: true,
        message: `Expedicao **${expedition?.name}** falhou! Voce nao conseguiu os tesouros.`,
        wasSuccessful: false,
      };
    }
  }

  async getExpeditionStats(discordId: string): Promise<{
    completed: number;
    totalCoins: number;
    totalXp: number;
  }> {
    const completed = await expeditionRepository.countCompletedExpeditions(discordId);
    const totals = await expeditionRepository.getTotalExpeditionRewards(discordId);

    return {
      completed,
      totalCoins: totals.coins,
      totalXp: totals.xp,
    };
  }

  getDifficultyName(difficulty: ExpeditionDifficulty): string {
    return DIFFICULTY_NAMES[difficulty];
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

export const expeditionService = new ExpeditionService();
export default expeditionService;
