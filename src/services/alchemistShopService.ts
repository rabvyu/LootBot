// Serviço da Loja do Alquimista
import { User, Character, AlchemistStock, CharacterInventory } from '../database/models';
import { AlchemistStockDocument, StockItem } from '../database/models/AlchemistStock';
import {
  AlchemistItem,
  getAlchemistItemById,
  generateAlchemistStock,
  canPurchaseAlchemistItem,
  commonItems,
  ALCHEMIST_REFRESH_HOURS,
} from '../data/shops/alchemistShop';
import { logger } from '../utils/logger';

export interface AlchemistPurchaseResult {
  success: boolean;
  message: string;
  item?: AlchemistItem;
  coinsSpent?: number;
  newBalance?: number;
  addedToInventory?: boolean;
}

export interface AlchemistShopView {
  items: Array<{
    item: AlchemistItem;
    stock: number;
    canPurchase: boolean;
    reason?: string;
  }>;
  userCoins: number;
  nextRefresh: Date;
  hasRareItems: boolean;
  hasLegendaryItems: boolean;
}

class AlchemistShopService {
  // Obter ou criar estoque do alquimista
  async getOrCreateStock(guildId: string): Promise<AlchemistStockDocument | null> {
    let stock: AlchemistStockDocument | null = await AlchemistStock.findOne({ guildId });

    if (!stock) {
      // Criar novo estoque
      stock = await this.refreshStock(guildId);
    } else if (new Date() >= stock.nextRefresh) {
      // Refresh necessário
      stock = await this.refreshStock(guildId);
    }

    return stock;
  }

  // Atualizar estoque
  async refreshStock(guildId: string): Promise<AlchemistStockDocument | null> {
    const newItems = generateAlchemistStock();

    const stockItems = newItems.map(item => ({
      itemId: item.id,
      quantity: item.maxStock || 1,
    }));

    const nextRefresh = new Date();
    nextRefresh.setHours(nextRefresh.getHours() + ALCHEMIST_REFRESH_HOURS);

    const stock = await AlchemistStock.findOneAndUpdate(
      { guildId },
      {
        guildId,
        items: stockItems,
        lastRefresh: new Date(),
        nextRefresh,
      },
      { upsert: true, new: true }
    );

    logger.info(`Alchemist stock refreshed for guild ${guildId}`);

    return stock;
  }

  // Obter visão da loja
  async getShopView(discordId: string, guildId: string): Promise<AlchemistShopView | null> {
    const user = await User.findOne({ discordId });
    if (!user) return null;

    const stock = await this.getOrCreateStock(guildId);
    if (!stock) return null;

    const items: AlchemistShopView['items'] = [];
    let hasRareItems = false;
    let hasLegendaryItems = false;

    for (const stockItem of stock.items) {
      const itemData = getAlchemistItemById(stockItem.itemId);
      if (!itemData) continue;

      const canPurchase = canPurchaseAlchemistItem(
        itemData,
        user.coins,
        stockItem.quantity
      );

      items.push({
        item: itemData,
        stock: stockItem.quantity,
        canPurchase: canPurchase.canPurchase,
        reason: canPurchase.reason,
      });

      if (itemData.rarity === 'rare') hasRareItems = true;
      if (itemData.rarity === 'legendary') hasLegendaryItems = true;
    }

    // Ordenar por raridade
    const rarityOrder = { common: 0, rare: 1, legendary: 2 };
    items.sort((a, b) => rarityOrder[a.item.rarity] - rarityOrder[b.item.rarity]);

    return {
      items,
      userCoins: user.coins,
      nextRefresh: stock.nextRefresh,
      hasRareItems,
      hasLegendaryItems,
    };
  }

