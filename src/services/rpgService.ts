import { rpgRepository } from '../database/repositories/rpgRepository';
import { resourceRepository } from '../database/repositories/resourceRepository';
import { economyRepository } from '../database/repositories/economyRepository';
import { userRepository } from '../database/repositories/userRepository';
import { CharacterDocument, CharacterClass, CharacterStats } from '../database/models/Character';
import { MonsterDocument, MonsterType } from '../database/models/Monster';
import { logger } from '../utils/logger';
import {
  ALL_MONSTERS,
  LOCATIONS,
  getMonstersByLocation,
  getLocationById,
  getLocationsForLevel,
  getRandomMonsterForLevel,
  getRandomMonsterFromLocation,
  MONSTER_STATS,
  MonsterData,
  LocationData,
} from '../data/monsters';

// Base stats by class
const CLASS_BASE_STATS: Record<CharacterClass, CharacterStats> = {
  warrior: { hp: 150, maxHp: 150, attack: 18, defense: 15, critChance: 10, critDamage: 150 },
  mage: { hp: 80, maxHp: 80, attack: 28, defense: 6, critChance: 15, critDamage: 180 },
  archer: { hp: 100, maxHp: 100, attack: 22, defense: 10, critChance: 25, critDamage: 160 },
  paladin: { hp: 130, maxHp: 130, attack: 14, defense: 18, critChance: 8, critDamage: 140 },
};

const CLASS_NAMES: Record<CharacterClass, string> = {
  warrior: 'Guerreiro',
  mage: 'Mago',
  archer: 'Arqueiro',
  paladin: 'Paladino',
};

const CLASS_EMOJIS: Record<CharacterClass, string> = {
  warrior: '⚔️',
  mage: '🔮',
  archer: '🏹',
  paladin: '🛡️',
};

// Level up stat multipliers by class
const LEVEL_UP_STATS: Record<CharacterClass, Partial<CharacterStats>> = {
  warrior: { maxHp: 12, attack: 2, defense: 2 },
  mage: { maxHp: 5, attack: 4, defense: 1 },
  archer: { maxHp: 8, attack: 3, defense: 1 },
  paladin: { maxHp: 10, attack: 2, defense: 3 },
};

// XP required for character level
const XP_FOR_LEVEL = (level: number) => Math.floor(50 * Math.pow(level, 1.5));

export interface BattleResult {
  victory: boolean;
  rounds: string[];
  damageDealt: number;
  damageTaken: number;
  xpEarned: number;
  coinsEarned: number;
  drops: { resourceId: string; amount: number }[];
  characterDied: boolean;
  monsterName: string;
  monsterEmoji: string;
  monsterId?: string;
  monsterHpRemaining?: number;
  monsterMaxHp?: number;
  isBoss?: boolean;
}

export interface CreateCharacterResult {
  success: boolean;
  message: string;
  character?: CharacterDocument;
}

class RPGService {
  async initialize(): Promise<void> {
    let created = 0;
    for (const monster of ALL_MONSTERS) {
      const existing = await rpgRepository.getMonster(monster.id);
      if (!existing) {
        await rpgRepository.createMonster(monster);
        created++;
      }
    }
    if (created > 0) {
      logger.info(`Created ${created} new monsters`);
    }
    logger.info(`RPG system initialized with ${MONSTER_STATS.total} monsters in ${MONSTER_STATS.totalLocations} locations`);
  }

  getClassBaseStats(characterClass: CharacterClass): CharacterStats {
    return { ...CLASS_BASE_STATS[characterClass] };
  }

  getClassName(characterClass: CharacterClass): string {
    return CLASS_NAMES[characterClass];
  }

  getClassEmoji(characterClass: CharacterClass): string {
    return CLASS_EMOJIS[characterClass];
  }

  async getCharacter(discordId: string): Promise<CharacterDocument | null> {
    return rpgRepository.getCharacter(discordId);
  }

  async createCharacter(
    discordId: string,
    name: string,
    characterClass: CharacterClass
  ): Promise<CreateCharacterResult> {
    const existing = await rpgRepository.getCharacter(discordId);
    if (existing) {
      return { success: false, message: 'Voce ja tem um personagem!' };
    }

    if (name.length < 2 || name.length > 20) {
      return { success: false, message: 'Nome deve ter entre 2 e 20 caracteres.' };
    }

    const stats = this.getClassBaseStats(characterClass);
    const character = await rpgRepository.createCharacter(discordId, name, characterClass, stats);

    logger.info(`User ${discordId} created character ${name} (${characterClass})`);

    return {
      success: true,
      message: `Personagem **${name}** criado como ${CLASS_EMOJIS[characterClass]} ${CLASS_NAMES[characterClass]}!`,
      character,
    };
  }

