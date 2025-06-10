'use client';

import { useEffect, useReducer, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AuthStateContext, 
  AuthDispatchContext, 
  AuthMethodsContext,
  authReducer, 
  initialAuthState,
  AuthContextMethods,
  User,
  AuthAction
} from './AuthContext';
import { authAPI } from '@/lib/api';
import { authEvents } from '@/lib/hooks/useAuth';
import { 
  createGuestSession, 
  endGuestSession as clearGuestSession, 
  getGuestId, 
  loadGuestData,
  saveGuestData
} from '@/lib/utils/guestStorage';
import LoadingScreen from '@/components/ui/LoadingScreen';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Method implementations
  const authMethods: AuthContextMethods = {
    login: async (email: string, password: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'CLEAR_ERROR' });
        
        const response = await authAPI.login(email, password);
        
        // Store token in localStorage as a fallback mechanism
        if (response?.data?.data?.accessToken) {
          localStorage.setItem('auth_token', response.data.data.accessToken);
        }
        
        // Clear any existing guest session data when formally logging in
        clearGuestSession();
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: response.data.data.user });
        return Promise.resolve(response.data.data);
      } catch (err: any) {
        console.error('Login error:', err);
        const errorMessage = err.response?.data?.message || 'Login failed';
        dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
        return Promise.reject(err);
      }
    },

    register: async (email: string, password: string, name: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'CLEAR_ERROR' });
        
        const response = await authAPI.register(email, password, name);
        
        // Clear any existing guest session data when registering
        clearGuestSession();
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: response.data.data.user });
        return Promise.resolve();
      } catch (err: any) {
        console.error('Registration error:', err);
        const errorMessage = err.response?.data?.message || 'Registration failed';
        dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
        return Promise.reject(err);
      }
    },

    logout: async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // First clear all authentication storage in browser
        localStorage.removeItem('auth_token');
        localStorage.removeItem('guestId');
        localStorage.removeItem('isGuestSessionActive');
        
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
        
        // Then call backend logout
        try {
          await authAPI.logout();
        } catch (err) {
          console.warn('Backend logout API call failed, but proceeding with local logout');
        }
        
        // Update auth state
        dispatch({ type: 'LOGOUT_SUCCESS' });
        
        // Broadcast auth state change to all components
        // This needs to come after the dispatch so components get the latest state
        authEvents.emit('auth_state_changed', { isAuthenticated: false });
        
        // Delay redirect slightly to allow state updates to propagate
        setTimeout(() => {
          router.push('/login');
        }, 50);
        
        return Promise.resolve();
      } catch (err: any) {
        console.error('Logout error:', err);
        const errorMessage = err.response?.data?.message || 'Logout failed';
        dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
        return Promise.reject(err);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    loginWithWallet: async (walletAddress: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'CLEAR_ERROR' });
        
        console.log(`Attempting to login with wallet: ${walletAddress}`);
        
        // Try to call the backend API
        try {
          const response = await authAPI.loginWithWallet(walletAddress);
          console.log('Successfully authenticated with wallet address');
          
          // Explicitly save token from wallet auth response as fallback
          const token = response?.data?.data?.accessToken;
          if (token) {
            localStorage.setItem('auth_token', token);
          }
          
          // Clear any existing guest session data when formally logging in
          clearGuestSession();
          
          dispatch({ type: 'LOGIN_SUCCESS', payload: response.data.data.user });
          return Promise.resolve();
        } catch (err: any) {
          console.error('Wallet login API error:', err?.response?.status, err?.response?.data?.message || err.message);
          
          // If the backend is unavailable or returns certain errors, check if we're in development mode
          // and use a local fallback to allow developers to work without the backend
          if (
            process.env.NODE_ENV === 'development' && 
            (!err.response || err.response.status === 404 || err.response.status >= 500)
          ) {
            console.warn('Backend unavailable in development - using fallback wallet auth');
            
            // Create a mock user for development only
            const mockUser = {
              id: `user_${Math.random().toString(36).substring(2, 11)}`,
              walletAddress: walletAddress,
              name: `User_${walletAddress.substring(0, 6)}`,
              role: 'user'
            };
            
            // Save a mock token for development
            localStorage.setItem('auth_token', 'dev_wallet_auth_token');
            
            // Clear any existing guest session data when formally logging in
            clearGuestSession();
            
            dispatch({ type: 'LOGIN_SUCCESS', payload: mockUser });
            return Promise.resolve();
          } else {
            // In production or for other errors, propagate the error
            throw err;
          }
        }
      } catch (err: any) {
        console.error('Wallet login error:', err);
        let errorMessage = 'Login failed';
        
        if (!err.response) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (err.response.status === 401) {
          errorMessage = 'Unauthorized. Please check your wallet connection.';
        } else if (err.response.status === 403) {
          errorMessage = 'Access denied. You may not have permission to login with this wallet.';
        } else {
          errorMessage = err.response?.data?.message || 'Login failed';
        }
        
        // Clear any existing guest session data when formally logging in
        clearGuestSession();
        
        dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
        return Promise.reject(err);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    loginWithGoogle: async (idToken: string, email: string, name?: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'CLEAR_ERROR' });
        
        console.log(`Attempting to login with Google`, { emailProvided: !!email, nameProvided: !!name });
        
        if (!idToken) {
          throw new Error('Google ID token is required');
        }

        if (!email) {
          throw new Error('Email is required for Google authentication');
        }
        
        const response = await authAPI.loginWithGoogle(idToken, email, name);
        console.log('Successfully authenticated with Google', { status: response.status });
        
        // Save token from Google auth response
        const token = response?.data?.data?.accessToken;
        if (token) {
          console.log('Received access token from Google auth', { tokenLength: token.length });
          localStorage.setItem('auth_token', token);
        } else {
          console.warn('No access token found in Google auth response');
        }
        
        // Clear any existing guest session data when formally logging in
        clearGuestSession();
        
        // Make sure we have user data
        if (!response?.data?.data?.user) {
          console.error('No user data in Google auth response', response?.data);
          throw new Error('Authentication successful but user data is missing');
        }
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: response.data.data.user });
        
        // Return the response data for the calling component to use
        return response.data.data;
      } catch (err: any) {
        console.error('Google login error:', err);
        let errorMessage = 'Login failed';
        
        if (!err.response) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (err.response.status === 401) {
          errorMessage = 'Unauthorized. Please check your Google account.';
        } else if (err.response.status === 403) {
          errorMessage = 'Access denied. You may not have permission to login with this Google account.';
        } else if (err.response.status === 400) {
          errorMessage = err.response?.data?.message || 'Invalid Google authentication data';
        } else {
          errorMessage = err.response?.data?.message || 'Login failed';
        }
        
        console.error('Google login failed with message:', errorMessage);
        
        // Clear any existing guest session data when formally logging in
        clearGuestSession();
        
        dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
        
        // Add error as property to the error object for more context when rethrowing
        const error = new Error(errorMessage);
        (error as any).originalError = err;
        (error as any).responseData = err.response?.data;
        
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    verifyEmail: async (token: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'CLEAR_ERROR' });
        
        await authAPI.verifyEmail(token);
        dispatch({ type: 'SET_LOADING', payload: false });
        return true;
      } catch (err: any) {
        console.error('Email verification error:', err);
        const errorMessage = err.response?.data?.message || 'Failed to verify email';
        dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
        return false;
      }
    },

    resendVerification: async (email: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'CLEAR_ERROR' });
        
        await authAPI.resendVerification(email);
        dispatch({ type: 'SET_LOADING', payload: false });
        return true;
      } catch (err: any) {
        console.error('Resend verification error:', err);
        const errorMessage = err.response?.data?.message || 'Failed to resend verification email';
        dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
        return false;
      }
    },

    forgotPassword: async (email: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'CLEAR_ERROR' });
        
        await authAPI.forgotPassword(email);
        dispatch({ type: 'SET_LOADING', payload: false });
        return true;
      } catch (err: any) {
        console.error('Forgot password error:', err);
        const errorMessage = err.response?.data?.message || 'Failed to send reset email';
        dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
        return false;
      }
    },

    resetPassword: async (token: string, password: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'CLEAR_ERROR' });
        
        await authAPI.resetPassword(token, password);
        dispatch({ type: 'SET_LOADING', payload: false });
        return true;
      } catch (err: any) {
        console.error('Reset password error:', err);
        const errorMessage = err.response?.data?.message || 'Failed to reset password';
        dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
        return false;
      }
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'CLEAR_ERROR' });
        
        await authAPI.changePassword(currentPassword, newPassword);
        dispatch({ type: 'SET_LOADING', payload: false });
        return true;
      } catch (err: any) {
        console.error('Change password error:', err);
        const errorMessage = err.response?.data?.message || 'Failed to change password';
        dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
        return false;
      }
    },

    startGuestSession: async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'CLEAR_ERROR' });
        
        // Try to get a guest ID from the guestStorage utility if available
        let guestId = getGuestId();
        
        // If no guest ID exists, create a new guest session with the backend
        if (!guestId) {
          try {
            // Try the backend first to get a consistent guest ID
            const response = await authAPI.loginAsGuest();
            guestId = response.data.data.user.guestId || '';
            
            // Store the guest ID in localStorage if it wasn't returned properly
            if (!guestId) {
              guestId = createGuestSession();
            } else {
              // Save the backend-provided guestId to localStorage
              localStorage.setItem('guestId', guestId);
              localStorage.setItem('isGuestSessionActive', 'true');
              saveGuestData(guestId, {});
            }
            
            // Update auth state with guest user from backend
            dispatch({ 
              type: 'START_GUEST_SESSION', 
              payload: { guestId }
            });
            
            return Promise.resolve(guestId);
          } catch (err) {
            console.warn('Backend guest login failed, falling back to local-only guest session');
            // Fall back to client-side guest session if backend fails
            guestId = createGuestSession();
          }
        }
        
        // Update auth state with guest session
        dispatch({ 
          type: 'START_GUEST_SESSION', 
          payload: { guestId: guestId || '' }
        });
        
        return Promise.resolve(guestId || '');
      } catch (err: any) {
        console.error('Failed to start guest session:', err);
        dispatch({ type: 'AUTH_ERROR', payload: 'Failed to start guest session' });
        return Promise.reject(err);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    endGuestSession: async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'CLEAR_ERROR' });
        
        // Get the current guest ID
        const guestId = getGuestId();
        
        // Clear guest session data from localStorage
        if (guestId) {
          clearGuestSession();
        }
        
        // Try to logout from backend
        try {
          await authAPI.logout();
        } catch (err) {
          console.warn('Backend logout failed, but guest session was cleared locally');
        }
        
        // Update auth state
        dispatch({ type: 'END_GUEST_SESSION' });
        
        return Promise.resolve();
      } catch (err: any) {
        console.error('Failed to end guest session:', err);
        dispatch({ type: 'AUTH_ERROR', payload: 'Failed to end guest session' });
        return Promise.reject(err);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  };

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Always check auth status regardless of the page
        // This ensures consistent auth state across all routes
        
        // First check if we have a token in localStorage as fallback
        const token = localStorage.getItem('auth_token');
        if (token) {
          console.debug('Found authentication token in localStorage');
          // Set the token in axios headers
          const api = authAPI as any;
          if (api.setToken) {
            api.setToken(token);
          }
        }

        // Check for guest session
        const guestId = localStorage.getItem('guestId');
        const isGuest = localStorage.getItem('isGuestSessionActive') === 'true';
        
        if (guestId && isGuest) {
          // Load guest data
          try {
            const guestData = JSON.parse(localStorage.getItem(`guest_data_${guestId}`) || '{}');
            // Create a mock guest user
            const mockUser = {
              id: guestId,
              name: `Guest-${guestId.substring(0, 8)}`,
              role: 'guest',
              isGuest: true
            };
            dispatch({ 
              type: 'START_GUEST_SESSION', 
              payload: { guestId }
            });
            dispatch({ type: 'SET_LOADING', payload: false });
            setIsInitialized(true);
            
            // Skip API call if we're in guest mode
            return;
          } catch (err) {
            console.warn('Failed to load guest data, will try standard auth', err);
          }
        }

        // Try to fetch the current user
        try {
          const response = await authAPI.getCurrentUser();
          dispatch({ type: 'LOGIN_SUCCESS', payload: response.data.data.user });
        } catch (err: any) {
          console.warn('Auth check failed:', err?.response?.status || err.message || err);
          
          // Not authenticated - clean and redirect on protected routes
          if (err.response && err.response.status === 401) {
            // It's a 401 so we just need to clear the auth state
            localStorage.removeItem('auth_token');
            dispatch({ type: 'LOGOUT_SUCCESS' });
            
            // Check if we're on a page where auth check isn't necessary
            if (typeof window !== 'undefined') {
              const pathname = window.location.pathname;
              const isLoginPage = pathname === '/login' || pathname.includes('/login');
              const isHomePage = pathname === '/';
              const isRegisterPage = pathname === '/register';
              
              // For ChainSight page, we want to stay there even if not authenticated
              // to allow users to see the anonymous view
              const isChainSightPage = pathname.includes('/chainSight');
              
              // Check if current route requires authentication
              const protectedRoutes = ['/dashboard', '/profile', '/settings', '/projects'];
              const requiresAuth = protectedRoutes.some(route => pathname.startsWith(route));
              
              if (requiresAuth && !isChainSightPage) {
                console.log('Protected route. Redirecting to login');
                router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
              }
            }
          } else {
            // For network errors or unexpected errors, we show a message but don't redirect
            if (!err.response) {
              dispatch({ type: 'AUTH_ERROR', payload: 'Network error. Please check your connection.' });
            } else {
              dispatch({ type: 'AUTH_ERROR', payload: err.response?.data?.message || 'Authentication check failed' });
            }
          }
        }
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        setIsInitialized(true);
      }
    };

    checkAuthStatus();
  }, [router]);

  // While checking auth status on initial load, show a loader
  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <AuthStateContext.Provider value={state}>
      <AuthDispatchContext.Provider value={dispatch}>
        <AuthMethodsContext.Provider value={authMethods}>
          {children}
        </AuthMethodsContext.Provider>
      </AuthDispatchContext.Provider>
    </AuthStateContext.Provider>
  );
}; 