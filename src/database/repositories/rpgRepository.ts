import { Character, CharacterDocument, CharacterClass, CharacterStats } from '../models/Character';
import { Monster, MonsterDocument, MonsterType } from '../models/Monster';

class RPGRepository {
  // Character operations
  async getCharacter(discordId: string): Promise<CharacterDocument | null> {
    return Character.findOne({ discordId });
  }

  async createCharacter(
    discordId: string,
    name: string,
    characterClass: CharacterClass,
    stats: CharacterStats
  ): Promise<CharacterDocument> {
    return Character.create({
      discordId,
      name,
      class: characterClass,
      level: 1,
      experience: 0,
      stats,
      equipment: {},
      skills: [],
      battlesWon: 0,
      battlesLost: 0,
      dungeonClears: 0,
      bossKills: 0,
      totalDamageDealt: 0,
    });
  }

  async updateCharacterStats(
    discordId: string,
    stats: Partial<CharacterStats>
  ): Promise<CharacterDocument | null> {
    const update: Record<string, any> = {};
    for (const [key, value] of Object.entries(stats)) {
      update[`stats.${key}`] = value;
    }
    return Character.findOneAndUpdate({ discordId }, update, { new: true });
  }

  async healCharacter(discordId: string): Promise<CharacterDocument | null> {
    const char = await Character.findOne({ discordId });
    if (!char) return null;
    return Character.findOneAndUpdate(
      { discordId },
      { 'stats.hp': char.stats.maxHp },
      { new: true }
    );
  }

  async damageCharacter(discordId: string, damage: number): Promise<CharacterDocument | null> {
    return Character.findOneAndUpdate(
      { discordId },
      { $inc: { 'stats.hp': -damage } },
      { new: true }
    );
  }

  async addExperience(discordId: string, exp: number): Promise<CharacterDocument | null> {
    return Character.findOneAndUpdate(
      { discordId },
      { $inc: { experience: exp } },
      { new: true }
    );
  }

  async levelUp(
    discordId: string,
    newLevel: number,
    statBoosts: Partial<CharacterStats>
  ): Promise<CharacterDocument | null> {
    const update: Record<string, any> = { level: newLevel };
    for (const [key, value] of Object.entries(statBoosts)) {
      update[`stats.${key}`] = value;
    }
    return Character.findOneAndUpdate({ discordId }, update, { new: true });
  }

  async recordBattleWin(discordId: string, damageDealt: number): Promise<void> {
    await Character.updateOne(
      { discordId },
      { $inc: { battlesWon: 1, totalDamageDealt: damageDealt } }
    );
  }

  async recordBattleLoss(discordId: string): Promise<void> {
    await Character.updateOne({ discordId }, { $inc: { battlesLost: 1 } });
  }

  async recordDungeonClear(discordId: string): Promise<void> {
    await Character.updateOne({ discordId }, { $inc: { dungeonClears: 1 } });
  }

  async recordBossKill(discordId: string): Promise<void> {
    await Character.updateOne({ discordId }, { $inc: { bossKills: 1 } });
  }

  async equipItem(
    discordId: string,
    slot: 'weapon' | 'armor' | 'accessory',
    itemId: string
  ): Promise<CharacterDocument | null> {
    return Character.findOneAndUpdate(
      { discordId },
      { [`equipment.${slot}`]: itemId },
      { new: true }
    );
  }

  async getLeaderboard(limit: number = 10): Promise<CharacterDocument[]> {
    return Character.find().sort({ level: -1, experience: -1 }).limit(limit);
  }

  // Monster operations
  async getMonster(id: string): Promise<MonsterDocument | null> {
    return Monster.findOne({ id });
  }

  async getMonstersByType(type: MonsterType): Promise<MonsterDocument[]> {
    return Monster.find({ type }).sort({ level: 1 });
  }

  async getMonstersByLevel(minLevel: number, maxLevel: number): Promise<MonsterDocument[]> {
    return Monster.find({ level: { $gte: minLevel, $lte: maxLevel } });
  }

  async getAllMonsters(): Promise<MonsterDocument[]> {
    return Monster.find().sort({ level: 1, type: 1 });
  }

  async createMonster(data: Partial<MonsterDocument>): Promise<MonsterDocument> {
    return Monster.create(data);
  }

  async getBosses(): Promise<MonsterDocument[]> {
    return Monster.find({ isBoss: true }).sort({ level: 1 });
  }
}

export const rpgRepository = new RPGRepository();
export default rpgRepository;
