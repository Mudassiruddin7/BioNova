'use client';

import React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ExternalLink, AlertCircle, Clock, CheckCircle, XCircle, 
  Filter, ArrowLeft, ArrowRight, Loader2, DownloadCloud, RefreshCw,
  Calendar, ChevronDown, ChevronUp, X, Wallet
} from 'lucide-react';
import { useTransactionHistory, TransactionType, TransactionStatus, Transaction } from '@/lib/hooks/useTransactionHistory';
import { useAuth } from '@/lib/hooks/useAuth';
import { useChainSightStore } from '@/lib/stores/chainSightStore';
import { transactionAPI } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface TransactionHistoryProps {
  compact?: boolean;
  limit?: number;
  showFilters?: boolean;
}

// Format date for CSV export
const formatDate = (date: Date) => {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Map of transaction types to friendly names
const typeLabels: Record<TransactionType, string> = {
  sample: 'Sample',
  experiment: 'Experiment',
  access: 'Access Control',
  workflow: 'Workflow',
  ip: 'IP Rights',
  other: 'Other'
};

// Map of status to icons
const statusIcons: Record<TransactionStatus, React.ReactElement> = {
  pending: <Clock className="h-3.5 w-3.5 text-yellow-400" />,
  confirmed: <CheckCircle className="h-3.5 w-3.5 text-green-400" />,
  failed: <XCircle className="h-3.5 w-3.5 text-red-400" />
};

// Map of status to colors
const statusColors: Record<TransactionStatus, string> = {
  pending: 'text-yellow-400',
  confirmed: 'text-green-400',
  failed: 'text-red-400'
};

// Map of type to colors
const typeColors: Record<TransactionType, string> = {
  sample: 'bg-blue-900/30 text-blue-300',
  experiment: 'bg-purple-900/30 text-purple-300',
  access: 'bg-green-900/30 text-green-300',
  workflow: 'bg-amber-900/30 text-amber-300',
  ip: 'bg-pink-900/30 text-pink-300',
  other: 'bg-gray-900/30 text-gray-300'
};

export const TransactionHistory = ({ 
  compact = false, 
  limit,
  showFilters = true 
}: TransactionHistoryProps) => {
  const { transactionHistory, clearTransactionHistory, wallet, syncWithBackend } = useChainSightStore();
  const { isAuthenticated } = useAuth();
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [exportLoading, setExportLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTransactionCountRef = useRef<number>(0);
  
  // Use our custom hook for transaction history
  const {
    transactions,
    isLoading,
    error,
    totalTransactions,
    currentPage,
    totalPages,
    pageSize,
    fetchTransactions,
    goToPage,
    clearTransactionHistory: clearBackendHistory,
    counts,
    loadingCounts,
    fetchCounts
  } = useTransactionHistory({
    limit: limit || 10, 
    type: typeFilter !== 'all' ? typeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    fromDate: fromDate ? new Date(fromDate) : undefined,
    toDate: toDate ? new Date(toDate) : undefined
  });
  
  // Check for new transactions and refresh when needed
  useEffect(() => {
    // Update our ref for transaction count tracking
    if (transactionHistory.length !== lastTransactionCountRef.current) {
      console.log(`Transaction count changed: ${lastTransactionCountRef.current} -> ${transactionHistory.length}`);
      lastTransactionCountRef.current = transactionHistory.length;
      
      // Force a refresh when transaction count changes
      if (!isLoading && isAuthenticated) {
        console.log('Refreshing transaction display due to count change');
        fetchTransactions();
        fetchCounts();
      }
    }
  }, [transactionHistory.length, isLoading, isAuthenticated, fetchTransactions, fetchCounts]);
  
  // Setup periodic polling for transaction updates
  useEffect(() => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    
    // Only poll when auto-refresh is enabled and the user is authenticated with a connected wallet
    if (autoRefresh && isAuthenticated && wallet.isConnected) {
      console.log('Setting up transaction auto-refresh timer');
      
      refreshTimerRef.current = setInterval(() => {
        // Check if we have any pending transactions that need updating
        const hasPendingTransactions = transactions.some(tx => tx.status === 'pending');
        
        if (hasPendingTransactions) {
          console.log('Auto-refreshing pending transactions');
          syncWithBackend().then(() => {
            fetchTransactions();
            fetchCounts();
          }).catch(error => {
            console.error('Error during auto-refresh:', error);
          });
        }
      }, 5000); // Poll every 5 seconds for pending transaction updates
    }
    
    // Cleanup on unmount or when dependencies change
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [autoRefresh, isAuthenticated, wallet.isConnected, transactions, syncWithBackend, fetchTransactions, fetchCounts]);
  
  // Reload data when filters change
  const applyFilters = useCallback(() => {
    fetchTransactions({
      type: typeFilter !== 'all' ? typeFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      page: 1 // Reset to first page when filters change
    });
    setShowFiltersPanel(false);
  }, [fetchTransactions, typeFilter, statusFilter, fromDate, toDate]);
  
  // Refresh data
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncWithBackend();
      await fetchTransactions();
      await fetchCounts();
    } catch (error) {
      console.error('Error refreshing transaction data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [syncWithBackend, fetchTransactions, fetchCounts]);
  
  // Initial data load and automatic refresh
  useEffect(() => {
    let isMounted = true;
    
    const initData = async () => {
      if (isAuthenticated && wallet.isConnected && isMounted) {
        // Initial sync and fetch
        await syncWithBackend();
        await fetchTransactions();
        await fetchCounts();
        
        // Force another refresh after 2 seconds to catch any new transactions
        setTimeout(async () => {
          if (isMounted) {
            try {
              await syncWithBackend();
              await fetchTransactions();
            } catch (error) {
              console.error('Error during delayed refresh:', error);
            }
          }
        }, 2000);
      }
    };
    
    initData();
    
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, wallet.isConnected, syncWithBackend, fetchTransactions, fetchCounts]);
  
  // Export transactions as CSV
  const exportToCsv = useCallback(async () => {
    if (transactions.length === 0) {
      alert('No transactions available to export');
      return;
    }
    
    setExportLoading(true);
    
    try {
      // Use the transactionAPI directly for better type safety
      const response = await transactionAPI.getUserTransactions({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate: toDate ? new Date(toDate) : undefined,
        limit: 1000 // Get a large batch for export
      });
      
      const exportTransactions = response.data.data.transactions;
      
      if (exportTransactions.length === 0) {
        alert('No transactions found to export with current filters');
        return;
      }
      
      // Convert to CSV
      const headers = ['Hash', 'Description', 'Type', 'Status', 'Time', 'Block Number', 'Gas Used'];
      const csvContent = [
        headers.join(','),
        ...exportTransactions.map((tx: Transaction) => [
          `"${tx.hash}"`,
          `"${tx.description.replace(/"/g, '""')}"`,
          `"${tx.type}"`,
          `"${tx.status}"`,
          `"${formatDate(new Date(tx.timestamp instanceof Date ? tx.timestamp.getTime() : tx.timestamp))}"`,
          tx.blockNumber || '',
          tx.gasUsed || ''
        ].join(','))
      ].join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `blockchain-transactions-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting transactions:', error);
      alert('Failed to export transactions. Please try again.');
    } finally {
      setExportLoading(false);
    }
  }, [transactions.length, typeFilter, statusFilter, fromDate, toDate]);
  
  // Reset all filters
  const resetFilters = useCallback(() => {
    setTypeFilter('all');
    setStatusFilter('all');
    setFromDate('');
    setToDate('');
    fetchTransactions({ page: 1 });
  }, [fetchTransactions]);
  
  // Calculate date range for "Last 30 days", "Last 7 days", etc.
  const setDateRange = useCallback((days: number) => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    
    const startDate = new Date();
    startDate.setDate(today.getDate() - days);
    const formattedStartDate = startDate.toISOString().split('T')[0];
    
    setFromDate(formattedStartDate);
    setToDate(endDate);
  }, []);
  
  // Handle clear history
  const handleClearHistory = useCallback(async () => {
    if (transactions.length === 0) return;
  
    if (!confirm('Are you sure you want to clear your transaction history?')) {
      return;
    }
    
    try {
      if (isAuthenticated) {
        await clearBackendHistory();
      }
      clearTransactionHistory();
    } catch (error) {
      console.error('Error clearing transaction history:', error);
      alert('Failed to clear transaction history. Please try again.');
    }
  }, [isAuthenticated, clearBackendHistory, clearTransactionHistory, transactions.length]);
  
  // Early return with a friendly UI if wallet isn't connected
  if (!wallet.isConnected) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-white">Blockchain Transaction History</h2>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-indigo-500/20 rounded-lg bg-black/20">
          <div className="h-16 w-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-3">
            <Wallet className="h-8 w-8 text-indigo-400/60" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Wallet Not Connected</h3>
          <p className="text-gray-400 text-sm max-w-md text-center mb-4">
            Connect your wallet to view your blockchain transaction history and interact with the Base network.
          </p>

        </div>
      </div>
    );
  }
  
  // If wallet is connected but we still have an error fetching data
  if (error && !isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-white">Blockchain Transaction History</h2>
          <Button 
            onClick={handleRefresh}
            className="p-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-white rounded-md border border-indigo-500/30 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        <div className="rounded-lg border border-red-500/30 bg-red-900/10 p-5 flex flex-col items-center">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-300 text-sm font-medium">Error Fetching Transaction Data</p>
          </div>
          <p className="text-gray-400 text-xs mb-3 text-center">
            There was a problem retrieving your transaction history. Please try again later.
          </p>
          <Button 
            onClick={handleRefresh}
            className="bg-indigo-600/30 hover:bg-indigo-600/50 text-white text-xs px-3 py-1 rounded-md border border-indigo-500/30 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold text-white">Blockchain Transaction History</h2>
        <div className="flex space-x-1.5">
          <button 
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className="p-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-white rounded-md border border-indigo-500/30 transition-colors flex items-center text-xs"
          >
            <Filter className="h-3.5 w-3.5 mr-1" />
            Filters
            {showFiltersPanel ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
          </button>
          <button 
            onClick={handleRefresh}
            disabled={isLoading || refreshing}
            className="p-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-white rounded-md border border-indigo-500/30 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {!showFiltersPanel && counts && Object.keys(counts).length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-indigo-700 scrollbar-track-transparent">
          {Object.entries(counts).map(([type, count]) => (
            <button 
              key={type}
              className={`px-2 py-1 rounded-md text-xs whitespace-nowrap ${
                typeFilter === type 
                  ? 'bg-indigo-700 text-white border-indigo-500' 
                  : 'bg-indigo-900/20 text-gray-300 border-gray-700 hover:bg-indigo-900/30'
              } border transition-colors flex items-center gap-1`}
              onClick={() => {
                setTypeFilter(typeFilter === type as TransactionType ? 'all' : type as TransactionType);
                fetchTransactions({
                  type: typeFilter === type as TransactionType ? undefined : type as TransactionType,
                  status: statusFilter !== 'all' ? statusFilter : undefined,
                  page: 1
                });
              }}
            >
              {typeLabels[type as TransactionType]}
              <span className={`${typeFilter === type ? 'bg-indigo-800' : 'bg-indigo-950'} px-1.5 py-0.5 rounded-sm`}>
                {count}
              </span>
            </button>
          ))}
          <button 
            className={`px-2 py-1 rounded-md text-xs whitespace-nowrap ${
              typeFilter === 'all' 
                ? 'bg-indigo-700 text-white border-indigo-500' 
                : 'bg-indigo-900/20 text-gray-300 border-gray-700 hover:bg-indigo-900/30'
            } border transition-colors flex items-center gap-1`}
            onClick={() => {
              setTypeFilter('all');
              fetchTransactions({ type: undefined, page: 1 });
            }}
          >
            All Types
            <span className={`${typeFilter === 'all' ? 'bg-indigo-800' : 'bg-indigo-950'} px-1.5 py-0.5 rounded-sm`}>
              {Object.values(counts).reduce((sum, count) => sum + count, 0)}
            </span>
          </button>
        </div>
      )}
      
      {showFilters && showFiltersPanel && (
        <div className="bg-black/30 rounded-md p-3 border border-gray-800 mb-3 animate-in fade-in">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-indigo-300">Advanced Filters</h3>
            <button 
              onClick={() => setShowFiltersPanel(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Transaction Type</label>
                <select
                  value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TransactionType | 'all')}
                className="w-full bg-black/50 text-white text-xs rounded-md px-2 py-1.5 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Types</option>
                  <option value="sample">Samples</option>
                  <option value="experiment">Experiments</option>
                  <option value="access">Access Control</option>
                  <option value="workflow">Workflow</option>
                  <option value="ip">IP Rights</option>
                  <option value="other">Other</option>
                </select>
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TransactionStatus | 'all')}
                className="w-full bg-black/50 text-white text-xs rounded-md px-2 py-1.5 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="failed">Failed</option>
              </select>
                </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">From Date</label>
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-black/50 text-white text-xs rounded-md px-2 py-1.5 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">To Date</label>
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-black/50 text-white text-xs rounded-md px-2 py-1.5 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button
              onClick={() => setDateRange(7)}
              className="px-2 py-0.5 bg-indigo-900/30 hover:bg-indigo-900/50 text-xs text-white rounded border border-indigo-800/50"
            >
              Last 7 days
            </button>
            <button
              onClick={() => setDateRange(30)}
              className="px-2 py-0.5 bg-indigo-900/30 hover:bg-indigo-900/50 text-xs text-white rounded border border-indigo-800/50"
            >
              Last 30 days
            </button>
            <button
              onClick={() => setDateRange(90)}
              className="px-2 py-0.5 bg-indigo-900/30 hover:bg-indigo-900/50 text-xs text-white rounded border border-indigo-800/50"
            >
              Last 90 days
            </button>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={resetFilters}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-md transition-colors"
            >
              Reset
            </button>
            <button
              onClick={applyFilters}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md transition-colors"
            >
              Apply Filters
            </button>
              </div>
            </div>
          )}
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-6 border border-dashed border-indigo-500/20 rounded-lg bg-black/20">
          <Loader2 className="h-6 w-6 text-indigo-400 animate-spin mb-2" />
          <p className="text-gray-400 text-xs">Loading transaction history...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 border border-dashed border-indigo-500/20 rounded-lg bg-black/20">
          <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-2">
            <AlertCircle className="h-6 w-6 text-indigo-400" />
          </div>
          <h3 className="text-base font-medium text-white mb-1">No transaction history available</h3>
          <p className="text-gray-500 text-xs">Try adjusting your filters or connect a different wallet</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg overflow-hidden border border-indigo-500/30">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-indigo-950/50 border-b border-indigo-500/20">
                  <th className="font-medium p-2 text-left text-indigo-200">Transaction</th>
                  {!compact && <th className="font-medium p-2 text-left text-indigo-200">Type</th>}
                  <th className="font-medium p-2 text-left text-indigo-200">Hash</th>
                  <th className="font-medium p-2 text-left text-indigo-200">Time</th>
                  <th className="font-medium p-2 text-left text-indigo-200">Status</th>
                  <th className="font-medium p-2 text-left text-indigo-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  // Ensure type safety for the transaction object
                  const type = tx.type as TransactionType;
                  const status = tx.status as TransactionStatus;
                  
                  return (
                    <tr key={tx.hash} className="border-b border-indigo-500/10 hover:bg-indigo-900/20">
                      <td className="p-2 align-middle text-white">
                        {type === 'sample' && 'Registered Sample: '}
                        {type === 'experiment' && 'Registered Experiment for Specimen: '}
                        {type === 'ip' && 'Registered IP: '}
                        {type === 'access' && 'Registered Access: '}
                        {type === 'workflow' && 'Registered Workflow: '}
                        <span className="text-indigo-300">
                          {tx.description.replace('Registered Sample: ', '')
                                         .replace('Registered Experiment for Specimen: ', '')
                                         .replace('Registered IP: ', '')
                                         .replace('Registered Access: ', '')
                                         .replace('Registered Workflow: ', '')}
                        </span>
                      </td>
                      {!compact && (
                        <td className="p-2 align-middle">
                          <span className="px-2 py-1 rounded-sm text-xs font-medium bg-opacity-30" 
                                style={{ 
                                  backgroundColor: type === 'sample' ? '#1e40af' : 
                                                  type === 'experiment' ? '#7e22ce' : 
                                                  type === 'ip' ? '#be185d' :
                                                  type === 'access' ? '#047857' :
                                                  type === 'workflow' ? '#b45309' : '#374151',
                                  color: type === 'sample' ? '#93c5fd' : 
                                        type === 'experiment' ? '#d8b4fe' : 
                                        type === 'ip' ? '#f9a8d4' :
                                        type === 'access' ? '#6ee7b7' :
                                        type === 'workflow' ? '#fcd34d' : '#d1d5db'
                                }}>
                            {typeLabels[type]}
                          </span>
                        </td>
                      )}
                      <td className="p-2 align-middle font-mono text-xs text-indigo-300">
                        {`0x${tx.hash.slice(0, 5)}...${tx.hash.slice(-3)}`}
                      </td>
                      <td className="p-2 align-middle text-xs text-indigo-300/70">
                        {new Date(tx.timestamp instanceof Date ? tx.timestamp.getTime() : tx.timestamp).toLocaleString('en-US', {
                          month: 'numeric',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </td>
                      <td className="p-2 align-middle">
                        {status === 'confirmed' && (
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="ml-1 text-xs text-green-400">Confirmed</span>
                          </div>
                        )}
                        {status === 'pending' && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-yellow-400" />
                            <span className="ml-1 text-xs text-yellow-400">Pending</span>
                          </div>
                        )}
                        {status === 'failed' && (
                          <div className="flex items-center">
                            <XCircle className="h-4 w-4 text-red-400" />
                            <span className="ml-1 text-xs text-red-400">Failed</span>
                          </div>
                        )}
                      </td>
                      <td className="p-2 align-middle">
                        <a 
                          href={`https://sepolia.basescan.org/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-300 hover:text-indigo-200 flex items-center"
                        >
                          <span className="text-xs">View</span>
                          <ExternalLink className="h-3 w-3 ml-0.5" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="flex justify-between items-center px-4 py-2 border-t border-indigo-500/20 bg-indigo-950/30">
              <div className="text-xs text-indigo-300/70">
                Showing {transactions.length} of {totalTransactions} transactions
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    className={`px-2 py-1 rounded-sm text-xs ${
                      currentPage === 1 ? 'text-gray-600 cursor-not-allowed' : 'text-indigo-300 hover:text-indigo-200 bg-indigo-800/30 hover:bg-indigo-800/50'
                    }`}
                  >
                    <span className="flex items-center">
                      <ArrowLeft className="h-3 w-3 mr-1" />
                      Page {currentPage} of {totalPages}
                    </span>
                  </button>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    className={`px-2 py-1 rounded-sm text-xs ml-2 ${
                      currentPage === totalPages ? 'text-gray-600 cursor-not-allowed' : 'text-indigo-300 hover:text-indigo-200 bg-indigo-800/30 hover:bg-indigo-800/50'
                    }`}
                  >
                    <span className="flex items-center">
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </span>
                  </button>
                </div>
                <button 
                  className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-white text-xs rounded-sm border border-red-500/30 transition-colors"
                  onClick={handleClearHistory}
                  disabled={transactions.length === 0}
                >
                  Clear History
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}; 