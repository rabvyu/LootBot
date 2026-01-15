import { craftingRepository } from '../database/repositories/craftingRepository';
import { resourceRepository } from '../database/repositories/resourceRepository';
import { economyRepository } from '../database/repositories/economyRepository';
import { userRepository } from '../database/repositories/userRepository';
import { petRepository } from '../database/repositories/petRepository';
import { RecipeDocument, RecipeCategory } from '../database/models/Recipe';
import { logger } from '../utils/logger';

const DEFAULT_RECIPES = [
  // Basic materials
  {
    id: 'refined_iron',
    name: 'Ferro Refinado',
    emoji: '⚙️',
    description: 'Ferro refinado de alta qualidade.',
    category: 'material' as RecipeCategory,
    ingredients: [
      { resourceId: 'iron', amount: 5 },
      { resourceId: 'wood', amount: 2 },
    ],
    results: [{ type: 'resource' as const, id: 'refined_iron', amount: 1 }],
    levelRequired: 3,
    cooldownHours: 0,
    xpReward: 15,
    unlocked: true,
  },
  {
    id: 'gold_bar',
    name: 'Barra de Ouro',
    emoji: '🏅',
    description: 'Uma barra de ouro puro.',
    category: 'material' as RecipeCategory,
    ingredients: [
      { resourceId: 'gold', amount: 5 },
      { resourceId: 'stone', amount: 3 },
    ],
    results: [{ type: 'resource' as const, id: 'gold_bar', amount: 1 }],
    levelRequired: 5,
    cooldownHours: 0,
    xpReward: 25,
    unlocked: true,
  },
  // Consumables
  {
    id: 'bait_pack',
    name: 'Pacote de Iscas',
    emoji: '🪱',
    description: 'Iscas para melhorar sua pesca.',
    category: 'consumable' as RecipeCategory,
    ingredients: [
      { resourceId: 'fish_common', amount: 3 },
      { resourceId: 'wood', amount: 1 },
    ],
    results: [{ type: 'resource' as const, id: 'bait', amount: 10 }],
    levelRequired: 2,
    cooldownHours: 0,
    xpReward: 10,
    unlocked: true,
  },
  {
    id: 'xp_potion_small',
    name: 'Pocao de XP Pequena',
    emoji: '🧪',
    description: 'Concede 100 XP instantaneamente.',
    category: 'consumable' as RecipeCategory,
    ingredients: [
      { resourceId: 'essence', amount: 2 },
      { resourceId: 'fish_rare', amount: 1 },
    ],
    results: [{ type: 'item' as const, id: 'xp_potion_small', amount: 1 }],
    levelRequired: 5,
    cooldownHours: 1,
    xpReward: 20,
    unlocked: true,
  },
  {
    id: 'xp_potion_large',
    name: 'Pocao de XP Grande',
    emoji: '🧪',
    description: 'Concede 500 XP instantaneamente.',
    category: 'consumable' as RecipeCategory,
    ingredients: [
      { resourceId: 'essence', amount: 10 },
      { resourceId: 'diamond', amount: 2 },
      { resourceId: 'fish_golden', amount: 1 },
    ],
    results: [{ type: 'item' as const, id: 'xp_potion_large', amount: 1 }],
    levelRequired: 15,
    cooldownHours: 6,
    xpReward: 75,
    unlocked: true,
  },
  // Equipment
  {
    id: 'rod_improved',
    name: 'Vara de Pesca Melhorada',
    emoji: '🎣',
    description: '+10% chance de peixes raros.',
    category: 'equipment' as RecipeCategory,
    ingredients: [
      { resourceId: 'wood', amount: 20 },
      { resourceId: 'iron', amount: 10 },
    ],
    results: [{ type: 'item' as const, id: 'rod_improved', amount: 1 }],
    levelRequired: 5,
    cooldownHours: 0,
    xpReward: 50,
    unlocked: true,
  },
  {
    id: 'rod_advanced',
    name: 'Vara de Pesca Avancada',
    emoji: '🎣',
    description: '+20% chance de peixes raros.',
    category: 'equipment' as RecipeCategory,
    ingredients: [
      { resourceId: 'wood', amount: 50 },
      { resourceId: 'gold', amount: 15 },
      { resourceId: 'essence', amount: 5 },
    ],
    results: [{ type: 'item' as const, id: 'rod_advanced', amount: 1 }],
    levelRequired: 12,
    cooldownHours: 0,
    xpReward: 100,
    unlocked: true,
  },
  // Special
  {
    id: 'pet_egg_common',
    name: 'Ovo de Pet Comum',
    emoji: '🥚',
    description: 'Chance de obter um pet comum.',
    category: 'special' as RecipeCategory,
    ingredients: [
      { resourceId: 'wood', amount: 30 },
      { resourceId: 'stone', amount: 30 },
      { resourceId: 'iron', amount: 20 },
      { resourceId: 'essence', amount: 5 },
    ],
    results: [{ type: 'pet_egg' as const, id: 'common', amount: 1 }],
    levelRequired: 8,
    cooldownHours: 24,
    xpReward: 100,
    unlocked: true,
  },
  {
    id: 'pet_egg_rare',
    name: 'Ovo de Pet Raro',
    emoji: '🥚',
    description: 'Chance de obter um pet raro!',
    category: 'special' as RecipeCategory,
    ingredients: [
      { resourceId: 'gold', amount: 30 },
      { resourceId: 'diamond', amount: 10 },
      { resourceId: 'essence', amount: 20 },
    ],
    results: [{ type: 'pet_egg' as const, id: 'rare', amount: 1 }],
    levelRequired: 20,
    cooldownHours: 72,
    xpReward: 300,
    unlocked: true,
  },
  {
    id: 'lucky_charm',
    name: 'Amuleto da Sorte',
    emoji: '🍀',
    description: '+25% drop rate por 24h.',
    category: 'consumable' as RecipeCategory,
    ingredients: [
      { resourceId: 'gold', amount: 10 },
      { resourceId: 'diamond', amount: 3 },
      { resourceId: 'fish_golden', amount: 2 },
    ],
    results: [{ type: 'item' as const, id: 'lucky_charm', amount: 1 }],
    levelRequired: 10,
    cooldownHours: 24,
    xpReward: 50,
    unlocked: true,
  },
];