  // Comprar item
  async purchaseItem(
    discordId: string,
    guildId: string,
    itemId: string,
    quantity: number = 1
  ): Promise<AlchemistPurchaseResult> {
    const user = await User.findOne({ discordId });
    if (!user) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    const stock = await this.getOrCreateStock(guildId);
    if (!stock) {
      return { success: false, message: 'Erro ao acessar loja do alquimista.' };
    }

    const item = getAlchemistItemById(itemId);
    if (!item) {
      return { success: false, message: 'Item não encontrado.' };
    }

    const stockItem = stock.items.find((i: StockItem) => i.itemId === itemId);
    if (!stockItem || stockItem.quantity <= 0) {
      return { success: false, message: 'Item fora de estoque.' };
    }

    if (quantity > stockItem.quantity) {
      return { success: false, message: `Apenas ${stockItem.quantity} em estoque.` };
    }

    const totalPrice = item.price * quantity;
    if (user.coins < totalPrice) {
      return { success: false, message: `Precisa de ${totalPrice} coins (tem ${user.coins}).` };
    }

    // Processar compra
    user.coins -= totalPrice;
    stockItem.quantity -= quantity;

    await user.save();
    await stock.save();

    // Aplicar efeito ou adicionar ao inventário
    const effectResult = await this.applyOrStoreItem(discordId, item, quantity);

    logger.info(`User ${discordId} purchased ${quantity}x ${itemId} for ${totalPrice} coins`);

    return {
      success: true,
      message: `${item.emoji} **${item.name}** x${quantity} comprado!\n\n${effectResult.message}`,
      item,
      coinsSpent: totalPrice,
      newBalance: user.coins,
      addedToInventory: effectResult.addedToInventory,
    };
  }

  // Aplicar efeito ou guardar no inventário
  private async applyOrStoreItem(
    discordId: string,
    item: AlchemistItem,
    quantity: number
  ): Promise<{ message: string; addedToInventory: boolean }> {
    const effect = item.effect;

    // Efeitos permanentes são aplicados imediatamente
    if (effect.isPermanent) {
      const character = await Character.findOne({ discordId });
      if (!character) {
        return { message: 'Personagem não encontrado.', addedToInventory: false };
      }

      let message = '';

      switch (effect.type) {
        case 'max_hp_bonus':
          character.permanentBonuses.maxHp += effect.value * quantity;
          character.stats.maxHp += effect.value * quantity;
          character.stats.hp = character.stats.maxHp;
          message = `+${effect.value * quantity} HP máximo permanente!`;
          break;

        case 'attack_bonus':
          character.permanentBonuses.attack += effect.value * quantity;
          character.stats.attack += effect.value * quantity;
          message = `+${effect.value * quantity} ATK permanente!`;
          break;

        case 'defense_bonus':
          character.permanentBonuses.defense += effect.value * quantity;
          character.stats.defense += effect.value * quantity;
          message = `+${effect.value * quantity} DEF permanente!`;
          break;

        case 'cursed_attack':
          character.permanentBonuses.attack += effect.value * quantity;
          character.permanentBonuses.maxHp -= 50 * quantity;
          character.stats.attack += effect.value * quantity;
          character.stats.maxHp -= 50 * quantity;
          if (character.stats.hp > character.stats.maxHp) {
            character.stats.hp = character.stats.maxHp;
          }
          message = `+${effect.value * quantity} ATK, -${50 * quantity} HP máximo (maldição!)`;
          break;

        case 'skill_points_bonus':
          character.bonusSkillPoints += effect.value * quantity;
          message = `+${effect.value * quantity} pontos de skill permanentes!`;
          break;

        case 'guarantee_wildcard':
          character.guaranteeWildcard = true;
          message = `Sua próxima evolução será GARANTIDAMENTE uma classe Wildcard!`;
          break;

        default:
          message = 'Efeito aplicado!';
      }

      await character.save();
      return { message, addedToInventory: false };
    }

    // Itens consumíveis vão para o inventário
    let inventory = await CharacterInventory.findOne({ discordId });
    if (!inventory) {
      inventory = new CharacterInventory({
        discordId,
        consumables: [],
        materials: [],
      });
    }

    const isMaterial = effect.type === 'crafting_material';
    const targetArray = isMaterial ? inventory.materials : inventory.consumables;

    const existingItem = targetArray.find(i => i.itemId === item.id);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      targetArray.push({
        itemId: item.id,
        quantity,
        acquiredAt: new Date(),
      });
    }

    await inventory.save();

