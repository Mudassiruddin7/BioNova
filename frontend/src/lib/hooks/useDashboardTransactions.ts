'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { transactionAPI } from '@/lib/api';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';
export type TransactionType = 'sample' | 'experiment' | 'access' | 'workflow' | 'ip' | 'other';

export interface Transaction {
  hash: string;
  timestamp: string | Date;
  description?: string;
  type: TransactionType;
  status: TransactionStatus;
  from?: string;
  to?: string;
  value?: string;
  gas?: string;
  blockNumber?: number;
}

export interface TransactionFilter {
  page?: number;
  limit?: number;
  status?: TransactionStatus;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
}

export interface UseDashboardTransactionsResult {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  filters: TransactionFilter;
  updateFilters: (newFilters: TransactionFilter) => void;
  refreshTransactions: () => Promise<void>;
  totalTransactions: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  clearTransactions: () => Promise<void>;
  goToPage: (page: number) => void;
}

// Mock transactions for development/fallback
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    description: 'Sample Transaction',
    type: 'sample',
    status: 'confirmed',
    from: '0xabcdef1234567890abcdef1234567890abcdef12',
    to: '0x1234567890abcdef1234567890abcdef12345678',
    value: '0.5 ETH'
  },
  {
    hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    description: 'Experiment Verification',
    type: 'experiment',
    status: 'pending',
    from: '0x1234567890abcdef1234567890abcdef12345678',
    to: '0xabcdef1234567890abcdef1234567890abcdef12',
    value: '0.1 ETH'
  }
];

export function useDashboardTransactions(
  initialFilters: TransactionFilter = {}
): UseDashboardTransactionsResult {
  const { isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilter>(initialFilters);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialFilters.page || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(initialFilters.limit || 10);
  
  // Use a ref to track if the component is mounted
  const isMounted = useRef(false);
  // Use a ref to prevent multiple concurrent fetches
  const isFetching = useRef(false);

  const fetchTransactions = useCallback(async (newFilters?: TransactionFilter) => {
    if (!isAuthenticated || isFetching.current || !isMounted.current) return;
    
    isFetching.current = true;
    setIsLoading(true);
    setError(null);
    
    const updatedFilters = newFilters ? { ...filters, ...newFilters } : filters;
    if (newFilters) {
      setFilters(updatedFilters);
    }
    
    try {
      const response = await transactionAPI.getUserTransactions({
        status: updatedFilters.status || undefined,
        type: updatedFilters.type || undefined,
        page: updatedFilters.page || 1,
        limit: updatedFilters.limit || pageSize
      });
      
      if (isMounted.current) {
        // Extract data from the response properly
        let transactionData: Transaction[] = [];
        let total = 0;
        let pages = 1;
        let current = 1;
        let size = pageSize;
        
        // Handle different response structures
        if (response && response.data) {
          // API returns { success: true, data: { transactions, total, page, limit, totalPages } }
          const responseData = response.data;
          
          if (responseData.success && responseData.data) {
            // Handle the paginated response from backend
            if (responseData.data.transactions) {
              transactionData = responseData.data.transactions;
              total = responseData.data.total || transactionData.length;
              pages = responseData.data.totalPages || 1;
              current = responseData.data.page || 1;
              size = responseData.data.limit || pageSize;
            } 
            // Handle direct array in data
            else if (Array.isArray(responseData.data)) {
              transactionData = responseData.data;
              total = transactionData.length;
              pages = 1;
              current = 1;
            }
            // Handle single transaction object
            else if (responseData.data.hash) {
              transactionData = [responseData.data];
              total = 1;
              pages = 1;
              current = 1;
            }
          }
          // Direct data array without success wrapper
          else if (Array.isArray(responseData)) {
            transactionData = responseData;
            total = responseData.length;
            pages = 1;
            current = 1;
          }
        }
        // Direct array response
        else if (Array.isArray(response)) {
          transactionData = response;
          total = response.length;
          pages = 1;
          current = 1;
        }
        
        setTransactions(transactionData);
        setTotalTransactions(total);
        setTotalPages(pages);
        setCurrentPage(current);
        setPageSize(size);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      
      if (isMounted.current) {
        setIsLoading(false);
        setError(err?.message || 'Failed to fetch transaction history');
        
        // Fallback to mock data during development
        if (process.env.NODE_ENV === 'development') {
          setTransactions(MOCK_TRANSACTIONS);
          setTotalTransactions(MOCK_TRANSACTIONS.length);
          setTotalPages(1);
          setCurrentPage(1);
        }
      }
    } finally {
      if (isMounted.current) {
        isFetching.current = false;
      }
    }
  }, [filters, isAuthenticated, pageSize]);

  // Function to refresh transactions with current filters
  const refreshTransactions = useCallback(async () => {
    if (!isFetching.current && isMounted.current) {
      await fetchTransactions();
    }
  }, [fetchTransactions]);

  // Update filters and fetch transactions
  const updateFilters = useCallback((newFilters: TransactionFilter) => {
    if (!isFetching.current && isMounted.current) {
      fetchTransactions(newFilters);
    }
  }, [fetchTransactions]);

  // Go to a specific page
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      updateFilters({ ...filters, page });
    }
  }, [updateFilters, filters, totalPages, currentPage]);

  // Clear transactions
  const clearTransactions = useCallback(async () => {
    if (!isAuthenticated || !isMounted.current) return;
    
    try {
      await transactionAPI.clearTransactions();
      if (isMounted.current) {
        setTransactions([]);
        setTotalTransactions(0);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (err: any) {
      console.error('Error clearing transactions:', err);
      if (isMounted.current) {
        setError(err?.message || 'Failed to clear transaction history');
      }
    }
  }, [isAuthenticated]);

  // Track initial mount
  const initialFetchComplete = useRef(false);

  // Set up mount state
  useEffect(() => {
    isMounted.current = true;
    
    // Initial data fetch - only on first mount or auth change
    if (isAuthenticated && !initialFetchComplete.current && !isFetching.current) {
      initialFetchComplete.current = true;
      fetchTransactions();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [isAuthenticated]); // Remove fetchTransactions from dependencies

  return {
    transactions,
    isLoading,
    error,
    filters,
    updateFilters,
    refreshTransactions,
    totalTransactions,
    currentPage,
    totalPages,
    pageSize,
    clearTransactions,
    goToPage
  };
} 