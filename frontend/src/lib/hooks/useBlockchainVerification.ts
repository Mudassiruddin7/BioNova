import { useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'sonner';

interface VerificationData {
  predictionId: string;
  originalSequence: string;
  editedSequence: string;
  timestamp?: string;
}

export const useBlockchainVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const generateHash = (data: VerificationData): string => {
    // Create a combined hash of the prediction data
    const dataString = JSON.stringify({
      id: data.predictionId,
      original: data.originalSequence,
      edited: data.editedSequence,
      timestamp: data.timestamp || Date.now(),
    });
    
    return ethers.utils.id(dataString);
  };

  const verify = async (data: VerificationData) => {
    try {
      setIsVerifying(true);
      setVerificationError(null);
      
      // Check if MetaMask or other web3 provider is available
      if (typeof window.ethereum === 'undefined') {
        const error = 'Web3 wallet not detected. Please install MetaMask';
        setVerificationError(error);
        toast.error(error);
        setIsVerifying(false);
        return;
      }
      
      // Connect to the provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Request account access
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      
      // Get connected address
      const address = await signer.getAddress();
      
      // Generate hash of the prediction data
      const dataHash = generateHash(data);
      
      // Create a simple transaction (in a production app, you'd interact with a smart contract)
      // For this demo, we'll just send a minimal amount of ETH to the same address with the hash in data
      const tx = await signer.sendTransaction({
        to: address,
        value: ethers.utils.parseEther("0.0001"),
        data: dataHash,
      });
      
      // Wait for transaction confirmation
      await tx.wait();
      
      setTransactionHash(tx.hash);
      setIsVerified(true);
      toast.success('Prediction verified on blockchain!');
      
    } catch (error) {
      console.error('Blockchain verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Verification failed. Please try again.';
      setVerificationError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    isVerifying,
    isVerified,
    transactionHash,
    verificationError,
    verify,
  };
};

// Add window ethereum type
declare global {
  interface Window {
    ethereum: any;
  }
} 