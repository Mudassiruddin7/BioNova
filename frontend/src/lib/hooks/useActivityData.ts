import { useState, useEffect, useCallback } from 'react';
import { transactionAPI, geneAPI, profileAPI } from '@/lib/api';

// Define activity item interface that works for both types
export interface ActivityItem {
  id: string;
  type: 'prediction' | 'transaction' | 'monitoring';
  title: string;
  description: string;
  timestamp: Date | number; 
  status?: string;
  data: any; // Original data
}

// Hook return interface
export interface UseActivityDataReturn {
  isLoading: boolean;
  error: string | null;
  activities: ActivityItem[];
  totalCount: number;
  fetchActivities: (options?: {
    limit?: number;
    activityType?: 'prediction' | 'transaction' | 'monitoring' | 'all';
  }) => Promise<void>;
}

export function useActivityData(): UseActivityDataReturn {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch gene predictions
  const fetchPredictions = useCallback(async (limit = 10) => {
    try {
      const response = await geneAPI.getUserGenes({ limit, sort: 'createdAt', order: 'desc' });
      const data = response?.data?.data || {};
      
      // Check if we have gene predictions
      if (Array.isArray(data.genes)) {
        return data.genes.map((gene: any) => ({
          id: gene._id,
          type: 'prediction',
          title: gene.name || 'Unnamed Gene Prediction',
          description: gene.description || `${gene.geneType || 'DNA'} sequence analysis`,
          timestamp: gene.createdAt,
          status: gene.efficiency > 70 ? 'high' : gene.efficiency > 40 ? 'medium' : 'low',
          data: gene
        }));
      } else if (data.total === 0) {
        return [];
      }
      
      return [];
    } catch (err) {
      console.error('Error fetching gene predictions:', err);
      return [];
    }
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async (limit = 10) => {
    try {
      const response = await transactionAPI.getUserTransactions({ limit });
      const responseData = response?.data?.data;
      
      // Handle the nested structure where transactions is a property
      let transactions = [];
      
      if (responseData && typeof responseData === 'object') {
        // Check if the response has a transactions array
        if (Array.isArray(responseData.transactions)) {
          transactions = responseData.transactions;
        }
        // If the response itself is an array
        else if (Array.isArray(responseData)) {
          transactions = responseData;
        }
        // If we just have a single transaction
        else if (responseData.hash) {
          transactions = [responseData];
        }
      }
      
      return transactions.map((tx: any) => ({
        id: tx.hash,
        type: 'transaction',
        title: tx.description || 'Blockchain Transaction',
        description: `${tx.type} transaction ${tx.status}`,
        timestamp: tx.timestamp,
        status: tx.status,
        data: tx
      }));
    } catch (err) {
      console.error('Error fetching transactions:', err);
      return [];
    }
  }, []);

  // Fetch profile activity (monitoring)
  const fetchProfileActivity = useCallback(async () => {
    try {
      const response = await profileAPI.getProfile();
      const profile = response?.data?.data?.profile;
      
      if (profile?.recentActivity && Array.isArray(profile.recentActivity)) {
        return profile.recentActivity
          .filter((activity: any) => activity.type === 'monitoring')
          .map((activity: any) => ({
            id: activity.id || `monitoring-${Date.now()}-${Math.random()}`,
            type: 'monitoring',
            title: 'IoT Monitoring',
            description: activity.data?.summary || 'Monitoring data recorded',
            timestamp: activity.timestamp,
            data: activity
          }));
      }
      
      return [];
    } catch (err) {
      console.error('Error fetching profile activity:', err);
      return [];
    }
  }, []);

  // Main fetch function that combines all activities
  const fetchActivities = useCallback(async (options?: {
    limit?: number;
    activityType?: 'prediction' | 'transaction' | 'monitoring' | 'all';
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const limit = options?.limit || 10;
      const activityType = options?.activityType || 'all';
      
      let allActivities: ActivityItem[] = [];
      
      // Fetch data based on type filter
      if (activityType === 'all' || activityType === 'prediction') {
        const predictions = await fetchPredictions(limit);
        allActivities = [...allActivities, ...predictions];
      }
      
      if (activityType === 'all' || activityType === 'transaction') {
        const transactions = await fetchTransactions(limit);
        allActivities = [...allActivities, ...transactions];
      }
      
      if (activityType === 'all' || activityType === 'monitoring') {
        const monitoringActivities = await fetchProfileActivity();
        allActivities = [...allActivities, ...monitoringActivities];
      }
      
      // Sort by timestamp, most recent first
      allActivities.sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateB - dateA;
      });
      
      // Limit the total number of activities
      const limitedActivities = allActivities.slice(0, limit);
      
      setActivities(limitedActivities);
      setTotalCount(allActivities.length);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activity data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPredictions, fetchTransactions, fetchProfileActivity]);

  // Fetch data on component mount
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    isLoading,
    error,
    activities,
    totalCount,
    fetchActivities
  };
} 