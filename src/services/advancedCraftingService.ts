// Serviço de Crafting Avançado (Equipamentos Tier 8-10)
import {
  Character,
  User,
  CharacterInventory,
  Equipment,
} from '../database/models';
import {
  CraftingRecipe,
  getRecipeById,
  getAvailableRecipes,
  getMaterialInfo,
  ALL_RECIPES,
  EQUIPMENT_RECIPES,
  CONSUMABLE_RECIPES,
  MATERIAL_RECIPES,
} from '../data/crafting';
import { guildService } from './guildService';
import { logger } from '../utils/logger';

export interface AdvancedCraftingResult {
  success: boolean;
  message: string;
  recipe?: CraftingRecipe;
  itemsCrafted?: number;
  coinsSpent?: number;
  craftingFailed?: boolean;
}

export interface MaterialCheck {
  materialId: string;
  materialName: string;
  required: number;
  have: number;
  sufficient: boolean;
}

export interface RecipeRequirements {
  recipe: CraftingRecipe;
  canCraft: boolean;
  missingLevel: boolean;
  missingCoins: boolean;
  missingMaterials: MaterialCheck[];
  playerLevel: number;
  playerCoins: number;
  guildBonus: {
    hasGuild: boolean;
    successRateBonus: number;
    costReduction: number;
    finalSuccessRate: number;
    finalCost: number;
  };
}

class AdvancedCraftingService {
  // Verificar requisitos para craftar
  async checkRequirements(
    discordId: string,
    recipeId: string
  ): Promise<RecipeRequirements | null> {
    const recipe = getRecipeById(recipeId);
    if (!recipe) return null;

    const character = await Character.findOne({ discordId });
    const user = await User.findOne({ discordId });
    const inventory = await CharacterInventory.findOne({ discordId });

    if (!character || !user) return null;

    // Verificar guilda para bônus
    const guild = await guildService.getPlayerGuild(discordId);
    const hasGuild = !!guild;
    let successRateBonus = 0;
    let costReduction = 0;

    if (hasGuild && recipe.guildBonus) {
      successRateBonus = recipe.guildBonus.successRateBonus;
      costReduction = recipe.guildBonus.costReduction;
    }

    const finalSuccessRate = Math.min(100, recipe.successRate + successRateBonus);
    const finalCost = Math.floor(recipe.requiredCoins * (1 - costReduction / 100));

    // Verificar materiais
    const materialChecks: MaterialCheck[] = [];
    for (const ingredient of recipe.ingredients) {
      const have = this.getMaterialQuantity(inventory, ingredient.materialId);
      materialChecks.push({
        materialId: ingredient.materialId,
        materialName: ingredient.materialName,
        required: ingredient.quantity,
        have,
        sufficient: have >= ingredient.quantity,
      });
    }

    const missingMaterials = materialChecks.filter(m => !m.sufficient);

    return {
      recipe,
      canCraft:
        character.level >= recipe.requiredLevel &&
        user.coins >= finalCost &&
        missingMaterials.length === 0,
      missingLevel: character.level < recipe.requiredLevel,
      missingCoins: user.coins < finalCost,
      missingMaterials,
      playerLevel: character.level,
      playerCoins: user.coins,
      guildBonus: {
        hasGuild,
        successRateBonus,
        costReduction,
        finalSuccessRate,
        finalCost,
      },
    };
  }

  // Craftar item
  async craft(discordId: string, recipeId: string): Promise<AdvancedCraftingResult> {
    const requirements = await this.checkRequirements(discordId, recipeId);

    if (!requirements) {
      return { success: false, message: 'Receita não encontrada.' };
    }

    if (!requirements.canCraft) {
      if (requirements.missingLevel) {
        return {
          success: false,
          message: `Nível insuficiente. Necessário: ${requirements.recipe.requiredLevel}. Atual: ${requirements.playerLevel}.`,
        };
      }
      if (requirements.missingCoins) {
        return {
          success: false,
          message: `Coins insuficientes. Necessário: ${requirements.guildBonus.finalCost.toLocaleString()}. Atual: ${requirements.playerCoins.toLocaleString()}.`,
        };
      }
      if (requirements.missingMaterials.length > 0) {
        const missing = requirements.missingMaterials
          .map(m => `${m.materialName}: ${m.have}/${m.required}`)
          .join('\n');
        return {
          success: false,
          message: `Materiais insuficientes:\n${missing}`,
        };
      }
    }

    const recipe = requirements.recipe;
    const user = await User.findOne({ discordId });
    let inventory = await CharacterInventory.findOne({ discordId });

    if (!user) {
      return { success: false, message: 'Erro ao acessar dados.' };
    }

    if (!inventory) {
      inventory = new CharacterInventory({ discordId, consumables: [], materials: [] });
    }

    // Cobrar coins
    const finalCost = requirements.guildBonus.finalCost;
    user.coins -= finalCost;

    // Consumir materiais
    for (const ingredient of recipe.ingredients) {
      this.removeMaterial(inventory, ingredient.materialId, ingredient.quantity);
    }

    await user.save();
    await inventory.save();

    // Verificar sucesso
    const roll = Math.random() * 100;
    const success = roll <= requirements.guildBonus.finalSuccessRate;

    if (!success) {
      logger.info(`Advanced crafting failed for ${discordId}: ${recipe.name} (roll: ${roll.toFixed(1)}, needed: ${requirements.guildBonus.finalSuccessRate})`);

      return {
        success: false,
        message: `❌ **Falha no Crafting!**\n\nA criação de **${recipe.name}** falhou.\nMateriais e coins foram perdidos.\n\n(Chance: ${requirements.guildBonus.finalSuccessRate}%)`,
        recipe,
        coinsSpent: finalCost,
        craftingFailed: true,
      };
    }

    // Crafting bem-sucedido - adicionar item
    const result = recipe.result;

    switch (result.type) {
      case 'equipment':
        await this.addEquipment(discordId, recipe);
        break;
      case 'consumable':
        await this.addConsumable(inventory, result.itemId, result.quantity);
        await inventory.save();
        break;
      case 'material':
        await this.addMaterial(inventory, result.itemId, result.quantity);
        await inventory.save();
        break;
    }

    // Contribuir XP para guilda
    if (requirements.guildBonus.hasGuild) {
      await guildService.contributeMemberXP(discordId, Math.floor(finalCost / 100));
    }

    logger.info(`Advanced crafting success for ${discordId}: ${recipe.name} x${result.quantity}`);

    return {
      success: true,
      message: `✅ **Crafting Bem-sucedido!**\n\n${recipe.emoji} **${recipe.name}** x${result.quantity} criado!\n\nCoins gastos: ${finalCost.toLocaleString()}`,
      recipe,
      itemsCrafted: result.quantity,
      coinsSpent: finalCost,
    };
  }

