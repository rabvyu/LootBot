import { rpgRepository } from '../database/repositories/rpgRepository';
import { resourceRepository } from '../database/repositories/resourceRepository';
import { economyRepository } from '../database/repositories/economyRepository';
import { userRepository } from '../database/repositories/userRepository';
import { CharacterDocument, CharacterClass, CharacterStats } from '../database/models/Character';
import { MonsterDocument, MonsterType } from '../database/models/Monster';
import { logger } from '../utils/logger';

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

// Default monsters
const DEFAULT_MONSTERS = [
  { id: 'slime', name: 'Slime', emoji: '🟢', description: 'Um slime gelatinoso.', type: 'normal' as MonsterType, level: 1, hp: 30, attack: 5, defense: 2, xpReward: 15, coinsReward: { min: 10, max: 25 }, drops: [{ resourceId: 'essence', chance: 10, minAmount: 1, maxAmount: 1 }] },
  { id: 'goblin', name: 'Goblin', emoji: '👺', description: 'Um goblin traicoeiro.', type: 'normal' as MonsterType, level: 2, hp: 50, attack: 10, defense: 5, xpReward: 30, coinsReward: { min: 20, max: 40 }, drops: [{ resourceId: 'iron', chance: 20, minAmount: 1, maxAmount: 2 }] },
  { id: 'wolf', name: 'Lobo Selvagem', emoji: '🐺', description: 'Um lobo feroz.', type: 'normal' as MonsterType, level: 3, hp: 70, attack: 15, defense: 8, xpReward: 50, coinsReward: { min: 30, max: 60 }, drops: [{ resourceId: 'wood', chance: 30, minAmount: 2, maxAmount: 5 }] },
  { id: 'skeleton', name: 'Esqueleto', emoji: '💀', description: 'Um esqueleto animado.', type: 'normal' as MonsterType, level: 5, hp: 100, attack: 20, defense: 10, xpReward: 80, coinsReward: { min: 50, max: 100 }, drops: [{ resourceId: 'stone', chance: 40, minAmount: 2, maxAmount: 6 }] },
  { id: 'orc', name: 'Orc Guerreiro', emoji: '👹', description: 'Um orc brutal.', type: 'elite' as MonsterType, level: 8, hp: 180, attack: 30, defense: 15, xpReward: 150, coinsReward: { min: 100, max: 200 }, drops: [{ resourceId: 'iron', chance: 50, minAmount: 3, maxAmount: 8 }, { resourceId: 'gold', chance: 20, minAmount: 1, maxAmount: 2 }] },
  { id: 'vampire', name: 'Vampiro', emoji: '🧛', description: 'Um vampiro sedento.', type: 'elite' as MonsterType, level: 12, hp: 250, attack: 40, defense: 20, xpReward: 250, coinsReward: { min: 200, max: 400 }, drops: [{ resourceId: 'essence', chance: 60, minAmount: 3, maxAmount: 8 }, { resourceId: 'diamond', chance: 15, minAmount: 1, maxAmount: 2 }] },
  { id: 'dragon_young', name: 'Dragao Jovem', emoji: '🐲', description: 'Um dragao ainda jovem.', type: 'boss' as MonsterType, level: 15, hp: 500, attack: 50, defense: 30, xpReward: 500, coinsReward: { min: 500, max: 1000 }, drops: [{ resourceId: 'diamond', chance: 50, minAmount: 2, maxAmount: 5 }, { resourceId: 'essence', chance: 80, minAmount: 5, maxAmount: 15 }], isBoss: true },
  { id: 'lich', name: 'Lich', emoji: '☠️', description: 'Um mago morto-vivo poderoso.', type: 'boss' as MonsterType, level: 25, hp: 800, attack: 70, defense: 40, xpReward: 1000, coinsReward: { min: 1000, max: 2500 }, drops: [{ resourceId: 'essence', chance: 100, minAmount: 10, maxAmount: 30 }, { resourceId: 'diamond', chance: 70, minAmount: 3, maxAmount: 8 }], isBoss: true },
];

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
}

export interface CreateCharacterResult {
  success: boolean;
  message: string;
  character?: CharacterDocument;
}

class RPGService {
  async initialize(): Promise<void> {
    for (const monster of DEFAULT_MONSTERS) {
      const existing = await rpgRepository.getMonster(monster.id);
      if (!existing) {
        await rpgRepository.createMonster(monster);
        logger.info(`Created monster: ${monster.name}`);
      }
    }
    logger.info('RPG system initialized');
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
}

export const rpgService = new RPGService();
export default rpgService;
