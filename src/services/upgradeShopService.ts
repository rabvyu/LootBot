// Serviço da Loja de Melhoria
import { Character, User } from '../database/models';
import {
  UpgradeShopItem,
  getUpgradeItemById,
  getUpgradeItemsByCategory,
  canPurchaseUpgradeItem,
  allUpgradeItems,
} from '../data/shops/upgradeShop';
import { skillTreeService } from './skillTreeService';
import { classEvolutionService } from './classEvolutionService';
import { logger } from '../utils/logger';

export interface PurchaseResult {
  success: boolean;
  message: string;
  item?: UpgradeShopItem;
  coinsSpent?: number;
  newBalance?: number;
}

export interface ShopView {
  categories: {
    name: string;
    emoji: string;
    items: Array<{
      item: UpgradeShopItem;
      canPurchase: boolean;
      reason?: string;
      purchaseCount: number;
    }>;
  }[];
  userCoins: number;
}

class UpgradeShopService {
  // Obter visão da loja
  async getShopView(discordId: string): Promise<ShopView | null> {
    const user = await User.findOne({ discordId });
    const character = await Character.findOne({ discordId });

    if (!user || !character) return null;

    const userCoins = user.coins;
    const purchaseCounts = this.getPurchaseCounts(character);

    const categoryInfo: Record<string, { name: string; emoji: string }> = {
      reset: { name: 'Resets', emoji: '🔄' },
      permanent: { name: 'Melhorias Permanentes', emoji: '⬆️' },
      temporary: { name: 'Bônus Temporários', emoji: '⏱️' },
    };

    const categories = Object.entries(categoryInfo).map(([category, info]) => {
      const items = getUpgradeItemsByCategory(category as any);

      return {
        name: info.name,
        emoji: info.emoji,
        items: items.map(item => {
          const purchaseCount = purchaseCounts[item.id] || 0;
          const result = canPurchaseUpgradeItem(item, userCoins, character.level, purchaseCount);

          return {
            item,
            canPurchase: result.canPurchase,
            reason: result.reason,
            purchaseCount,
          };
        }),
      };
    });

    return {
      categories,
      userCoins,
    };
  }

  // Comprar item
  async purchaseItem(discordId: string, itemId: string): Promise<PurchaseResult> {
    const user = await User.findOne({ discordId });
    const character = await Character.findOne({ discordId });

    if (!user || !character) {
      return { success: false, message: 'Usuário ou personagem não encontrado.' };
    }

    const item = getUpgradeItemById(itemId);
    if (!item) {
      return { success: false, message: 'Item não encontrado na loja.' };
    }

    const purchaseCounts = this.getPurchaseCounts(character);
    const purchaseCount = purchaseCounts[itemId] || 0;

    const canPurchase = canPurchaseUpgradeItem(item, user.coins, character.level, purchaseCount);
    if (!canPurchase.canPurchase) {
      return { success: false, message: canPurchase.reason || 'Não pode comprar este item.' };
    }

    // Processar compra
    user.coins -= item.price;
    await user.save();

    // Registrar compra
    this.recordPurchase(character, itemId);

    // Aplicar efeito
    const effectResult = await this.applyItemEffect(discordId, item, character);

    await character.save();

    logger.info(`User ${discordId} purchased ${itemId} for ${item.price} coins`);

    return {
      success: true,
      message: `${item.emoji} **${item.name}** comprado!\n\n${effectResult}`,
      item,
      coinsSpent: item.price,
      newBalance: user.coins,
    };
  }

  // Obter contagem de compras por item
  private getPurchaseCounts(character: any): Record<string, number> {
    const counts: Record<string, number> = {};
    const purchases = character.shopPurchases || [];

    for (const purchase of purchases) {
      counts[purchase.itemId] = purchase.count;
    }

    return counts;
  }

