'use client';

import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Info, GitBranch, AlertCircle, Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import { BaseWalletConnector } from '@/components/BaseWalletConnector';
import { updateGeneticSampleStatus } from '../../../contracts/contract-service';
import { useChainSightStore, Transaction } from '@/lib/stores/chainSightStore';

// Map UI workflow status to contract status values
const CONTRACT_STATUS_MAP = {
  'pending': 'Collected',
  'in-progress': 'Processing',
  'completed': 'Analyzed',
  'failed': 'Archived'
};

type WorkflowStatus = 'pending' | 'in-progress' | 'completed' | 'failed';

interface WorkflowData {
  sampleId: string;
  status: WorkflowStatus;
  notes: string;
}

export const WorkflowManager = () => {
  const { address, isConnected } = useAccount();
  const { wallet, addTransaction } = useChainSightStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<WorkflowData>({
    sampleId: '',
    status: 'pending',
    notes: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const effectivelyConnected = isConnected || wallet.isConnected;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (status: WorkflowStatus) => {
    setFormData(prev => ({ ...prev, status }));
  };

  const validateForm = (): boolean => {
    setError(null);
    
    // Validate sample ID format
    if (!formData.sampleId.trim()) {
      setError("Sample ID is required");
      return false;
    }
    
    // Validate notes - prevent overly long notes
    if (formData.notes.length > 500) {
      setError("Notes are too long. Please keep them under 500 characters.");
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
    
    try {
      // Convert UI status to contract status
      const contractStatus = CONTRACT_STATUS_MAP[formData.status];
      
      // Call smart contract function
      const txHash = await updateGeneticSampleStatus(
        formData.sampleId.trim(),
        contractStatus,
        formData.notes.trim()
      );
      
      console.log('Workflow status update transaction:', txHash);
      
      // Add to global transaction history
      const newTransaction: Transaction = {
        hash: txHash,
        timestamp: Date.now(),
        description: `Updated ${formData.sampleId} to ${formData.status}`,
        type: 'workflow',
        status: 'pending'
      };
      
      addTransaction(newTransaction);
      
      // Show success message
      setShowSuccess(true);
      
      // Reset form after delay
      setTimeout(() => {
        setFormData({
          sampleId: '',
          status: 'pending',
          notes: '',
        });
        setShowSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error updating workflow status:', err);
      if (err instanceof Error) {
        if (err.message.includes('wallet') && err.message.includes('connect')) {
          console.log('Wallet connection prompt already visible');
        } else if (err.message.includes('transaction failed') || err.message.includes('cannot estimate')) {
          setError("Transaction cannot be processed. Please check your inputs and try again.");
        } else if (err.message.includes('Function') && err.message.includes('not found')) {
          setError("Smart contract function error. The workflow automation contract may need to be updated.");
        } else if (err.message.includes('rejected')) {
          setError("Transaction was rejected. Please try again.");
        } else {
          setError(err.message);
        }
      } else {
        setError('An unknown error occurred while updating the workflow status');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xl font-bold text-white">Manage Workflow</h2>
      </div>
      <p className="text-sm text-gray-300 mb-6">
        Track sample workflow status and processing stages
      </p>

      {!effectivelyConnected && (
        <div className="bg-indigo-900/30 border border-indigo-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col items-center space-y-4 py-8">
            <Wallet className="h-12 w-12 text-indigo-400 mb-2" />
            <h3 className="text-xl font-semibold text-white">Connect Your Wallet</h3>
            <p className="text-gray-400 text-center mb-4">Please connect your wallet to update workflow status on the blockchain</p>
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
          <h3 className="text-green-400 font-medium mb-1">Workflow Status Updated Successfully!</h3>
          <p className="text-sm text-gray-300">
            The workflow status has been permanently recorded on the blockchain and will trigger any automated processes associated with this stage.
          </p>
        </motion.div>
      ) : (
        effectivelyConnected && (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
                  Sample ID
                  <span title="ID of the sample to update" className="cursor-help text-gray-500">
                    <Info size={14} />
                  </span>
                </label>
                <input
                  type="text"
                  name="sampleId"
                  value={formData.sampleId}
                  onChange={handleChange}
                  placeholder="Enter the sample ID number"
                  className="w-full px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-1">
                  Workflow Status
                  <span title="Current processing stage" className="cursor-help text-gray-500">
                    <Info size={14} />
                  </span>
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div 
                    className={`flex items-center p-3 rounded-lg cursor-pointer border ${
                      formData.status === 'pending' 
                        ? 'border-yellow-500 bg-yellow-900/20' 
                        : 'border-gray-700 bg-black/20 hover:bg-black/30'
                    }`}
                    onClick={() => handleStatusChange('pending')}
                  >
                    <div className="mr-3">
                      <div 
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.status === 'pending' 
                            ? 'border-yellow-500' 
                            : 'border-gray-500'
                        }`}
                      >
                        {formData.status === 'pending' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Pending</div>
                      <div className="text-xs text-gray-400">Awaiting processing</div>
                    </div>
                  </div>
                  
                  <div 
                    className={`flex items-center p-3 rounded-lg cursor-pointer border ${
                      formData.status === 'in-progress' 
                        ? 'border-blue-500 bg-blue-900/20' 
                        : 'border-gray-700 bg-black/20 hover:bg-black/30'
                    }`}
                    onClick={() => handleStatusChange('in-progress')}
                  >
                    <div className="mr-3">
                      <div 
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.status === 'in-progress' 
                            ? 'border-blue-500' 
                            : 'border-gray-500'
                        }`}
                      >
                        {formData.status === 'in-progress' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">In Progress</div>
                      <div className="text-xs text-gray-400">Currently being processed</div>
                    </div>
                  </div>
                  
                  <div 
                    className={`flex items-center p-3 rounded-lg cursor-pointer border ${
                      formData.status === 'completed' 
                        ? 'border-green-500 bg-green-900/20' 
                        : 'border-gray-700 bg-black/20 hover:bg-black/30'
                    }`}
                    onClick={() => handleStatusChange('completed')}
                  >
                    <div className="mr-3">
                      <div 
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.status === 'completed' 
                            ? 'border-green-500' 
                            : 'border-gray-500'
                        }`}
                      >
                        {formData.status === 'completed' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Completed</div>
                      <div className="text-xs text-gray-400">Processing finished successfully</div>
                    </div>
                  </div>
                  
                  <div 
                    className={`flex items-center p-3 rounded-lg cursor-pointer border ${
                      formData.status === 'failed' 
                        ? 'border-red-500 bg-red-900/20' 
                        : 'border-gray-700 bg-black/20 hover:bg-black/30'
                    }`}
                    onClick={() => handleStatusChange('failed')}
                  >
                    <div className="mr-3">
                      <div 
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.status === 'failed' 
                            ? 'border-red-500' 
                            : 'border-gray-500'
                        }`}
                      >
                        {formData.status === 'failed' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Failed</div>
                      <div className="text-xs text-gray-400">Processing encountered errors</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
                  Workflow Notes
                  <span title="Additional workflow information" className="cursor-help text-gray-500">
                    <Info size={14} />
                  </span>
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Details about the current processing stage, next steps, or special handling instructions"
                  className="w-full px-3 py-2 h-32 bg-black/30 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-blue-900/20 rounded-lg border border-blue-900/50">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch size={16} className="text-blue-400" />
                <h3 className="text-sm font-medium text-blue-400">Workflow Automation</h3>
              </div>
              <p className="text-xs text-gray-300 mb-1">
                This will update the workflow status of the sample and trigger any automated processes associated with this stage.
                The transaction will be visible in your transaction history below.
              </p>
            </div>
            
            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium flex items-center gap-2 ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:from-blue-500 hover:to-purple-500'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  'Update Workflow Status'
                )}
              </button>
            </div>
          </form>
        )
      )}
    </div>
  );
}; 