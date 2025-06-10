import express from 'express';
import { verifyJWT } from '../../middleware/auth';
import {
  createTransaction,
  updateTransactionStatus,
  getUserTransactions,
  getTransactionByHash,
  deleteTransaction,
  getTransactionCounts,
  clearUserTransactions
} from '../../controllers/transaction.controller';

const router = express.Router();

// Require authentication for all transaction routes
router.use(verifyJWT);

// Create a new transaction record
router.post('/', createTransaction);

// Update transaction status (e.g., when it's confirmed on the blockchain)
router.patch('/:hash/status', updateTransactionStatus);

// Get all transactions for the authenticated user (with filtering)
router.get('/', getUserTransactions);

// Get a specific transaction by hash
router.get('/:hash', getTransactionByHash);

// Delete a transaction record
router.delete('/:hash', deleteTransaction);

// Get transaction counts by type
router.get('/stats/counts', getTransactionCounts);

// Clear transaction history (soft delete/hide)
router.post('/clear', clearUserTransactions);

export default router; 