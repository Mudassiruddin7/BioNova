'use client';

import { 
  Wallet, 
  ConnectWallet, 
  WalletDropdown, 
  WalletDropdownDisconnect 
} from '@coinbase/onchainkit/wallet';
import { 
  Address, 
  Avatar, 
  Name, 
  Identity, 
  EthBalance 
} from '@coinbase/onchainkit/identity';
import { useChainSightStore } from '@/lib/stores/chainSightStore';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

interface BaseWalletConnectorProps {
  containerClassName?: string;
}

export function BaseWalletConnector({ containerClassName = "" }: BaseWalletConnectorProps) {
  const { setWalletConnected } = useChainSightStore();
  const { address, isConnected } = useAccount();
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update wallet connected state when connection changes
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

  // Return a placeholder during SSR or before mounting
  if (!isMounted) {
    return (
      <div className={containerClassName}>
        <div className="h-10 bg-indigo-600/30 rounded-md animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <Wallet>
        <ConnectWallet disconnectedLabel='Connect Wallet'>
          <Avatar className="h-6 w-6" />
          <Name />
        </ConnectWallet>
        <WalletDropdown>
          <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
            <Avatar />
            <Name />
            <Address />
            <EthBalance />
          </Identity>
          <WalletDropdownDisconnect />
        </WalletDropdown>
      </Wallet>
    </div>
  );
} 