    return {
      message: `Adicionado ao inventário! Use \`/usar ${item.id}\` para utilizar.`,
      addedToInventory: true,
    };
  }

  // Usar item do inventário
  async useItem(discordId: string, itemId: string): Promise<{ success: boolean; message: string }> {
    const inventory = await CharacterInventory.findOne({ discordId });
    if (!inventory) {
      return { success: false, message: 'Inventário não encontrado.' };
    }

    const consumable = inventory.consumables.find(i => i.itemId === itemId);
    if (!consumable || consumable.quantity <= 0) {
      return { success: false, message: 'Você não possui este item.' };
    }

    const item = getAlchemistItemById(itemId);
    if (!item) {
      return { success: false, message: 'Item não encontrado.' };
    }

    const character = await Character.findOne({ discordId });
    if (!character) {
      return { success: false, message: 'Personagem não encontrado.' };
    }

    // Aplicar efeito
    let message = '';
    const effect = item.effect;

    switch (effect.type) {
      case 'heal':
        const healAmount = Math.min(effect.value, character.stats.maxHp - character.stats.hp);
        character.stats.hp += healAmount;
        message = `Curou ${healAmount} HP! (${character.stats.hp}/${character.stats.maxHp})`;
        break;

      case 'heal_percent':
        const percentHeal = Math.floor(character.stats.maxHp * (effect.value / 100));
        character.stats.hp = Math.min(character.stats.maxHp, character.stats.hp + percentHeal);
        message = `HP totalmente restaurado! (${character.stats.hp}/${character.stats.maxHp})`;
        break;

      case 'cure_poison':
        message = `Veneno removido!`;
        break;

      case 'auto_revive':
        // Marcar que tem revive ativo
        if (!character.activeBuffs) character.activeBuffs = [];
        const existingRevive = character.activeBuffs.find(b => b.type === 'auto_revive');
        if (existingRevive) {
          return { success: false, message: 'Você já tem uma Lágrima de Fênix ativa!' };
        }
        const reviveExpires = new Date();
        reviveExpires.setHours(reviveExpires.getHours() + 24);
        character.activeBuffs.push({ type: 'auto_revive', value: effect.value, expiresAt: reviveExpires });
        message = `Lágrima de Fênix ativada! Você revive com ${effect.value}% HP se morrer (24h).`;
        break;

      case 'level_up':
        // Ganhar nível
        character.level += 1;
        message = `Parabéns! Você subiu para o nível ${character.level}!`;
        break;

      case 'reset_cooldowns':
        message = `Todos os cooldowns foram resetados!`;
        break;

      case 'attack_boost':
      case 'defense_boost':
      case 'drop_rate_boost':
        // Buffs temporários
        if (!character.activeBuffs) character.activeBuffs = [];
        const buffExpires = new Date();
        buffExpires.setHours(buffExpires.getHours() + (effect.duration || 24));
        character.activeBuffs.push({ type: effect.type, value: effect.value, expiresAt: buffExpires });
        message = `Buff ativo por ${effect.duration || 24}h!`;
        break;

      default:
        message = 'Item usado!';
    }

    // Remover item do inventário
    consumable.quantity -= 1;
    if (consumable.quantity <= 0) {
      inventory.consumables = inventory.consumables.filter(i => i.itemId !== itemId);
    }

    await inventory.save();
    await character.save();

    return {
      success: true,
      message: `${item.emoji} ${item.name} usado!\n\n${message}`,
    };
  }

  // Obter inventário de consumíveis
  async getInventory(discordId: string): Promise<Array<{ item: AlchemistItem; quantity: number }>> {
    const inventory = await CharacterInventory.findOne({ discordId });
    if (!inventory) return [];

    const result: Array<{ item: AlchemistItem; quantity: number }> = [];

    for (const consumable of inventory.consumables) {
      const item = getAlchemistItemById(consumable.itemId);
      if (item && consumable.quantity > 0) {
        result.push({ item, quantity: consumable.quantity });
      }
    }

    return result;
  }
}

export const alchemistShopService = new AlchemistShopService();
export default alchemistShopService;
