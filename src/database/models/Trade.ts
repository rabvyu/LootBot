// Model de Trading P2P
import mongoose, { Document, Schema } from 'mongoose';

export type TradeStatus = 'pending' | 'negotiating' | 'confirmed' | 'completed' | 'cancelled' | 'expired' | 'declined';

export interface TradeItem {
  itemType: 'equipment' | 'material' | 'consumable';
  itemId: string;
  itemName: string;
  quantity: number;
  itemData?: any;
}

export interface ITrade {
  tradeId: string;
  initiatorId: string;
  initiatorName: string;
  targetId: string;
  targetName: string;
  initiatorItems: TradeItem[];
  targetItems: TradeItem[];
  initiatorCoins: number;
  targetCoins: number;
  initiatorConfirmed: boolean;
  targetConfirmed: boolean;
  status: TradeStatus;
  expiresAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TradeDocument extends ITrade, Document {}

const tradeItemSchema = new Schema<TradeItem>({
  itemType: { type: String, required: true, enum: ['equipment', 'material', 'consumable'] },
  itemId: { type: String, required: true },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  itemData: { type: Schema.Types.Mixed },
}, { _id: false });

const tradeSchema = new Schema<TradeDocument>(
  {
    tradeId: { type: String, required: true, unique: true, index: true },
    initiatorId: { type: String, required: true, index: true },
    initiatorName: { type: String, required: true },
    targetId: { type: String, required: true, index: true },
    targetName: { type: String, required: true },
    initiatorItems: [tradeItemSchema],
    targetItems: [tradeItemSchema],
    initiatorCoins: { type: Number, default: 0, min: 0 },
    targetCoins: { type: Number, default: 0, min: 0 },
    initiatorConfirmed: { type: Boolean, default: false },
    targetConfirmed: { type: Boolean, default: false },
    status: { type: String, required: true, enum: ['pending', 'negotiating', 'confirmed', 'completed', 'cancelled', 'expired', 'declined'], default: 'pending', index: true },
    expiresAt: { type: Date, required: true },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Índices
tradeSchema.index({ status: 1, expiresAt: 1 });
tradeSchema.index({ initiatorId: 1, status: 1 });
tradeSchema.index({ targetId: 1, status: 1 });

export const Trade = mongoose.model<TradeDocument>('Trade', tradeSchema);
export default Trade;
