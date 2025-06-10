import { useState } from 'react';
import { predictionAPI, profileAPI } from '../api';
import { usePredictionStore, useBlockchainStore } from '../store';

export function usePredictor() {
  const { 
    currentPrediction, 
    recentPredictions,
    setCurrentPrediction, 
    setRecentPredictions 
  } = usePredictionStore();
  
  const { setDataToVerify } = useBlockchainStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new prediction
  const createPrediction = async (sequence: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Make API call to create prediction
      const response = await predictionAPI.createPrediction(sequence);
      
      // Extract prediction data
      const { prediction } = response.data.data;
      
      // Update current prediction in store
      setCurrentPrediction(prediction);
      
      // Add to recent activity
      await profileAPI.addActivity({
        type: 'prediction',
        data: {
          id: prediction.id,
          originalSequence: prediction.originalSequence,
          predictedSequence: prediction.predictedSequence,
          editCount: prediction.editCount,
        },
      });
      
      return prediction;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create prediction';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Get user's recent predictions
  const getUserPredictions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Make API call to get predictions
      const response = await predictionAPI.getUserPredictions();
      
      // Extract predictions data
      const { predictions } = response.data.data;
      
      // Update recent predictions in store
      setRecentPredictions(predictions);
      
      return predictions;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to get predictions';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Get a specific prediction by ID
  const getPrediction = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Make API call to get prediction
      const response = await predictionAPI.getPrediction(id);
      
      // Extract prediction data
      const { prediction } = response.data.data;
      
      // Update current prediction in store
      setCurrentPrediction(prediction);
      
      return prediction;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to get prediction';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Add explanation to prediction
  const addExplanation = async (id: string, question: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Make API call to add explanation
      const response = await predictionAPI.addExplanation(id, question);
      
      // Extract explanation data
      const { explanation } = response.data.data;
      
      // Update current prediction with new explanation
      if (currentPrediction && currentPrediction.id === id) {
        setCurrentPrediction({
          ...currentPrediction,
          explanation,
        });
      }
      
      return explanation;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to add explanation';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare prediction for blockchain verification
  const prepareForVerification = () => {
    if (!currentPrediction) return false;
    
    setDataToVerify({
      type: 'prediction',
      data: {
        originalSequence: currentPrediction.originalSequence,
        predictedSequence: currentPrediction.predictedSequence,
        editCount: currentPrediction.editCount,
        editPositions: currentPrediction.editPositions,
      },
    });
    
    return true;
  };

  // Clear current prediction
  const clearPrediction = () => {
    setCurrentPrediction(null);
  };

  return {
    currentPrediction,
    recentPredictions,
    isLoading,
    error,
    createPrediction,
    getUserPredictions,
    getPrediction,
    addExplanation,
    prepareForVerification,
    clearPrediction,
  };
} 