  // Registrar compra
  private recordPurchase(character: any, itemId: string): void {
    if (!character.shopPurchases) {
      character.shopPurchases = [];
    }

    const existing = character.shopPurchases.find((p: any) => p.itemId === itemId);
    if (existing) {
      existing.count += 1;
      existing.lastPurchased = new Date();
    } else {
      character.shopPurchases.push({
        itemId,
        count: 1,
        lastPurchased: new Date(),
      });
    }
  }

  // Aplicar efeito do item
  private async applyItemEffect(
    discordId: string,
    item: UpgradeShopItem,
    character: any
  ): Promise<string> {
    const effect = item.effect;

    switch (effect.type) {
      case 'reset_skills': {
        const result = await skillTreeService.resetSkills(discordId, true);
        return result.message;
      }

      case 'reset_attributes': {
        // Resetar atributos
        const pointsRefunded = character.attributePointsSpent || 0;
        character.attributes = { str: 0, int: 0, vit: 0, agi: 0, luk: 0 };
        character.attributePointsSpent = 0;
        return `Atributos resetados! ${pointsRefunded} pontos devolvidos.`;
      }

      case 'reset_all': {
        // Resetar skills
        await skillTreeService.resetSkills(discordId, true);
        // Resetar atributos
        const pointsRefunded = character.attributePointsSpent || 0;
        character.attributes = { str: 0, int: 0, vit: 0, agi: 0, luk: 0 };
        character.attributePointsSpent = 0;
        return `Skills e Atributos resetados! Todos os pontos foram devolvidos.`;
      }

      case 'reset_class': {
        const result = await classEvolutionService.resetClass(discordId, true);
        return result.message;
      }

      case 'bonus_skill_points': {
        character.bonusSkillPoints = (character.bonusSkillPoints || 0) + effect.value;
        return `+${effect.value} pontos de skill permanentes adicionados!`;
      }

      case 'bonus_attribute_points': {
        character.bonusAttributePoints = (character.bonusAttributePoints || 0) + effect.value;
        return `+${effect.value} pontos de atributo permanentes adicionados!`;
      }

      case 'early_evolution': {
        character.earlyEvolutionLevels = (character.earlyEvolutionLevels || 0) + effect.value;
        return `Agora você pode evoluir ${effect.value} níveis antes!`;
      }

      case 'wildcard_chance': {
        character.wildcardChanceBonus = (character.wildcardChanceBonus || 0) + effect.value;
        return `+${effect.value}% de chance de classe wildcard!`;
      }

      case 'xp_boost':
      case 'damage_boost':
      case 'defense_boost':
      case 'all_stats_boost': {
        // Adicionar buff temporário
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + (effect.duration || 24));

        if (!character.activeBuffs) {
          character.activeBuffs = [];
        }

        character.activeBuffs.push({
          type: effect.type,
          value: effect.value,
          expiresAt,
        });

        return `Buff ativo por ${effect.duration}h: +${effect.value}% ${this.getBuffName(effect.type)}`;
      }

      default:
        return 'Efeito aplicado!';
    }
  }

  // Obter nome amigável do buff
  private getBuffName(type: string): string {
    const names: Record<string, string> = {
      xp_boost: 'XP',
      damage_boost: 'Dano',
      defense_boost: 'Defesa',
      all_stats_boost: 'Todos Stats',
    };
    return names[type] || type;
  }

  // Verificar e remover buffs expirados
  async cleanExpiredBuffs(discordId: string): Promise<void> {
    const character = await Character.findOne({ discordId });
    if (!character || !character.activeBuffs) return;

    const now = new Date();
    character.activeBuffs = character.activeBuffs.filter(buff => buff.expiresAt > now);
    await character.save();
  }

  // Obter buffs ativos
  async getActiveBuffs(discordId: string): Promise<Array<{ type: string; value: number; expiresAt: Date }>> {
    await this.cleanExpiredBuffs(discordId);

    const character = await Character.findOne({ discordId });
    if (!character) return [];

    return character.activeBuffs || [];
  }
}

export const upgradeShopService = new UpgradeShopService();
export default upgradeShopService;
