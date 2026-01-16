import { rpgRepository } from '../database/repositories/rpgRepository';
import { resourceRepository } from '../database/repositories/resourceRepository';
import { economyRepository } from '../database/repositories/economyRepository';
import { userRepository } from '../database/repositories/userRepository';
import { equipmentService } from './equipmentService';
import { skillTreeService } from './skillTreeService';
import { CharacterDocument, CharacterClass, BaseCharacterClass, CharacterStats } from '../database/models/Character';
import { MonsterDocument, MonsterType } from '../database/models/Monster';
import { EquipmentDocument } from '../database/models/Equipment';
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
import { getClassStatMultiplier, getClassInfo } from '../data/classes';

// Base stats by class (only for base classes)
const CLASS_BASE_STATS: Record<BaseCharacterClass, CharacterStats> = {
  warrior: { hp: 150, maxHp: 150, attack: 18, defense: 15, critChance: 10, critDamage: 150 },
  mage: { hp: 80, maxHp: 80, attack: 28, defense: 6, critChance: 15, critDamage: 180 },
  archer: { hp: 100, maxHp: 100, attack: 22, defense: 10, critChance: 25, critDamage: 160 },
  paladin: { hp: 130, maxHp: 130, attack: 14, defense: 18, critChance: 8, critDamage: 140 },
};

const CLASS_NAMES: Record<BaseCharacterClass, string> = {
  warrior: 'Guerreiro',
  mage: 'Mago',
  archer: 'Arqueiro',
  paladin: 'Paladino',
};

const CLASS_EMOJIS: Record<BaseCharacterClass, string> = {
  warrior: '⚔️',
  mage: '🔮',
  archer: '🏹',
  paladin: '🛡️',
};

// Level up stat multipliers by class (only for base classes)
const LEVEL_UP_STATS: Record<BaseCharacterClass, Partial<CharacterStats>> = {
  warrior: { maxHp: 12, attack: 2, defense: 2 },
  mage: { maxHp: 5, attack: 4, defense: 1 },
  archer: { maxHp: 8, attack: 3, defense: 1 },
  paladin: { maxHp: 10, attack: 2, defense: 3 },
};

// XP required for character level
const XP_FOR_LEVEL = (level: number) => Math.floor(50 * Math.pow(level, 1.5));

// Equipment drop chances by monster type
const EQUIPMENT_DROP_CHANCES: Record<MonsterType, number> = {
  normal: 5,    // 5% chance
  elite: 15,    // 15% chance
  boss: 50,     // 50% chance
};

// Get equipment tier based on monster level
const getEquipmentTierForLevel = (monsterLevel: number): number => {
  if (monsterLevel >= 80) return 10;
  if (monsterLevel >= 70) return 9;
  if (monsterLevel >= 60) return 8;
  if (monsterLevel >= 50) return 7;
  if (monsterLevel >= 40) return 6;
  if (monsterLevel >= 30) return 5;
  if (monsterLevel >= 25) return 4;
  if (monsterLevel >= 15) return 3;
  if (monsterLevel >= 8) return 2;
  return 1;
};

// Combat stats including all bonuses
export interface CombatStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  critChance: number;
  critDamage: number;
  evasion: number;
  lifesteal: number;
  damageBonus: number;
  defenseBonus: number;
}

export interface BattleResult {
  victory: boolean;
  rounds: string[];
  damageDealt: number;
  damageTaken: number;
  xpEarned: number;
  coinsEarned: number;
  drops: { resourceId: string; amount: number }[];
  equipmentDrop?: EquipmentDocument;
  characterDied: boolean;
  monsterName: string;
  monsterEmoji: string;
  monsterId?: string;
  monsterHpRemaining?: number;
  monsterMaxHp?: number;
  isBoss?: boolean;
  skillsUsed?: string[];
  lifestealHealed?: number;
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

  // Calculate complete combat stats with all bonuses
  async calculateCombatStats(character: CharacterDocument): Promise<CombatStats> {
    // Get skill bonuses
    const skillBonuses = await skillTreeService.calculateSkillBonuses(character.discordId);

    // Get attribute bonuses
    const attrBonuses = skillTreeService.calculateAttributeBonuses(character);

    // Get class multiplier from evolved class
    const classMultiplier = getClassStatMultiplier(character.class);

    // Base stats from character
    const baseAttack = character.stats.attack;
    const baseDefense = character.stats.defense;
    const baseCritChance = character.stats.critChance;
    const baseCritDamage = character.stats.critDamage;

    // Calculate final stats
    const physicalAttack = attrBonuses.physicalAttack;
    const magicAttack = attrBonuses.magicAttack;
    const attackFromAttrs = Math.max(physicalAttack, magicAttack); // Use higher of the two

    return {
      hp: character.stats.hp,
      maxHp: character.stats.maxHp + attrBonuses.hp + skillBonuses.hpBonus,
      attack: Math.floor((baseAttack + attackFromAttrs) * classMultiplier * (1 + skillBonuses.damageBonus / 100)),
      defense: Math.floor((baseDefense + attrBonuses.defense) * classMultiplier * (1 + skillBonuses.defenseBonus / 100)),
      critChance: baseCritChance + attrBonuses.critChance + skillBonuses.critBonus,
      critDamage: baseCritDamage + attrBonuses.critDamage + skillBonuses.critDamageBonus,
      evasion: attrBonuses.evasion + skillBonuses.evasion,
      lifesteal: skillBonuses.lifesteal,
      damageBonus: skillBonuses.damageBonus,
      defenseBonus: skillBonuses.defenseBonus,
    };
  }

