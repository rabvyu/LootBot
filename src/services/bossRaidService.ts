import { BossRaid, IBossRaid, BOSSES, BossDefinition, RaidParticipant } from '../database/models/BossRaid';
import { equipmentService } from './equipmentService';
import { rpgRepository } from '../database/repositories/rpgRepository';
import { economyService } from './economyService';
import { resourceService } from './resourceService';
import { userRepository } from '../database/repositories/userRepository';
import { logger } from '../utils/logger';

// Raid configuration
const RAID_CONFIG = {
  ATTACK_COOLDOWN: 30 * 1000, // 30 seconds between attacks
  MIN_LEVEL_TO_JOIN: 5,
  MAX_ACTIVE_RAIDS_PER_GUILD: 1,
  PARTICIPATION_THRESHOLD: 0.01, // Minimum 1% damage to get rewards
};

interface AttackResult {
  success: boolean;
  message: string;
  damage?: number;
  bossDamageToPlayer?: number;
  bossDefeated?: boolean;
  currentHp?: number;
  maxHp?: number;
  criticalHit?: boolean;
}

interface RaidReward {
  discordId: string;
  coins: number;
  xp: number;
  resources: Array<{ resourceId: string; amount: number }>;
  equipmentName?: string;
  equipmentRarity?: string;
  damagePercent: number;
}

// Equipment drop chances based on boss and participation
const RAID_EQUIPMENT_CONFIG = {
  BASE_DROP_CHANCE: 30, // 30% base chance
  DAMAGE_BONUS_MULTIPLIER: 1.5, // Up to 1.5x bonus for damage dealers
  TIER_BY_BOSS_LEVEL: (level: number): number => {
    if (level >= 80) return 10;
    if (level >= 70) return 9;
    if (level >= 60) return 8;
    if (level >= 50) return 7;
    if (level >= 40) return 6;
    return 5;
  },
};

class BossRaidService {
  /**
   * Create a new boss raid
   */
  async createRaid(
    guildId: string,
    channelId: string,
    bossId: string,
    difficulty: number = 1
  ): Promise<{ success: boolean; message: string; raid?: IBossRaid }> {
    // Check if there's already an active raid
    const activeRaid = await BossRaid.findOne({
      guildId,
      status: { $in: ['recruiting', 'active'] },
    });

    if (activeRaid) {
      return {
        success: false,
        message: 'Ja existe uma raid ativa neste servidor! Termine ou aguarde ela expirar.',
      };
    }

    // Get boss definition
    const boss = BOSSES[bossId];
    if (!boss) {
      return {
        success: false,
        message: `Boss "${bossId}" nao encontrado. Opcoes: ${Object.keys(BOSSES).join(', ')}`,
      };
    }

    // Scale boss stats by difficulty
    const difficultyMultiplier = 1 + (difficulty - 1) * 0.5;
    const scaledHp = Math.floor(boss.baseHp * difficultyMultiplier);

    const raid = new BossRaid({
      bossId: boss.id,
      bossName: boss.name,
      bossEmoji: boss.emoji,
      guildId,
      channelId,
      currentHp: scaledHp,
      maxHp: scaledHp,
      attack: Math.floor(boss.baseAttack * difficultyMultiplier),
      defense: Math.floor(boss.baseDefense * difficultyMultiplier),
      level: boss.level,
      difficulty,
      status: 'recruiting',
      participants: [],
    });

    await raid.save();

    logger.info(`Raid created: ${boss.name} (difficulty ${difficulty}) in guild ${guildId}`);

    return {
      success: true,
      message: `Raid contra ${boss.emoji} **${boss.name}** criada! Use /raid entrar para participar.`,
      raid,
    };
  }

  /**
   * Join an active raid
   */
  async joinRaid(
    guildId: string,
    discordId: string,
    username: string
  ): Promise<{ success: boolean; message: string; raid?: IBossRaid }> {
    const raid = await BossRaid.findOne({
      guildId,
      status: { $in: ['recruiting', 'active'] },
    });

    if (!raid) {
      return { success: false, message: 'Nao ha nenhuma raid ativa no momento!' };
    }

    // Check if already participating
    const existing = raid.participants.find(p => p.discordId === discordId);
    if (existing) {
      return { success: false, message: 'Voce ja esta participando desta raid!' };
    }

    // Check player level
    const character = await rpgRepository.getCharacter(discordId);
    if (!character) {
      return { success: false, message: 'Voce precisa criar um personagem primeiro! Use /rpg criar.' };
    }

    if (character.level < RAID_CONFIG.MIN_LEVEL_TO_JOIN) {
      return {
        success: false,
        message: `Voce precisa ser nivel ${RAID_CONFIG.MIN_LEVEL_TO_JOIN} ou maior para participar de raids!`,
      };
    }

    // Add participant
    raid.participants.push({
      discordId,
      username,
      damageDealt: 0,
      attackCount: 0,
      lastAttack: new Date(0),
    });

    await raid.save();

    logger.info(`Player ${discordId} joined raid ${raid._id}`);

    return {
      success: true,
      message: `Voce entrou na raid contra ${raid.bossEmoji} **${raid.bossName}**! (${raid.participants.length} participantes)`,
      raid,
    };
  }

