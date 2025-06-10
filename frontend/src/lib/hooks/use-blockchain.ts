import { useState, useCallback, useEffect } from 'react';
import { useWalletAccount } from './use-wallet-account';
import { readContract, writeContract } from '@/lib/blockchain/contracts';
import { useChainId, useConfig, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { toast } from 'sonner';

export function useBlockchain() {
  const { address, isConnected } = useWalletAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const config = useConfig();
  
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // Check if user is on the correct chain
  const isCorrectChain = chainId === baseSepolia.id;

  // Verify chain function for compatibility
  const verifyChain = useCallback(async () => {
    console.log('Verifying chain, current chainId:', chainId, 'target:', baseSepolia.id);
    return isCorrectChain;
  }, [chainId, isCorrectChain]);

  // Switch to Base Sepolia
  const switchToBaseChain = useCallback(async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return false;
    }

    try {
      await switchChain({ chainId: baseSepolia.id });
      return true;
    } catch (error) {
      console.error('Error switching chain:', error);
      toast.error('Failed to switch to Base Sepolia network');
      return false;
    }
  }, [isConnected, switchChain]);

  // Read from contract (with type inference)
  const read = useCallback(async <T,>(
    contract: Parameters<typeof readContract>[0]['contract'],
    method: string,
    args: any[] = []
  ): Promise<T | null> => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return null;
    }
    
    try {
      const data = await readContract<T>({
        contract,
        method,
        args,
      });
      
      return data;
    } catch (error) {
      console.error(`Error reading from ${contract}.${method}:`, error);
      toast.error(`Failed to read data from contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }, [isConnected]);

  // Write to contract
  const write = useCallback(async (
    contract: Parameters<typeof writeContract>[0]['contract'],
    method: string,
    args: any[] = [],
    value: bigint = 0n
  ): Promise<string | null> => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return null;
    }
    
    // Verify user is on the correct chain
    if (!isCorrectChain) {
      const switched = await switchToBaseChain();
      if (!switched) return null;
    }
    
    setIsLoading(true);
    setTxHash(null);
    
    try {
      const { hash } = await writeContract({
        contract,
        method,
        args,
        value,
      });
      
      setTxHash(hash);
      toast.success('Transaction submitted successfully!');
      return hash;
    } catch (error) {
      console.error(`Error writing to ${contract}.${method}:`, error);
      toast.error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, isCorrectChain, switchToBaseChain]);

  // Log connection status for debugging
  useEffect(() => {
    console.log('Blockchain connection status:', {
      isConnected,
      address,
      chainId,
      isCorrectChain
    });
  }, [isConnected, address, chainId, isCorrectChain]);

  return {
    read,
    write,
    verifyChain,
    switchToBaseChain,
    isCorrectChain,
    isLoading,
    txHash,
    address,
    isConnected,
  };
} 