import mongoose, { Schema, Document } from 'mongoose';

export type TransactionType =
  | 'earn'          // Earned coins (from XP, daily, missions)
  | 'spend'         // Spent on shop
  | 'transfer_out'  // Transferred to another user
  | 'transfer_in'   // Received from another user
  | 'lottery_win'   // Won lottery
  | 'admin';        // Admin adjustment

export interface ITransaction {
  discordId: string;
  type: TransactionType;
  amount: number;              // Positive for gains, negative for losses
  balance: number;             // Balance after transaction
  description: string;
  relatedUserId: string | null; // For transfers
  relatedItemId: string | null; // For purchases
  createdAt: Date;
}

export interface TransactionDocument extends Omit<ITransaction, '_id'>, Document {}

const TransactionSchema = new Schema<TransactionDocument>({
  discordId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['earn', 'spend', 'transfer_out', 'transfer_in', 'lottery_win', 'admin'],
  },
  amount: {
    type: Number,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  relatedUserId: {
    type: String,
    default: null,
  },
  relatedItemId: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Index for user transactions history
TransactionSchema.index({ discordId: 1, createdAt: -1 });

export const Transaction = mongoose.model<TransactionDocument>('Transaction', TransactionSchema);
export default Transaction;