  getClassBaseStats(characterClass: BaseCharacterClass): CharacterStats {
    return { ...CLASS_BASE_STATS[characterClass] };
  }

  getClassName(characterClass: CharacterClass): string {
    // First check if it's a base class
    if (characterClass in CLASS_NAMES) {
      return CLASS_NAMES[characterClass as BaseCharacterClass];
    }
    // Otherwise look up from class info
    const info = getClassInfo(characterClass);
    return info?.name || characterClass;
  }

  getClassEmoji(characterClass: CharacterClass): string {
    // First check if it's a base class
    if (characterClass in CLASS_EMOJIS) {
      return CLASS_EMOJIS[characterClass as BaseCharacterClass];
    }
    // Otherwise look up from class info
    const info = getClassInfo(characterClass);
    return info?.emoji || '⚔️';
  }

  async getCharacter(discordId: string): Promise<CharacterDocument | null> {
    return rpgRepository.getCharacter(discordId);
  }

  async createCharacter(
    discordId: string,
    name: string,
    characterClass: BaseCharacterClass
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

    // Use the new battle system with all bonuses
    return this.executeBattle(discordId, character, monster);
  }

  private async tryEquipmentDrop(discordId: string, monster: MonsterDocument): Promise<EquipmentDocument | null> {
    const dropChance = EQUIPMENT_DROP_CHANCES[monster.type] || 5;
    const roll = Math.random() * 100;

    if (roll > dropChance) return null;

    const tier = getEquipmentTierForLevel(monster.level);
    const equipment = await equipmentService.giveEquipmentDrop(discordId, tier);

    if (equipment) {
      logger.info(`User ${discordId} got equipment drop: ${equipment.name} from ${monster.name}`);
    }

    return equipment;
  }

  private simulateBattleWithStats(
    character: CharacterDocument,
    monster: MonsterDocument,
    combatStats: CombatStats
  ): BattleResult {
    const rounds: string[] = [];
    let charHp = combatStats.hp;
    let charMaxHp = combatStats.maxHp;
    let monsterHp = monster.hp;
    let totalDamageDealt = 0;
    let totalDamageTaken = 0;
    let totalLifestealHealed = 0;
    let round = 0;
    const maxRounds = 20;

    while (charHp > 0 && monsterHp > 0 && round < maxRounds) {
      round++;

      // Character attacks
      const isCrit = Math.random() * 100 < combatStats.critChance;
      let charDamage = Math.max(1, combatStats.attack - monster.defense / 2);

      if (isCrit) {
        charDamage = Math.floor(charDamage * (combatStats.critDamage / 100));
        rounds.push(`⚔️ Round ${round}: Voce causou **${charDamage}** de dano CRITICO! 💥`);
      } else {
        charDamage = Math.floor(charDamage);
        rounds.push(`⚔️ Round ${round}: Voce causou **${charDamage}** de dano.`);
      }

      monsterHp -= charDamage;
      totalDamageDealt += charDamage;

      // Apply lifesteal
      if (combatStats.lifesteal > 0) {
        const lifestealAmount = Math.floor(charDamage * (combatStats.lifesteal / 100));
        if (lifestealAmount > 0 && charHp < charMaxHp) {
          const actualHeal = Math.min(lifestealAmount, charMaxHp - charHp);
          charHp += actualHeal;
          totalLifestealHealed += actualHeal;
          rounds.push(`  🩸 Lifesteal: +${actualHeal} HP`);
        }
      }

      if (monsterHp <= 0) break;

      // Monster attacks - check evasion first
      const evaded = Math.random() * 100 < combatStats.evasion;
      if (evaded) {
        rounds.push(`💨 Voce esquivou do ataque de ${monster.emoji} ${monster.name}!`);
      } else {
        const monsterDamage = Math.max(1, Math.floor(monster.attack - combatStats.defense / 2));
        charHp -= monsterDamage;
        totalDamageTaken += monsterDamage;
        rounds.push(`💥 ${monster.emoji} ${monster.name} causou **${monsterDamage}** de dano!`);
      }
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

      if (totalLifestealHealed > 0) {
        rounds.push(`🩸 Total curado por lifesteal: ${totalLifestealHealed} HP`);
      }
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
      lifestealHealed: totalLifestealHealed,
    };
  }

