'use client';

import { io, Socket } from 'socket.io-client';
import { useIoTStore } from './store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Socket instance shared across the application
let socket: Socket | null = null;

/**
 * Initialize Socket.IO connection
 * @returns Socket instance
 */
export const initializeSocket = (): Socket => {
  if (socket) {
    return socket;
  }

  socket = io(API_URL, {
    transports: ['websocket'],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });
  
  // Set up common event handlers
  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Set up custom event handlers
  socket.on('synapse_agent_update', (data) => {
    console.log('Agent status update:', data);
    // This event will be handled by consumers using getSocket().on()
  });
  
  // Initialize sensor data handlers
  setupSensorDataHandlers(socket);
  
  return socket;
};

/**
 * Disconnect Socket.IO connection
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

const setupSensorDataHandlers = (socket: Socket) => {
  const iotStore = useIoTStore.getState();
  
  // Initial data handler
  socket.on('initial-data', (data) => {
    iotStore.setReadings(data);
  });
  
  // Real-time sensor data handler
  socket.on('sensor-data', (data) => {
    if (data.temperature) {
      iotStore.addReading('temperature', data.temperature);
    }
    
    if (data.humidity) {
      iotStore.addReading('humidity', data.humidity);
    }
    
    if (data.pressure) {
      iotStore.addReading('pressure', data.pressure);
    }
    
    if (data.light) {
      iotStore.addReading('light', data.light);
    }
    
    if (data.co2) {
      iotStore.addReading('co2', data.co2);
    }
  });
  
  // Sensor insights handler
  socket.on('sensor-insights', (data) => {
    iotStore.setInsights(data.message);
  });
  
  // Sensor alert handler
  socket.on('sensor-alert', (data) => {
    // Here you could integrate with a toast notification system
    console.log('Sensor Alert:', data.message);
  });
};

/**
 * Get the current Socket.IO instance
 * Creates a new connection if one doesn't exist
 * @returns Socket instance
 */
export const getSocket = (): Socket => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
}; 