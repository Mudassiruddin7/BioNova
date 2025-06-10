'use client';

import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Info, AlertCircle, Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import { BaseWalletConnector } from '@/components/BaseWalletConnector';
import { registerGeneticIP } from '../../../contracts/contract-service';
import { useChainSightStore, Transaction } from '@/lib/stores/chainSightStore';

interface IPRightsData {
  title: string;
  ipType: string;
  description: string;
  documentationUri?: string;
  initialOwners: string;
}

export const IPRights = () => {
  const { address, isConnected } = useAccount();
  const { wallet, addTransaction } = useChainSightStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<IPRightsData>({
    title: '',
    ipType: '',
    description: '',
    documentationUri: '',
    initialOwners: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const effectivelyConnected = isConnected || wallet.isConnected;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    setError(null);
    
    // Validate initial owners format (wallet addresses)
    if (formData.initialOwners) {
      const ownerAddresses = formData.initialOwners.split(',').map(addr => addr.trim());
      
      // Check if at least one owner is provided
      if (ownerAddresses.length === 0 || (ownerAddresses.length === 1 && !ownerAddresses[0])) {
        setError("Please enter at least one wallet address for initial owners");
        return false;
      }
      
      for (const addr of ownerAddresses) {
        if (!addr) continue;
        
        // Check exact length for Ethereum addresses (0x + 40 hex chars = 42 chars total)
        if (addr.length !== 42) {
          setError(`Invalid Ethereum address length: "${addr}". Addresses must be 42 characters long.`);
          return false;
        }
        
        // Check format with regex
        if (!addr.match(/^0x[a-fA-F0-9]{40}$/)) {
          setError(`Invalid Ethereum address format: "${addr}". Addresses must start with 0x followed by 40 hexadecimal characters.`);
          return false;
        }
      }
    } else {
      // If current wallet not included, add it automatically
      if (address) {
        setFormData(prev => ({...prev, initialOwners: address}));
      } else {
        setError("Please enter at least one wallet address for initial owners");
        return false;
      }
    }
    
    // Validate data lengths to prevent contract errors
    if (formData.title.length > 100) {
      setError("Title is too long. Please keep it under 100 characters.");
      return false;
    }
    
    if (formData.description.length > 500) {
      setError("Description is too long. Please keep it under 500 characters.");
      return false;
    }
    
    // Check for invalid characters in description and title
    const invalidCharsRegex = /[^\w\s.,;:'"\-\(\)]/g;
    if (invalidCharsRegex.test(formData.title)) {
      setError("Title contains invalid characters. Please use only letters, numbers, and basic punctuation.");
      return false;
    }
    
    if (invalidCharsRegex.test(formData.description)) {
      setError("Description contains invalid characters. Please use only letters, numbers, and basic punctuation.");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!effectivelyConnected) {
      setError("Please connect your wallet first.");
      return;
    }

    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    // Add a timeout to prevent infinite processing
    const processingTimeout = setTimeout(() => {
      setIsSubmitting(false);
      setError("Transaction is taking too long. Please try again later.");
    }, 30000); // 30 seconds timeout
    
    try {
      // Sanitize inputs before calling the contract
      const sanitizedTitle = formData.title.trim();
      const sanitizedDescription = formData.description.trim();
      
      // Format IP type - ensure it's uppercase as expected by the contract
      const sanitizedIpType = formData.ipType.trim().toUpperCase();
      
      // Sanitize URI - use empty string if not provided
      const sanitizedUri = formData.documentationUri?.trim() || "";
      
      // Clean up the wallet addresses and convert to array format for the contract
      const ownerAddresses = formData.initialOwners
        .split(',')
        .map(addr => addr.trim())
        .filter(addr => addr.startsWith('0x') && addr.length === 42);
      
      // If no valid addresses, use current wallet address
      if (ownerAddresses.length === 0 && address) {
        ownerAddresses.push(address as string);
      }
      
      if (ownerAddresses.length === 0) {
        throw new Error("No valid Ethereum addresses found for initial owners");
      }
      
      console.log('Calling contract with:', {
        title: sanitizedTitle,
        description: sanitizedDescription,
        ipType: sanitizedIpType,
        uri: sanitizedUri,
        initialOwners: ownerAddresses // This is now an array as required by the contract
      });
      
      // Explicitly verify types match what the contract expects
      if (!["PATENT", "COPYRIGHT", "TRADEMARK", "DISCOVERY"].includes(sanitizedIpType)) {
        console.warn(`IP Type "${sanitizedIpType}" may not be recognized. Consider using PATENT, COPYRIGHT, TRADEMARK, or DISCOVERY.`);
      }
      
      try {
        // Call the smart contract function - now with the array of addresses instead of a string
        const txHash = await registerGeneticIP(
          sanitizedTitle,
          sanitizedDescription,
          sanitizedIpType,
          sanitizedUri,
          ownerAddresses.join(',') // Join addresses back to string (the contract function will split it again)
        );
        
        console.log('IP Rights registration transaction:', txHash);
        
        // Add to global transaction history
        const newTransaction: Transaction = {
          hash: txHash,
          timestamp: Date.now(),
          description: `Registered IP: ${sanitizedTitle}`,
          type: 'ip', // Use 'ip' type as defined in ChainSightStore
          status: 'pending'
        };
        
        addTransaction(newTransaction);
      
      // Show success message
      setShowSuccess(true);
      
        // Reset form after delay
      setTimeout(() => {
        setFormData({
          title: '',
            ipType: '',
          description: '',
            documentationUri: '',
            initialOwners: '',
        });
        setShowSuccess(false);
      }, 5000);
      } catch (contractError) {
        console.error('Contract execution error:', contractError);
        
        // Handle specific contract errors
        if (contractError instanceof Error) {
          const errMsg = contractError.message.toLowerCase();
          if (errMsg.includes('user denied') || errMsg.includes('user rejected')) {
            setError("Transaction was rejected by user");
          } else if (errMsg.includes('insufficient funds')) {
            setError("Insufficient funds for transaction. Make sure you have enough ETH to cover gas fees.");
          } else if (errMsg.includes('gas required exceeds allowance')) {
            setError("Transaction requires more gas than allowed. Try simplifying the data or increasing gas limit.");
          } else if (errMsg.includes('execution reverted')) {
            // This is a contract-specific error
            setError("Contract execution failed: " + 
              (errMsg.includes(':') ? errMsg.split(':')[1].trim() : "Check your inputs and try again with simpler data"));
          } else {
            setError(`Contract error: ${contractError.message}`);
          }
        } else {
          setError("Failed to execute contract transaction");
        }
      }
    } catch (err) {
      console.error('Error registering IP rights:', err);
      // Ensure we stop processing state
      setIsSubmitting(false);
      
      if (err instanceof Error) {
        if (err.message.includes('wallet') && err.message.includes('connect')) {
          console.log('Wallet connection prompt already visible');
        } else if (err.message.includes('transaction failed') || err.message.includes('cannot estimate')) {
          setError("Transaction cannot be processed. Please check your inputs and try again with simpler data (shorter description, title, etc.)");
        } else {
          setError(err.message);
        }
      } else {
        setError('An unknown error occurred while registering the IP rights');
      }
    } finally {
      clearTimeout(processingTimeout);
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-3">
        <h2 className="text-xl font-bold text-white">Register Intellectual Property</h2>
        <p className="text-sm text-gray-400">
          Manage intellectual property rights for genomic discoveries
        </p>
      </div>

      {!effectivelyConnected && (
        <div className="bg-indigo-900/30 border border-indigo-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col items-center space-y-4 py-8">
            <Wallet className="h-12 w-12 text-indigo-400 mb-2" />
            <h3 className="text-xl font-semibold text-white">Connect Your Wallet</h3>
            <p className="text-gray-400 text-center mb-4">Please connect your wallet to register IP rights on the blockchain</p>
            <BaseWalletConnector />
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {showSuccess ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-900/30 border border-green-700 rounded-lg mb-6"
        >
          <h3 className="text-green-400 font-medium mb-1">IP Rights Registration Successful!</h3>
          <p className="text-sm text-gray-300">
            Your intellectual property claim has been permanently recorded on the blockchain with a timestamp. This can serve as evidence for priority of discovery.
          </p>
        </motion.div>
      ) : (
        effectivelyConnected && (
        <form onSubmit={handleSubmit}>
            <div className="space-y-5">
            <div>
                <div className="flex items-center mb-1">
                  <label htmlFor="title" className="text-sm text-gray-300">IP Title (e.g., Sample ID)</label>
                  <div className="ml-2 text-gray-500 cursor-help" title="Title or identifier for this IP record">
                    <Info className="h-4 w-4" />
                  </div>
                </div>
              <input
                type="text"
                  id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                  placeholder="Enter the IP title or identifier"
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white"
                required
              />
            </div>
            
            <div>
                <div className="flex items-center mb-1">
                  <label htmlFor="ipType" className="text-sm text-gray-300">IP Type</label>
                  <div className="ml-2 text-gray-500 cursor-help" title="Type of IP (e.g., Patent, Discovery)">
                    <Info className="h-4 w-4" />
                  </div>
                </div>
              <input
                type="text"
                  id="ipType"
                  name="ipType"
                  value={formData.ipType}
                onChange={handleChange}
                  placeholder="Enter IP type (e.g., PATENT, COPYRIGHT, TRADEMARK)"
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white"
                required
              />
                <p className="text-xs text-gray-400 mt-1">
                  Common types: PATENT, COPYRIGHT, TRADEMARK, DISCOVERY (use uppercase)
                </p>
            </div>
            
            <div>
                <div className="flex items-center mb-1">
                  <label htmlFor="description" className="text-sm text-gray-300">IP Description</label>
                  <div className="ml-2 text-gray-500 cursor-help" title="Description of the intellectual property">
                    <Info className="h-4 w-4" />
                  </div>
                </div>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detailed description of the discovery, innovation, or intellectual property being registered"
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white resize-none h-28"
                  required
                />
                </div>
                
                  <div>
                <div className="flex items-center mb-1">
                  <label htmlFor="documentationUri" className="text-sm text-gray-300">Documentation URI (Optional)</label>
                  <div className="ml-2 text-gray-500 cursor-help" title="Link to additional documentation">
                    <Info className="h-4 w-4" />
                  </div>
                </div>
                <input
                  type="text"
                  id="documentationUri"
                  name="documentationUri"
                  value={formData.documentationUri}
                  onChange={handleChange}
                  placeholder="Enter URI (e.g., https://...)"
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white"
                />
                </div>
                
                  <div>
                <div className="flex items-center mb-1">
                  <label htmlFor="initialOwners" className="text-sm text-gray-300">Initial Owners</label>
                  <div className="ml-2 text-gray-500 cursor-help" title="Comma-separated wallet addresses">
                    <Info className="h-4 w-4" />
                  </div>
                </div>
                <input
                  type="text"
                  id="initialOwners"
                  name="initialOwners"
                  value={formData.initialOwners}
                  onChange={handleChange}
                  placeholder="0x..., 0x..."
                  className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white font-mono"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter comma-separated wallet addresses. Your own address will be included if empty.
                </p>
                {address && (
                  <button 
                    type="button"
                    onClick={() => {
                      const currentOwners = formData.initialOwners;
                      const newOwners = currentOwners ? 
                        `${currentOwners}${currentOwners.endsWith(',') ? ' ' : ', '}${address}` : 
                        address;
                      setFormData(prev => ({...prev, initialOwners: newOwners}));
                    }}
                    className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    + Add my address ({address.substring(0, 6)}...{address.substring(38)})
                  </button>
                )}
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-800/50">
              <div className="flex items-center mb-1">
                <div className="text-blue-400 mr-2">
                  <Info className="h-5 w-5" />
            </div>
                <h3 className="text-sm font-medium text-blue-400">Intellectual Property Registration</h3>
          </div>
              <p className="text-xs text-gray-300">
                This will register your intellectual property claim on the blockchain, providing a timestamped record of your discovery.
                The transaction will be visible in your transaction history below.
            </p>
          </div>
          
            <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
                className={`w-full py-3 rounded-lg bg-indigo-600 text-white font-medium ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'
              }`}
            >
              {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Processing...</span>
                  </div>
              ) : (
                'Register IP Rights'
              )}
            </button>
          </div>
        </form>
        )
      )}
    </div>
  );
}; 