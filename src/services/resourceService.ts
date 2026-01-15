import { resourceRepository } from '../database/repositories/resourceRepository';
import { economyRepository } from '../database/repositories/economyRepository';
import { ResourceDocument, ResourceRarity } from '../database/models/Resource';
import { UserResourceDocument } from '../database/models/UserResource';
import { logger } from '../utils/logger';

const DEFAULT_RESOURCES = [
  {
    id: 'wood',
    name: 'Madeira',
    emoji: '🪵',
    description: 'Madeira comum usada em construcoes basicas.',
    rarity: 'common' as ResourceRarity,
    baseValue: 2,
  },
  {
    id: 'stone',
    name: 'Pedra',
    emoji: '🪨',
    description: 'Pedra resistente para construcoes.',
    rarity: 'common' as ResourceRarity,
    baseValue: 3,
  },
  {
    id: 'iron',
    name: 'Ferro',
    emoji: '🔩',
    description: 'Minerio de ferro para ferramentas.',
    rarity: 'uncommon' as ResourceRarity,
    baseValue: 8,
  },
  {
    id: 'gold',
    name: 'Ouro',
    emoji: '🥇',
    description: 'Metal precioso muito valioso.',
    rarity: 'rare' as ResourceRarity,
    baseValue: 25,
  },
  {
    id: 'diamond',
    name: 'Diamante',
    emoji: '💎',
    description: 'Gema rara e extremamente valiosa.',
    rarity: 'epic' as ResourceRarity,
    baseValue: 100,
  },
  {
    id: 'essence',
    name: 'Essencia Magica',
    emoji: '✨',
    description: 'Essencia magica para crafting especial.',
    rarity: 'rare' as ResourceRarity,
    baseValue: 50,
  },
  {
    id: 'fish_common',
    name: 'Peixe Comum',
    emoji: '🐟',
    description: 'Um peixe comum.',
    rarity: 'common' as ResourceRarity,
    baseValue: 5,
  },
  {
    id: 'fish_rare',
    name: 'Peixe Raro',
    emoji: '🐠',
    description: 'Um peixe colorido e raro.',
    rarity: 'uncommon' as ResourceRarity,
    baseValue: 20,
  },
  {
    id: 'fish_golden',
    name: 'Peixe Dourado',
    emoji: '🐡',
    description: 'Um peixe dourado muito valioso!',
    rarity: 'rare' as ResourceRarity,
    baseValue: 75,
  },
  {
    id: 'fish_legendary',
    name: 'Peixe Lendario',
    emoji: '🦈',
    description: 'Uma criatura lendaria dos mares.',
    rarity: 'legendary' as ResourceRarity,
    baseValue: 500,
  },
  {
    id: 'bait',
    name: 'Isca',
    emoji: '🪱',
    description: 'Isca para pesca.',
    rarity: 'common' as ResourceRarity,
    baseValue: 1,
  },
];

export interface SellResult {
  success: boolean;
  message: string;
  coinsEarned?: number;
  newBalance?: number;
}

class ResourceService {
  async initialize(): Promise<void> {
    for (const resData of DEFAULT_RESOURCES) {
      const existing = await resourceRepository.getResourceById(resData.id);
      if (!existing) {
        await resourceRepository.createResource(resData);
        logger.info(`Created resource: ${resData.name}`);
      }
    }
    logger.info('Resource system initialized');
  }

  async getAllResources(): Promise<ResourceDocument[]> {
    return resourceRepository.getAllResources();
  }

  async getResource(resourceId: string): Promise<ResourceDocument | null> {
    return resourceRepository.getResourceById(resourceId);
  }

  async getUserResources(discordId: string): Promise<UserResourceDocument[]> {
    return resourceRepository.getUserResources(discordId);
  }

  async getUserResourceAmount(discordId: string, resourceId: string): Promise<number> {
    const resource = await resourceRepository.getUserResource(discordId, resourceId);
    return resource?.amount || 0;
  }

  async addResources(
    discordId: string,
    resources: { resourceId: string; amount: number }[]
  ): Promise<void> {
    for (const res of resources) {
      await resourceRepository.addResource(discordId, res.resourceId, res.amount);
    }
  }

  async removeResources(
    discordId: string,
    resources: { resourceId: string; amount: number }[]
  ): Promise<boolean> {
    // Check if user has all resources first
    for (const res of resources) {
      const hasEnough = await resourceRepository.hasResource(discordId, res.resourceId, res.amount);
      if (!hasEnough) {
        return false;
      }
    }

    // Remove all resources
    for (const res of resources) {
      await resourceRepository.removeResource(discordId, res.resourceId, res.amount);
    }

    return true;
  }

  async sellResource(discordId: string, resourceId: string, amount: number): Promise<SellResult> {
    if (amount <= 0) {
      return { success: false, message: 'Quantidade invalida.' };
    }

    const resource = await resourceRepository.getResourceById(resourceId);
    if (!resource) {
      return { success: false, message: 'Recurso nao encontrado.' };
    }

    if (!resource.tradeable) {
      return { success: false, message: 'Este recurso nao pode ser vendido.' };
    }

    const userAmount = await this.getUserResourceAmount(discordId, resourceId);
    if (userAmount < amount) {
      return {
        success: false,
        message: `Voce nao tem ${amount}x ${resource.name}. (Tem: ${userAmount})`,
      };
    }

    const coinsEarned = amount * resource.baseValue;

    await resourceRepository.removeResource(discordId, resourceId, amount);
    const result = await economyRepository.addCoins(
      discordId,
      coinsEarned,
      'earn',
      `Venda: ${amount}x ${resource.name}`
    );

    logger.info(`User ${discordId} sold ${amount}x ${resourceId} for ${coinsEarned} coins`);

    return {
      success: true,
      message: `Vendido ${amount}x ${resource.emoji} ${resource.name} por ${coinsEarned} coins!`,
      coinsEarned,
      newBalance: result.newBalance,
    };
  }

  async sellAllResources(discordId: string): Promise<SellResult> {
    const userResources = await resourceRepository.getUserResources(discordId);

    if (userResources.length === 0) {
      return { success: false, message: 'Voce nao tem recursos para vender.' };
    }

    let totalCoins = 0;
    const soldItems: string[] = [];

    for (const ur of userResources) {
      const resource = await resourceRepository.getResourceById(ur.resourceId);
      if (!resource || !resource.tradeable) continue;

      const coins = ur.amount * resource.baseValue;
      totalCoins += coins;
      soldItems.push(`${ur.amount}x ${resource.emoji} ${resource.name}`);

      await resourceRepository.removeResource(discordId, ur.resourceId, ur.amount);
    }

    if (totalCoins === 0) {
      return { success: false, message: 'Nenhum recurso vendavel encontrado.' };
    }

    const result = await economyRepository.addCoins(
      discordId,
      totalCoins,
      'earn',
      'Venda de todos os recursos'
    );

    return {
      success: true,
      message: `Vendido:\n${soldItems.join('\n')}\n\n**Total: ${totalCoins} coins**`,
      coinsEarned: totalCoins,
      newBalance: result.newBalance,
    };
  }

  async getResourceValue(discordId: string): Promise<number> {
    return resourceRepository.getTotalResourceValue(discordId);
  }
}

export const resourceService = new ResourceService();
export default resourceService;
