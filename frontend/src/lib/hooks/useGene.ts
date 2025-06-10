import { useState } from 'react';
import { geneAPI, profileAPI } from '../api';
import { toast } from 'sonner';

export interface IGene {
  _id: string;
  userId: string;
  originalSequence: string;
  predictedSequence: string;
  editCount: number;
  editPositions: number[];
  efficiency: number;
  originalEfficiency: number;
  changedPosition: number;
  originalBase: string;
  newBase: string;
  changeIndicator: string;
  message: string;
  name: string;
  description: string;
  tags: string[];
  geneType: 'dna' | 'crispr' | 'rna' | 'protein' | 'other';
  isPublic: boolean;
  isFavorite: boolean;
  explanations: { text: string; timestamp: Date }[];
  createdAt: string;
  updatedAt: string;
}

export interface GeneListResponse {
  genes: IGene[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export function useGene() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userGenes, setUserGenes] = useState<IGene[]>([]);
  const [currentGene, setCurrentGene] = useState<IGene | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });

  // Get all gene predictions for the authenticated user
  const getUserGenes = async (options?: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    geneType?: string;
    tags?: string[];
    favorite?: boolean;
    query?: string;
    minEfficiency?: number;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await geneAPI.getUserGenes(options);
      const data = response.data.data as GeneListResponse;
      
      setUserGenes(data.genes);
      setPagination(data.pagination);
      
      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch gene predictions';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get a single gene prediction by ID
  const getGene = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await geneAPI.getGene(id);
      const gene = response.data.data.gene;
      
      setCurrentGene(gene);
      return gene;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch gene prediction';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new gene prediction
  const predictSequence = async (sequence: string, metadata?: {
    name?: string;
    description?: string;
    tags?: string[];
    geneType?: 'crispr' | 'rna' | 'dna' | 'protein' | 'other';
    isPublic?: boolean;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Calling geneAPI.predictSequence with:', { sequence, metadata });
      
      const response = await geneAPI.predictSequence(sequence, metadata);
      console.log('Gene prediction API response:', response);
      
      const result = response.data.data;
      
      // Save the gene's ID for activity tracking
      const geneId = result.id;
      console.log('Gene ID from response:', geneId);
      
      // Add to recent activity
      if (geneId) {
        console.log('Adding gene prediction to activity log...');
        try {
          await profileAPI.addActivity({
            type: 'prediction',
            data: {
              id: geneId,
              summary: `Analyzed ${sequence.substring(0, 8)}... with ${result.efficiency.toFixed(2)}% efficiency`,
              sequence: sequence,
              efficiency: result.efficiency
            },
          });
          console.log('Successfully added to activity log');
        } catch (activityError) {
          console.error('Failed to add activity:', activityError);
        }
      } else {
        console.warn('No gene ID received, skipping activity log');
      }
      
      toast.success('Gene prediction created successfully');
      
      // Refresh the user's genes list
      console.log('Refreshing user genes list...');
      getUserGenes();
      
      return result;
    } catch (err: any) {
      console.error('Gene prediction failed:', err);
      console.error('API Error Details:', err.response?.data);
      const errorMessage = err.response?.data?.message || 'Failed to predict gene sequence';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update a gene prediction
  const updateGene = async (id: string, updates: {
    name?: string;
    description?: string;
    tags?: string[];
    geneType?: 'crispr' | 'rna' | 'dna' | 'protein' | 'other';
    isFavorite?: boolean;
    isPublic?: boolean;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await geneAPI.updateGene(id, updates);
      const updatedGene = response.data.data.gene;
      
      // Update the current gene if it's the same one
      if (currentGene && currentGene._id === id) {
        setCurrentGene(updatedGene);
      }
      
      // Update the gene in the list
      setUserGenes(prev => 
        prev.map(gene => gene._id === id ? updatedGene : gene)
      );
      
      toast.success('Gene prediction updated successfully');
      return updatedGene;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update gene prediction';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a gene prediction
  const deleteGene = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await geneAPI.deleteGene(id);
      
      // Remove from state
      setUserGenes(prev => prev.filter(gene => gene._id !== id));
      
      // Clear current gene if it's the same one
      if (currentGene && currentGene._id === id) {
        setCurrentGene(null);
      }
      
      toast.success('Gene prediction deleted successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete gene prediction';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Add an explanation to a gene prediction
  const addExplanation = async (id: string, text: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await geneAPI.addExplanation(id, text);
      const { gene, explanation } = response.data.data;
      
      // Update the current gene if it's the same one
      if (currentGene && currentGene._id === id) {
        setCurrentGene(gene);
      }
      
      // Update the gene in the list
      setUserGenes(prev => 
        prev.map(g => g._id === id ? gene : g)
      );
      
      toast.success('Explanation added successfully');
      return explanation;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to add explanation';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    userGenes,
    currentGene,
    pagination,
    getUserGenes,
    getGene,
    predictSequence,
    updateGene,
    deleteGene,
    addExplanation,
    setCurrentGene
  };
} 