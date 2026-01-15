import { GuildMember } from 'discord.js';
import { economyRepository } from '../database/repositories/economyRepository';
import { ShopItemDocument, UserInventoryDocument, TransactionDocument } from '../database/models';
import { ShopItemType } from '../types';
import { logger } from '../utils/logger';

// Economy configuration
export const ECONOMY_CONFIG = {
  COINS_PER_XP: 0.5,               // Coins earned per XP gained
  DAILY_COINS_BASE: 50,            // Base coins from daily
  DAILY_COINS_STREAK_BONUS: 10,    // Extra coins per streak day
  TRANSFER_TAX_RATE: 0.1,          // 10% tax on transfers
  DAILY_TRANSFER_LIMIT: 5,         // Max transfers per day
  MAX_TRANSFER_AMOUNT: 10000,      // Max coins per transfer
};

export interface PurchaseResult {
  success: boolean;
  message: string;
  item?: ShopItemDocument;
  newBalance?: number;
  inventoryItem?: UserInventoryDocument;
}

class EconomyService {
  /**
   * Award coins to user (usually alongside XP)
   */
  async awardCoins(discordId: string, xpAmount: number, eventMultiplier: number = 1): Promise<number> {
    const baseCoins = Math.floor(xpAmount * ECONOMY_CONFIG.COINS_PER_XP);
    const coinsEarned = Math.floor(baseCoins * eventMultiplier);
    if (coinsEarned <= 0) return 0;

    try {
      await economyRepository.addCoins(
        discordId,
        coinsEarned,
        'earn',
        `XP earned: ${xpAmount}${eventMultiplier > 1 ? ` (${eventMultiplier}x event)` : ''}`
      );
      return coinsEarned;
    } catch (error) {
      logger.error('Error awarding coins:', error);
      return 0;
    }
  }

  /**
   * Award daily coins
   */
  async awardDailyCoins(discordId: string, streak: number, dailyMultiplier: number = 1): Promise<number> {
    const streakBonus = Math.min(streak, 30) * ECONOMY_CONFIG.DAILY_COINS_STREAK_BONUS;
    const baseCoins = ECONOMY_CONFIG.DAILY_COINS_BASE + streakBonus;
    const totalCoins = Math.floor(baseCoins * dailyMultiplier);

    try {
      await economyRepository.addCoins(
        discordId,
        totalCoins,
        'earn',
        `Daily reward (streak: ${streak})${dailyMultiplier > 1 ? ` (${dailyMultiplier}x event)` : ''}`
      );
      return totalCoins;
    } catch (error) {
      logger.error('Error awarding daily coins:', error);
      return 0;
    }
  }

  /**
   * Get user balance
   */
  async getBalance(discordId: string): Promise<number> {
    return economyRepository.getBalance(discordId);
  }

  /**
   * Get shop items
   */
  async getShopItems(): Promise<ShopItemDocument[]> {
    return economyRepository.getShopItems();
  }

