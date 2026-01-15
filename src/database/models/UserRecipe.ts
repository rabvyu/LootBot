import mongoose, { Schema, Document } from 'mongoose';

export interface IUserRecipe {
  discordId: string;
  recipeId: string;
  unlocked: boolean;
  timesCrafted: number;
  lastCrafted?: Date;
}

export interface UserRecipeDocument extends Document {
  discordId: string;
  recipeId: string;
  unlocked: boolean;
  timesCrafted: number;
  lastCrafted?: Date;
}

const UserRecipeSchema = new Schema<UserRecipeDocument>({
  discordId: { type: String, required: true, index: true },
  recipeId: { type: String, required: true },
  unlocked: { type: Boolean, default: false },
  timesCrafted: { type: Number, default: 0 },
  lastCrafted: { type: Date, default: null },
}, { timestamps: true });

UserRecipeSchema.index({ discordId: 1, recipeId: 1 }, { unique: true });

export const UserRecipe = mongoose.model<UserRecipeDocument>('UserRecipe', UserRecipeSchema);
export default UserRecipe;
