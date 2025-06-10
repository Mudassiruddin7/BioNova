import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import mockGenomicData from '@/lib/data/mockGenomicData';
import { transactionAPI } from '../api';

export type ExperimentType = 'prediction' | 'sensor' | 'manual';
export type ViewMode = 'grid' | 'helix';
export type SortOrder = 'newest' | 'oldest' | 'recordId';
export type TransactionType = 'sample' | 'experiment' | 'access' | 'workflow' | 'ip' | 'other';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface GenomicRecord {
  id: string;
  experimentType: ExperimentType;
  timestamp: number;
  loggedBy: string;
  blockNumber: number;
  txHash: string;
  geneSequence: {
    original: string;
    edited: string;
  };
  metadata: Record<string, any>;
  notes?: string;
  ipfsLink?: string;
  relatedRecords?: string[];
}

export interface Transaction {
  hash: string;
  timestamp: number;
  description: string;
  type: TransactionType;
  status: TransactionStatus;
  blockNumber?: number;
  gasUsed?: number;
  entityId?: string;
}

export interface WalletState {
  address: string;
  isConnected: boolean;
  provider?: any;
}

interface ChainSightState {
  // UI States
  isSequencerOpen: boolean;
  isMicroscopeOpen: boolean;
  isSettingsOpen: boolean;
  activeRecordId: string | null;
  isLoading: boolean;
  viewMode: ViewMode;
  activeView: 'dashboard' | 'sequencer' | 'settings';
  hasWalletConnected: boolean;
  hasLoadedData: boolean;
  
  // Filter/Search States
  search: string;
  filters: {
    experimentTypes: ExperimentType[];
    dateRange: [number, number] | null;
    loggedBy: string | null;
  };
  sortOrder: SortOrder;
  
  // Records Data
  records: GenomicRecord[];
  
  // Settings
  theme: 'dark' | 'light';
  showTooltips: boolean;
  
  // Wallet State
  wallet: WalletState;
  
  // Transaction History
  transactionHistory: Transaction[];
  
  // Actions
  toggleSequencer: () => void;
  openMicroscope: (recordId: string) => void;
  closeMicroscope: () => void;
  toggleSettings: () => void;
  setViewMode: (mode: ViewMode) => void;
  setSearch: (query: string) => void;
  toggleExperimentTypeFilter: (type: ExperimentType) => void;
  setDateRangeFilter: (range: [number, number] | null) => void;
  setLoggedByFilter: (address: string | null) => void;
  setSortOrder: (order: SortOrder) => void;
  addRecord: (record: GenomicRecord) => void;
  setWalletConnected: (isConnected: boolean) => void;
  setWalletState: (walletState: Partial<WalletState>) => void;
  connectWallet: (address: string, chainId: number) => void;
  disconnectWallet: () => void;
  // Additional mock data loading function for demo purposes
  loadMockData: () => void;
  addTransaction: (transaction: Transaction) => void;
  clearTransactionHistory: () => void;
  setTransactionStatus: (hash: string, status: TransactionStatus, blockData?: { blockNumber: number; gasUsed: number }) => void;
  setWallet: (walletState: WalletState) => void;
  syncWithBackend: () => Promise<void>;
}

