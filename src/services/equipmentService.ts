import { equipmentRepository } from '../database/repositories/equipmentRepository';
import { EquipmentDocument, EquipmentSlot, EquipmentStats } from '../database/models/Equipment';
import { getRandomEquipmentDrop, getEquipmentById, EQUIPMENT_STATS, ALL_EQUIPMENT } from '../data/equipmentData';
import { calculateSetBonus, SET_BONUSES } from '../data/items';
import { logger } from '../utils/logger';

const MAX_INVENTORY = 50;

const RARITY_COLORS: Record<string, string> = {
  common: '#9E9E9E',
  uncommon: '#4CAF50',
  rare: '#2196F3',
  epic: '#9C27B0',
  legendary: '#FF9800',
};

const RARITY_EMOJIS: Record<string, string> = {
  common: '⚪',
  uncommon: '🟢',
  rare: '🔵',
  epic: '🟣',
  legendary: '🟠',
};

class EquipmentService {
  async getPlayerEquipment(discordId: string): Promise<EquipmentDocument[]> {
    return equipmentRepository.getPlayerEquipment(discordId);
  }

  async getEquippedItems(discordId: string): Promise<EquipmentDocument[]> {
    return equipmentRepository.getEquippedItems(discordId);
  }

  async equipItem(discordId: string, equipmentId: string): Promise<{ success: boolean; message: string }> {
    const item = await equipmentRepository.getEquipmentById(equipmentId);
    if (!item || item.odiscordId !== discordId) {
      return { success: false, message: 'Equipamento nao encontrado.' };
    }

    if (item.isEquipped) {
      return { success: false, message: 'Este item ja esta equipado.' };
    }

    await equipmentRepository.equipItem(equipmentId);
    return { success: true, message: `**${item.name}** equipado com sucesso!` };
  }

  async unequipItem(discordId: string, equipmentId: string): Promise<{ success: boolean; message: string }> {
    const item = await equipmentRepository.getEquipmentById(equipmentId);
    if (!item || item.odiscordId !== discordId) {
      return { success: false, message: 'Equipamento nao encontrado.' };
    }

    if (!item.isEquipped) {
      return { success: false, message: 'Este item nao esta equipado.' };
    }

    await equipmentRepository.unequipItem(equipmentId);
    return { success: true, message: `**${item.name}** desequipado.` };
  }

  async sellEquipment(discordId: string, equipmentId: string): Promise<{ success: boolean; message: string; coins?: number }> {
    const item = await equipmentRepository.getEquipmentById(equipmentId);
    if (!item || item.odiscordId !== discordId) {
      return { success: false, message: 'Equipamento nao encontrado.' };
    }

    if (item.isEquipped) {
      return { success: false, message: 'Desequipe o item antes de vender.' };
    }

    const basePrice = item.tier * 50;
    const rarityMult: Record<string, number> = { common: 1, uncommon: 2, rare: 4, epic: 8, legendary: 20 };
    const coins = Math.floor(basePrice * (rarityMult[item.rarity] || 1));

    await equipmentRepository.deleteEquipment(equipmentId);
    return { success: true, message: `Vendeu **${item.name}** por ${coins} coins!`, coins };
  }

  async giveEquipmentDrop(discordId: string, tier: number): Promise<EquipmentDocument | null> {
    const count = await equipmentRepository.countEquipment(discordId);
    if (count >= MAX_INVENTORY) {
      return null;
    }

    const dropData = getRandomEquipmentDrop(tier);
    if (!dropData) return null;

    const equipment = await equipmentRepository.addEquipment(
      discordId,
      dropData.id,
      dropData.name,
      dropData.slot,
      dropData.rarity,
      dropData.tier,
      dropData.stats,
      dropData.setName
    );

    logger.info(`User ${discordId} received equipment: ${dropData.name} (${dropData.rarity})`);
    return equipment;
  }

  async calculateTotalStats(discordId: string): Promise<{ stats: EquipmentStats; setBonuses: { name: string; pieces: number }[] }> {
    const equipped = await equipmentRepository.getEquippedItems(discordId);

    const totalStats: EquipmentStats = {
      attack: 0,
      defense: 0,
      hp: 0,
      critChance: 0,
      critDamage: 0,
    };

    // Sum base stats
    for (const item of equipped) {
      totalStats.attack! += item.stats.attack || 0;
      totalStats.defense! += item.stats.defense || 0;
      totalStats.hp! += item.stats.hp || 0;
      totalStats.critChance! += item.stats.critChance || 0;
      totalStats.critDamage! += item.stats.critDamage || 0;
    }

    // Calculate set bonuses
    const setBonuses: { name: string; pieces: number }[] = [];
    const setCounts: Record<string, number> = {};

    for (const item of equipped) {
      if (item.setName) {
        setCounts[item.setName] = (setCounts[item.setName] || 0) + 1;
      }
    }

    for (const [setName, count] of Object.entries(setCounts)) {
      if (count >= 2) {
        setBonuses.push({ name: setName, pieces: count });
        const bonus = calculateSetBonus(setName, count);
        totalStats.attack! += bonus.attack || 0;
        totalStats.defense! += bonus.defense || 0;
        totalStats.hp! += bonus.hp || 0;
        totalStats.critChance! += bonus.critChance || 0;
        totalStats.critDamage! += bonus.critDamage || 0;
      }
    }

    return { stats: totalStats, setBonuses };
  }

  getRarityColor(rarity: string): string {
    return RARITY_COLORS[rarity] || '#FFFFFF';
  }

  getRarityEmoji(rarity: string): string {
    return RARITY_EMOJIS[rarity] || '⚪';
  }

  getStats() {
    return EQUIPMENT_STATS;
  }

  getSlotName(slot: EquipmentSlot): string {
    const names: Record<EquipmentSlot, string> = {
      weapon: 'Arma',
      armor: 'Armadura',
      helmet: 'Elmo',
      boots: 'Botas',
      gloves: 'Luvas',
      ring: 'Anel',
      amulet: 'Amuleto',
    };
    return names[slot] || slot;
  }

  getSetInfo(setName: string) {
    return SET_BONUSES[setName];
  }
}

export const equipmentService = new EquipmentService();
export default equipmentService;