  async battle(discordId: string, monsterId: string): Promise<BattleResult | { error: string }> {
    const character = await rpgRepository.getCharacter(discordId);
    if (!character) {
      return { error: 'Voce nao tem um personagem! Use `/rpg criar` primeiro.' };
    }

    if (character.stats.hp <= 0) {
      return { error: 'Seu personagem esta morto! Use `/rpg curar` primeiro.' };
    }

    const monster = await rpgRepository.getMonster(monsterId);
    if (!monster) {
      return { error: 'Monstro nao encontrado.' };
    }

    // Simulate battle
    const result = this.simulateBattle(character, monster);

    // Apply results
    if (result.victory) {
      await rpgRepository.recordBattleWin(discordId, result.damageDealt);

      // Award XP and coins
      await rpgRepository.addExperience(discordId, result.xpEarned);
      await economyRepository.addCoins(discordId, result.coinsEarned, 'earn', `Batalha: ${monster.name}`);
      await userRepository.addXP(discordId, Math.floor(result.xpEarned / 2), 'bonus');

      // Process drops
      for (const drop of result.drops) {
        await resourceRepository.addResource(discordId, drop.resourceId, drop.amount);
      }

      // Check for level up
      await this.checkLevelUp(discordId);

      if (monster.isBoss) {
        await rpgRepository.recordBossKill(discordId);
      }
    } else {
      await rpgRepository.recordBattleLoss(discordId);
    }

    // Apply damage taken
    if (result.damageTaken > 0) {
      await rpgRepository.damageCharacter(discordId, result.damageTaken);
    }

    return result;
  }

  private simulateBattle(character: CharacterDocument, monster: MonsterDocument): BattleResult {
    const rounds: string[] = [];
    let charHp = character.stats.hp;
    let monsterHp = monster.hp;
    let totalDamageDealt = 0;
    let totalDamageTaken = 0;
    let round = 0;
    const maxRounds = 20;

    while (charHp > 0 && monsterHp > 0 && round < maxRounds) {
      round++;

      // Character attacks
      const isCrit = Math.random() * 100 < character.stats.critChance;
      let charDamage = Math.max(1, character.stats.attack - monster.defense / 2);
      if (isCrit) {
        charDamage = Math.floor(charDamage * (character.stats.critDamage / 100));
        rounds.push(`⚔️ Round ${round}: Voce causou **${charDamage}** de dano CRITICO!`);
      } else {
        charDamage = Math.floor(charDamage);
        rounds.push(`⚔️ Round ${round}: Voce causou **${charDamage}** de dano.`);
      }
      monsterHp -= charDamage;
      totalDamageDealt += charDamage;

      if (monsterHp <= 0) break;

      // Monster attacks
      const monsterDamage = Math.max(1, Math.floor(monster.attack - character.stats.defense / 2));
      charHp -= monsterDamage;
      totalDamageTaken += monsterDamage;
      rounds.push(`💥 ${monster.emoji} ${monster.name} causou **${monsterDamage}** de dano!`);
    }

    const victory = monsterHp <= 0;

    // Calculate rewards
    let xpEarned = 0;
    let coinsEarned = 0;
    const drops: { resourceId: string; amount: number }[] = [];

    if (victory) {
      xpEarned = monster.xpReward;
      coinsEarned = this.randomBetween(monster.coinsReward.min, monster.coinsReward.max);

      for (const drop of monster.drops) {
        if (Math.random() * 100 <= drop.chance) {
          const amount = this.randomBetween(drop.minAmount, drop.maxAmount);
          drops.push({ resourceId: drop.resourceId, amount });
        }
      }

      rounds.push(`\n🎉 **VITORIA!** ${monster.emoji} ${monster.name} foi derrotado!`);
    } else {
      rounds.push(`\n💀 **DERROTA!** Voce foi derrotado por ${monster.emoji} ${monster.name}...`);
    }

    return {
      victory,
      rounds,
      damageDealt: totalDamageDealt,
      damageTaken: totalDamageTaken,
      xpEarned,
      coinsEarned,
      drops,
      characterDied: charHp <= 0,
      monsterName: monster.name,
      monsterEmoji: monster.emoji,
    };
  }

  async checkLevelUp(discordId: string): Promise<{ leveledUp: boolean; newLevel?: number }> {
    const character = await rpgRepository.getCharacter(discordId);
    if (!character) return { leveledUp: false };

    const xpNeeded = XP_FOR_LEVEL(character.level);
    if (character.experience < xpNeeded) return { leveledUp: false };

    const newLevel = character.level + 1;
    const levelUpBonus = LEVEL_UP_STATS[character.class];
    const newStats: CharacterStats = {
      ...character.stats,
      maxHp: character.stats.maxHp + (levelUpBonus.maxHp || 0),
      hp: character.stats.maxHp + (levelUpBonus.maxHp || 0), // Full heal on level up
      attack: character.stats.attack + (levelUpBonus.attack || 0),
      defense: character.stats.defense + (levelUpBonus.defense || 0),
    };

    await rpgRepository.levelUp(discordId, newLevel, newStats);
    logger.info(`Character ${character.name} leveled up to ${newLevel}`);

    return { leveledUp: true, newLevel };
  }

