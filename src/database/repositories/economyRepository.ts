import { User, UserDocument, ShopItem, ShopItemDocument, Transaction, TransactionDocument, UserInventory, UserInventoryDocument } from '../models';
import { TransactionType, ShopItemType } from '../../types';

export class EconomyRepository {
  // === Coins Operations ===

  /**
   * Get user's coin balance
   */
  async getBalance(discordId: string): Promise<number> {
    const user = await User.findOne({ discordId });
    return user?.coins ?? 0;
  }

  /**
   * Add coins to user
   */
  async addCoins(discordId: string, amount: number, type: TransactionType, description: string, relatedUserId?: string, relatedItemId?: string): Promise<{ newBalance: number; transaction: TransactionDocument }> {
    const user = await User.findOneAndUpdate(
      { discordId },
      { $inc: { coins: amount } },
      { new: true }
    );

    if (!user) throw new Error('User not found');

    const transaction = await Transaction.create({
      discordId,
      type,
      amount,
      balance: user.coins,
      description,
      relatedUserId: relatedUserId || null,
      relatedItemId: relatedItemId || null,
    });

    return { newBalance: user.coins, transaction };
  }

  /**
   * Remove coins from user
   */
  async removeCoins(discordId: string, amount: number, type: TransactionType, description: string, relatedUserId?: string, relatedItemId?: string): Promise<{ newBalance: number; transaction: TransactionDocument } | null> {
    const user = await User.findOne({ discordId });
    if (!user || user.coins < amount) return null;

    const updatedUser = await User.findOneAndUpdate(
      { discordId, coins: { $gte: amount } },
      { $inc: { coins: -amount } },
      { new: true }
    );

    if (!updatedUser) return null;

    const transaction = await Transaction.create({
      discordId,
      type,
      amount: -amount,
      balance: updatedUser.coins,
      description,
      relatedUserId: relatedUserId || null,
      relatedItemId: relatedItemId || null,
    });

    return { newBalance: updatedUser.coins, transaction };
  }

  /**
   * Transfer coins between users
   */
  async transferCoins(fromId: string, toId: string, amount: number, taxRate: number = 0): Promise<{
    fromBalance: number;
    toBalance: number;
    tax: number;
  } | null> {
    const fromUser = await User.findOne({ discordId: fromId });
    if (!fromUser || fromUser.coins < amount) return null;

    const tax = Math.floor(amount * taxRate);
    const netAmount = amount - tax;

    // Remove from sender
    const fromResult = await this.removeCoins(fromId, amount, 'transfer_out', `Transferencia para usuario`, toId);
    if (!fromResult) return null;

    // Add to receiver
    const toResult = await this.addCoins(toId, netAmount, 'transfer_in', `Transferencia recebida`, fromId);

    return {
      fromBalance: fromResult.newBalance,
      toBalance: toResult.newBalance,
      tax,
    };
  }

  /**
   * Get transaction history
   */
  async getTransactions(discordId: string, limit: number = 10): Promise<TransactionDocument[]> {
    return Transaction.find({ discordId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  // === Shop Operations ===

  /**
   * Create shop item
   */
  async createShopItem(data: {
    id: string;
    name: string;
    description: string;
    type: ShopItemType;
    price: number;
    stock?: number;
    roleId?: string;
    duration?: number;
    multiplier?: number;
    badgeId?: string;
    color?: string;
  }): Promise<ShopItemDocument> {
    return ShopItem.create(data);
  }

  /**
   * Get all active shop items
   */
  async getShopItems(): Promise<ShopItemDocument[]> {
    return ShopItem.find({ active: true }).sort({ type: 1, price: 1 });
  }

  /**
   * Get shop item by ID
   */
  async getShopItem(id: string): Promise<ShopItemDocument | null> {
    return ShopItem.findOne({ id });
  }

  /**
   * Update shop item
   */
  async updateShopItem(id: string, updates: Partial<{
    name: string;
    description: string;
    price: number;
    stock: number | null;
    active: boolean;
  }>): Promise<ShopItemDocument | null> {
    return ShopItem.findOneAndUpdate({ id }, updates, { new: true });
  }

  /**
   * Decrease item stock
   */
  async decreaseStock(id: string): Promise<boolean> {
    const result = await ShopItem.findOneAndUpdate(
      { id, $or: [{ stock: null }, { stock: { $gt: 0 } }] },
      { $inc: { stock: -1 } },
      { new: true }
    );
    return !!result;
  }

  /**
   * Delete shop item
   */
  async deleteShopItem(id: string): Promise<boolean> {
    const result = await ShopItem.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // === Inventory Operations ===

  /**
   * Add item to user inventory
   */
  async addToInventory(
    discordId: string,
    itemId: string,
    itemType: string,
    expiresAt?: Date,
    data?: Record<string, unknown>
  ): Promise<UserInventoryDocument> {
    return UserInventory.create({
      discordId,
      itemId,
      itemType,
      expiresAt: expiresAt || null,
      active: true,
      data: data || {},
      purchasedAt: new Date(),
    });
  }

  /**
   * Get user's inventory
   */
  async getInventory(discordId: string): Promise<UserInventoryDocument[]> {
    return UserInventory.find({
      discordId,
      active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });
  }

  /**
   * Get active booster for user
   */
  async getActiveBooster(discordId: string): Promise<UserInventoryDocument | null> {
    return UserInventory.findOne({
      discordId,
      itemType: 'xp_booster',
      active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });
  }

  /**
   * Deactivate inventory item
   */
  async deactivateItem(discordId: string, itemId: string): Promise<boolean> {
    const result = await UserInventory.updateOne(
      { discordId, itemId },
      { active: false }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Clean up expired inventory items
   */
  async cleanupExpiredItems(): Promise<number> {
    const result = await UserInventory.updateMany(
      { expiresAt: { $lte: new Date() }, active: true },
      { active: false }
    );
    return result.modifiedCount;
  }

  /**
   * Get lottery tickets for user
   */
  async getLotteryTickets(discordId: string): Promise<number> {
    const tickets = await UserInventory.find({
      discordId,
      itemType: 'lottery_ticket',
      active: true,
    });
    return tickets.reduce((sum, t) => sum + t.quantity, 0);
  }

  /**
   * Get all lottery tickets (for drawing)
   */
  async getAllLotteryTickets(): Promise<{ discordId: string; count: number }[]> {
    const result = await UserInventory.aggregate([
      { $match: { itemType: 'lottery_ticket', active: true } },
      { $group: { _id: '$discordId', count: { $sum: '$quantity' } } },
    ]);
    return result.map(r => ({ discordId: r._id, count: r.count }));
  }

  /**
   * Reset lottery tickets (after drawing)
   */
  async resetLotteryTickets(): Promise<number> {
    const result = await UserInventory.updateMany(
      { itemType: 'lottery_ticket', active: true },
      { active: false }
    );
    return result.modifiedCount;
  }

  // === Leaderboard ===

  /**
   * Get coins leaderboard
   */
  async getCoinsLeaderboard(limit: number = 10): Promise<UserDocument[]> {
    return User.find()
      .sort({ coins: -1 })
      .limit(limit);
  }
}

export const economyRepository = new EconomyRepository();
export default economyRepository;