  /**
   * Start the raid (change from recruiting to active)
   */
  async startRaid(guildId: string): Promise<{ success: boolean; message: string; raid?: IBossRaid }> {
    const raid = await BossRaid.findOne({
      guildId,
      status: 'recruiting',
    });

    if (!raid) {
      return { success: false, message: 'Nao ha nenhuma raid em recrutamento!' };
    }

    const boss = BOSSES[raid.bossId];
    if (raid.participants.length < boss.minParticipants) {
      return {
        success: false,
        message: `Precisa de pelo menos ${boss.minParticipants} participantes para iniciar! (Atual: ${raid.participants.length})`,
      };
    }

    // Set raid as active
    const timeLimit = boss.timeLimit * 60 * 1000; // Convert to ms
    raid.status = 'active';
    raid.startedAt = new Date();
    raid.endsAt = new Date(Date.now() + timeLimit);

    await raid.save();

    logger.info(`Raid ${raid._id} started with ${raid.participants.length} participants`);

    return {
      success: true,
      message: `A raid contra ${raid.bossEmoji} **${raid.bossName}** comecou! Voces tem ${boss.timeLimit} minutos!`,
      raid,
    };
  }

  /**
   * Attack the boss
   */
  async attackBoss(guildId: string, discordId: string): Promise<AttackResult> {
    const raid = await BossRaid.findOne({
      guildId,
      status: 'active',
    });

    if (!raid) {
      return { success: false, message: 'Nao ha nenhuma raid ativa no momento!' };
    }

    // Check if raid has expired
    if (raid.endsAt && new Date() > raid.endsAt) {
      await this.failRaid(raid);
      return { success: false, message: 'A raid expirou! O boss escapou...' };
    }

    // Check if participating
    const participant = raid.participants.find(p => p.discordId === discordId);
    if (!participant) {
      return { success: false, message: 'Voce nao esta participando desta raid! Use /raid entrar.' };
    }

    // Check cooldown
    const timeSinceLastAttack = Date.now() - participant.lastAttack.getTime();
    if (timeSinceLastAttack < RAID_CONFIG.ATTACK_COOLDOWN) {
      const remaining = Math.ceil((RAID_CONFIG.ATTACK_COOLDOWN - timeSinceLastAttack) / 1000);
      return { success: false, message: `Aguarde ${remaining}s para atacar novamente!` };
    }

    // Get player stats
    const character = await rpgRepository.getCharacter(discordId);
    if (!character) {
      return { success: false, message: 'Personagem nao encontrado!' };
    }

    const { stats: eqStats } = await equipmentService.calculateTotalStats(discordId);

    const playerAttack = character.stats.attack + (eqStats.attack || 0);
    const playerDefense = character.stats.defense + (eqStats.defense || 0);
    const playerCritChance = (eqStats.critChance || 0) + 0.1; // Base 10% crit

    // Calculate damage
    const baseDamage = Math.max(1, playerAttack - raid.defense * 0.3);
    const randomVariance = 0.8 + Math.random() * 0.4; // 80-120% damage variance
    const isCritical = Math.random() < playerCritChance;
    const critMultiplier = isCritical ? 2 : 1;

    const damage = Math.floor(baseDamage * randomVariance * critMultiplier);

    // Apply damage to boss
    raid.currentHp = Math.max(0, raid.currentHp - damage);

    // Update participant stats
    participant.damageDealt += damage;
    participant.attackCount++;
    participant.lastAttack = new Date();

    // Boss counter-attack (reduced damage)
    const bossDamage = Math.max(1, Math.floor((raid.attack * 0.2) - playerDefense * 0.5));

    await raid.save();

    // Check if boss is defeated
    if (raid.currentHp <= 0) {
      const rewards = await this.completeRaid(raid);
      return {
        success: true,
        message: `Golpe final! Voce derrotou ${raid.bossEmoji} **${raid.bossName}**!`,
        damage,
        bossDefeated: true,
        currentHp: 0,
        maxHp: raid.maxHp,
        criticalHit: isCritical,
      };
    }

    return {
      success: true,
      message: isCritical ? 'Golpe critico!' : 'Ataque bem sucedido!',
      damage,
      bossDamageToPlayer: bossDamage,
      bossDefeated: false,
      currentHp: raid.currentHp,
      maxHp: raid.maxHp,
      criticalHit: isCritical,
    };
  }

