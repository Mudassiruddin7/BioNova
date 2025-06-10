'use client';

import { useState, FormEvent, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Info, ShieldCheck, AlertCircle, Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import { BaseWalletConnector } from '@/components/BaseWalletConnector';
import { grantResearcherAccess, hasAdminRole, publicClient } from '../../../contracts/contract-service';
import { useChainSightStore, Transaction } from '@/lib/stores/chainSightStore';

type AccessRole = 'admin' | 'researcher' | 'viewer';

interface AccessControlData {
  userWalletAddress: string;
  accessRole: AccessRole;
}

export const AccessControl = () => {
  const { address, isConnected } = useAccount();
  const { wallet, addTransaction, setTransactionStatus } = useChainSightStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AccessControlData>({
    userWalletAddress: '',
    accessRole: 'viewer',
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [checkingAdminStatus, setCheckingAdminStatus] = useState<boolean>(false);

  const effectivelyConnected = isConnected || wallet.isConnected;
  const effectiveAddress = address || wallet.address;

  // Check admin status when wallet connects
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!effectivelyConnected || !effectiveAddress) {
        setIsAdmin(false);
        return;
      }

      setCheckingAdminStatus(true);
      try {
        const hasAdmin = await hasAdminRole(effectiveAddress);
        console.log('Has admin role:', hasAdmin);
        setIsAdmin(hasAdmin);
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      } finally {
        setCheckingAdminStatus(false);
      }
    };

    checkAdminStatus();
  }, [effectivelyConnected, effectiveAddress]);

  // Effect to check for transaction confirmation
  useEffect(() => {
    if (!pendingTxHash) return;

    const checkTransaction = async () => {
      try {
        console.log('Waiting for transaction receipt:', pendingTxHash);
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash: pendingTxHash as `0x${string}` 
        });
        
        console.log('Transaction receipt:', receipt);
        
        if (receipt.status === 'success') {
          setTransactionStatus(pendingTxHash, 'confirmed');
          setShowSuccess(true);
          
          // Reset form after successful transaction
          resetForm();
          
          // Hide success message after 5 seconds
          setTimeout(() => {
            setShowSuccess(false);
          }, 5000);
        } else {
          setTransactionStatus(pendingTxHash, 'failed');
          setError("Transaction failed. Please check the blockchain explorer for details.");
        }
      } catch (err) {
        console.error('Error waiting for transaction:', err);
        setTransactionStatus(pendingTxHash, 'failed');
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to get transaction confirmation: ${errMsg}`);
      } finally {
        setPendingTxHash(null);
      }
    };

    checkTransaction();
  }, [pendingTxHash, setTransactionStatus]);

  // Function to reset the form
  const resetForm = () => {
    setFormData({
      userWalletAddress: '',
      accessRole: 'viewer',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (accessRole: AccessRole) => {
    setFormData(prev => ({ ...prev, accessRole }));
  };

  const validateForm = (): boolean => {
    setError(null);
    
    if (!effectivelyConnected) {
      setError("Please connect your wallet first.");
      return false;
    }
    
    if (!isAdmin) {
      setError("You don't have admin rights to grant access. Only accounts with ADMIN_ROLE can grant access.");
      return false;
    }
    
    // Validate Ethereum address format
    if (!formData.userWalletAddress || !/^0x[a-fA-F0-9]{40}$/.test(formData.userWalletAddress)) {
      setError("Please enter a valid Ethereum wallet address");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Map frontend role names to contract roles
      console.log(`Attempting to grant ${formData.accessRole} access to ${formData.userWalletAddress}`);
      
      const txHash = await grantResearcherAccess(
        formData.accessRole, // Role name
        formData.userWalletAddress // Target account address
      );
      
      console.log('Access granted transaction:', txHash);
      
      // Add to global transaction history
      const newTransaction: Transaction = {
        hash: txHash,
        timestamp: Date.now(),
        description: `Granted ${formData.accessRole} access to ${formData.userWalletAddress.substring(0, 6)}...${formData.userWalletAddress.substring(38)}`,
        type: 'access',
        status: 'pending'
      };
      
      addTransaction(newTransaction);
      setPendingTxHash(txHash);
      
      // Don't immediately show success - wait for confirmation in useEffect
    } catch (err) {
      console.error('Error assigning access rights:', err);
      let errorMessage = 'An unknown error occurred while assigning access rights';
      
      if (err instanceof Error) {
        if (err.message.includes('wallet') && err.message.includes('connect')) {
          console.log('Wallet connection prompt already visible');
        } else if (err.message.includes('sender does not have required role')) {
          errorMessage = "You don't have admin rights to grant access. Only accounts with ADMIN_ROLE can grant access.";
          // Refresh admin status as it might have changed
          if (effectiveAddress) {
            hasAdminRole(effectiveAddress).then(setIsAdmin);
          }
        } else if (err.message.includes('transaction failed') || err.message.includes('cannot estimate')) {
          errorMessage = "Transaction cannot be processed. Please check that you have admin privileges and sufficient funds.";
        } else if (err.message.includes('rejected')) {
          errorMessage = "Transaction was rejected. Please try again.";
        } else if (err.message.includes('invalid address') || err.message.includes('Invalid contract address')) {
          errorMessage = "Contract address is invalid. The contract might not be deployed correctly.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xl font-bold text-white">Manage Access Control</h2>
      </div>
      <p className="text-sm text-gray-300 mb-6">
        Assign and manage permissions for genomic data access
      </p>

      {!effectivelyConnected && (
        <div className="bg-indigo-900/30 border border-indigo-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col items-center space-y-4 py-8">
            <Wallet className="h-12 w-12 text-indigo-400 mb-2" />
            <h3 className="text-xl font-semibold text-white">Connect Your Wallet</h3>
            <p className="text-gray-400 text-center mb-4">Please connect your wallet to manage access control on the blockchain</p>
            <BaseWalletConnector />
          </div>
        </div>
      )}
      
      {effectivelyConnected && !isAdmin && !checkingAdminStatus && (
        <div className="bg-orange-900/30 border border-orange-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-orange-400 mr-2" />
            <p className="text-orange-300 text-sm">
              Your account doesn't have admin rights. Only admin accounts can grant access.
            </p>
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
          <h3 className="text-green-400 font-medium mb-1">Access Rights Assigned Successfully!</h3>
          <p className="text-sm text-gray-300">
            Access permissions have been permanently recorded on the blockchain. The user now has the specified level of access to the genomic data.
          </p>
        </motion.div>
      ) : (
        effectivelyConnected && (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
                  User Wallet Address
                  <span title="Ethereum address to grant access to" className="cursor-help text-gray-500">
                    <Info size={14} />
                  </span>
                </label>
                <input
                  type="text"
                  name="userWalletAddress"
                  value={formData.userWalletAddress}
                  onChange={handleChange}
                  placeholder="0x..."
                  className="w-full px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter a valid wallet address (0x format)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-1">
                  Access Role
                  <span title="Level of access to grant" className="cursor-help text-gray-500">
                    <Info size={14} />
                  </span>
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div 
                    className={`flex items-center p-3 rounded-lg cursor-pointer border ${
                      formData.accessRole === 'admin' 
                        ? 'border-purple-500 bg-purple-900/20' 
                        : 'border-gray-700 bg-black/20 hover:bg-black/30'
                    }`}
                    onClick={() => handleRoleChange('admin')}
                  >
                    <div className="mr-3">
                      <div 
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.accessRole === 'admin' 
                            ? 'border-purple-500' 
                            : 'border-gray-500'
                        }`}
                      >
                        {formData.accessRole === 'admin' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Admin</div>
                      <div className="text-xs text-gray-400">Full control</div>
                    </div>
                  </div>
                  
                  <div 
                    className={`flex items-center p-3 rounded-lg cursor-pointer border ${
                      formData.accessRole === 'researcher' 
                        ? 'border-blue-500 bg-blue-900/20' 
                        : 'border-gray-700 bg-black/20 hover:bg-black/30'
                    }`}
                    onClick={() => handleRoleChange('researcher')}
                  >
                    <div className="mr-3">
                      <div 
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.accessRole === 'researcher' 
                            ? 'border-blue-500' 
                            : 'border-gray-500'
                        }`}
                      >
                        {formData.accessRole === 'researcher' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Researcher</div>
                      <div className="text-xs text-gray-400">Add and modify</div>
                    </div>
                  </div>
                  
                  <div 
                    className={`flex items-center p-3 rounded-lg cursor-pointer border ${
                      formData.accessRole === 'viewer' 
                        ? 'border-green-500 bg-green-900/20' 
                        : 'border-gray-700 bg-black/20 hover:bg-black/30'
                    }`}
                    onClick={() => handleRoleChange('viewer')}
                  >
                    <div className="mr-3">
                      <div 
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.accessRole === 'viewer' 
                            ? 'border-green-500' 
                            : 'border-gray-500'
                        }`}
                      >
                        {formData.accessRole === 'viewer' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Viewer</div>
                      <div className="text-xs text-gray-400">View only</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-indigo-900/20 rounded-lg border border-indigo-900/50">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={16} className="text-indigo-400" />
                <h3 className="text-sm font-medium text-indigo-400">Access Control</h3>
              </div>
              <p className="text-xs text-gray-300 mb-1">
                This will grant the specified user permanent access rights to the genomic data. This action is recorded on the blockchain.
              </p>
            </div>
            
            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting || !isAdmin}
                className={`px-8 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium flex items-center gap-2 ${
                  isSubmitting || !isAdmin ? 'opacity-70 cursor-not-allowed' : 'hover:from-indigo-500 hover:to-purple-500'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  'Assign Access Rights'
                )}
              </button>
            </div>
          </form>
        )
      )}
    </div>
  );
}; 