  /**
   * Purchase item from shop
   */
  async purchaseItem(member: GuildMember, itemId: string): Promise<PurchaseResult> {
    const item = await economyRepository.getShopItem(itemId);

    if (!item) {
      return { success: false, message: 'Item nao encontrado.' };
    }

    if (!item.active) {
      return { success: false, message: 'Este item nao esta disponivel.' };
    }

    if (item.stock !== null && item.stock <= 0) {
      return { success: false, message: 'Este item esta esgotado.' };
    }

    const balance = await economyRepository.getBalance(member.id);
    if (balance < item.price) {
      return {
        success: false,
        message: `Saldo insuficiente. Voce tem ${balance} 🪙 e precisa de ${item.price} 🪙.`,
      };
    }

    // Process purchase
    const result = await economyRepository.removeCoins(
      member.id,
      item.price,
      'spend',
      `Compra: ${item.name}`,
      undefined,
      item.id
    );

    if (!result) {
      return { success: false, message: 'Erro ao processar compra.' };
    }

    // Decrease stock if applicable
    if (item.stock !== null) {
      await economyRepository.decreaseStock(item.id);
    }

    // Apply item effects
    let inventoryItem: UserInventoryDocument | undefined;

    switch (item.type) {
      case 'role_temp':
        if (item.roleId && item.duration) {
          const role = member.guild.roles.cache.get(item.roleId);
          if (role) {
            await member.roles.add(role, `Comprou: ${item.name}`);
            const expiresAt = new Date(Date.now() + item.duration * 60 * 60 * 1000);
            inventoryItem = await economyRepository.addToInventory(
              member.id,
              item.id,
              'role_temp',
              expiresAt,
              { roleId: item.roleId }
            );
          }
        }
        break;

      case 'xp_booster':
        if (item.duration && item.multiplier) {
          const expiresAt = new Date(Date.now() + item.duration * 60 * 60 * 1000);
          inventoryItem = await economyRepository.addToInventory(
            member.id,
            item.id,
            'xp_booster',
            expiresAt,
            { multiplier: item.multiplier }
          );
        }
        break;

      case 'lottery_ticket':
        inventoryItem = await economyRepository.addToInventory(
          member.id,
          item.id,
          'lottery_ticket',
          undefined,
          {}
        );
        break;

      case 'badge':
        if (item.badgeId) {
          const { badgeService } = await import('./badgeService');
          await badgeService.awardBadge(member, item.badgeId);
        }
        break;

      case 'title':
        inventoryItem = await economyRepository.addToInventory(
          member.id,
          item.id,
          'title',
          undefined,
          { title: item.name }
        );
        break;

      case 'profile_color':
        if (item.color) {
          inventoryItem = await economyRepository.addToInventory(
            member.id,
            item.id,
            'profile_color',
            undefined,
            { color: item.color }
          );
        }
        break;
    }

    logger.info(`User ${member.id} purchased ${item.name} for ${item.price} coins`);

    return {
      success: true,
      message: `Voce comprou **${item.name}** por ${item.price} 🪙!`,
      item,
      newBalance: result.newBalance,
      inventoryItem,
    };
  }

  /**
   * Transfer coins to another user
   */
  async transferCoins(
    fromMember: GuildMember,
    toMember: GuildMember,
    amount: number
  ): Promise<{ success: boolean; message: string; tax?: number; fromBalance?: number; toBalance?: number }> {
    if (amount <= 0) {
      return { success: false, message: 'Quantidade invalida.' };
    }

    if (amount > ECONOMY_CONFIG.MAX_TRANSFER_AMOUNT) {
      return {
        success: false,
        message: `Maximo de ${ECONOMY_CONFIG.MAX_TRANSFER_AMOUNT} 🪙 por transferencia.`,
      };
    }

    if (fromMember.id === toMember.id) {
      return { success: false, message: 'Voce nao pode transferir para voce mesmo.' };
    }

    const result = await economyRepository.transferCoins(
      fromMember.id,
      toMember.id,
      amount,
      ECONOMY_CONFIG.TRANSFER_TAX_RATE
    );

    if (!result) {
      return { success: false, message: 'Saldo insuficiente para esta transferencia.' };
    }

    const netAmount = amount - result.tax;
    logger.info(`Transfer: ${fromMember.id} -> ${toMember.id}: ${amount} coins (tax: ${result.tax})`);

    return {
      success: true,
      message: `Transferido ${netAmount} 🪙 para ${toMember.user.username}!${result.tax > 0 ? ` (Taxa: ${result.tax} 🪙)` : ''}`,
      tax: result.tax,
      fromBalance: result.fromBalance,
      toBalance: result.toBalance,
    };
  }

  /**
   * Get user's active XP booster multiplier
   */
  async getBoosterMultiplier(discordId: string): Promise<number> {
    const booster = await economyRepository.getActiveBooster(discordId);
    if (!booster || !booster.data.multiplier) return 1;
    return booster.data.multiplier as number;
  }

