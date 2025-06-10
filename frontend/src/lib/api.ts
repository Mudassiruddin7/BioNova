'use client';

import axios from 'axios';
import { Transaction } from './hooks/useDashboardTransactions';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Function to get token from localStorage (as fallback to cookies)
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Function to save token to localStorage (when received in response)
const saveAuthToken = (token: string) => {
  if (typeof window !== 'undefined' && token) {
    localStorage.setItem('auth_token', token);
  }
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
  timeout: 30000, // Increase timeout to 30 seconds
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    // Only add token header if token exists (fallback mechanism)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to save token when available
api.interceptors.response.use(
  (response) => {
    // Check for token in response data
    const token = response.data?.data?.accessToken;
    if (token) {
      console.log('Received auth token in response - saving to localStorage');
      saveAuthToken(token);
      // Set token in axios default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    return response;
  },
  (error) => Promise.reject(error)
);

// Auth API with error handling
export const authAPI = {
  // Token helper function
  setToken: (token: string) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return true;
    }
    return false;
  },

  // Login-related methods
  getCurrentUser: () => {
    // Always try to set token from localStorage before getCurrentUser call
    const token = getAuthToken();
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    return api.get('/auth/me');
  },
  
  // Email/password authentication
  login: (email: string, password: string) => {
    return api.post('/auth/login', { email, password })
      .then(response => {
        // Explicitly handle token from login response
        const token = response?.data?.data?.accessToken;
        if (token) {
          console.log('Login successful - saving auth token');
          saveAuthToken(token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        return response;
      });
  },
  
  // Guest authentication
  loginAsGuest: () => {
    return api.post('/auth/login/guest')
      .then(response => {
        // Handle token from guest login response
        const token = response?.data?.data?.accessToken;
        if (token) {
          saveAuthToken(token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        return response;
      });
  },
  
  register: (email: string, password: string, name: string) => 
    api.post('/auth/register', { email, password, name }),
  verifyEmail: (token: string) => {
    console.log('Frontend API: Sending verification request with token', { tokenLength: token.length });
    return api.post('/auth/verify-email', { token });
  },
  resendVerification: (email: string) => {
    console.log('Frontend API: Requesting verification email resend for', { email });
    return api.post('/auth/resend-verification', { email });
  },
  forgotPassword: (email: string) => 
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => 
    api.post('/auth/reset-password', { token, password }),
  changePassword: (currentPassword: string, newPassword: string) => 
    api.post('/auth/change-password', { currentPassword, newPassword }),
  
  // Wallet auth
  loginWithWallet: (walletAddress: string) => 
    api.post('/auth/login/wallet', { walletAddress }),
  
  // Google auth
  loginWithGoogle: (idToken: string, email: string, name?: string) =>
    api.post('/auth/login/google', { idToken, email, name }),
  
  // Common
  logout: () => {
    // Safely clean up localStorage
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.warn('Failed to clear localStorage on logout:', error);
    }
    
    // Safely clean up auth headers
    try {
      if (api.defaults?.headers?.common?.Authorization) {
        delete api.defaults.headers.common.Authorization;
      } else if (api.defaults?.headers?.common && api.defaults.headers.common['Authorization']) {
        delete api.defaults.headers.common['Authorization'];
      }
    } catch (error) {
      console.warn('Failed to clear auth headers on logout:', error);
    }
    
    // Call the backend logout API
    return api.post('/auth/logout').catch(err => {
      console.warn('Backend logout API call failed:', err);
      // Return a resolved promise so that frontend logout flow can continue
      return Promise.resolve({ status: 'ok', data: { message: 'Logged out locally' } });
    });
  },
};

// Profile API
export const profileAPI = {
  getProfile: () => api.get('/profile'),
  updatePreferences: (data: { theme?: string; aiVoice?: string }) => 
    api.put('/profile/preferences', data),
  addActivity: (data: { type: 'prediction' | 'monitoring'; data: any }) => 
    api.post('/profile/activity', data),
};

// Prediction API (for storing/retrieving results)
export const predictionAPI = {
  createPrediction: (sequence: string) => api.post('/prediction', { sequence }),
  getUserPredictions: () => api.get('/prediction'),
  getPrediction: (id: string) => api.get(`/prediction/${id}`),
  addExplanation: (id: string, question: string) => 
    api.post(`/prediction/${id}/explanation`, { question }),
  predictSequence: (sequence: string) => api.post('/prediction/predict', { sequence }),
};

// Gene API for DNA sequence analysis
export const geneAPI = {
  // Create a gene prediction
  createGene: (sequence: string, metadata?: {
    name?: string;
    description?: string;
    tags?: string[];
    geneType?: 'crispr' | 'rna' | 'dna' | 'protein' | 'other';
    isPublic?: boolean;
  }) => api.post('/gene', { sequence, ...metadata }),
  
  // Get all gene predictions for the authenticated user with filtering options
  getUserGenes: (options?: {
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
    const params = new URLSearchParams();
    if (options) {
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.sort) params.append('sort', options.sort);
      if (options.order) params.append('order', options.order);
      if (options.geneType) params.append('geneType', options.geneType);
      if (options.favorite) params.append('favorite', options.favorite.toString());
      if (options.query) params.append('query', options.query);
      if (options.minEfficiency) params.append('minEfficiency', options.minEfficiency.toString());
      if (options.tags && options.tags.length > 0) {
        options.tags.forEach(tag => params.append('tags', tag));
      }
    }
    return api.get(`/gene?${params.toString()}`);
  },
  
  // Get a single gene prediction by ID
  getGene: (id: string) => api.get(`/gene/${id}`),
  
  // Update gene prediction metadata
  updateGene: (id: string, updates: {
    name?: string;
    description?: string;
    tags?: string[];
    geneType?: 'crispr' | 'rna' | 'dna' | 'protein' | 'other';
    isFavorite?: boolean;
    isPublic?: boolean;
  }) => api.put(`/gene/${id}`, updates),
  
  // Delete a gene prediction
  deleteGene: (id: string) => api.delete(`/gene/${id}`),
  
  // Add an explanation to a gene prediction
  addExplanation: (id: string, text: string) => 
    api.post(`/gene/${id}/explanation`, { text }),
  
  // Run the prediction service (compatible with legacy predictionAPI.predictSequence)
  predictSequence: (sequence: string, metadata?: {
    name?: string;
    description?: string;
    tags?: string[];
    geneType?: 'crispr' | 'rna' | 'dna' | 'protein' | 'other';
    isPublic?: boolean;
  }) => api.post('/gene/predict', { sequence, ...metadata }),
};

// Transaction API for blockchain transactions
export const transactionAPI = {
  createTransaction: async (data: Partial<Transaction>) => {
    try {
      return await api.post('/transactions', data);
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  },
  
  updateTransaction: async (id: string, data: Partial<Transaction>) => {
    try {
      return await api.put(`/transactions/${id}`, data);
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  },
  
  getUserTransactions: (options?: {
    type?: string | string[]; // Single type or comma-separated list
    status?: string | string[]; // Single status or comma-separated list
    walletAddress?: string;
    fromDate?: string | Date; // ISO date string or Date object
    toDate?: string | Date; // ISO date string or Date object
    entityId?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }) => {
    try {
      const params = new URLSearchParams();

      if (options) {
        // Handle type filtering
        if (options.type) {
          const typeValue = Array.isArray(options.type) ? options.type.join(',') : options.type;
          params.append('type', typeValue);
        }
        
        // Handle status filtering
        if (options.status) {
          const statusValue = Array.isArray(options.status) ? options.status.join(',') : options.status;
          params.append('status', statusValue);
        }
        
        // Handle date range filtering
        if (options.fromDate) {
          const fromDateString = options.fromDate instanceof Date 
            ? options.fromDate.toISOString() 
            : options.fromDate;
          params.append('fromDate', fromDateString);
        }
        
        if (options.toDate) {
          const toDateString = options.toDate instanceof Date 
            ? options.toDate.toISOString() 
            : options.toDate;
          params.append('toDate', toDateString);
        }
        
        // Handle entity filtering
        if (options.entityId) {
          params.append('entityId', options.entityId);
        }
        
        // Handle wallet filtering
        if (options.walletAddress) {
          params.append('walletAddress', options.walletAddress);
        }
        
        // Handle pagination
        if (options.page) {
          params.append('page', options.page.toString());
        }
        
        if (options.limit) {
          params.append('limit', options.limit.toString());
        }
        
        // Handle sorting
        if (options.sort) {
          params.append('sort', options.sort);
        }
        
        if (options.order) {
          params.append('order', options.order);
        }
      }
      
      return api.get(`/transactions?${params.toString()}`);
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      throw error;
    }
  },
  
  getTransactionCounts: async () => {
    try {
      return await api.get('/transactions/counts');
    } catch (error) {
      console.error('Error getting transaction counts:', error);
      throw error;
    }
  },
  
  clearTransactions: async () => {
    try {
      return await api.delete('/transactions');
    } catch (error) {
      console.error('Error clearing transactions:', error);
      throw error;
    }
  }
};

// IoT Monitoring API
export const iotAPI = {
  getLatestData: () => api.get('/iot/data'),
  getInsights: () => api.get('/iot/insights'),
};

// Groq API
export const groqAPI = {
  chat: (messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>) => 
    api.post('/groq/chat', { messages }),
  
  onboardingChat: (message: string, history: Array<{ role: 'user' | 'assistant'; content: string }> = []) => 
    api.post('/groq/onboarding-chat', { message, history }),
    
  getBlockchainGuidance: (dataType: 'prediction' | 'monitoring') => 
    api.get(`/groq/blockchain-guidance?dataType=${dataType}`),
    
  // Health check for Groq API
  checkHealth: async () => {
    try {
      const response = await api.get('/groq/health');
      return response.data;
    } catch (error) {
      return {
        status: 'error',
        groq: {
          connected: false,
          message: 'Failed to connect to Groq health endpoint'
        }
      };
    }
  },
    
  // Lab monitoring APIs
  analyzeVision: (scenario: string) => 
    api.post('/groq/analyze-vision', { scenario }),
    
  transcribeAudio: (audioCommand: string) => 
    api.post('/groq/transcribe', { audioCommand }),
    
  interpretCommand: (text: string) => 
    api.post('/groq/interpret-command', { text }),
    
  getSensorInsights: (sensorData: { 
    temperature: number; 
    humidity: number; 
    pressure?: number; 
    co2?: number; 
    oxygen?: number;
    ph?: number;
  }) => api.post('/groq/sensor-insights', sensorData),
};

// Modify the interceptor for handling auth errors to prevent redirects on network errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Skip redirect for network errors
    if (!error.response) {
      return Promise.reject(error);
    }
    
    // Only handle 401 responses (not network errors)
    if (error.response?.status === 401) {
      // Don't immediately redirect - let the component decide based on requireAuth
      console.warn('Authentication required for this request');
      
      // Check if this is a second request with the same error
      // This helps prevent infinite loops
      const isRetry = error.config.__isRetryRequest;
      
      if (!isRetry) {
        // Check if token exists in localStorage
        const token = localStorage.getItem('auth_token');
        
        if (token) {
          console.warn('Auth token exists but request was unauthorized. Token may be invalid.');
          
          // Clear the invalid token
          localStorage.removeItem('auth_token');
          
          // Notify about auth state change for components to update
          if (typeof window !== 'undefined' && window.authEvents) {
            window.authEvents.emit('auth_state_changed', { isAuthenticated: false, reason: '401_response' });
          }
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Synapse AI Bot API
export const synapseAPI = {
  // Send a message to the Synapse Bot
  sendMessage: (sessionId: string, message: string, contextHint: any) => 
    api.post('/synapse/bot/message', { sessionId, message, contextHint }),
  
  // Send a message to Synapse Agent with agentic RAG capabilities
  sendAgentMessage: (sessionId: string, message: string, contextHint: any) =>
    api.post('/synapse/agent/message', { sessionId, message, contextHint }),
  
  // Create a new chat session - change route to match backend
  createSession: (title?: string) => 
    api.post('/synapse/chat/session', { title }),
  
  // Get user sessions
  getUserSessions: () => 
    api.get('/synapse/chat/sessions'),
  
  // Get session history - update to use the correct route
  getSessionHistory: (sessionId: string) => 
    api.get(`/synapse/chat/sessions/${sessionId}/history`),
  
  // Delete a chat session
  deleteSession: (sessionId: string) =>
    api.delete(`/synapse/chat/sessions/${sessionId}`),
  
  // Submit feedback for a message
  submitFeedback: (
    sessionId: string, 
    messageId: string, 
    feedbackType: 'positive' | 'negative' | 'specific', 
    options?: {
      comment?: string;
      specificRatings?: {
        accuracy?: number;
        relevance?: number;
        helpfulness?: number;
        clarity?: number;
      }
    }
  ) => api.post('/synapse/feedback', { 
    sessionId, 
    messageId, 
    feedbackType,
    comment: options?.comment,
    specificRatings: options?.specificRatings
  }),
  
  // Get user feedback statistics
  getFeedbackStats: () => api.get('/synapse/feedback/stats'),
  
  // Get Synapse AI info
  getInfo: () => 
    api.get('/synapse/ai/info'),
  
  // Lab Monitor specific commands
  interpretLabCommand: (command: string) => 
    api.post('/synapse/bot/lab-command', { command }),
  
  // Analyze sensor data
  analyzeSensorData: (sensorType: string, readings: Array<{ timestamp: Date; value: number }>, thresholdValue: number) => 
    api.post('/synapse/bot/analyze-sensor', { sensorType, readings, thresholdValue }),
  
  // Analyze sensor trends
  analyzeSensorTrends: (
    sensorType: string, 
    sensorId: string, 
    timeRange: { start: number | string, end: number | string },
    options: { predictionHours?: number; detectAnomalies?: boolean } = {}
  ) => api.post('/synapse/bot/analyze-trends', { sensorType, sensorId, timeRange, options }),
  
  // For gene analysis
  analyzeGeneEdit: (originalSequence: string, editedSequence: string, experimentMetadata?: any) => 
    api.post('/synapse/bot/analyze-gene-edit', { originalSequence, editedSequence, experimentMetadata }),
  
  // For blockchain
  narrateTransaction: (transactionDetails: any, transactionHash?: string) => 
    api.post('/synapse/bot/narrate-transaction', { transactionDetails, transactionHash })
};

export default api; 