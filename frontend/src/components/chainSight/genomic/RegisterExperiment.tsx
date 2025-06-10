'use client';

import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Info, AlertCircle, Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import { BaseWalletConnector } from '@/components/BaseWalletConnector';
import { registerCRISPRExperiment } from '../../../contracts/contract-service';
import { useChainSightStore, Transaction } from '@/lib/stores/chainSightStore';

interface ExperimentData {
  specimenId: string;
  location: string;
  notes: string;
}

export const RegisterExperiment = () => {
  const { address, isConnected } = useAccount();
  const { wallet, addTransaction } = useChainSightStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ExperimentData>({
    specimenId: '',
    location: '',
    notes: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const effectivelyConnected = isConnected || wallet.isConnected;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Only allow numbers for specimenId
    if (name === 'specimenId' && !/^\d*$/.test(value)) {
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    // Clear any existing errors
    setError(null);
    
    // Check if specimenId is a valid number
    if (!formData.specimenId || !/^\d+$/.test(formData.specimenId)) {
      setError("Specimen ID must be a numeric value");
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
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Call contract function - convert specimenId to bigint
      const txHash = await registerCRISPRExperiment(
        BigInt(formData.specimenId),
        formData.location,
        formData.notes
      );
      
      console.log('Experiment registration transaction:', txHash);
      
      // Add to global transaction history
      const newTransaction: Transaction = {
        hash: txHash,
        timestamp: Date.now(),
        description: `Registered Experiment for Specimen: ${formData.specimenId}`,
        type: 'experiment',
        status: 'pending'
      };
      
      addTransaction(newTransaction);
      
      // Show success message
      setShowSuccess(true);
      
      // Reset form after delay
      setTimeout(() => {
        setFormData({
          specimenId: '',
          location: '',
          notes: '',
        });
        setShowSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error registering experiment:', err);
      if (err instanceof Error) {
        if (err.message.includes('wallet') && err.message.includes('connect')) {
          console.log('Wallet connection prompt already visible');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unknown error occurred while registering the experiment');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xl font-bold text-white">Register Experiment Location & Notes</h2>
      </div>
      <p className="text-sm text-gray-300 mb-6">
        Track experiment location and notes for genomic samples
      </p>

      {!effectivelyConnected && (
        <div className="bg-indigo-900/30 border border-indigo-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col items-center space-y-4 py-8">
            <Wallet className="h-12 w-12 text-indigo-400 mb-2" />
            <h3 className="text-xl font-semibold text-white">Connect Your Wallet</h3>
            <p className="text-gray-400 text-center mb-4">Please connect your wallet to register experiments on the blockchain</p>
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
          <h3 className="text-green-400 font-medium mb-1">Experiment Registration Successful!</h3>
          <p className="text-sm text-gray-300">
            Your experiment details have been permanently recorded on the blockchain. The transaction is being processed and will be confirmed shortly.
          </p>
        </motion.div>
      ) : (
        effectivelyConnected && (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
                  Specimen ID
                  <span title="ID of the specimen used in this experiment (numeric only)" className="cursor-help text-gray-500">
                    <Info size={14} />
                  </span>
                </label>
                <input
                  type="text"
                  name="specimenId"
                  value={formData.specimenId}
                  onChange={handleChange}
                  placeholder="Enter the specimen ID number (numbers only)"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  className="w-full px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Specimen ID must contain only numbers
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
                  Location
                  <span title="Location where experiment was conducted" className="cursor-help text-gray-500">
                    <Info size={14} />
                  </span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Enter experiment location (e.g., Lab A, Site B)"
                  className="w-full px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
                  Experiment Notes
                  <span title="Detailed information about the experiment" className="cursor-help text-gray-500">
                    <Info size={14} />
                  </span>
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Protocol details, conditions, results, and observations"
                  className="w-full px-3 py-2 h-40 bg-black/30 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-blue-900/20 rounded-lg border border-blue-900/50">
              <div className="flex items-center gap-2 mb-2">
                <Info size={16} className="text-blue-400" />
                <h3 className="text-sm font-medium text-blue-400">Experiment Record</h3>
              </div>
              <p className="text-xs text-gray-300 mb-1">
                This will create a permanent record of the experiment. Your wallet address will be recorded as the researcher.
              </p>
            </div>
            
            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium flex items-center gap-2 ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:from-purple-500 hover:to-indigo-500'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  'Register Experiment'
                )}
              </button>
            </div>
          </form>
        )
      )}
    </div>
  );
}; 