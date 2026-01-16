import mongoose, { Schema, Document } from 'mongoose';

// Item no inventário de consumíveis
export interface InventoryItem {
  itemId: string;
  quantity: number;
  acquiredAt: Date;
}

export interface ICharacterInventory {
  discordId: string;
  consumables: InventoryItem[];
  materials: InventoryItem[];
}

export interface CharacterInventoryDocument extends Document {
  discordId: string;
  consumables: InventoryItem[];
  materials: InventoryItem[];
}

const InventoryItemSchema = new Schema({
  itemId: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  acquiredAt: { type: Date, default: Date.now },
}, { _id: false });

const CharacterInventorySchema = new Schema<CharacterInventoryDocument>({
  discordId: { type: String, required: true, unique: true, index: true },
  consumables: [InventoryItemSchema],
  materials: [InventoryItemSchema],
}, { timestamps: true });

export const CharacterInventory = mongoose.model<CharacterInventoryDocument>('CharacterInventory', CharacterInventorySchema);
export default CharacterInventory;
