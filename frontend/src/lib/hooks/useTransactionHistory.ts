import { useState, useCallback, useEffect } from 'react';
import { transactionAPI } from '../api';
import { useAuth } from './useAuth';

export type TransactionType = 'sample' | 'experiment' | 'access' | 'workflow' | 'ip' | 'other';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface Transaction {
  _id?: string;
  hash: string;
  description: string;
  type: TransactionType;
  timestamp: number | Date;
  status: TransactionStatus;
  walletAddress: string;
  blockNumber?: number;
  gasUsed?: number;
  metadata?: Record<string, any>;
  entityId?: string;
  contractAddress?: string;
}

export interface TransactionFilter {
  type?: TransactionType | TransactionType[];
  status?: TransactionStatus | TransactionStatus[];
  walletAddress?: string;
  fromDate?: Date;
  toDate?: Date;
  entityId?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface TransactionCounts {
  sample: number;
  experiment: number;
  access: number;
  workflow: number;
  ip: number;
  other: number;
}

export interface UseTransactionHistoryResult {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  totalTransactions: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  createTransaction: (transaction: Omit<Transaction, '_id'>) => Promise<Transaction>;
  updateTransactionStatus: (hash: string, status: TransactionStatus, blockData?: { blockNumber: number; gasUsed: number }) => Promise<Transaction | null>;
  fetchTransactions: (filters?: TransactionFilter) => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  clearTransactionHistory: () => Promise<void>;
  counts: TransactionCounts | null;
  loadingCounts: boolean;
  fetchCounts: () => Promise<void>;
}

export function useTransactionHistory(initialFilters?: TransactionFilter): UseTransactionHistoryResult {
  const { isAuthenticated } = useAuth();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialFilters?.page || 1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(initialFilters?.limit || 10);
  const [filters, setFilters] = useState<TransactionFilter>(initialFilters || {});
  const [counts, setCounts] = useState<TransactionCounts | null>(null);
  const [loadingCounts, setLoadingCounts] = useState<boolean>(false);
  
  // Fetch transaction counts by type
  const fetchCounts = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoadingCounts(true);
    setError(null);
    
    try {
      const response = await transactionAPI.getTransactionCounts();
      setCounts(response.data.data.counts);
    } catch (err) {
      console.error('Error fetching transaction counts:', err);
      setError('Failed to load transaction counts');
    } finally {
      setLoadingCounts(false);
    }
  }, [isAuthenticated]);
  
  // Fetch transactions with filters
  const fetchTransactions = useCallback(async (newFilters?: TransactionFilter) => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Update filters if new ones are provided
      const currentFilters = newFilters ? { ...filters, ...newFilters } : filters;
      setFilters(currentFilters);
      
      // If page is provided, update current page
      if (newFilters?.page) {
        setCurrentPage(newFilters.page);
      }
      
      // If limit is provided, update page size
      if (newFilters?.limit) {
        setPageSize(newFilters.limit);
      }
      
      const response = await transactionAPI.getUserTransactions({
        ...currentFilters,
        page: newFilters?.page || currentPage,
        limit: newFilters?.limit || pageSize
      });
      
      const { transactions, total, page, limit, totalPages } = response.data.data;
      
      setTransactions(transactions);
      setTotalTransactions(total);
      setCurrentPage(page);
      setPageSize(limit);
      setTotalPages(totalPages);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transaction history');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, filters, currentPage, pageSize]);
  
  // Go to a specific page
  const goToPage = useCallback(async (page: number) => {
    if (page < 1 || page > totalPages) return;
    
    await fetchTransactions({ ...filters, page });
  }, [fetchTransactions, filters, totalPages]);
  
  // Create a new transaction
  const createTransaction = useCallback(async (transaction: Omit<Transaction, '_id'>): Promise<Transaction> => {
    try {
      const response = await transactionAPI.createTransaction(transaction);
      // Refresh transactions if needed
      fetchTransactions();
      return response.data.data.transaction;
    } catch (err) {
      console.error('Error creating transaction:', err);
      throw err;
    }
  }, [fetchTransactions]);
  
  // Update transaction status
  const updateTransactionStatus = useCallback(async (
    hash: string, 
    status: TransactionStatus, 
    blockData?: { blockNumber: number; gasUsed: number }
  ): Promise<Transaction | null> => {
    try {
      const response = await transactionAPI.updateTransactionStatus(hash, status, blockData);
      
      // Update transaction in local state
      setTransactions(prevTransactions => 
        prevTransactions.map(tx => 
          tx.hash === hash 
            ? { ...tx, status, ...(blockData || {}) } 
            : tx
        )
      );
      
      return response.data.data.transaction;
    } catch (err) {
      console.error('Error updating transaction status:', err);
      return null;
    }
  }, []);
  
  // Clear transaction history
  const clearTransactionHistory = useCallback(async () => {
    try {
      await transactionAPI.clearTransactions();
      
      // Clear local state
      setTransactions([]);
      setTotalTransactions(0);
      setCurrentPage(1);
      setTotalPages(1);
      
      // Refresh counts
      fetchCounts();
      
      return Promise.resolve();
    } catch (err) {
      console.error('Error clearing transaction history:', err);
      setError('Failed to clear transaction history');
      return Promise.reject(err);
    }
  }, [fetchCounts]);
  
  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions();
      fetchCounts();
    }
  }, [isAuthenticated, fetchTransactions, fetchCounts]);
  
  return {
    transactions,
    isLoading,
    error,
    totalTransactions,
    currentPage,
    totalPages,
    pageSize,
    createTransaction,
    updateTransactionStatus,
    fetchTransactions,
    goToPage,
    clearTransactionHistory,
    counts,
    loadingCounts,
    fetchCounts
  };
} 