  /**
   * Get user's inventory
   */
  async getInventory(discordId: string): Promise<UserInventoryDocument[]> {
    return economyRepository.getInventory(discordId);
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(discordId: string, limit: number = 10): Promise<TransactionDocument[]> {
    return economyRepository.getTransactions(discordId, limit);
  }

  /**
   * Get lottery tickets count
   */
  async getLotteryTickets(discordId: string): Promise<number> {
    return economyRepository.getLotteryTickets(discordId);
  }

  /**
   * Draw lottery (returns winner discord ID)
   */
  async drawLottery(): Promise<{ winnerId: string; prize: number } | null> {
    const allTickets = await economyRepository.getAllLotteryTickets();
    if (allTickets.length === 0) return null;

    // Calculate total tickets and prize pool
    const totalTickets = allTickets.reduce((sum, t) => sum + t.count, 0);
    const lotteryTicketItem = await economyRepository.getShopItem('lottery_ticket');
    const ticketPrice = lotteryTicketItem?.price || 100;
    const prizePool = Math.floor(totalTickets * ticketPrice * 0.9); // 90% of pool goes to winner

    // Pick random winner weighted by ticket count
    let randomPick = Math.floor(Math.random() * totalTickets);
    let winnerId = '';

    for (const entry of allTickets) {
      randomPick -= entry.count;
      if (randomPick < 0) {
        winnerId = entry.discordId;
        break;
      }
    }

    if (!winnerId) return null;

    // Award prize to winner
    await economyRepository.addCoins(winnerId, prizePool, 'lottery_win', `Lottery winner! ${totalTickets} tickets in pool`);

    // Reset all lottery tickets
    await economyRepository.resetLotteryTickets();

    logger.info(`Lottery drawn: Winner ${winnerId}, Prize: ${prizePool} coins, Total tickets: ${totalTickets}`);

    return { winnerId, prize: prizePool };
  }

  /**
   * Get coins leaderboard
   */
  async getCoinsLeaderboard(limit: number = 10): Promise<Array<{
    discordId: string;
    username: string;
    globalName: string | null;
    coins: number;
  }>> {
    const users = await economyRepository.getCoinsLeaderboard(limit);
    return users.map(u => ({
      discordId: u.discordId,
      username: u.username,
      globalName: u.globalName,
      coins: u.coins,
    }));
  }

  /**
   * Initialize default shop items
   */
  async initializeShop(): Promise<void> {
    const defaultItems = [
      {
        id: 'xp_boost_24h',
        name: 'Booster de XP (24h)',
        description: '1.5x XP por 24 horas',
        type: 'xp_booster' as ShopItemType,
        price: 500,
        duration: 24,
        multiplier: 1.5,
      },
      {
        id: 'xp_boost_72h',
        name: 'Booster de XP (72h)',
        description: '1.5x XP por 72 horas',
        type: 'xp_booster' as ShopItemType,
        price: 1200,
        duration: 72,
        multiplier: 1.5,
      },
      {
        id: 'lottery_ticket',
        name: 'Ticket de Loteria',
        description: 'Participe do sorteio semanal!',
        type: 'lottery_ticket' as ShopItemType,
        price: 100,
      },
    ];

    for (const item of defaultItems) {
      const existing = await economyRepository.getShopItem(item.id);
      if (!existing) {
        await economyRepository.createShopItem(item);
        logger.info(`Created shop item: ${item.name}`);
      }
    }
  }

  /**
   * Admin: Give coins to user
   */
  async adminGiveCoins(discordId: string, amount: number, reason: string): Promise<number> {
    const result = await economyRepository.addCoins(
      discordId,
      amount,
      'admin',
      `Admin: ${reason}`
    );
    return result.newBalance;
  }

  /**
   * Admin: Remove coins from user
   */
  async adminRemoveCoins(discordId: string, amount: number, reason: string): Promise<number | null> {
    const result = await economyRepository.removeCoins(
      discordId,
      amount,
      'admin',
      `Admin: ${reason}`
    );
    return result?.newBalance ?? null;
  }
}

export const economyService = new EconomyService();
export default economyService;
