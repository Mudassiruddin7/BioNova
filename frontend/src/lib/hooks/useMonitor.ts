import { useEffect, useState } from 'react';
import { iotAPI, profileAPI } from '../api';
import { useIoTStore, useBlockchainStore } from '../store';
import { initializeSocket, disconnectSocket, getSocket } from '../socket';

export function useMonitor() {
  const { 
    temperature, 
    humidity, 
    pressure, 
    light, 
    co2, 
    insights,
    setReadings, 
    setInsights 
  } = useIoTStore();
  
  const { setDataToVerify } = useBlockchainStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const socket = initializeSocket();
    
    socket.on('connect', () => {
      setIsSocketConnected(true);
    });
    
    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });
    
    return () => {
      disconnectSocket();
    };
  }, []);

  // Get latest sensor data
  const getLatestData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Make API call to get latest data
      const response = await iotAPI.getLatestData();
      
      // Extract sensor data
      const { sensorData } = response.data.data;
      
      // Update readings in store
      setReadings(sensorData);
      
      return sensorData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to get sensor data';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Get insights for current sensor data
  const getInsights = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Make API call to get insights
      const response = await iotAPI.getInsights();
      
      // Extract insights data
      const { insights: insightsData, currentData } = response.data.data;
      
      // Update insights in store
      setInsights(insightsData);
      
      // Add to recent activity
      await profileAPI.addActivity({
        type: 'monitoring',
        data: {
          temperature: currentData.temperature,
          humidity: currentData.humidity,
          insights: insightsData.substring(0, 100) + '...',
          timestamp: new Date().toISOString(),
        },
      });
      
      return insightsData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to get insights';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare monitoring data for blockchain verification
  const prepareForVerification = () => {
    if (temperature.length === 0 || humidity.length === 0) return false;
    
    const latestTemp = temperature[temperature.length - 1];
    const latestHumidity = humidity[humidity.length - 1];
    
    setDataToVerify({
      type: 'monitoring',
      data: {
        temperature: latestTemp.value,
        humidity: latestHumidity.value,
        timestamp: new Date().toISOString(),
        insights: insights ? insights.substring(0, 200) : undefined,
      },
    });
    
    return true;
  };

  // Get current socket status
  const getSocketStatus = () => {
    const socket = getSocket();
    return socket.connected;
  };

  return {
    temperature,
    humidity,
    pressure,
    light,
    co2,
    insights,
    isLoading,
    isSocketConnected,
    error,
    getLatestData,
    getInsights,
    prepareForVerification,
    getSocketStatus,
  };
} 