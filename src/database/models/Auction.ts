// Model de Leilão
import mongoose, { Document, Schema } from 'mongoose';

export type AuctionItemType = 'equipment' | 'material' | 'consumable';
export type AuctionStatus = 'active' | 'sold' | 'expired' | 'cancelled';

export interface AuctionBid {
  bidderId: string;
  bidderName: string;
  amount: number;
  bidAt: Date;
}

export interface IAuction {
  listingId: string;
  sellerId: string;
  sellerName: string;
  itemType: AuctionItemType;
  itemId: string;
  itemName: string;
  itemRarity: string;
  itemLevel: number;
  itemStats?: any;
  quantity: number;
  itemData: any;
  startingBid: number;
  buyoutPrice?: number;
  currentBid: number;
  currentBidderId?: string;
  currentBidderName?: string;
  bids: AuctionBid[];
  duration: 24 | 48 | 72;
  listingFee: number;
  expiresAt: Date;
  status: AuctionStatus;
  soldAt?: Date;
  soldPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuctionDocument extends IAuction, Document {}

const auctionBidSchema = new Schema<AuctionBid>({
  bidderId: { type: String, required: true },
  bidderName: { type: String, required: true },
  amount: { type: Number, required: true },
  bidAt: { type: Date, default: Date.now },
}, { _id: false });

const auctionSchema = new Schema<AuctionDocument>(
  {
    listingId: { type: String, required: true, unique: true, index: true },
    sellerId: { type: String, required: true, index: true },
    sellerName: { type: String, required: true },
    itemType: { type: String, required: true, enum: ['equipment', 'material', 'consumable'] },
    itemId: { type: String, required: true },
    itemName: { type: String, required: true },
    itemRarity: { type: String, required: true },
    itemLevel: { type: Number, default: 1 },
    itemStats: { type: Schema.Types.Mixed },
    quantity: { type: Number, default: 1 },
    itemData: { type: Schema.Types.Mixed },
    startingBid: { type: Number, required: true, min: 1 },
    buyoutPrice: { type: Number },
    currentBid: { type: Number, default: 0 },
    currentBidderId: { type: String },
    currentBidderName: { type: String },
    bids: [auctionBidSchema],
    duration: { type: Number, required: true, enum: [24, 48, 72] },
    listingFee: { type: Number, required: true },
    expiresAt: { type: Date, required: true, index: true },
    status: { type: String, required: true, enum: ['active', 'sold', 'expired', 'cancelled'], default: 'active', index: true },
    soldAt: { type: Date },
    soldPrice: { type: Number },
  },
  { timestamps: true }
);

// Índices compostos
auctionSchema.index({ status: 1, expiresAt: 1 });
auctionSchema.index({ status: 1, itemType: 1 });
auctionSchema.index({ sellerId: 1, status: 1 });

export const Auction = mongoose.model<AuctionDocument>('Auction', auctionSchema);
export default Auction;
