import mongoose, { Schema, Document } from 'mongoose';

export type RecipeCategory = 'consumable' | 'equipment' | 'material' | 'special';

export interface RecipeIngredient {
  resourceId: string;
  amount: number;
}

export interface RecipeResult {
  type: 'resource' | 'item' | 'badge' | 'title' | 'pet_egg';
  id: string;
  amount: number;
}

export interface IRecipe {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: RecipeCategory;
  ingredients: RecipeIngredient[];
  results: RecipeResult[];
  levelRequired: number;
  cooldownHours: number;
  xpReward: number;
  unlocked: boolean; // false = needs to be discovered
  createdAt: Date;
}

export interface RecipeDocument extends Omit<IRecipe, 'id'>, Document {
  id: string;
}

const RecipeIngredientSchema = new Schema({
  resourceId: { type: String, required: true },
  amount: { type: Number, required: true, min: 1 },
}, { _id: false });

const RecipeResultSchema = new Schema({
  type: { type: String, required: true, enum: ['resource', 'item', 'badge', 'title', 'pet_egg'] },
  id: { type: String, required: true },
  amount: { type: Number, default: 1 },
}, { _id: false });

const RecipeSchema = new Schema<RecipeDocument>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  emoji: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['consumable', 'equipment', 'material', 'special'],
  },
  ingredients: [RecipeIngredientSchema],
  results: [RecipeResultSchema],
  levelRequired: { type: Number, default: 1 },
  cooldownHours: { type: Number, default: 0 },
  xpReward: { type: Number, default: 10 },
  unlocked: { type: Boolean, default: true },
}, { timestamps: true });

export const Recipe = mongoose.model<RecipeDocument>('Recipe', RecipeSchema);
export default Recipe;