  /**
   * Complete the raid and distribute rewards
   */
  private async completeRaid(raid: IBossRaid): Promise<RaidReward[]> {
    raid.status = 'completed';
    raid.completedAt = new Date();

    const boss = BOSSES[raid.bossId];
    const totalDamage = raid.participants.reduce((sum, p) => sum + p.damageDealt, 0);

    const rewards: RaidReward[] = [];

    for (const participant of raid.participants) {
      const damagePercent = totalDamage > 0 ? participant.damageDealt / totalDamage : 0;

      // Skip players with less than threshold damage
      if (damagePercent < RAID_CONFIG.PARTICIPATION_THRESHOLD) {
        continue;
      }

      // Calculate rewards based on participation
      const difficultyBonus = 1 + (raid.difficulty - 1) * 0.3;
      const baseCoins = boss.rewards.coins.min +
        Math.floor(Math.random() * (boss.rewards.coins.max - boss.rewards.coins.min));
      const baseXp = boss.rewards.xp.min +
        Math.floor(Math.random() * (boss.rewards.xp.max - boss.rewards.xp.min));

      const coins = Math.floor(baseCoins * damagePercent * difficultyBonus * 2);
      const xp = Math.floor(baseXp * damagePercent * difficultyBonus * 2);

      // Roll for resources
      const resourceRewards: Array<{ resourceId: string; amount: number }> = [];
      for (const resource of boss.rewards.resources) {
        if (Math.random() < resource.chance * damagePercent * 3) {
          const amount = resource.amount.min +
            Math.floor(Math.random() * (resource.amount.max - resource.amount.min));
          resourceRewards.push({ resourceId: resource.resourceId, amount });
        }
      }

      // Award rewards
      await economyService.addCoins(participant.discordId, coins, `Raid: ${boss.name}`);
      await userRepository.addXP(participant.discordId, xp, 'bonus');
      if (resourceRewards.length > 0) {
        await resourceService.addResources(participant.discordId, resourceRewards);
      }

      // Try equipment drop
      let equipmentName: string | undefined;
      let equipmentRarity: string | undefined;
      const equipDropChance = RAID_EQUIPMENT_CONFIG.BASE_DROP_CHANCE *
        (1 + damagePercent * RAID_EQUIPMENT_CONFIG.DAMAGE_BONUS_MULTIPLIER);

      if (Math.random() * 100 < equipDropChance) {
        const tier = RAID_EQUIPMENT_CONFIG.TIER_BY_BOSS_LEVEL(raid.level);
        const equipment = await equipmentService.giveEquipmentDrop(participant.discordId, tier);
        if (equipment) {
          equipmentName = equipment.name;
          equipmentRarity = equipment.rarity;
          logger.info(`Raid drop: ${participant.discordId} got ${equipment.name} from ${boss.name}`);
        }
      }

      // Update participant rewards
      participant.rewards = { coins, xp, resources: resourceRewards };

      rewards.push({
        discordId: participant.discordId,
        coins,
        xp,
        resources: resourceRewards,
        equipmentName,
        equipmentRarity,
        damagePercent: damagePercent * 100,
      });

      // Award raid badges
      await this.checkRaidBadges(participant.discordId);
    }

    raid.totalCoinsPool = rewards.reduce((sum, r) => sum + r.coins, 0);
    raid.totalXpPool = rewards.reduce((sum, r) => sum + r.xp, 0);

    await raid.save();

    logger.info(`Raid ${raid._id} completed. ${rewards.length} players rewarded.`);

    return rewards;
  }

  /**
   * Fail the raid (time expired)
   */
  private async failRaid(raid: IBossRaid): Promise<void> {
    raid.status = 'failed';
    raid.completedAt = new Date();
    await raid.save();

    logger.info(`Raid ${raid._id} failed (expired)`);
  }

  /**
   * Get active raid for a guild
   */
  async getActiveRaid(guildId: string): Promise<IBossRaid | null> {
    return BossRaid.findOne({
      guildId,
      status: { $in: ['recruiting', 'active'] },
    });
  }

  /**
   * Get raid by ID
   */
  async getRaidById(raidId: string): Promise<IBossRaid | null> {
    return BossRaid.findById(raidId);
  }

