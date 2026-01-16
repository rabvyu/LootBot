// Serviço de Encantamentos
import {
  Equipment,
  EquipmentDocument,
  User,
  CharacterInventory,
} from '../database/models';
import {
  EnchantmentType,
  EnchantmentData,
  getEnchantmentById,
  getEnchantmentsForSlot,
  calculateEnchantmentValue,
  calculateEnchantmentCost,
  calculateSuccessRate,
  calculateDestructionRate,
  formatEnchantmentValue,
  getLevelNumeral,
  ENCHANTMENT_MATERIALS,
} from '../data/enchantments';
import { logger } from '../utils/logger';

export interface EnchantResult {
  success: boolean;
  message: string;
  newLevel?: number;
  destroyed?: boolean;
  statsGained?: string;
}

export interface EnchantmentPreview {
  enchantment: EnchantmentData;
  currentLevel: number;
  targetLevel: number;
  currentValue: string;
  newValue: string;
  cost: { coins: number; materials: number };
  successRate: number;
  destructionRate: number;
  canEnchant: boolean;
  reason?: string;
}

export interface EquipmentEnchantments {
  equipment: EquipmentDocument;
  enchantments: Array<{
    enchantment: EnchantmentData;
    level: number;
    value: string;
  }>;
  availableEnchantments: EnchantmentData[];
}

class EnchantmentService {
  // Obter informações de encantamento de um equipamento
  async getEquipmentEnchantments(equipmentId: string): Promise<EquipmentEnchantments | null> {
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) return null;

    const enchantments: EquipmentEnchantments['enchantments'] = [];

    const equipEnchantments = equipment.enchantments as Record<string, number> | undefined;
    if (equipEnchantments) {
      for (const [enchId, level] of Object.entries(equipEnchantments)) {
        const enchantment = getEnchantmentById(enchId as EnchantmentType);
        if (enchantment && (level as number) > 0) {
          enchantments.push({
            enchantment,
            level: level as number,
            value: formatEnchantmentValue(enchantment, level as number),
          });
        }
      }
    }

    const availableEnchantments = getEnchantmentsForSlot(equipment.slot);

