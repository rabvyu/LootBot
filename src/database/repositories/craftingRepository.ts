import { Recipe, RecipeDocument, RecipeCategory } from '../models/Recipe';
import { UserRecipe, UserRecipeDocument } from '../models/UserRecipe';

class CraftingRepository {
  // Recipe definitions
  async getRecipeById(id: string): Promise<RecipeDocument | null> {
    return Recipe.findOne({ id });
  }

  async getAllRecipes(): Promise<RecipeDocument[]> {
    return Recipe.find().sort({ levelRequired: 1, name: 1 });
  }

  async getRecipesByCategory(category: RecipeCategory): Promise<RecipeDocument[]> {
    return Recipe.find({ category });
  }

  async getUnlockedRecipes(): Promise<RecipeDocument[]> {
    return Recipe.find({ unlocked: true });
  }

  async createRecipe(data: Partial<RecipeDocument>): Promise<RecipeDocument> {
    return Recipe.create(data);
  }

  // User recipes
  async getUserRecipe(discordId: string, recipeId: string): Promise<UserRecipeDocument | null> {
    return UserRecipe.findOne({ discordId, recipeId });
  }

  async getUserUnlockedRecipes(discordId: string): Promise<UserRecipeDocument[]> {
    return UserRecipe.find({ discordId, unlocked: true });
  }

  async unlockRecipe(discordId: string, recipeId: string): Promise<UserRecipeDocument> {
    return UserRecipe.findOneAndUpdate(
      { discordId, recipeId },
      { unlocked: true },
      { upsert: true, new: true }
    );
  }

  async recordCraft(discordId: string, recipeId: string): Promise<UserRecipeDocument | null> {
    return UserRecipe.findOneAndUpdate(
      { discordId, recipeId },
      {
        lastCrafted: new Date(),
        $inc: { timesCrafted: 1 },
      },
      { upsert: true, new: true }
    );
  }

  async getLastCraftTime(discordId: string, recipeId: string): Promise<Date | null> {
    const userRecipe = await UserRecipe.findOne({ discordId, recipeId });
    return userRecipe?.lastCrafted || null;
  }

  async getCraftingStats(discordId: string): Promise<{
    totalCrafted: number;
    recipesUnlocked: number;
  }> {
    const recipes = await UserRecipe.find({ discordId });
    const totalCrafted = recipes.reduce((sum, r) => sum + r.timesCrafted, 0);
    const recipesUnlocked = recipes.filter(r => r.unlocked).length;
    return { totalCrafted, recipesUnlocked };
  }
}

export const craftingRepository = new CraftingRepository();
export default craftingRepository;
