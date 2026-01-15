import { GuildMember } from 'discord.js';
import { titleRepository } from '../database/repositories/titleRepository';
import { userRepository } from '../database/repositories/userRepository';
import { economyRepository } from '../database/repositories/economyRepository';
import { TitleDocument, TitleSource } from '../database/models/Title';
import { UserTitleDocument } from '../database/models/UserTitle';
import { logger } from '../utils/logger';

export interface TitlePurchaseResult {
  success: boolean;
  message: string;
  title?: TitleDocument;
  newBalance?: number;
}

class TitleService {
  /**
   * Initialize default titles
   */
  async initialize(): Promise<void> {
    await titleRepository.initializeDefaults();
    logger.info('Title system initialized');
  }

  /**
   * Get all available titles
   */
  async getAllTitles(): Promise<TitleDocument[]> {
    return titleRepository.getActiveTitles();
  }

  /**
   * Get titles by source
   */
  async getTitlesBySource(source: TitleSource): Promise<TitleDocument[]> {
    return titleRepository.getTitlesBySource(source);
  }

  /**
   * Get shop titles
   */
  async getShopTitles(): Promise<TitleDocument[]> {
    return titleRepository.getShopTitles();
  }

  /**
   * Get user's titles
   */
  async getUserTitles(discordId: string): Promise<Array<{
    userTitle: UserTitleDocument;
    title: TitleDocument;
  }>> {
    return titleRepository.getUserTitlesWithDetails(discordId);
  }

  /**
   * Get user's equipped title
   */
  async getEquippedTitle(discordId: string): Promise<TitleDocument | null> {
    const userTitle = await titleRepository.getEquippedTitle(discordId);
    if (!userTitle) return null;

    return titleRepository.getTitleById(userTitle.titleId);
  }

  /**
   * Get equipped title display name
   */
  async getEquippedTitleDisplay(discordId: string): Promise<string | null> {
    const title = await this.getEquippedTitle(discordId);
    return title?.displayName || null;
  }

  /**
   * Grant a title to user
   */
  async grantTitle(discordId: string, titleId: string, expiresAt?: Date): Promise<UserTitleDocument | null> {
    const title = await titleRepository.getTitleById(titleId);
    if (!title || !title.active) return null;

    const userTitle = await titleRepository.grantTitle(discordId, titleId, expiresAt);
    logger.info(`Granted title ${titleId} to user ${discordId}`);

    return userTitle;
  }

  /**
   * Revoke a title from user
   */
  async revokeTitle(discordId: string, titleId: string): Promise<boolean> {
    const result = await titleRepository.revokeTitle(discordId, titleId);
    if (result) {
      logger.info(`Revoked title ${titleId} from user ${discordId}`);
    }
    return result;
  }

  /**
   * Equip a title
   */
  async equipTitle(discordId: string, titleId: string): Promise<boolean> {
    // Check if user has this title
    const hasTitle = await titleRepository.hasTitle(discordId, titleId);
    if (!hasTitle) return false;

    return titleRepository.equipTitle(discordId, titleId);
  }

  /**
   * Unequip current title
   */
  async unequipTitle(discordId: string): Promise<boolean> {
    return titleRepository.unequipTitle(discordId);
  }

  /**
   * Purchase a title from shop
   */
  async purchaseTitle(member: GuildMember, titleId: string): Promise<TitlePurchaseResult> {
    const title = await titleRepository.getTitleById(titleId);

    if (!title) {
      return { success: false, message: 'Titulo nao encontrado.' };
    }

    if (!title.active) {
      return { success: false, message: 'Este titulo nao esta disponivel.' };
    }

    if (title.source !== 'shop' || !title.price) {
      return { success: false, message: 'Este titulo nao pode ser comprado.' };
    }

    // Check if already has title
    const hasTitle = await titleRepository.hasTitle(member.id, titleId);
    if (hasTitle) {
      return { success: false, message: 'Voce ja possui este titulo.' };
    }

    // Check balance
    const balance = await economyRepository.getBalance(member.id);
    if (balance < title.price) {
      return {
        success: false,
        message: `Saldo insuficiente. Voce tem ${balance} 🪙 e precisa de ${title.price} 🪙.`,
      };
    }

    // Process purchase
    const result = await economyRepository.removeCoins(
      member.id,
      title.price,
      'spend',
      `Titulo: ${title.name}`,
      undefined,
      title.id
    );

    if (!result) {
      return { success: false, message: 'Erro ao processar compra.' };
    }

    // Grant title
    await titleRepository.grantTitle(member.id, titleId);

    logger.info(`User ${member.id} purchased title ${title.name} for ${title.price} coins`);

    return {
      success: true,
      message: `Voce comprou o titulo **${title.displayName}** por ${title.price} 🪙!`,
      title,
      newBalance: result.newBalance,
    };
  }

  /**
   * Check and grant level titles
   */
  async checkLevelTitles(discordId: string, level: number): Promise<TitleDocument[]> {
    const levelTitles = await titleRepository.getTitlesBySource('level');
    const grantedTitles: TitleDocument[] = [];

    for (const title of levelTitles) {
      if (title.requiredLevel && level >= title.requiredLevel) {
        const hasTitle = await titleRepository.hasTitle(discordId, title.id);
        if (!hasTitle) {
          await titleRepository.grantTitle(discordId, title.id);
          grantedTitles.push(title);
          logger.info(`User ${discordId} earned level title: ${title.name}`);
        }
      }
    }

    return grantedTitles;
  }

  /**
   * Check and grant achievement titles
   */
  async checkAchievementTitles(discordId: string, badgeIds: string[]): Promise<TitleDocument[]> {
    const achievementTitles = await titleRepository.getTitlesBySource('achievement');
    const grantedTitles: TitleDocument[] = [];

    for (const title of achievementTitles) {
      if (title.requiredBadgeId && badgeIds.includes(title.requiredBadgeId)) {
        const hasTitle = await titleRepository.hasTitle(discordId, title.id);
        if (!hasTitle) {
          await titleRepository.grantTitle(discordId, title.id);
          grantedTitles.push(title);
          logger.info(`User ${discordId} earned achievement title: ${title.name}`);
        }
      }
    }

    return grantedTitles;
  }

  /**
   * Clean expired titles
   */
  async cleanExpiredTitles(): Promise<number> {
    return titleRepository.cleanExpiredTitles();
  }

  /**
   * Get title by ID
   */
  async getTitle(titleId: string): Promise<TitleDocument | null> {
    return titleRepository.getTitleById(titleId);
  }

  /**
   * Create a new title (admin)
   */
  async createTitle(data: {
    id: string;
    name: string;
    displayName: string;
    description: string;
    source: TitleSource;
    requiredLevel?: number;
    requiredBadgeId?: string;
    price?: number;
    color?: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  }): Promise<TitleDocument> {
    return titleRepository.createTitle({
      ...data,
      active: true,
    });
  }

  /**
   * Delete a title (admin)
   */
  async deleteTitle(titleId: string): Promise<boolean> {
    return titleRepository.deleteTitle(titleId);
  }

  /**
   * Toggle title active status (admin)
   */
  async toggleTitle(titleId: string): Promise<TitleDocument | null> {
    return titleRepository.toggleTitle(titleId);
  }

  /**
   * Get title holders count
   */
  async getTitleHolders(titleId: string): Promise<number> {
    return titleRepository.getTitleHolders(titleId);
  }
}

export const titleService = new TitleService();
