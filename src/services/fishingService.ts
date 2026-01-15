import { resourceRepository } from '../database/repositories/resourceRepository';
import { economyRepository } from '../database/repositories/economyRepository';
import { userRepository } from '../database/repositories/userRepository';
import { logger } from '../utils/logger';

// Fishing cooldown in milliseconds (30 minutes)
const FISHING_COOLDOWN = 30 * 60 * 1000;

// Fishing results
interface FishingResult {
  success: boolean;
  message: string;
  caught?: {
    id: string;
    name: string;
    emoji: string;
    rarity: string;
    value: number;
  };
  bonusCoins?: number;
  xpGained?: number;
  cooldownRemaining?: number;
}

// Fish types with drop chances
const FISH_TABLE = [
  { id: 'trash', name: 'Lixo', emoji: '👢', chance: 8, value: 1, rarity: 'trash', xp: 1 },
  { id: 'fish_common', name: 'Sardinha', emoji: '🐟', chance: 35, value: 10, rarity: 'common', xp: 5 },
  { id: 'fish_common', name: 'Tilapia', emoji: '🐟', chance: 25, value: 20, rarity: 'common', xp: 8 },
  { id: 'fish_rare', name: 'Salmao', emoji: '🐠', chance: 15, value: 50, rarity: 'uncommon', xp: 15 },
  { id: 'fish_rare', name: 'Atum', emoji: '🐠', chance: 10, value: 100, rarity: 'rare', xp: 25 },
  { id: 'fish_golden', name: 'Peixe Dourado', emoji: '🐡', chance: 5, value: 300, rarity: 'epic', xp: 50 },
  { id: 'fish_legendary', name: 'Tubarao Dourado', emoji: '🦈', chance: 1.5, value: 1000, rarity: 'legendary', xp: 150 },
  { id: 'treasure', name: 'Bau do Tesouro', emoji: '📦', chance: 0.5, value: 2000, rarity: 'legendary', xp: 200 },
];

// Fishing rod upgrades (stored in user inventory)
const ROD_BONUSES: Record<string, number> = {
  'rod_basic': 0,
  'rod_improved': 10,    // +10% rare chance
  'rod_advanced': 20,    // +20% rare chance
  'rod_master': 35,      // +35% rare chance
  'rod_legendary': 50,   // +50% rare chance
};

// User cooldowns stored in memory (could be moved to DB for persistence)
const userCooldowns = new Map<string, number>();

class FishingService {
  async fish(discordId: string, rodId: string = 'rod_basic'): Promise<FishingResult> {
    // Check cooldown
    const lastFish = userCooldowns.get(discordId) || 0;
    const now = Date.now();
    const timeSinceLastFish = now - lastFish;

    if (timeSinceLastFish < FISHING_COOLDOWN) {
      const remaining = FISHING_COOLDOWN - timeSinceLastFish;
      return {
        success: false,
        message: 'Voce precisa esperar antes de pescar novamente.',
        cooldownRemaining: remaining,
      };
    }

    // Check for bait (optional, improves chances)
    const hasBait = await resourceRepository.hasResource(discordId, 'bait', 1);
    let baitBonus = 0;
    if (hasBait) {
      await resourceRepository.removeResource(discordId, 'bait', 1);
      baitBonus = 15; // +15% chance for rare fish
    }

    // Calculate rod bonus
    const rodBonus = ROD_BONUSES[rodId] || 0;
    const totalBonus = rodBonus + baitBonus;

    // Roll for fish
    const caught = this.rollFish(totalBonus);

    // Set cooldown
    userCooldowns.set(discordId, now);

    // Award coins
    await economyRepository.addCoins(
      discordId,
      caught.value,
      'earn',
      `Pesca: ${caught.name}`
    );

    // Award XP
    await userRepository.addXP(discordId, caught.xp, 'bonus');

    // If it's a resource-type fish, add to inventory
    if (caught.id.startsWith('fish_')) {
      await resourceRepository.addResource(discordId, caught.id, 1);
    }

    logger.info(`User ${discordId} caught ${caught.name} worth ${caught.value} coins`);

    return {
      success: true,
      message: `Voce pescou **${caught.name}**!`,
      caught: {
        id: caught.id,
        name: caught.name,
        emoji: caught.emoji,
        rarity: caught.rarity,
        value: caught.value,
      },
      bonusCoins: caught.value,
      xpGained: caught.xp,
    };
  }

  private rollFish(bonusPercent: number): typeof FISH_TABLE[0] {
    // Adjust chances based on bonus
    const adjustedTable = FISH_TABLE.map((fish) => {
      if (['rare', 'epic', 'legendary'].includes(fish.rarity)) {
        return {
          ...fish,
          chance: fish.chance * (1 + bonusPercent / 100),
        };
      }
      return fish;
    });

    // Normalize chances
    const totalChance = adjustedTable.reduce((sum, f) => sum + f.chance, 0);
    const roll = Math.random() * totalChance;

    let cumulative = 0;
    for (const fish of adjustedTable) {
      cumulative += fish.chance;
      if (roll <= cumulative) {
        return fish;
      }
    }

    // Fallback to common fish
    return FISH_TABLE[1];
  }

  getCooldownRemaining(discordId: string): number {
    const lastFish = userCooldowns.get(discordId) || 0;
    const remaining = FISHING_COOLDOWN - (Date.now() - lastFish);
    return Math.max(0, remaining);
  }

  getRodBonus(rodId: string): number {
    return ROD_BONUSES[rodId] || 0;
  }

  getFishTable(): typeof FISH_TABLE {
    return FISH_TABLE;
  }
}

export const fishingService = new FishingService();
export default fishingService;
