// Model de Banco do Reino
import mongoose, { Document, Schema } from 'mongoose';

export type TransactionType = 'deposit' | 'withdrawal' | 'interest' | 'loan' | 'loan_payment' | 'transfer_in' | 'transfer_out';

export interface BankTransaction {
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  relatedUserId?: string;
  timestamp: Date;
}

export interface StoredItem {
  itemType: 'equipment' | 'material' | 'consumable';
  itemId: string;
  itemName: string;
  quantity: number;
  itemData?: any;
  storedAt: Date;
}

export interface IBank {
  discordId: string;
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalInterestEarned: number;
  currentLoan: number;
  loanDueDate?: Date;
  loanInterestAccrued: number;
  totalLoansTaken: number;
  storedItems: StoredItem[];
  maxStorageSlots: number;
  transactions: BankTransaction[];
  lastInterestClaim: Date;
  trustLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankDocument extends IBank, Document {}

const bankTransactionSchema = new Schema<BankTransaction>({
  type: { type: String, required: true, enum: ['deposit', 'withdrawal', 'interest', 'loan', 'loan_payment', 'transfer_in', 'transfer_out'] },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  description: { type: String, required: true },
  relatedUserId: { type: String },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const storedItemSchema = new Schema<StoredItem>({
  itemType: { type: String, required: true, enum: ['equipment', 'material', 'consumable'] },
  itemId: { type: String, required: true },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  itemData: { type: Schema.Types.Mixed },
  storedAt: { type: Date, default: Date.now },
}, { _id: false });

const bankSchema = new Schema<BankDocument>(
  {
    discordId: { type: String, required: true, unique: true, index: true },
    balance: { type: Number, default: 0, min: 0 },
    totalDeposited: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    totalInterestEarned: { type: Number, default: 0 },
    currentLoan: { type: Number, default: 0 },
    loanDueDate: { type: Date },
    loanInterestAccrued: { type: Number, default: 0 },
    totalLoansTaken: { type: Number, default: 0 },
    storedItems: [storedItemSchema],
    maxStorageSlots: { type: Number, default: 5 },
    transactions: [bankTransactionSchema],
    lastInterestClaim: { type: Date, default: Date.now },
    trustLevel: { type: Number, default: 1, min: 0, max: 10 },
  },
  { timestamps: true }
);

export const Bank = mongoose.model<BankDocument>('Bank', bankSchema);
export default Bank;