// Extra resources needed for crafting results
const EXTRA_RESOURCES = [
  { id: 'refined_iron', name: 'Ferro Refinado', emoji: '⚙️', description: 'Ferro refinado de alta qualidade.', rarity: 'uncommon', baseValue: 30 },
  { id: 'gold_bar', name: 'Barra de Ouro', emoji: '🏅', description: 'Uma barra de ouro puro.', rarity: 'rare', baseValue: 80 },
];

export interface CraftResult {
  success: boolean;
  message: string;
  results?: { name: string; emoji: string; amount: number }[];
  xpGained?: number;
  cooldownEnd?: Date;
}

class CraftingService {
  async initialize(): Promise<void> {
    // Create extra resources
    for (const res of EXTRA_RESOURCES) {
      const existing = await resourceRepository.getResourceById(res.id);
      if (!existing) {
        await resourceRepository.createResource(res as any);
        logger.info(`Created crafting resource: ${res.name}`);
      }
    }

    // Create recipes
    for (const recipe of DEFAULT_RECIPES) {
      const existing = await craftingRepository.getRecipeById(recipe.id);
      if (!existing) {
        await craftingRepository.createRecipe(recipe);
        logger.info(`Created recipe: ${recipe.name}`);
      }
    }
    logger.info('Crafting system initialized');
  }

  async getAllRecipes(): Promise<RecipeDocument[]> {
    return craftingRepository.getAllRecipes();
  }

  async getRecipe(recipeId: string): Promise<RecipeDocument | null> {
    return craftingRepository.getRecipeById(recipeId);
  }

  async getRecipesByCategory(category: RecipeCategory): Promise<RecipeDocument[]> {
    return craftingRepository.getRecipesByCategory(category);
  }

