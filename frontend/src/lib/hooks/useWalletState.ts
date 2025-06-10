"use client";

import { useState, useEffect } from 'react';

export const ROLES = {
  VIEWER: 'viewer',
  SCIENTIST: 'scientist',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

interface WalletState {
  isWalletConnected: boolean;
  isWalletAuthorized: boolean;
  userAddress: string | undefined;
  ensName: string | undefined;
  userRole: UserRole;
  isWrongNetwork: boolean;
  walletType?: 'metamask' | 'coinbase';
  connectWallet: (type: 'metamask' | 'coinbase') => Promise<void>;
  disconnectWallet: () => void;
}

export const useWalletState = (): WalletState => {
  // Internal state
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [role, setRole] = useState<UserRole>(ROLES.VIEWER);
  const [ensName, setEnsName] = useState<string | undefined>(undefined);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [walletType, setWalletType] = useState<'metamask' | 'coinbase' | undefined>(undefined);

  // Handle wallet connection event
  useEffect(() => {
    const handleWalletConnected = (event: Event) => {
      const customEvent = event as CustomEvent<{
        address: string;
        walletType: 'metamask' | 'coinbase';
      }>;
      
      if (customEvent.detail?.address) {
        setIsConnected(true);
        setAddress(customEvent.detail.address);
        setWalletType(customEvent.detail.walletType);
        
        // Store connection in localStorage for persistence
        localStorage.setItem('wallet_connected', 'true');
        localStorage.setItem('wallet_address', customEvent.detail.address);
        localStorage.setItem('wallet_type', customEvent.detail.walletType);
      }
    };

    window.addEventListener('wallet-connected', handleWalletConnected);
    
    // Check if there's a stored connection
    const storedConnected = localStorage.getItem('wallet_connected') === 'true';
    const storedAddress = localStorage.getItem('wallet_address');
    const storedType = localStorage.getItem('wallet_type') as 'metamask' | 'coinbase' | null;
    
    if (storedConnected && storedAddress) {
      setIsConnected(true);
      setAddress(storedAddress);
      if (storedType) {
        setWalletType(storedType);
      }
    }
    
    return () => {
      window.removeEventListener('wallet-connected', handleWalletConnected);
    };
  }, []);

  // Set up role and authorization based on address
  useEffect(() => {
    if (isConnected && address) {
      // For demo purposes, assume the wallet is authorized if connected
      setIsAuthorized(true);
      
      // Assign a role based on the wallet address (demo purposes)
      if (address.toLowerCase().endsWith('a') || address.toLowerCase().endsWith('e')) {
        setRole(ROLES.SCIENTIST);
      } else if (address.toLowerCase().endsWith('f') || address.toLowerCase().endsWith('0')) {
        setRole(ROLES.ADMIN);
      } else {
        setRole(ROLES.VIEWER);
      }
      
      // Check if on the correct network (for demo)
      setIsWrongNetwork(false);
    } else {
      setIsAuthorized(false);
      setRole(ROLES.VIEWER);
      setEnsName(undefined);
      setIsWrongNetwork(false);
    }
  }, [isConnected, address]);
  
  // Connect wallet function (to be used outside of the WalletConnector)
  const connectWallet = async (type: 'metamask' | 'coinbase') => {
    try {
      // In a real implementation, this would use web3 libraries to connect
      // For our demo, we'll just simulate a successful connection
      const mockAddress = '0x' + Math.random().toString(16).substring(2, 42);
      
      // Dispatch the same event our WalletConnector component dispatches
      window.dispatchEvent(new CustomEvent('wallet-connected', { 
        detail: { 
          address: mockAddress,
          walletType: type
        } 
      }));
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };
  
  // Disconnect wallet function
  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(undefined);
    setIsAuthorized(false);
    setWalletType(undefined);
    
    // Clear localStorage
    localStorage.removeItem('wallet_connected');
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_type');
  };

  return {
    isWalletConnected: isConnected,
    isWalletAuthorized: isAuthorized,
    userAddress: address,
    ensName,
    userRole: role,
    isWrongNetwork,
    walletType,
    connectWallet,
    disconnectWallet
  };
}; 