  /**
   * Get raid history for a guild
   */
  async getRaidHistory(guildId: string, limit: number = 10): Promise<IBossRaid[]> {
    return BossRaid.find({
      guildId,
      status: { $in: ['completed', 'failed'] },
    })
      .sort({ completedAt: -1 })
      .limit(limit);
  }

  /**
   * Get player raid stats
   */
  async getPlayerRaidStats(discordId: string): Promise<{
    totalRaids: number;
    raidsWon: number;
    totalDamage: number;
    avgDamagePercent: number;
    bossesDefeated: string[];
  }> {
    const raids = await BossRaid.find({
      'participants.discordId': discordId,
      status: { $in: ['completed', 'failed'] },
    });

    let totalDamage = 0;
    let totalPercent = 0;
    const bossesDefeated: Set<string> = new Set();
    let raidsWon = 0;

    for (const raid of raids) {
      const participant = raid.participants.find(p => p.discordId === discordId);
      if (participant) {
        totalDamage += participant.damageDealt;
        const raidTotal = raid.participants.reduce((sum, p) => sum + p.damageDealt, 0);
        if (raidTotal > 0) {
          totalPercent += (participant.damageDealt / raidTotal) * 100;
        }
        if (raid.status === 'completed') {
          raidsWon++;
          bossesDefeated.add(raid.bossId);
        }
      }
    }

    return {
      totalRaids: raids.length,
      raidsWon,
      totalDamage,
      avgDamagePercent: raids.length > 0 ? totalPercent / raids.length : 0,
      bossesDefeated: Array.from(bossesDefeated),
    };
  }

  /**
   * Cancel a raid (admin)
   */
  async cancelRaid(guildId: string): Promise<{ success: boolean; message: string }> {
    const raid = await BossRaid.findOne({
      guildId,
      status: { $in: ['recruiting', 'active'] },
    });

    if (!raid) {
      return { success: false, message: 'Nao ha raid ativa para cancelar.' };
    }

    raid.status = 'expired';
    raid.completedAt = new Date();
    await raid.save();

    return { success: true, message: `Raid contra ${raid.bossEmoji} ${raid.bossName} foi cancelada.` };
  }

  /**
   * Check and expire old raids
   */
  async checkExpiredRaids(): Promise<number> {
    const expiredRaids = await BossRaid.find({
      status: 'active',
      endsAt: { $lt: new Date() },
    });

    for (const raid of expiredRaids) {
      await this.failRaid(raid);
    }

    return expiredRaids.length;
  }

  /**
   * Check and award raid badges
   */
  private async checkRaidBadges(discordId: string): Promise<void> {
    const stats = await this.getPlayerRaidStats(discordId);

    // Raid participation badges
    if (stats.totalRaids >= 1) await userRepository.addBadge(discordId, 'raid_rookie');
    if (stats.raidsWon >= 5) await userRepository.addBadge(discordId, 'raid_veteran');
    if (stats.raidsWon >= 25) await userRepository.addBadge(discordId, 'raid_champion');
    if (stats.raidsWon >= 50) await userRepository.addBadge(discordId, 'raid_master');
    if (stats.raidsWon >= 100) await userRepository.addBadge(discordId, 'raid_legend');

    // Boss slayer badges
    if (stats.bossesDefeated.length >= 3) await userRepository.addBadge(discordId, 'boss_hunter');
    if (stats.bossesDefeated.length >= 5) await userRepository.addBadge(discordId, 'boss_slayer');

    // Damage badges
    if (stats.totalDamage >= 100000) await userRepository.addBadge(discordId, 'damage_dealer');
    if (stats.totalDamage >= 1000000) await userRepository.addBadge(discordId, 'devastator');
  }

  /**
   * Get leaderboard for a specific raid
   */
  getRaidLeaderboard(raid: IBossRaid): Array<{ rank: number; username: string; damage: number; percent: number }> {
    const totalDamage = raid.participants.reduce((sum, p) => sum + p.damageDealt, 0);

    return raid.participants
      .map(p => ({
        username: p.username,
        damage: p.damageDealt,
        percent: totalDamage > 0 ? (p.damageDealt / totalDamage) * 100 : 0,
      }))
      .sort((a, b) => b.damage - a.damage)
      .map((p, i) => ({ rank: i + 1, ...p }));
  }

  /**
   * Get list of available bosses
   */
  getAvailableBosses(): BossDefinition[] {
    return Object.values(BOSSES);
  }
}

export const bossRaidService = new BossRaidService();
export default bossRaidService;