  // Keep old method for backwards compatibility, but use new method internally
  private simulateBattle(character: CharacterDocument, monster: MonsterDocument): BattleResult {
    // Simple version without skill bonuses (for non-async contexts)
    const combatStats: CombatStats = {
      hp: character.stats.hp,
      maxHp: character.stats.maxHp,
      attack: character.stats.attack,
      defense: character.stats.defense,
      critChance: character.stats.critChance,
      critDamage: character.stats.critDamage,
      evasion: 0,
      lifesteal: 0,
      damageBonus: 0,
      defenseBonus: 0,
    };

    return this.simulateBattleWithStats(character, monster, combatStats);
  }

  async checkLevelUp(discordId: string): Promise<{ leveledUp: boolean; newLevel?: number }> {
    const character = await rpgRepository.getCharacter(discordId);
    if (!character) return { leveledUp: false };

    const xpNeeded = XP_FOR_LEVEL(character.level);
    if (character.experience < xpNeeded) return { leveledUp: false };

    const newLevel = character.level + 1;
    // Use baseClass for level up stats (base class determines stat growth)
    const baseClass = (character.baseClass || character.class) as BaseCharacterClass;
    const levelUpBonus = LEVEL_UP_STATS[baseClass] || LEVEL_UP_STATS.warrior;
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
    // Calculate full combat stats including skills and attributes
    const combatStats = await this.calculateCombatStats(character);

    // Get skill bonuses for XP/drop rate modifiers
    const skillBonuses = await skillTreeService.calculateSkillBonuses(discordId);

    const result = this.simulateBattleWithStats(character, monster, combatStats);

    // Add monster data for capture
    result.monsterId = monster.id || monster._id.toString();
    result.monsterMaxHp = monster.hp;
    result.monsterHpRemaining = result.victory ? 0 : Math.max(0, monster.hp - result.damageDealt);
    result.isBoss = monster.isBoss;

    if (result.victory) {
      await rpgRepository.recordBattleWin(discordId, result.damageDealt);

      // Apply XP bonus from skills
      const xpWithBonus = Math.floor(result.xpEarned * (1 + skillBonuses.xpBonus / 100));
      result.xpEarned = xpWithBonus;

      await rpgRepository.addExperience(discordId, xpWithBonus);
      await economyRepository.addCoins(discordId, result.coinsEarned, 'earn', `Batalha: ${monster.name}`);
      await userRepository.addXP(discordId, Math.floor(xpWithBonus / 2), 'bonus');

      // Apply drop rate bonus from skills
      for (const drop of monster.drops) {
        const modifiedChance = drop.chance * (1 + skillBonuses.dropBonus / 100);
        if (Math.random() * 100 <= modifiedChance) {
          const amount = this.randomBetween(drop.minAmount, drop.maxAmount);
          if (!result.drops.find(d => d.resourceId === drop.resourceId)) {
            result.drops.push({ resourceId: drop.resourceId, amount });
          }
        }
      }

      for (const drop of result.drops) {
        await resourceRepository.addResource(discordId, drop.resourceId, drop.amount);
      }

      await this.checkLevelUp(discordId);

      if (monster.isBoss) {
        await rpgRepository.recordBossKill(discordId);
      }

      // Try to drop equipment (with drop bonus)
      const equipDrop = await this.tryEquipmentDropWithBonus(discordId, monster, skillBonuses.dropBonus);
      if (equipDrop) {
        result.equipmentDrop = equipDrop;
      }
    } else {
      await rpgRepository.recordBattleLoss(discordId);
    }

    // Calculate actual damage taken (reduced by lifesteal healing)
    const actualDamageTaken = Math.max(0, result.damageTaken - (result.lifestealHealed || 0));
    if (actualDamageTaken > 0) {
      await rpgRepository.damageCharacter(discordId, actualDamageTaken);
    }

    return result;
  }

  private async tryEquipmentDropWithBonus(
    discordId: string,
    monster: MonsterDocument,
    dropBonus: number
  ): Promise<EquipmentDocument | null> {
    const baseDropChance = EQUIPMENT_DROP_CHANCES[monster.type] || 5;
    const modifiedChance = baseDropChance * (1 + dropBonus / 100);
    const roll = Math.random() * 100;

    if (roll > modifiedChance) return null;

    const tier = getEquipmentTierForLevel(monster.level);
    const equipment = await equipmentService.giveEquipmentDrop(discordId, tier);

    if (equipment) {
      logger.info(`User ${discordId} got equipment drop: ${equipment.name} from ${monster.name} (bonus: ${dropBonus}%)`);
    }

    return equipment;
  }

  // Stats
  getMonsterStats() {
    return MONSTER_STATS;
  }
}

export const rpgService = new RPGService();
export default rpgService;
