import { tamingRepository } from '../database/repositories/tamingRepository';
import { economyRepository } from '../database/repositories/economyRepository';
import { TamedMonsterDocument, TamedMonsterStats } from '../database/models/TamedMonster';
import { getMonsterById, MonsterData } from '../data/monsters';
import { logger } from '../utils/logger';

// Taming configuration
const MAX_TAMED_MONSTERS = 10;
const BASE_CAPTURE_CHANCE = 30; // 30% base chance
const HP_CAPTURE_BONUS = 40; // Up to 40% bonus based on monster HP
const LEVEL_PENALTY = 2; // -2% per level difference

// XP required for tamed monster level
const XP_FOR_LEVEL = (level: number) => Math.floor(30 * Math.pow(level, 1.4));

// Food items and their effects
const FOOD_ITEMS: Record<string, { happiness: number; loyalty: number; cost: number }> = {
  bread: { happiness: 5, loyalty: 2, cost: 50 },
  meat: { happiness: 10, loyalty: 5, cost: 150 },
  fish: { happiness: 8, loyalty: 4, cost: 100 },
  cake: { happiness: 15, loyalty: 3, cost: 200 },
  elixir: { happiness: 20, loyalty: 10, cost: 500 },
};

export interface CaptureResult {
  success: boolean;
  message: string;
  monster?: TamedMonsterDocument;
  captureChance?: number;
}

export interface TamedBattleResult {
  victory: boolean;
  rounds: string[];
  damageDealt: number;
  damageTaken: number;
  xpEarned: number;
  monsterDied: boolean;
}

class TamingService {
  async attemptCapture(
    discordId: string,
    monsterId: string,
    monsterCurrentHp: number,
    monsterMaxHp: number,
    playerLevel: number
  ): Promise<CaptureResult> {
    // Check max monsters
    const count = await tamingRepository.countTamedMonsters(discordId);
    if (count >= MAX_TAMED_MONSTERS) {
      return {
        success: false,
        message: `Você já tem ${MAX_TAMED_MONSTERS} monstros! Libere alguns antes de capturar mais.`,
      };
    }

    // Get monster data
    const monsterData = getMonsterById(monsterId);
    if (!monsterData) {
      return { success: false, message: 'Monstro não encontrado.' };
    }

    // Can't capture bosses
    if (monsterData.isBoss) {
      return { success: false, message: 'Você não pode capturar bosses!' };
    }

    // Calculate capture chance
    const hpPercentage = monsterCurrentHp / monsterMaxHp;
    const hpBonus = Math.floor((1 - hpPercentage) * HP_CAPTURE_BONUS);
    const levelDiff = monsterData.level - playerLevel;
    const levelPenalty = Math.max(0, levelDiff * LEVEL_PENALTY);
    const captureChance = Math.min(95, Math.max(5, BASE_CAPTURE_CHANCE + hpBonus - levelPenalty));

    // Roll for capture
    const roll = Math.random() * 100;
    if (roll > captureChance) {
      return {
        success: false,
        message: `A captura falhou! (${captureChance.toFixed(1)}% de chance)`,
        captureChance,
      };
    }

    // Capture successful
    const nickname = monsterData.name;
    const stats: TamedMonsterStats = {
      hp: Math.floor(monsterData.hp * 0.8),
      maxHp: Math.floor(monsterData.hp * 0.8),
      attack: Math.floor(monsterData.attack * 0.7),
      defense: Math.floor(monsterData.defense * 0.7),
      loyalty: 30,
      happiness: 40,
    };

    const monster = await tamingRepository.createTamedMonster(
      discordId,
      monsterId,
      nickname,
      monsterData.name,
      monsterData.emoji,
      stats
    );

    logger.info(`User ${discordId} captured ${monsterData.name}`);

    return {
      success: true,
      message: `Você capturou **${monsterData.emoji} ${monsterData.name}**!`,
      monster,
      captureChance,
    };
  }

  async getTamedMonsters(discordId: string): Promise<TamedMonsterDocument[]> {
    return tamingRepository.getTamedMonsters(discordId);
  }

  async getActiveMonster(discordId: string): Promise<TamedMonsterDocument | null> {
    return tamingRepository.getActiveMonster(discordId);
  }

