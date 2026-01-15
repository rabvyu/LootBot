import { Title, TitleDocument, ITitle, TitleSource } from '../models/Title';
import { UserTitle, UserTitleDocument } from '../models/UserTitle';

class TitleRepository {
  // Title CRUD
  async createTitle(data: Omit<ITitle, 'createdAt' | 'updatedAt'>): Promise<TitleDocument> {
    return Title.create(data);
  }

  async getTitleById(id: string): Promise<TitleDocument | null> {
    return Title.findOne({ id });
  }

  async getAllTitles(): Promise<TitleDocument[]> {
    return Title.find().sort({ rarity: 1, name: 1 });
  }

  async getActiveTitles(): Promise<TitleDocument[]> {
    return Title.find({ active: true }).sort({ rarity: 1, name: 1 });
  }

  async getTitlesBySource(source: TitleSource): Promise<TitleDocument[]> {
    return Title.find({ source, active: true }).sort({ rarity: 1, name: 1 });
  }

  async getShopTitles(): Promise<TitleDocument[]> {
    return Title.find({ source: 'shop', active: true }).sort({ price: 1 });
  }

  async updateTitle(id: string, data: Partial<ITitle>): Promise<TitleDocument | null> {
    return Title.findOneAndUpdate({ id }, data, { new: true });
  }

  async deleteTitle(id: string): Promise<boolean> {
    const result = await Title.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async toggleTitle(id: string): Promise<TitleDocument | null> {
    const title = await Title.findOne({ id });
    if (!title) return null;

    title.active = !title.active;
    await title.save();
    return title;
  }

  // User Titles
  async getUserTitles(discordId: string): Promise<UserTitleDocument[]> {
    return UserTitle.find({ discordId }).sort({ earnedAt: -1 });
  }

  async getUserTitle(discordId: string, titleId: string): Promise<UserTitleDocument | null> {
    return UserTitle.findOne({ discordId, titleId });
  }

  async getEquippedTitle(discordId: string): Promise<UserTitleDocument | null> {
    return UserTitle.findOne({ discordId, equipped: true });
  }

  async grantTitle(discordId: string, titleId: string, expiresAt?: Date): Promise<UserTitleDocument> {
    const existing = await UserTitle.findOne({ discordId, titleId });
    if (existing) {
      // Extend expiration if applicable
      if (expiresAt && existing.expiresAt) {
        existing.expiresAt = new Date(Math.max(existing.expiresAt.getTime(), expiresAt.getTime()));
        await existing.save();
      }
      return existing;
    }

    return UserTitle.create({
      discordId,
      titleId,
      equipped: false,
      earnedAt: new Date(),
      expiresAt,
    });
  }

  async revokeTitle(discordId: string, titleId: string): Promise<boolean> {
    const result = await UserTitle.deleteOne({ discordId, titleId });
    return result.deletedCount > 0;
  }

  async equipTitle(discordId: string, titleId: string): Promise<boolean> {
    // First unequip all titles
    await UserTitle.updateMany(
      { discordId },
      { $set: { equipped: false } }
    );

    // Then equip the specified one
    const result = await UserTitle.updateOne(
      { discordId, titleId },
      { $set: { equipped: true } }
    );

    return result.modifiedCount > 0;
  }

  async unequipTitle(discordId: string): Promise<boolean> {
    const result = await UserTitle.updateMany(
      { discordId },
      { $set: { equipped: false } }
    );
    return result.modifiedCount > 0;
  }

  async hasTitle(discordId: string, titleId: string): Promise<boolean> {
    const userTitle = await UserTitle.findOne({ discordId, titleId });
    if (!userTitle) return false;

    // Check if expired
    if (userTitle.expiresAt && userTitle.expiresAt < new Date()) {
      await UserTitle.deleteOne({ _id: userTitle._id });
      return false;
    }

    return true;
  }

  async getExpiredTitles(): Promise<UserTitleDocument[]> {
    return UserTitle.find({
      expiresAt: { $lte: new Date() }
    });
  }

  async cleanExpiredTitles(): Promise<number> {
    const result = await UserTitle.deleteMany({
      expiresAt: { $lte: new Date() }
    });
    return result.deletedCount;
  }

  async getTitleHolders(titleId: string): Promise<number> {
    return UserTitle.countDocuments({ titleId });
  }

  async getFullUserTitle(discordId: string, titleId: string): Promise<{
    userTitle: UserTitleDocument;
    title: TitleDocument;
  } | null> {
    const userTitle = await UserTitle.findOne({ discordId, titleId });
    if (!userTitle) return null;

    const title = await Title.findOne({ id: titleId });
    if (!title) return null;

    return { userTitle, title };
  }

  async getUserTitlesWithDetails(discordId: string): Promise<Array<{
    userTitle: UserTitleDocument;
    title: TitleDocument;
  }>> {
    const userTitles = await UserTitle.find({ discordId });
    const result: Array<{ userTitle: UserTitleDocument; title: TitleDocument }> = [];

    for (const userTitle of userTitles) {
      const title = await Title.findOne({ id: userTitle.titleId });
      if (title) {
        result.push({ userTitle, title });
      }
    }

    return result;
  }

  // Initialize default titles
  async initializeDefaults(): Promise<void> {
    const defaults: Array<Omit<ITitle, 'createdAt' | 'updatedAt'>> = [
      // Level titles
      {
        id: 'title_novato',
        name: 'Novato',
        displayName: '🌱 Novato',
        description: 'Alcance o nivel 5',
        source: 'level',
        requiredLevel: 5,
        rarity: 'common',
        active: true,
      },
      {
        id: 'title_membro',
        name: 'Membro',
        displayName: '👤 Membro',
        description: 'Alcance o nivel 10',
        source: 'level',
        requiredLevel: 10,
        rarity: 'common',
        active: true,
      },
      {
        id: 'title_ativo',
        name: 'Ativo',
        displayName: '⚡ Ativo',
        description: 'Alcance o nivel 25',
        source: 'level',
        requiredLevel: 25,
        rarity: 'uncommon',
        active: true,
      },
      {
        id: 'title_veterano',
        name: 'Veterano',
        displayName: '🎖️ Veterano',
        description: 'Alcance o nivel 50',
        source: 'level',
        requiredLevel: 50,
        rarity: 'rare',
        active: true,
      },
      {
        id: 'title_elite',
        name: 'Elite',
        displayName: '💎 Elite',
        description: 'Alcance o nivel 75',
        source: 'level',
        requiredLevel: 75,
        rarity: 'epic',
        active: true,
      },
      {
        id: 'title_lenda',
        name: 'Lenda',
        displayName: '👑 Lenda',
        description: 'Alcance o nivel 100',
        source: 'level',
        requiredLevel: 100,
        rarity: 'legendary',
        active: true,
      },
      // Shop titles
      {
        id: 'title_vip',
        name: 'VIP',
        displayName: '💠 VIP',
        description: 'Titulo exclusivo da loja',
        source: 'shop',
        price: 2000,
        rarity: 'rare',
        active: true,
      },
      {
        id: 'title_premium',
        name: 'Premium',
        displayName: '✨ Premium',
        description: 'Titulo premium da loja',
        source: 'shop',
        price: 5000,
        rarity: 'epic',
        active: true,
      },
    ];

    for (const title of defaults) {
      const existing = await Title.findOne({ id: title.id });
      if (!existing) {
        await Title.create(title);
      }
    }
  }
}

export const titleRepository = new TitleRepository();