    return {
      equipment,
      enchantments,
      availableEnchantments,
    };
  }

  // Preview de encantamento
  async previewEnchantment(
    discordId: string,
    equipmentId: string,
    enchantmentId: EnchantmentType
  ): Promise<EnchantmentPreview | null> {
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) return null;

    const equipDiscordId = equipment.discordId || equipment.odiscordId;
    if (equipDiscordId !== discordId) {
      return null;
    }

    const enchantment = getEnchantmentById(enchantmentId);
    if (!enchantment) return null;

    // Verificar se encantamento é aplicável ao slot
    if (!enchantment.applicableSlots.includes(equipment.slot)) {
      return {
        enchantment,
        currentLevel: 0,
        targetLevel: 1,
        currentValue: '-',
        newValue: formatEnchantmentValue(enchantment, 1),
        cost: calculateEnchantmentCost(enchantment, 1),
        successRate: 0,
        destructionRate: 0,
        canEnchant: false,
        reason: `Este encantamento não pode ser aplicado em ${equipment.slot}.`,
      };
    }

    // Obter nível atual
    const enchantmentsMap = equipment.enchantments as Record<string, number> | undefined;
    const currentLevel = enchantmentsMap?.[enchantmentId] || 0;
    const targetLevel = currentLevel + 1;

    // Verificar nível máximo
    if (currentLevel >= enchantment.maxLevel) {
      return {
        enchantment,
        currentLevel,
        targetLevel: currentLevel,
        currentValue: formatEnchantmentValue(enchantment, currentLevel),
        newValue: formatEnchantmentValue(enchantment, currentLevel),
        cost: { coins: 0, materials: 0 },
        successRate: 0,
        destructionRate: 0,
        canEnchant: false,
        reason: 'Este encantamento já está no nível máximo.',
      };
    }

    const cost = calculateEnchantmentCost(enchantment, targetLevel);
    const successRate = calculateSuccessRate(targetLevel);
    const destructionRate = calculateDestructionRate(targetLevel);

    // Verificar recursos
    const user = await User.findOne({ discordId });
    const inventory = await CharacterInventory.findOne({ discordId });

    const hasCoins = (user?.coins || 0) >= cost.coins;
    const materialCount = this.getMaterialCount(inventory, enchantment.material.materialId);
    const hasMaterials = materialCount >= cost.materials;

    let reason: string | undefined;
    if (!hasCoins) {
      reason = `Coins insuficientes. Necessário: ${cost.coins.toLocaleString()}`;
    } else if (!hasMaterials) {
      reason = `Materiais insuficientes. Necessário: ${cost.materials} ${enchantment.material.materialName} (tem: ${materialCount})`;
    }

    return {
      enchantment,
      currentLevel,
      targetLevel,
      currentValue: currentLevel > 0 ? formatEnchantmentValue(enchantment, currentLevel) : '-',
      newValue: formatEnchantmentValue(enchantment, targetLevel),
      cost,
      successRate,
      destructionRate,
      canEnchant: hasCoins && hasMaterials,
      reason,
    };
  }

  // Aplicar encantamento
  async enchant(
    discordId: string,
    equipmentId: string,
    enchantmentId: EnchantmentType
  ): Promise<EnchantResult> {
    const preview = await this.previewEnchantment(discordId, equipmentId, enchantmentId);

    if (!preview) {
      return { success: false, message: 'Equipamento ou encantamento não encontrado.' };
    }

    if (!preview.canEnchant) {
      return { success: false, message: preview.reason || 'Não é possível encantar.' };
    }

    const equipment = await Equipment.findById(equipmentId);
    const user = await User.findOne({ discordId });
    const inventory = await CharacterInventory.findOne({ discordId });

    if (!equipment || !user || !inventory) {
      return { success: false, message: 'Erro ao acessar dados.' };
    }

    // Cobrar recursos
    user.coins -= preview.cost.coins;
    this.removeMaterial(inventory, preview.enchantment.material.materialId, preview.cost.materials);

    await user.save();
    await inventory.save();

    // Rolar sucesso
    const roll = Math.random() * 100;
    const success = roll <= preview.successRate;

    if (!success) {
      // Falha - verificar destruição
      const destroyRoll = Math.random() * 100;
      const destroyed = destroyRoll <= preview.destructionRate;

      if (destroyed) {
        // Destruir equipamento
        await Equipment.deleteOne({ _id: equipmentId });

        logger.info(`Enchantment destroyed equipment ${equipmentId} for ${discordId}`);

        return {
          success: false,
          destroyed: true,
          message: `💥 **FALHA CRÍTICA!**\n\nO encantamento falhou e o equipamento **${equipment.name}** foi destruído!\n\n(Chance de destruição: ${preview.destructionRate}%)`,
        };
      }

      logger.info(`Enchantment failed for ${discordId}: ${enchantmentId} on ${equipment.name}`);

      return {
        success: false,
        destroyed: false,
        message: `❌ **Falha no Encantamento**\n\nO encantamento **${preview.enchantment.name}** falhou.\nRecursos foram perdidos, mas o equipamento está intacto.\n\n(Chance: ${preview.successRate}%)`,
      };
    }

    // Sucesso - aplicar encantamento
    const currentEnchantments = (equipment.enchantments || {}) as Record<string, number>;
    currentEnchantments[enchantmentId] = preview.targetLevel;
    (equipment as any).enchantments = currentEnchantments;

    // Atualizar stats do equipamento
    this.applyEnchantmentStats(equipment, preview.enchantment, preview.targetLevel - preview.currentLevel);

    await equipment.save();

    const levelName = getLevelNumeral(preview.targetLevel);

    logger.info(`Enchantment success for ${discordId}: ${enchantmentId} ${levelName} on ${equipment.name}`);

    return {
      success: true,
      newLevel: preview.targetLevel,
      statsGained: preview.newValue,
      message: `✅ **Encantamento Bem-sucedido!**\n\n${preview.enchantment.emoji} **${preview.enchantment.name} ${levelName}** aplicado em **${equipment.name}**!\n\n${preview.enchantment.stat}: ${preview.newValue}`,
    };
  }

  // Obter equipamentos do jogador
  async getPlayerEquipments(discordId: string): Promise<EquipmentDocument[]> {
    return Equipment.find({ discordId });
  }

  // Obter materiais de encantamento do jogador
  async getEnchantmentMaterials(discordId: string): Promise<Array<{
    materialId: string;
    name: string;
    emoji: string;
    quantity: number;
  }>> {
    const inventory = await CharacterInventory.findOne({ discordId });
    if (!inventory) return [];

    const materials = [];
    for (const [matId, info] of Object.entries(ENCHANTMENT_MATERIALS)) {
      const mat = inventory.materials.find(m => m.itemId === matId);
      if (mat && mat.quantity > 0) {
        materials.push({
          materialId: matId,
          name: info.name,
          emoji: info.emoji,
          quantity: mat.quantity,
        });
      }
    }

    return materials;
  }

  // ==================== HELPERS ====================

  private getMaterialCount(
    inventory: { materials: Array<{ itemId: string; quantity: number }> } | null,
    materialId: string
  ): number {
    if (!inventory) return 0;
    const mat = inventory.materials.find(m => m.itemId === materialId);
    return mat?.quantity || 0;
  }

  private removeMaterial(
    inventory: { materials: Array<{ itemId: string; quantity: number }> },
    materialId: string,
    quantity: number
  ): void {
    const mat = inventory.materials.find(m => m.itemId === materialId);
    if (mat) {
      mat.quantity -= quantity;
      if (mat.quantity <= 0) {
        inventory.materials = inventory.materials.filter(m => m.itemId !== materialId);
      }
    }
  }

  private applyEnchantmentStats(
    equipment: EquipmentDocument,
    enchantment: EnchantmentData,
    levelsDelta: number
  ): void {
    const valueGained = calculateEnchantmentValue(enchantment, levelsDelta);

    // Aplicar stat boost ao equipamento
    switch (enchantment.stat) {
      case 'attack':
        equipment.stats.attack = Math.floor((equipment.stats.attack || 0) * (1 + valueGained / 100));
        break;
      case 'defense':
        equipment.stats.defense = Math.floor((equipment.stats.defense || 0) * (1 + valueGained / 100));
        break;
      case 'hp':
        equipment.stats.hp = (equipment.stats.hp || 0) + valueGained;
        break;
      case 'critChance':
        equipment.stats.critChance = (equipment.stats.critChance || 0) + valueGained;
        break;
      case 'critDamage':
        equipment.stats.critDamage = (equipment.stats.critDamage || 0) + valueGained;
        break;
      case 'evasion':
        equipment.stats.evasion = (equipment.stats.evasion || 0) + valueGained;
        break;
      case 'lifesteal':
        equipment.stats.lifesteal = (equipment.stats.lifesteal || 0) + valueGained;
        break;
    }
  }
}

export const enchantmentService = new EnchantmentService();
export default enchantmentService;
