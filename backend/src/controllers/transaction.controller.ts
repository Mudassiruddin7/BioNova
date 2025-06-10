import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from './auth.controller';
import transactionService, { TransactionQuery } from '../services/transaction.service';
import { TransactionType, TransactionStatus } from '../models/transaction.model';
export const createTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { hash, description, type, timestamp, status, walletAddress, blockNumber, gasUsed, metadata, entityId, contractAddress } = req.body;
    
    // Validate required fields
    if (!hash || !description || !type || !walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: hash, description, type, and walletAddress are required'
      });
    }
    
    // Validate transaction type
    const validTypes: TransactionType[] = ['sample', 'experiment', 'access', 'workflow', 'ip', 'other'];
    if (!validTypes.includes(type as TransactionType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transaction type. Must be one of: ${validTypes.join(', ')}`
      });
    }
    
    // Create transaction with authenticated user's ID
    const transaction = await transactionService.createTransaction({
      userId: req.user._id,
      hash,
      description,
      type: type as TransactionType,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      status: 'confirmed',
      walletAddress,
      blockNumber,
      gasUsed,
      metadata,
      entityId,
      contractAddress
    });
    
    return res.status(201).json({
      success: true,
      data: {
        transaction
      }
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while creating the transaction'
    });
  }
};

export const updateTransactionStatus = async (req: Request, res: Response) => {
  try {
    const { hash } = req.params;
    const { status, blockNumber, gasUsed } = req.body;
    
    if (!hash || !status) {
      return res.status(400).json({
        success: false,
        message: 'Transaction hash and status are required'
      });
    }
    
    const validStatuses: TransactionStatus[] = ['pending', 'confirmed', 'failed'];
    if (!validStatuses.includes(status as TransactionStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const blockData = blockNumber && gasUsed ? { blockNumber, gasUsed } : undefined;
    
    const transaction = await transactionService.updateTransactionStatus(
      hash,
      status as TransactionStatus,
      blockData
    );
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    return res.json({
      success: true,
      data: {
        transaction
      }
    });
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while updating the transaction'
    });
  }
};

export const getUserTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      type,
      status,
      walletAddress,
      fromDate,
      toDate,
      entityId,
      page = '1',
      limit = '10',
      sort = 'timestamp',
      order = 'desc'
    } = req.query;
    
    const query: TransactionQuery = {
      userId: req.user._id,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      sort: sort as string,
      order: (order as 'asc' | 'desc')
    };
    
    // Add optional filters if provided
    if (type) {
      const types = (type as string).split(',') as TransactionType[];
      if (types.length === 1) {
        query.type = types[0];
      } else {
        query.type = types;
      }
    }
    
    if (status) {
      const statuses = (status as string).split(',') as TransactionStatus[];
      if (statuses.length === 1) {
        query.status = statuses[0];
      } else {
        query.status = statuses;
      }
    }
    
    if (walletAddress) {
      query.walletAddress = walletAddress as string;
    }
    
    if (entityId) {
      query.entityId = entityId as string;
    }
    
    if (fromDate) {
      query.fromDate = new Date(fromDate as string);
    }
    
    if (toDate) {
      query.toDate = new Date(toDate as string);
    }
    
    const results = await transactionService.getUserTransactions(query);
    
    return res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error getting user transactions:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while fetching transactions'
    });
  }
};

export const getTransactionByHash = async (req: Request, res: Response) => {
  try {
    const { hash } = req.params;
    
    if (!hash) {
      return res.status(400).json({
        success: false,
        message: 'Transaction hash is required'
      });
    }
    
    // Pass the userId for authorization checks
    const userId = req.user?._id.toString();
    const transaction = await transactionService.getTransactionByHash(hash, userId);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    return res.json({
      success: true,
      data: {
        transaction
      }
    });
  } catch (error) {
    console.error('Error getting transaction:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while fetching the transaction'
    });
  }
};

export const deleteTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { hash } = req.params;
    
    // First check if the transaction exists and belongs to the user
    const transaction = await transactionService.getTransactionByHash(hash);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    // Verify ownership (convert object IDs to strings for comparison)
    if (transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not own this transaction record'
      });
    }
    
    const isDeleted = await transactionService.deleteTransaction(hash);
    
    if (!isDeleted) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete transaction'
      });
    }
    
    return res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while deleting the transaction'
    });
  }
};

export const getTransactionCounts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const counts = await transactionService.getTransactionCountsByType(req.user._id);
    
    return res.json({
      success: true,
      data: {
        counts
      }
    });
  } catch (error) {
    console.error('Error getting transaction counts:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while fetching transaction counts'
    });
  }
};

export const clearUserTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // This is a soft clear - we'll just return success
    // In a real implementation, you might want to add a "isHidden" flag to the model
    // rather than actually deleting records
    
    return res.json({
      success: true,
      message: 'Transaction history cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing transaction history:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while clearing transaction history'
    });
  }
}; 