import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './user.model';

export type TransactionType = 'sample' | 'experiment' | 'access' | 'workflow' | 'ip' | 'other';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface TransactionDocument extends Document {
  userId: mongoose.Types.ObjectId | IUser;
  hash: string;
  description: string;
  type: TransactionType;
  timestamp: Date;
  status: TransactionStatus;
  walletAddress: string;
  blockNumber?: number;
  gasUsed?: number;
  metadata?: Record<string, any>;
  entityId?: string; // Reference to the entity (sample ID, experiment ID, etc.)
  contractAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['sample', 'experiment', 'access', 'workflow', 'ip', 'other'],
      default: 'other',
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'pending',
      required: true,
      index: true,
    },
    walletAddress: {
      type: String,
      required: true,
      index: true,
    },
    blockNumber: {
      type: Number,
    },
    gasUsed: {
      type: Number,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    entityId: {
      type: String,
      index: true,
    },
    contractAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Add compound index for efficient user-specific queries
TransactionSchema.index({ userId: 1, timestamp: -1 });
TransactionSchema.index({ userId: 1, type: 1, timestamp: -1 });

export const Transaction = mongoose.model<TransactionDocument>('Transaction', TransactionSchema); 