  // Obter receitas disponíveis para o jogador
  async getPlayerRecipes(discordId: string): Promise<{
    available: CraftingRecipe[];
    locked: CraftingRecipe[];
    playerLevel: number;
  }> {
    const character = await Character.findOne({ discordId });
    const playerLevel = character?.level || 1;

    const available = getAvailableRecipes(playerLevel);
    const locked = ALL_RECIPES.filter(r => r.requiredLevel > playerLevel);

    return { available, locked, playerLevel };
  }

  // Obter receitas por categoria
  getEquipmentRecipes(): CraftingRecipe[] {
    return EQUIPMENT_RECIPES;
  }

  getConsumableRecipes(): CraftingRecipe[] {
    return CONSUMABLE_RECIPES;
  }

  getMaterialRecipes(): CraftingRecipe[] {
    return MATERIAL_RECIPES;
  }

  // Obter inventário de materiais
  async getMaterialInventory(discordId: string): Promise<Array<{
    materialId: string;
    name: string;
    emoji: string;
    quantity: number;
    tier: number;
    rarity: string;
  }>> {
    const inventory = await CharacterInventory.findOne({ discordId });
    if (!inventory) return [];

    const materials = [];
    for (const mat of inventory.materials) {
      const info = getMaterialInfo(mat.itemId);
      if (info && mat.quantity > 0) {
        materials.push({
          materialId: mat.itemId,
          name: info.name,
          emoji: info.emoji,
          quantity: mat.quantity,
          tier: info.tier,
          rarity: info.rarity,
        });
      }
    }

    return materials.sort((a, b) => b.tier - a.tier);
  }

  // ==================== HELPERS ====================

  private getMaterialQuantity(
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

  private async addMaterial(
    inventory: { materials: Array<{ itemId: string; quantity: number; acquiredAt?: Date }> },
    materialId: string,
    quantity: number
  ): Promise<void> {
    const existing = inventory.materials.find(m => m.itemId === materialId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      inventory.materials.push({
        itemId: materialId,
        quantity,
        acquiredAt: new Date(),
      });
    }
  }

  private async addConsumable(
    inventory: { consumables: Array<{ itemId: string; quantity: number; acquiredAt?: Date }> },
    itemId: string,
    quantity: number
  ): Promise<void> {
    const existing = inventory.consumables.find(c => c.itemId === itemId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      inventory.consumables.push({
        itemId,
        quantity,
        acquiredAt: new Date(),
      });
    }
  }

  private async addEquipment(discordId: string, recipe: CraftingRecipe): Promise<void> {
    const result = recipe.result;
    if (result.type !== 'equipment' || !result.slot || !result.tier || !result.rarity || !result.stats) {
      return;
    }

    const equipment = new Equipment({
      discordId,
      name: recipe.name,
      slot: result.slot,
      tier: result.tier,
      rarity: result.rarity,
      stats: {
        attack: result.stats.attack || 0,
        defense: result.stats.defense || 0,
        hp: result.stats.hp || 0,
        critChance: result.stats.critChance || 0,
        critDamage: result.stats.critDamage || 0,
        evasion: result.stats.evasion || 0,
        lifesteal: result.stats.lifesteal || 0,
      },
      equipped: false,
      source: 'crafting',
    });

    await equipment.save();
  }
}

export const advancedCraftingService = new AdvancedCraftingService();
export default advancedCraftingService;
