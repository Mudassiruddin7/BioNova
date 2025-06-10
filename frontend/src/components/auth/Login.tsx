'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthState, useAuthMethods } from '@/lib/hooks/useAuth';
import { useAccount } from 'wagmi';
import { WalletConnector } from '@/components/chainSight/WalletConnector';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Login() {
  const { user, isLoading, isAuthenticated } = useAuthState();
  const { loginWithWallet } = useAuthMethods();
  const { address, isConnected } = useAccount();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const errorParam = searchParams.get('error');

  useEffect(() => {
    // Set error from URL parameter if present
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [errorParam]);

  useEffect(() => {
    // If user is already authenticated, redirect to the intended destination
    if (isAuthenticated && !isLoading) {
      router.push(redirectPath);
    }
  }, [isAuthenticated, isLoading, router, redirectPath]);

  useEffect(() => {
    // When wallet is connected, automatically log in with the address
    if (isConnected && address && !isAuthenticated && !isAuthenticating) {
      handleWalletLogin();
    }
  }, [isConnected, address, isAuthenticated]);

  const handleWalletLogin = async () => {
    if (!address) return;
    
    try {
      setIsAuthenticating(true);
      setError(null);
      await loginWithWallet(address);
      router.push(redirectPath);
    } catch (error: any) {
      console.error('Wallet login failed:', error);
      setError(error?.response?.data?.message || 'Failed to authenticate with wallet');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="mt-2 text-gray-400">Please connect your wallet to continue</p>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-red-900/30 border-red-900 text-red-300">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-8 space-y-6">
          <div className="flex flex-col items-center space-y-6">
            <WalletConnector />
            
            {isAuthenticating && (
              <div className="mt-4 text-white">
                <p>Authenticating...</p>
              </div>
            )}

            <div className="text-center mt-4">
              <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300">
                Sign in with Email/Password
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 