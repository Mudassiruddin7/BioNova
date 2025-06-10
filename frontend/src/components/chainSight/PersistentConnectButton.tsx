'use client';

import { useState, useEffect } from 'react';
import { useChainSightStore } from '@/lib/stores/chainSightStore';
import { useWalletAccount } from '@/lib/hooks/use-wallet-account';
import { useAuthState } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { BaseWalletConnector } from '@/components/BaseWalletConnector';

export function PersistentConnectButton() {
  const { address, isConnected } = useWalletAccount();
  const { setWalletConnected } = useChainSightStore();
  const { isAuthenticated, userType } = useAuthState();
  const router = useRouter();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const isGuest = userType === 'guest';
  
  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (!isMounted) return;
    
    try {
      if (address && isConnected) {
        setWalletConnected(true);
      } else {
        setWalletConnected(false);
      }
    } catch (error) {
      console.error('Error updating wallet connection state:', error);
    }
  }, [address, isConnected, setWalletConnected, isMounted]);

  const handleSignIn = () => {
    router.push('/login');
  };

  // Handle errors in wallet connections
  const handleOnError = (error: Error) => {
    console.error('Wallet connection error:', error);
    toast.error("Failed to connect wallet. Please try again.");
    setIsConnecting(false);
  };

  // Return a placeholder during SSR or before mounting
  if (!isMounted) {
    return (
      <div className="w-full">
        <div className="h-10 bg-indigo-600/30 rounded-md animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {isAuthenticated ? (
        // Show wallet connect button for authenticated users (including guests)
        <div className="relative">
          <BaseWalletConnector />
          {isGuest && (
            <div className="text-xs text-amber-400 mt-1 text-center">
              Connected as guest — data stored locally
            </div>
          )}
        </div>
      ) : (
        // Show sign in button and message when not authenticated
        <div className="space-y-2">
          <Button 
            variant="default" 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2"
            onClick={handleSignIn}
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In Required</span>
          </Button>
          <div className="text-xs text-center text-gray-400">
            Authentication required before connecting wallet
          </div>
        </div>
      )}
    </div>
  );
} 