  async healCharacter(discordId: string): Promise<{ success: boolean; message: string; cost?: number }> {
    const character = await rpgRepository.getCharacter(discordId);
    if (!character) {
      return { success: false, message: 'Voce nao tem um personagem!' };
    }

    if (character.stats.hp >= character.stats.maxHp) {
      return { success: false, message: 'Seu personagem ja esta com vida cheia!' };
    }

    const healCost = Math.floor((character.stats.maxHp - character.stats.hp) * 0.5);
    const balance = await economyRepository.getBalance(discordId);

    if (balance < healCost) {
      return { success: false, message: `Voce precisa de ${healCost} coins para curar.` };
    }

    await economyRepository.removeCoins(discordId, healCost, 'spend', 'Cura de personagem');
    await rpgRepository.healCharacter(discordId);

    return {
      success: true,
      message: `Seu personagem foi curado! (-${healCost} coins)`,
      cost: healCost,
    };
  }

  async getMonsters(): Promise<MonsterDocument[]> {
    return rpgRepository.getAllMonsters();
  }

  async getMonstersByLevel(charLevel: number): Promise<MonsterDocument[]> {
    const minLevel = Math.max(1, charLevel - 3);
    const maxLevel = charLevel + 5;
    return rpgRepository.getMonstersByLevel(minLevel, maxLevel);
  }

  async getLeaderboard(limit: number = 10): Promise<CharacterDocument[]> {
    return rpgRepository.getLeaderboard(limit);
  }

  getXpForLevel(level: number): number {
    return XP_FOR_LEVEL(level);
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Location methods
  getAllLocations(): LocationData[] {
    return LOCATIONS;
  }

  getLocation(locationId: string): LocationData | undefined {
    return getLocationById(locationId);
  }

  getLocationsForCharacterLevel(level: number): LocationData[] {
    return getLocationsForLevel(level);
  }

  getLocationsByTier(tier: number): LocationData[] {
    return LOCATIONS.filter(l => l.tier === tier);
  }

  getMonstersInLocation(locationId: string): MonsterData[] {
    return getMonstersByLocation(locationId);
  }

  getRandomMonster(playerLevel: number, locationId?: string): MonsterData | undefined {
    if (locationId) {
      return getRandomMonsterFromLocation(locationId, playerLevel);
    }
    return getRandomMonsterForLevel(playerLevel);
  }

  // Battle with location
  async battleInLocation(discordId: string, locationId: string): Promise<BattleResult | { error: string }> {
    const character = await rpgRepository.getCharacter(discordId);
    if (!character) {
      return { error: 'Voce nao tem um personagem! Use `/rpg criar` primeiro.' };
    }

    if (character.stats.hp <= 0) {
      return { error: 'Seu personagem esta morto! Use `/rpg curar` primeiro.' };
    }

    const location = getLocationById(locationId);
    if (!location) {
      return { error: 'Localizacao nao encontrada.' };
    }

    // Check if character level is appropriate
    if (character.level < location.minLevel - 5) {
      return { error: `Voce precisa ser pelo menos nivel ${location.minLevel - 5} para explorar ${location.name}.` };
    }

    const monsterData = getRandomMonsterFromLocation(locationId, character.level);
    if (!monsterData) {
      return { error: 'Nenhum monstro encontrado nesta localizacao.' };
    }

    // Ensure monster exists in DB
    let monster = await rpgRepository.getMonster(monsterData.id);
    if (!monster) {
      await rpgRepository.createMonster(monsterData);
      monster = await rpgRepository.getMonster(monsterData.id);
    }

    if (!monster) {
      return { error: 'Erro ao carregar monstro.' };
    }

    return this.executeBattle(discordId, character, monster);
  }

  private async executeBattle(
    discordId: string,
    character: CharacterDocument,
    monster: MonsterDocument
  ): Promise<BattleResult> {
    const result = this.simulateBattle(character, monster);

    // Add monster data for capture
    result.monsterId = monster.id || monster._id.toString();
    result.monsterMaxHp = monster.hp;
    result.monsterHpRemaining = result.victory ? 0 : Math.max(0, monster.hp - result.damageDealt);
    result.isBoss = monster.isBoss;

    if (result.victory) {
      await rpgRepository.recordBattleWin(discordId, result.damageDealt);
      await rpgRepository.addExperience(discordId, result.xpEarned);
      await economyRepository.addCoins(discordId, result.coinsEarned, 'earn', `Batalha: ${monster.name}`);
      await userRepository.addXP(discordId, Math.floor(result.xpEarned / 2), 'bonus');

      for (const drop of result.drops) {
        await resourceRepository.addResource(discordId, drop.resourceId, drop.amount);
      }

      await this.checkLevelUp(discordId);

      if (monster.isBoss) {
        await rpgRepository.recordBossKill(discordId);
      }
    } else {
      await rpgRepository.recordBattleLoss(discordId);
    }

    if (result.damageTaken > 0) {
      await rpgRepository.damageCharacter(discordId, result.damageTaken);
    }

    return result;
  }

  // Stats
  getMonsterStats() {
    return MONSTER_STATS;
  }
}

export const rpgService = new RPGService();
export default rpgService;