// Use persist middleware to store state in localStorage
export const useChainSightStore = create<ChainSightState>()(
  persist(
    (set, get) => ({
      // UI States
      isSequencerOpen: false,
      isMicroscopeOpen: false,
      isSettingsOpen: false,
      activeRecordId: null,
      isLoading: false,
      viewMode: 'grid',
      activeView: 'dashboard',
      hasWalletConnected: false,
      hasLoadedData: false,
      
      // Wallet State
      wallet: {
        address: '',
        isConnected: false,
        provider: null
      },
      
      // Filter/Search States
      search: '',
      filters: {
        experimentTypes: ['prediction', 'sensor', 'manual'],
        dateRange: null,
        loggedBy: null,
      },
      sortOrder: 'newest',
      
      // Records Data
      records: [],
      
      // Settings
      theme: 'dark',
      showTooltips: true,
      
      // Transaction History
      transactionHistory: [],
      
      // Actions
      toggleSequencer: () => set((state) => ({ 
        isSequencerOpen: !state.isSequencerOpen,
        isMicroscopeOpen: false, // Close microscope if open
      })),
      
      openMicroscope: (recordId) => set(() => ({ 
        isMicroscopeOpen: true,
        activeRecordId: recordId,
        isSequencerOpen: false, // Close sequencer if open
      })),
      
      closeMicroscope: () => set(() => ({ 
        isMicroscopeOpen: false,
        activeRecordId: null,
      })),
      
      toggleSettings: () => set((state) => ({ 
        isSettingsOpen: !state.isSettingsOpen 
      })),
      
      setViewMode: (mode) => set(() => ({ viewMode: mode })),
      
      setSearch: (query) => set(() => ({ search: query })),
      
      toggleExperimentTypeFilter: (type) => set((state) => {
        const currentTypes = state.filters.experimentTypes;
        const newTypes = currentTypes.includes(type)
          ? currentTypes.filter(t => t !== type)
          : [...currentTypes, type];
        
        // Ensure we always have at least one filter active
        return { 
          filters: {
            ...state.filters,
            experimentTypes: newTypes.length ? newTypes : [type]
          }
        };
      }),
      
      setDateRangeFilter: (range) => set((state) => ({
        filters: {
          ...state.filters,
          dateRange: range
        }
      })),
      
      setLoggedByFilter: (address) => set((state) => ({
        filters: {
          ...state.filters,
          loggedBy: address
        }
      })),
      
      setSortOrder: (order) => set(() => ({ sortOrder: order })),
      
      addRecord: (record) => set((state) => ({
        records: [record, ...state.records]
      })),
      
      setWalletConnected: (isConnected) => set(() => ({ 
        hasWalletConnected: isConnected 
      })),
      
      // New wallet actions
      setWalletState: (walletState) => set((state) => ({ 
        wallet: { ...state.wallet, ...walletState } 
      })),
      
      connectWallet: (address, chainId) => set(() => ({ 
        wallet: {
          address,
          isConnected: true,
          chainId,
          connectedTimestamp: Date.now()
        },
        hasWalletConnected: true
      })),
      
      disconnectWallet: () => set((state) => ({ 
        wallet: {
          address: '',
          isConnected: false,
          provider: null
        },
        // Only update wallet connection status, not authentication status
        hasWalletConnected: false
      })),
      
      // Mock data for demo purposes
      loadMockData: () => {
        set(state => {
          // Skip if data is already loaded
          if (state.hasLoadedData || state.records.length > 0) {
            return state;
          }
          
          set({ isLoading: true });
          
          // Generate mock data only once
          setTimeout(() => {
            const mockRecords: GenomicRecord[] = Array.from({ length: 20 }).map((_, i) => ({
              id: `0x${Math.random().toString(16).slice(2, 10)}`,
              experimentType: ['prediction', 'sensor', 'manual'][Math.floor(Math.random() * 3)] as ExperimentType,
              timestamp: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
              loggedBy: `0x${Math.random().toString(16).slice(2, 42)}`,
              blockNumber: 12345678 + i,
              txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
              geneSequence: {
                original: `ATCG${Math.random().toString(36).slice(2, 20).toUpperCase()}`,
                edited: `ATCG${Math.random().toString(36).slice(2, 20).toUpperCase()}`,
              },
              metadata: {
                temperature: 37.2 + Math.random(),
                pressure: 101.3 + Math.random() * 2,
                sensorId: `SEN-${Math.floor(Math.random() * 1000)}`
              },
              notes: Math.random() > 0.3 ? `Research notes on gene editing experiment ${i+1}` : undefined,
              ipfsLink: Math.random() > 0.5 ? `ipfs://Qm${Math.random().toString(36).slice(2, 44)}` : undefined,
              relatedRecords: Math.random() > 0.7 ? [`0x${Math.random().toString(16).slice(2, 10)}`] : undefined,
            }));
            
            set({ 
              records: mockRecords,
              isLoading: false,
              hasLoadedData: true
            });
          }, 1500);
          
          return state;
        });
      },
      
      addTransaction: (transaction: Transaction) => {
        set((state) => {
          // Check if the transaction already exists
          const exists = state.transactionHistory.some(tx => tx.hash === transaction.hash);
          
          if (exists) {
            // Update existing transaction
            const updatedHistory = state.transactionHistory.map(tx => 
              tx.hash === transaction.hash ? { ...tx, ...transaction } : tx
            );
            
            console.log(`Updated existing transaction in store: ${transaction.hash}`);
            
            return {
              transactionHistory: updatedHistory.sort((a, b) => {
                // Sort by timestamp (newest first)
                return b.timestamp - a.timestamp;
              })
            };
          } else {
            // Add new transaction at the beginning of the array
            console.log(`Added new transaction to store: ${transaction.hash} (${transaction.description})`);
            
            // Add this transaction with a unique ID for React rendering optimization
            const newTx = {
              ...transaction,
              _uniqueId: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
            };
            
            // Try to save to backend if wallet is connected
            if (state.wallet.isConnected && state.wallet.address) {
              try {
                transactionAPI.createTransaction({
                  ...transaction,
                  walletAddress: state.wallet.address
                }).catch(err => {
                  console.warn('Failed to save transaction to backend:', err);
                });
              } catch (err) {
                console.warn('Error calling transaction API:', err);
              }
            }
            
            return { 
              transactionHistory: [newTx, ...state.transactionHistory]
            };
          }
        });
      },
      
      setTransactionStatus: (hash: string, status: TransactionStatus, blockData?: { blockNumber: number; gasUsed: number }) => {
        set((state) => {
          // Find the transaction to update
          const txToUpdate = state.transactionHistory.find(tx => tx.hash === hash);
          
          // If transaction doesn't exist, do nothing
          if (!txToUpdate) {
            console.warn(`Transaction ${hash} not found in local state when updating status`);
            return state; // Return unchanged state
          }
          
          console.log(`Updating transaction ${hash} status to ${status}`, blockData || '');
          
          // Only update if status has changed
          if (txToUpdate.status === status && 
              (!blockData || (txToUpdate.blockNumber === blockData.blockNumber && 
                            txToUpdate.gasUsed === blockData.gasUsed))) {
            console.log(`Transaction ${hash} status already set to ${status}, skipping update`);
            return state;
          }
          
          // Create updated history with the modified transaction
          const updatedHistory = state.transactionHistory.map(tx => 
            tx.hash === hash 
              ? { 
                  ...tx, 
                  status, 
                  ...(blockData || {}),
                  // Add a lastUpdated timestamp for sorting recently updated transactions
                  lastUpdated: Date.now(),
                  // Add a unique ID for React rendering optimization on updates
                  _uniqueId: (tx as any)._uniqueId || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
                } 
              : tx
          );
          
          // Try to update status in backend if wallet is connected
          if (state.wallet.isConnected && state.wallet.address) {
            try {
              transactionAPI.updateTransactionStatus(hash, status, blockData)
                .catch(err => {
                  console.warn('Failed to update transaction status in backend:', err);
                });
            } catch (err) {
              console.warn('Error calling transaction API:', err);
            }
          }
          
          // Re-sort transactions, prioritizing:
          // 1. Recently updated transactions (if they have a lastUpdated field)
          // 2. New transactions by timestamp
          return { 
            transactionHistory: updatedHistory.sort((a, b) => {
              // First sort by lastUpdated (if available)
              const aUpdated = (a as any).lastUpdated || a.timestamp;
              const bUpdated = (b as any).lastUpdated || b.timestamp;
              
              // Then by timestamp (newest first)
              return bUpdated - aUpdated;
            }) 
          };
        });
      },
      
      clearTransactionHistory: () => {
        // Try to clear in backend if wallet is connected
        if (get().wallet.isConnected) {
          try {
            transactionAPI.clearTransactions()
              .catch(err => {
                console.warn('Failed to clear transaction history in backend:', err);
              });
          } catch (err) {
            console.warn('Error calling transaction API:', err);
          }
        }
        
        set({ transactionHistory: [] });
      },
      
      setWallet: (walletState: WalletState) => {
        set({ wallet: walletState });
        
        // If connecting wallet, sync with backend
        if (walletState.isConnected && walletState.address) {
          get().syncWithBackend();
        }
      },
      
      syncWithBackend: async () => {
        const { wallet, transactionHistory } = get();
        
        if (!wallet.isConnected || !wallet.address) {
          console.log('Cannot sync with backend: wallet not connected');
          return;
        }
        
        console.log('Syncing transactions with backend...');
        
        try {
          // Fetch transactions from backend
          const response = await transactionAPI.getUserTransactions({
            walletAddress: wallet.address,
            limit: 100 // Get a large batch
          });
          
          const backendTransactions = response.data.data.transactions;
          console.log(`Fetched ${backendTransactions.length} transactions from backend`);
          
          // Create a map of existing transactions for faster lookup
          const existingTransactions = new Map(
            transactionHistory.map(tx => [tx.hash, tx])
          );
          
          // Keep track of backend hashes
          const backendHashes = new Set(backendTransactions.map((tx: any) => tx.hash));
          
          // Upload local-only transactions to backend
          const localOnlyTransactions = transactionHistory.filter(tx => !backendHashes.has(tx.hash));
          
          if (localOnlyTransactions.length > 0) {
            console.log(`Uploading ${localOnlyTransactions.length} local-only transactions to backend`);
            
            for (const tx of localOnlyTransactions) {
              try {
                await transactionAPI.createTransaction({
                  ...tx,
                  walletAddress: wallet.address
                });
              } catch (err) {
                console.warn(`Failed to upload local transaction ${tx.hash} to backend:`, err);
              }
            }
          }
          
          // Convert backend transactions to local format while preserving local extra data
          const formattedBackendTxs = backendTransactions.map((backendTx: any) => {
            // Get existing local transaction if available, to preserve local state like _uniqueId
            const existingTx = existingTransactions.get(backendTx.hash);
            
            return {
              ...existingTx, // Keep any local extra properties
              hash: backendTx.hash,
              timestamp: backendTx.timestamp ? new Date(backendTx.timestamp).getTime() : Date.now(),
              description: backendTx.description,
              type: backendTx.type as TransactionType,
              status: backendTx.status as TransactionStatus,
              blockNumber: backendTx.blockNumber,
              gasUsed: backendTx.gasUsed,
              entityId: backendTx.entityId,
              // Add/update a unique ID for React rendering optimization
              _uniqueId: existingTx ? (existingTx as any)._uniqueId : `tx_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
            };
          });
          
          // Combine backend transactions with local-only transactions
          const mergedTransactions = [...formattedBackendTxs, ...localOnlyTransactions];
          
          // Sort transactions: prioritize by lastUpdated or timestamp
          const sortedTransactions = mergedTransactions.sort((a, b) => {
            const aTime = (a as any).lastUpdated || a.timestamp;
            const bTime = (b as any).lastUpdated || b.timestamp;
            return bTime - aTime; // Newest first
          });
          
          console.log(`Synced ${sortedTransactions.length} total transactions`);
          
          // Update the store with the merged and sorted transactions
          set({ transactionHistory: sortedTransactions });
          
        } catch (err) {
          console.error('Failed to sync with backend:', err);
        }
      }
    }),
    {
      name: 'chain-sight-storage',
      // Persist both transaction history and wallet state
      partialize: (state) => ({ 
        transactionHistory: state.transactionHistory,
        wallet: state.wallet,
        hasWalletConnected: state.hasWalletConnected
      })
    }
  )
); 