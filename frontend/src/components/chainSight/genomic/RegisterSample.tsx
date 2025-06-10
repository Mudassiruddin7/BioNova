'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Check, AlertCircle, FileSymlink, Info, Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import { BaseWalletConnector } from '@/components/BaseWalletConnector';
import { registerGenomeSample } from '../../../contracts/contract-service';
import { useChainSightStore, Transaction } from '@/lib/stores/chainSightStore';

interface SampleData {
  sampleId: string;
  sampleType: string;
  description: string;
  qualityLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

export const RegisterSample = () => {
  const { address, isConnected } = useAccount();
  const { wallet, addTransaction } = useChainSightStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SampleData>({
    sampleId: '',
    sampleType: '',
    description: '',
    qualityLevel: 'Low',
  });

  const effectivelyConnected = isConnected || wallet.isConnected;

  useEffect(() => {
    setError(null);
  }, [isConnected, wallet.isConnected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (value: 'Low' | 'Medium' | 'High' | 'Critical') => {
    setFormData(prev => ({ ...prev, qualityLevel: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectivelyConnected) {
      setError("Please connect your wallet first.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    
    try {
      const importance = formData.qualityLevel;
      
      const txHash = await registerGenomeSample(
        formData.sampleId,
        formData.sampleType,
        formData.description,
        importance
      );
      
      console.log("Transaction successful:", txHash);
      
      // Add to global transaction history
      const newTransaction: Transaction = {
        hash: txHash,
        timestamp: Date.now(),
        description: `Registered Sample: ${formData.sampleId}`,
        type: 'sample',
        status: 'pending'
      };
      
      addTransaction(newTransaction);
      
      setFormData({
        sampleId: '',
        sampleType: '',
        description: '',
        qualityLevel: 'Low',
      });
    } catch (err) {
      console.error('Error registering sample:', err);
      if (err instanceof Error) {
        if (err.message.includes('wallet') && err.message.includes('connect')) {
          console.log('Wallet connection prompt already visible');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unknown error occurred while registering the sample');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Register New CRISPR Sample</h2>
        <p className="text-gray-400 text-sm">
          Record gene editing samples with immutable blockchain verification
        </p>
      </div>
      
      {!effectivelyConnected && (
        <div className="bg-indigo-900/30 border border-indigo-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col items-center space-y-4 py-8">
            <Wallet className="h-12 w-12 text-indigo-400 mb-2" />
            <h3 className="text-xl font-semibold text-white">Connect Your Wallet</h3>
            <p className="text-gray-400 text-center mb-4">Please connect your wallet to register CRISPR samples on the blockchain</p>
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
      
      {effectivelyConnected && (
        <form onSubmit={handleSubmit} className="space-y-6 mb-8">
          <div>
            <div className="flex items-center mb-1">
              <label htmlFor="sampleId" className="text-sm font-medium text-gray-400">Sample ID</label>
              <div className="ml-2 text-gray-500">
                <Info className="h-4 w-4" />
              </div>
            </div>
            <input
              type="text"
              id="sampleId"
              name="sampleId"
              required
              value={formData.sampleId}
              onChange={handleChange}
              placeholder="e.g. GEN-2023-001"
              className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <div className="flex items-center mb-1">
              <label htmlFor="sampleType" className="text-sm font-medium text-gray-400">Sample Type</label>
              <div className="ml-2 text-gray-500">
                <Info className="h-4 w-4" />
              </div>
            </div>
            <input
              type="text"
              id="sampleType"
              name="sampleType"
              required
              value={formData.sampleType}
              onChange={handleChange}
              placeholder="Enter sample type (e.g., DNA, RNA, Blood)"
              className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <div className="flex items-center mb-1">
              <label htmlFor="description" className="text-sm font-medium text-gray-400">Description</label>
              <div className="ml-2 text-gray-500">
                <Info className="h-4 w-4" />
              </div>
            </div>
            <textarea
              id="description"
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Detailed description including source, collection methods, and any special characteristics"
              className="w-full px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 block">Quality Level</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="qualityLow"
                  name="qualityLevel"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 mr-2"
                  checked={formData.qualityLevel === 'Low'}
                  onChange={() => handleRadioChange('Low')}
                />
                <label htmlFor="qualityLow" className="text-white">Low</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="qualityMedium"
                  name="qualityLevel"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 mr-2"
                  checked={formData.qualityLevel === 'Medium'}
                  onChange={() => handleRadioChange('Medium')}
                />
                <label htmlFor="qualityMedium" className="text-white">Medium</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="qualityHigh"
                  name="qualityLevel"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 mr-2"
                  checked={formData.qualityLevel === 'High'}
                  onChange={() => handleRadioChange('High')}
                />
                <label htmlFor="qualityHigh" className="text-white">High</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="qualityCritical"
                  name="qualityLevel"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 mr-2"
                  checked={formData.qualityLevel === 'Critical'}
                  onChange={() => handleRadioChange('Critical')}
                />
                <label htmlFor="qualityCritical" className="text-white">Critical</label>
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-900/20 rounded-lg p-4 border border-indigo-900/50">
            <div className="flex items-center">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-900/30 flex-shrink-0 mr-4">
                <AlertCircle className="h-5 w-5 text-indigo-400" />
              </div>
              <p className="text-sm text-gray-300">
                This will create an immutable record of your CRISPR gene editing sample on the Base blockchain. Your wallet will be recorded as the registrant.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                isSubmitting 
                  ? 'bg-indigo-700/50 text-white/70 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Register CRISPR Sample
                  <Send className="h-4 w-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}; 