  async setActiveMonster(discordId: string, monsterIdOrNickname: string): Promise<{ success: boolean; message: string }> {
    // Try to find by nickname first
    let monster = await tamingRepository.getTamedMonsterByNickname(discordId, monsterIdOrNickname);

    // If not found, try by ID
    if (!monster) {
      monster = await tamingRepository.getTamedMonsterById(monsterIdOrNickname);
      if (monster && monster.odiscordId !== discordId) {
        monster = null;
      }
    }

    if (!monster) {
      return { success: false, message: 'Monstro não encontrado.' };
    }

    await tamingRepository.setActiveMonster(discordId, monster._id.toString());
    return { success: true, message: `**${monster.emoji} ${monster.nickname}** agora é seu monstro ativo!` };
  }

  async feedMonster(discordId: string, foodType: string): Promise<{ success: boolean; message: string }> {
    const food = FOOD_ITEMS[foodType.toLowerCase()];
    if (!food) {
      const available = Object.keys(FOOD_ITEMS).join(', ');
      return { success: false, message: `Comida inválida. Disponíveis: ${available}` };
    }

    const monster = await tamingRepository.getActiveMonster(discordId);
    if (!monster) {
      return { success: false, message: 'Você não tem um monstro ativo!' };
    }

    // Check coins
    const balance = await economyRepository.getBalance(discordId);
    if (balance < food.cost) {
      return { success: false, message: `Você precisa de ${food.cost} coins para comprar ${foodType}.` };
    }

    // Deduct coins and feed
    await economyRepository.removeCoins(discordId, food.cost, 'spend', `Alimentou ${monster.nickname}`);
    await tamingRepository.feedMonster(monster._id.toString(), food.happiness, food.loyalty);

    return {
      success: true,
      message: `Você alimentou **${monster.emoji} ${monster.nickname}** com ${foodType}!\n+${food.happiness} felicidade, +${food.loyalty} lealdade (-${food.cost} coins)`,
    };
  }

  async healTamedMonster(discordId: string): Promise<{ success: boolean; message: string; cost?: number }> {
    const monster = await tamingRepository.getActiveMonster(discordId);
    if (!monster) {
      return { success: false, message: 'Você não tem um monstro ativo!' };
    }

    if (monster.stats.hp >= monster.stats.maxHp) {
      return { success: false, message: 'Seu monstro já está com vida cheia!' };
    }

    const healCost = Math.floor((monster.stats.maxHp - monster.stats.hp) * 0.3);
    const balance = await economyRepository.getBalance(discordId);

    if (balance < healCost) {
      return { success: false, message: `Você precisa de ${healCost} coins para curar.` };
    }

    await economyRepository.removeCoins(discordId, healCost, 'spend', `Curou ${monster.nickname}`);
    await tamingRepository.healMonster(monster._id.toString());

    return {
      success: true,
      message: `**${monster.emoji} ${monster.nickname}** foi curado! (-${healCost} coins)`,
      cost: healCost,
    };
  }