  async canCraft(discordId: string, recipeId: string): Promise<{
    canCraft: boolean;
    reason?: string;
    missingIngredients?: { resourceId: string; have: number; need: number }[];
  }> {
    const recipe = await craftingRepository.getRecipeById(recipeId);
    if (!recipe) {
      return { canCraft: false, reason: 'Receita nao encontrada.' };
    }

    // Check level
    const user = await userRepository.findByDiscordId(discordId);
    if (!user || user.level < recipe.levelRequired) {
      return { canCraft: false, reason: `Precisa ser nivel ${recipe.levelRequired}.` };
    }

    // Check cooldown
    if (recipe.cooldownHours > 0) {
      const lastCraft = await craftingRepository.getLastCraftTime(discordId, recipeId);
      if (lastCraft) {
        const cooldownEnd = new Date(lastCraft.getTime() + recipe.cooldownHours * 60 * 60 * 1000);
        if (new Date() < cooldownEnd) {
          return { canCraft: false, reason: `Em cooldown ate <t:${Math.floor(cooldownEnd.getTime() / 1000)}:R>.` };
        }
      }
    }

    // Check ingredients
    const missingIngredients: { resourceId: string; have: number; need: number }[] = [];
    for (const ing of recipe.ingredients) {
      const userResource = await resourceRepository.getUserResource(discordId, ing.resourceId);
      const have = userResource?.amount || 0;
      if (have < ing.amount) {
        missingIngredients.push({ resourceId: ing.resourceId, have, need: ing.amount });
      }
    }

    if (missingIngredients.length > 0) {
      return { canCraft: false, reason: 'Ingredientes insuficientes.', missingIngredients };
    }

    return { canCraft: true };
  }

  async craft(discordId: string, recipeId: string): Promise<CraftResult> {
    const canCraftResult = await this.canCraft(discordId, recipeId);
    if (!canCraftResult.canCraft) {
      return { success: false, message: canCraftResult.reason || 'Nao pode craftar.' };
    }

    const recipe = (await craftingRepository.getRecipeById(recipeId))!;

    // Remove ingredients
    for (const ing of recipe.ingredients) {
      await resourceRepository.removeResource(discordId, ing.resourceId, ing.amount);
    }

    // Give results
    const resultItems: { name: string; emoji: string; amount: number }[] = [];

    for (const result of recipe.results) {
      switch (result.type) {
        case 'resource':
          await resourceRepository.addResource(discordId, result.id, result.amount);
          const resource = await resourceRepository.getResourceById(result.id);
          resultItems.push({
            name: resource?.name || result.id,
            emoji: resource?.emoji || '📦',
            amount: result.amount,
          });
          break;

        case 'item':
          await economyRepository.addToInventory(
            discordId,
            result.id,
            'consumable',
            undefined,
            { craftedFrom: recipeId }
          );
          resultItems.push({
            name: recipe.name,
            emoji: recipe.emoji,
            amount: result.amount,
          });
          break;

        case 'pet_egg':
          // Handle pet egg - give random pet of the specified rarity
          const petResult = await this.handlePetEgg(discordId, result.id);
          if (petResult) {
            resultItems.push(petResult);
          }
          break;
      }
    }

    // Award XP
    await userRepository.addXP(discordId, recipe.xpReward, 'bonus');

    // Record craft
    await craftingRepository.recordCraft(discordId, recipeId);

    logger.info(`User ${discordId} crafted ${recipeId}`);

    let cooldownEnd: Date | undefined;
    if (recipe.cooldownHours > 0) {
      cooldownEnd = new Date(Date.now() + recipe.cooldownHours * 60 * 60 * 1000);
    }

    return {
      success: true,
      message: `Criado com sucesso!`,
      results: resultItems,
      xpGained: recipe.xpReward,
      cooldownEnd,
    };
  }

  private async handlePetEgg(discordId: string, rarity: string): Promise<{ name: string; emoji: string; amount: number } | null> {
    // Get pets by rarity
    const pets = await petRepository.getAllPets();
    const eligiblePets = pets.filter(p => {
      if (rarity === 'common') return ['common', 'uncommon'].includes(p.rarity);
      if (rarity === 'rare') return ['uncommon', 'rare', 'epic'].includes(p.rarity);
      return true;
    });

    if (eligiblePets.length === 0) return null;

    // Random pet
    const randomPet = eligiblePets[Math.floor(Math.random() * eligiblePets.length)];

    // Check if user already has this pet
    const existingPet = await petRepository.getUserPetById(discordId, randomPet.id);
    if (existingPet) {
      // Give coins instead
      await economyRepository.addCoins(discordId, randomPet.price / 2, 'earn', 'Pet duplicado do ovo');
      return { name: `${randomPet.price / 2} Coins (Pet duplicado)`, emoji: '🪙', amount: 1 };
    }

    // Give the pet
    await petRepository.addPetToUser(discordId, randomPet.id, randomPet.name);
    return { name: randomPet.name, emoji: randomPet.emoji, amount: 1 };
  }

  async getCraftingStats(discordId: string): Promise<{ totalCrafted: number; recipesUnlocked: number }> {
    return craftingRepository.getCraftingStats(discordId);
  }
}

export const craftingService = new CraftingService();
export default craftingService;
