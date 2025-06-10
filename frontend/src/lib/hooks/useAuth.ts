'use client';

/**
 * Main Authentication Hooks File
 * 
 * This file contains all authentication-related hooks and functionality.
 * It supports multiple authentication methods:
 * - Context-based authentication (useAuthState, useAuthDispatch, useAuthMethods)
 * - Store-based authentication (useAuth)
 * - Wallet authentication
 * - Email/password authentication
 * 
 * All components should import authentication hooks from this file using:
 * import { useAuth } from '@/lib/hooks/useAuth';
 * or
 * import { useAuthState, useAuthMethods } from '@/lib/hooks/useAuth';
 */

import { useEffect, useState, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '../api';
import { useUserStore } from '../store';
import { 
  AuthState, 
  AuthAction,
  AuthContextMethods,
  AuthStateContext, 
  AuthDispatchContext,
  AuthMethodsContext
} from '../contexts/AuthContext';
import { getGuestId, isGuestSessionActive, loadGuestData } from '../utils/guestStorage';

// Extend Window interface to include our custom event emitter
declare global {
  interface Window {
    authEvents?: any;
  }
}

// Create a simple event system to broadcast auth state changes
class AuthEventEmitter {
  private listeners: Function[] = [];
  private lastData: Record<string, any> = {};
  private debounceTimers: Record<string, NodeJS.Timeout> = {};
  private debounceInterval = 300; // ms

  subscribe(listener: Function) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(event: string, data?: any) {
    // Clear any pending timer for this event
    if (this.debounceTimers[event]) {
      clearTimeout(this.debounceTimers[event]);
    }

    // Create a new debounced event
    this.debounceTimers[event] = setTimeout(() => {
      // Compare with last emitted data - only emit if data has changed
      const lastEventData = this.lastData[event];
      
      // Check if the data is actually different using shallow comparison
      const isDataChanged = !lastEventData || !data || 
        JSON.stringify(lastEventData) !== JSON.stringify(data);
      
      if (isDataChanged) {
        // Store the data for future comparison
        this.lastData[event] = JSON.parse(JSON.stringify(data || {}));
        
        // Notify listeners
        this.listeners.forEach(listener => {
          listener(event, data);
        });
      }
    }, this.debounceInterval);
  }
}

export const authEvents = new AuthEventEmitter();

// Make authEvents available globally for use in interceptors
if (typeof window !== 'undefined') {
  window.authEvents = authEvents;
}

export function useAuth(requireAuth: boolean = false) {
  const router = useRouter();
  const { user, setUser, isLoading, setLoading, error, setError } = useUserStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [userType, setUserType] = useState<'registered' | 'guest' | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);

  // Subscribe to auth events
  useEffect(() => {
    const unsubscribe = authEvents.subscribe((event: string) => {
      if (event === 'auth_state_changed') {
        // Force a recheck of authentication status
        checkAuth();
      }
    });
    
    return unsubscribe;
  }, []);

  // Check if user is authenticated when component mounts
  useEffect(() => {
    // Always check authentication status regardless of the page
    // This ensures consistent auth state across all routes
    checkAuth();
  }, [requireAuth, router, setError, setLoading, setUser]);
  
  const checkAuth = async () => {
    try {
      setLoading(true);
      
      // Check for guest session first
      const guestId = getGuestId();
      if (guestId && isGuestSessionActive()) {
        // Restore guest session
        setUserType('guest');
        setGuestId(guestId);
        
        // Load guest data if needed
        const guestData = loadGuestData(guestId);
        
        // Set dummy user for guest
        setUser({
          id: guestId,
          name: `Guest-${guestId.substring(0, 8)}`,
          role: 'guest',
          isGuest: true
        });
        
        setError(null);
        setLoading(false);
        setIsInitialized(true);
        return;
      }
      
      // Check if token exists in localStorage
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Set token for API calls
        const api = authAPI as any;
        if (api.setToken) {
          api.setToken(token);
        }
      }
      
      // If no guest session, attempt to get current user (this will use cookies or token header)
      const response = await authAPI.getCurrentUser();
      setUser(response.data.data.user);
      setUserType('registered');
      setGuestId(null);
      setError(null);
    } catch (err: any) {
      setUser(null);
      setUserType(null);
      setGuestId(null);
      
      // Handle network errors gracefully
      if (!err.response) {
        setError("Network error. Please check your connection.");
        return;
      }
      
      // Only redirect if auth is required for this route and it's not a network error
      if (requireAuth && err.response && err.response.status === 401) {
        // Check if we're on ChainSight page - don't redirect there
        const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
        const isChainSightPage = pathname.includes('/chainSight');
        
        // Don't redirect from ChainSight page even if auth fails
        if (!isChainSightPage) {
          router.push('/login');
        }
      }
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  // Login with wallet
  const loginWithWallet = async (walletAddress: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.loginWithWallet(walletAddress);
      setUser(response.data.data.user);
      // Broadcast auth state change
      authEvents.emit('auth_state_changed', { isAuthenticated: true });
      return response.data.data;
    } catch (err: any) {
      let errorMessage = 'Login failed';
      if (!err.response) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = err.response?.data?.message || 'Login failed';
      }
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Login with Google
  const loginWithGoogle = async (idToken: string, email: string, name?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting Google login process in useAuth hook', { emailProvided: !!email });
      
      // Input validation
      if (!idToken) {
        throw new Error('Google ID token is required');
      }
      
      if (!email) {
        throw new Error('Email is required for Google authentication');
      }
      
      // Call API
      const response = await authAPI.loginWithGoogle(idToken, email, name);
      console.log('Google authentication successful', { userId: response.data.data.user?.id });
      
      // Handle success
      const userData = response.data.data.user;
      if (!userData) {
        throw new Error('User data missing from authentication response');
      }
      
      setUser(userData);
      
      // Broadcast auth state change
      authEvents.emit('auth_state_changed', { 
        isAuthenticated: true,
        authProvider: 'google',
        user: { id: userData.id, email: userData.email }
      });
      
      return response.data.data;
    } catch (err: any) {
      console.error('Google login failed in useAuth hook:', err);
      
      // Format error message based on the error type
      let errorMessage = 'Google login failed';
      
      if (!err.response) {
        // Network error with no response
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.response?.status === 400) {
        // Validation or request format errors
        errorMessage = err.response.data?.message || 'Invalid authentication data';
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        // Authentication or authorization errors
        errorMessage = err.response.data?.message || 'Authentication failed. You may not have permission to access this account.';
      } else if (err.response?.status >= 500) {
        // Server errors
        errorMessage = 'Server error. Please try again later.';
      } else if (err.message) {
        // Other errors with message
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Setting error state:', errorMessage);
      
      // Rethrow with improved error
      const enhancedError = new Error(errorMessage);
      (enhancedError as any).originalError = err;
      (enhancedError as any).responseData = err.response?.data;
      throw enhancedError;
    } finally {
      setLoading(false);
    }
  };

  // Login with email and password
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.login(email, password);
      setUser(response.data.data.user);
      // Broadcast auth state change
      authEvents.emit('auth_state_changed', { isAuthenticated: true });
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Login as guest
  const loginAsGuest = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.loginAsGuest();
      setUser(response.data.data.user);
      setUserType('guest');
      setGuestId(response.data.data.user?.id || null);
      // Broadcast auth state change
      authEvents.emit('auth_state_changed', { isAuthenticated: true, isGuest: true });
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Guest login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Start a guest session (simpler method for components that don't need the full login flow)
  const startGuestSession = async () => {
    try {
      const userData = await loginAsGuest();
      return userData;
    } catch (error) {
      console.error('Failed to start guest session:', error);
      return null;
    }
  };
  
  // End a guest session
  const endGuestSession = async () => {
    try {
      await logout();
      setUserType(null);
      setGuestId(null);
    } catch (error) {
      console.error('Failed to end guest session:', error);
    }
  };

  // Register with email and password
  const register = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.register(email, password, name);
      setUser(response.data.data.user);
      // Broadcast auth state change
      authEvents.emit('auth_state_changed', { isAuthenticated: true });
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      await authAPI.forgotPassword(email);
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to send reset email';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (token: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      await authAPI.resetPassword(token, password);
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to reset password';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      await authAPI.changePassword(currentPassword, newPassword);
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to change password';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      
      // First clear all authentication data in memory and storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('guestId');
      localStorage.removeItem('isGuestSessionActive');
      
      // Clear user data
      setUser(null);
      setUserType(null);
      setGuestId(null);
      
      // Safely attempt to clear auth headers if they exist
      try {
        // Get the API instance
        const api = authAPI as any;
        
        // Only try to modify headers if api and its properties exist
        if (api && typeof api === 'object') {
          // Clear Authorization header directly from axios defaults if possible
          if (api.defaults?.headers?.common?.Authorization) {
            delete api.defaults.headers.common.Authorization;
          }
          
          // Also try the string format if that's being used
          if (api.defaults?.headers?.common && api.defaults.headers.common['Authorization']) {
            delete api.defaults.headers.common['Authorization'];
          }
        }
      } catch (headerError) {
        // Log but continue with logout even if headers can't be cleared
        console.warn('Failed to clear auth headers:', headerError);
      }
      
      // Then call backend logout API
      try {
        await authAPI.logout();
      } catch (err) {
        console.warn('Backend logout API call failed, but proceeding with local logout');
      }
      
      // Broadcast auth state change to all components
      authEvents.emit('auth_state_changed', { isAuthenticated: false });
      
      // Complete current state updates before navigation
      await new Promise(resolve => {
        // Let React finish its current update cycle
        setTimeout(resolve, 100);
      });
      
      // Navigate to login page
      router.push('/login');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Logout failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Resend verification email
  const resendVerification = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      await authAPI.resendVerification(email);
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to resend verification email';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Verify email with token
  const verifyEmail = async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      await authAPI.verifyEmail(token);
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to verify email';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    loginWithWallet,
    loginWithGoogle,
    register,
    forgotPassword,
    resetPassword,
    changePassword,
    logout,
    resendVerification,
    verifyEmail,
    isInitialized,
    loginAsGuest,
    startGuestSession,
    endGuestSession,
    userType,
    guestId,
  };
}

// Custom hook to access auth state directly from context
export const useAuthState = (): AuthState => {
  // Force component using this hook to rerender when auth state changes
  const [, setForceUpdate] = useState({});
  
  useEffect(() => {
    const unsubscribe = authEvents.subscribe(() => {
      // Force rerender
      setForceUpdate({});
    });
    
    return unsubscribe;
  }, []);
  
  try {
    const context = useContext(AuthStateContext);
    
    if (context === undefined) {
      // If used outside AuthProvider, fallback to store-based auth
      const storeAuth = useUserStore();
      return {
        user: storeAuth.user,
        isAuthenticated: !!storeAuth.user,
        isLoading: storeAuth.isLoading,
        error: storeAuth.error,
        userType: null,
        guestId: null
      };
    }
    
    return context;
  } catch (error) {
    // If context is not available at all, fallback to store-based auth
    const storeAuth = useUserStore();
    return {
      user: storeAuth.user,
      isAuthenticated: !!storeAuth.user,
      isLoading: storeAuth.isLoading,
      error: storeAuth.error,
      userType: null,
      guestId: null
    };
  }
};

// Custom hook to access auth dispatch
export const useAuthDispatch = (): React.Dispatch<AuthAction> => {
  const context = useContext(AuthDispatchContext);
  
  if (context === undefined) {
    // Return a no-op function that matches the dispatch signature
    return () => {};
  }
  
  return context;
};

// Custom hook to access auth methods
export const useAuthMethods = (): AuthContextMethods => {
  const context = useContext(AuthMethodsContext);
  
  if (context === undefined) {
    // Create a standalone instance of the useAuth hook's methods
    const {
      login,
      loginWithWallet,
      loginWithGoogle,
      register,
      forgotPassword,
      resetPassword,
      changePassword,
      logout,
      verifyEmail,
      resendVerification,
      startGuestSession,
      endGuestSession
    } = useAuth();
    
    // Return with required methods to match AuthContextMethods interface
    return {
      login,
      loginWithWallet,
      loginWithGoogle,
      register,
      forgotPassword,
      resetPassword,
      changePassword,
      logout,
      verifyEmail,
      resendVerification,
      startGuestSession,
      endGuestSession
    };
  }
  
  return context;
};