  async battleWithTamed(discordId: string, enemyMonster: MonsterData): Promise<TamedBattleResult | { error: string }> {
    const tamed = await tamingRepository.getActiveMonster(discordId);
    if (!tamed) {
      return { error: 'Você não tem um monstro ativo!' };
    }

    if (tamed.stats.hp <= 0) {
      return { error: 'Seu monstro está morto! Cure-o primeiro.' };
    }

    // Apply loyalty bonus
    const loyaltyBonus = 1 + (tamed.stats.loyalty / 200); // Up to 50% bonus

    const rounds: string[] = [];
    let tamedHp = tamed.stats.hp;
    let enemyHp = enemyMonster.hp;
    let totalDamageDealt = 0;
    let totalDamageTaken = 0;
    let round = 0;
    const maxRounds = 15;

    while (tamedHp > 0 && enemyHp > 0 && round < maxRounds) {
      round++;

      // Tamed monster attacks
      let tamedDamage = Math.max(1, Math.floor((tamed.stats.attack * loyaltyBonus) - enemyMonster.defense / 2));
      rounds.push(`⚔️ R${round}: ${tamed.emoji} causou **${tamedDamage}** de dano!`);
      enemyHp -= tamedDamage;
      totalDamageDealt += tamedDamage;

      if (enemyHp <= 0) break;

      // Enemy attacks
      const enemyDamage = Math.max(1, Math.floor(enemyMonster.attack - tamed.stats.defense / 2));
      tamedHp -= enemyDamage;
      totalDamageTaken += enemyDamage;
      rounds.push(`💥 ${enemyMonster.emoji} causou **${enemyDamage}** de dano!`);
    }

    const victory = enemyHp <= 0;
    const monsterDied = tamedHp <= 0;

    // Apply damage
    if (totalDamageTaken > 0) {
      await tamingRepository.damageMonster(tamed._id.toString(), totalDamageTaken);
    }

    // Record result
    if (victory) {
      await tamingRepository.recordBattleWin(tamed._id.toString());
      const happinessBonus = Math.floor(tamed.stats.happiness / 20); // Up to 5 XP bonus
      const xpEarned = Math.floor(enemyMonster.xpReward * 0.5) + happinessBonus;
      await tamingRepository.addExperience(tamed._id.toString(), xpEarned);
      await this.checkLevelUp(tamed._id.toString());

      rounds.push(`\n🎉 **VITÓRIA!** ${tamed.emoji} ${tamed.nickname} venceu!`);

      return { victory, rounds, damageDealt: totalDamageDealt, damageTaken: totalDamageTaken, xpEarned, monsterDied };
    } else {
      await tamingRepository.recordBattleLoss(tamed._id.toString());
      rounds.push(`\n💀 **DERROTA!** ${tamed.emoji} ${tamed.nickname} foi derrotado...`);

      return { victory, rounds, damageDealt: totalDamageDealt, damageTaken: totalDamageTaken, xpEarned: 0, monsterDied };
    }
  }

  async checkLevelUp(monsterId: string): Promise<{ leveledUp: boolean; newLevel?: number }> {
    const monster = await tamingRepository.getTamedMonsterById(monsterId);
    if (!monster) return { leveledUp: false };

    const xpNeeded = XP_FOR_LEVEL(monster.level);
    if (monster.experience < xpNeeded) return { leveledUp: false };

    const newLevel = monster.level + 1;
    const newStats: TamedMonsterStats = {
      ...monster.stats,
      maxHp: monster.stats.maxHp + 5,
      hp: monster.stats.maxHp + 5,
      attack: monster.stats.attack + 2,
      defense: monster.stats.defense + 1,
      loyalty: Math.min(100, monster.stats.loyalty + 2),
      happiness: Math.min(100, monster.stats.happiness + 1),
    };

    await tamingRepository.levelUp(monsterId, newLevel, newStats);
    logger.info(`Tamed monster ${monster.nickname} leveled up to ${newLevel}`);

    return { leveledUp: true, newLevel };
  }

  async releaseMonster(discordId: string, monsterIdOrNickname: string): Promise<{ success: boolean; message: string }> {
    let monster = await tamingRepository.getTamedMonsterByNickname(discordId, monsterIdOrNickname);

    if (!monster) {
      monster = await tamingRepository.getTamedMonsterById(monsterIdOrNickname);
      if (monster && monster.odiscordId !== discordId) {
        monster = null;
      }
    }

    if (!monster) {
      return { success: false, message: 'Monstro não encontrado.' };
    }

    const name = `${monster.emoji} ${monster.nickname}`;
    await tamingRepository.releaseMonster(monster._id.toString());

    return { success: true, message: `Você liberou **${name}** de volta à natureza.` };
  }

  async renameMonster(discordId: string, newName: string): Promise<{ success: boolean; message: string }> {
    const monster = await tamingRepository.getActiveMonster(discordId);
    if (!monster) {
      return { success: false, message: 'Você não tem um monstro ativo!' };
    }

    if (newName.length < 2 || newName.length > 20) {
      return { success: false, message: 'O nome deve ter entre 2 e 20 caracteres.' };
    }

    const oldName = monster.nickname;
    await tamingRepository.renameMonster(monster._id.toString(), newName);

    return { success: true, message: `**${monster.emoji} ${oldName}** agora se chama **${newName}**!` };
  }

  getXpForLevel(level: number): number {
    return XP_FOR_LEVEL(level);
  }

  getFoodItems() {
    return FOOD_ITEMS;
  }
}

export const tamingService = new TamingService();
export default tamingService;
