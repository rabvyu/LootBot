import mongoose, { Schema, Document } from 'mongoose';

export interface StockItem {
  itemId: string;
  quantity: number;
}

export interface IAlchemistStock {
  guildId: string;
  items: StockItem[];
  lastRefresh: Date;
  nextRefresh: Date;
}

export interface AlchemistStockDocument extends Document {
  guildId: string;
  items: StockItem[];
  lastRefresh: Date;
  nextRefresh: Date;
}

const StockItemSchema = new Schema({
  itemId: { type: String, required: true },
  quantity: { type: Number, required: true },
}, { _id: false });

const AlchemistStockSchema = new Schema<AlchemistStockDocument>({
  guildId: { type: String, required: true, unique: true, index: true },
  items: [StockItemSchema],
  lastRefresh: { type: Date, default: Date.now },
  nextRefresh: { type: Date, required: true },
}, { timestamps: true });

export const AlchemistStock = mongoose.model<AlchemistStockDocument>('AlchemistStock', AlchemistStockSchema);
export default AlchemistStock;
