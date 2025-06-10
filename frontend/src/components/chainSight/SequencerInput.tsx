"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useChainSightStore, ExperimentType, GenomicRecord } from '@/lib/stores/chainSightStore';
import { EFFECTS, DNA_COLORS } from '@/lib/constants/designTokens';

export const SequencerInput = () => {
  const { isSequencerOpen, toggleSequencer, addRecord } = useChainSightStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [txState, setTxState] = useState<'idle' | 'waitingSignature' | 'broadcasting' | 'confirming' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Form fields
  const [formData, setFormData] = useState({
    originalSequence: '',
    editedSequence: '',
    experimentType: 'prediction' as ExperimentType,
    notes: '',
    sensorData: '',
    relatedRecordId: '',
  });
  
  // Reset form and state when closing
  useEffect(() => {
    if (!isSequencerOpen) {
      setCurrentStep(0);
      setTxState('idle');
      setErrorMessage('');
      setFormData({
        originalSequence: '',
        editedSequence: '',
        experimentType: 'prediction',
        notes: '',
        sensorData: '',
        relatedRecordId: '',
      });
    }
  }, [isSequencerOpen]);
  
  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSequencerOpen) {
        // Only close if not in the middle of a transaction
        if (txState === 'idle' || txState === 'error' || txState === 'success') {
          toggleSequencer();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSequencerOpen, toggleSequencer, txState]);
  
  // Function to handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle experiment type selection
  const handleExperimentTypeSelect = (type: ExperimentType) => {
    setFormData(prev => ({
      ...prev,
      experimentType: type
    }));
  };
  
  // Check if current step is valid before allowing to proceed
  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.originalSequence.trim() !== '' && formData.editedSequence.trim() !== '';
      case 1:
        // Context step is optional, so always valid
        return true;
      case 2:
        // Review step is valid if previous steps are valid
        return formData.originalSequence.trim() !== '' && formData.editedSequence.trim() !== '';
      default:
        return false;
    }
  };
  
  // Next step
  const handleNextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };
  
  // Previous step
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  // Submit the record
  const handleSubmit = async () => {
    try {
      // Show waiting for signature
      setTxState('waitingSignature');
      
      // Simulate wallet signature request
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate broadcasting
      setTxState('broadcasting');
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Simulate confirmation
      setTxState('confirming');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create the new record
      const newRecord: GenomicRecord = {
        id: `0x${Math.random().toString(16).slice(2, 42)}`,
        experimentType: formData.experimentType,
        timestamp: Date.now(),
        loggedBy: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Demo address
        blockNumber: 12345678 + Math.floor(Math.random() * 1000),
        txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
        geneSequence: {
          original: formData.originalSequence,
          edited: formData.editedSequence,
        },
        metadata: formData.sensorData ? JSON.parse(formData.sensorData) : {},
        notes: formData.notes || undefined,
        relatedRecords: formData.relatedRecordId ? [formData.relatedRecordId] : undefined,
      };
      
      // Add the record to the store
      addRecord(newRecord);
      
      // Show success
      setTxState('success');
      
      // Close after success
      setTimeout(() => {
        toggleSequencer();
      }, 2000);
    } catch (error) {
      console.error('Error submitting record:', error);
      setTxState('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };
  
  // Steps content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Define Gene Edit</h2>
            
            {/* Experiment Type Selection */}
            <div>
              <label className="block mb-3 text-sm font-medium" style={{ color: DNA_COLORS.text.secondary }}>
                Experiment Type
              </label>
              <div className="grid grid-cols-3 gap-4">
                {(['prediction', 'sensor', 'manual'] as ExperimentType[]).map((type) => (
                  <button
                    key={type}
                    className={`p-4 rounded-lg flex flex-col items-center gap-2 border transition-all`}
                    style={{
                      background: formData.experimentType === type 
                        ? `rgba(${type === 'prediction' ? '0, 255, 255' : type === 'sensor' ? '255, 0, 255' : '0, 255, 127'}, 0.1)`
                        : 'rgba(0, 0, 0, 0.3)',
                      borderColor: formData.experimentType === type 
                        ? type === 'prediction' 
                          ? DNA_COLORS.primary 
                          : type === 'sensor' 
                            ? DNA_COLORS.secondary 
                            : DNA_COLORS.tertiary
                        : 'rgba(255, 255, 255, 0.1)',
                      boxShadow: formData.experimentType === type 
                        ? `0 0 15px rgba(${type === 'prediction' ? '0, 255, 255' : type === 'sensor' ? '255, 0, 255' : '0, 255, 127'}, 0.2)`
                        : 'none'
                    }}
                    onClick={() => handleExperimentTypeSelect(type)}
                  >
                    <span className="text-2xl">
                      {type === 'prediction' ? '🧪' : type === 'sensor' ? '📊' : '📝'}
                    </span>
                    <span className="text-sm capitalize font-medium text-white">
                      {type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Gene Sequence Inputs */}
            <div>
              <label className="block mb-2 text-sm font-medium" style={{ color: DNA_COLORS.text.secondary }}>
                Original Gene Sequence
              </label>
              <textarea
                name="originalSequence"
                value={formData.originalSequence}
                onChange={handleChange}
                rows={5}
                className="w-full p-3 rounded font-mono text-sm"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#FF5555',
                  caretColor: '#FFFFFF',
                }}
                placeholder="Enter original gene sequence..."
              />
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium" style={{ color: DNA_COLORS.text.secondary }}>
                Edited Gene Sequence
              </label>
              <textarea
                name="editedSequence"
                value={formData.editedSequence}
                onChange={handleChange}
                rows={5}
                className="w-full p-3 rounded font-mono text-sm"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#55FF55',
                  caretColor: '#FFFFFF',
                }}
                placeholder="Enter edited gene sequence..."
              />
            </div>
          </div>
        );
      
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Add Context (Optional)</h2>
            
            {/* Additional inputs based on experiment type */}
            {formData.experimentType === 'sensor' && (
              <div>
                <label className="block mb-2 text-sm font-medium" style={{ color: DNA_COLORS.text.secondary }}>
                  Sensor Data (JSON format)
                </label>
                <textarea
                  name="sensorData"
                  value={formData.sensorData}
                  onChange={handleChange}
                  rows={5}
                  className="w-full p-3 rounded font-mono text-sm"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: DNA_COLORS.text.primary,
                    caretColor: '#FFFFFF',
                  }}
                  placeholder='{"temperature": 37.2, "pressure": 101.3, "sensorId": "SEN-001"}'
                />
              </div>
            )}
            
            <div>
              <label className="block mb-2 text-sm font-medium" style={{ color: DNA_COLORS.text.secondary }}>
                Research Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full p-3 rounded text-sm"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: DNA_COLORS.text.primary,
                  caretColor: '#FFFFFF',
                }}
                placeholder="Add any notes about this experiment..."
              />
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium" style={{ color: DNA_COLORS.text.secondary }}>
                Related Record ID (optional)
              </label>
              <input
                type="text"
                name="relatedRecordId"
                value={formData.relatedRecordId}
                onChange={handleChange}
                className="w-full p-3 rounded font-mono text-sm"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: DNA_COLORS.text.primary,
                  caretColor: '#FFFFFF',
                }}
                placeholder="0x..."
              />
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Review & Commit</h2>
            
            <div className="p-4 rounded-lg space-y-4"
              style={{
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div>
                <div className="text-sm font-medium mb-1" style={{ color: DNA_COLORS.text.secondary }}>
                  Experiment Type
                </div>
                <div className="flex items-center gap-2">
                  <span>
                    {formData.experimentType === 'prediction' ? '🧪' : formData.experimentType === 'sensor' ? '📊' : '📝'}
                  </span>
                  <span className="capitalize text-white">{formData.experimentType}</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium mb-1" style={{ color: DNA_COLORS.text.secondary }}>
                  Sequence Diff
                </div>
                <div className="p-3 rounded font-mono text-xs overflow-auto max-h-[100px]"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div style={{ color: '#FF5555' }}>{formData.originalSequence}</div>
                  <div className="mt-1" style={{ color: '#55FF55' }}>{formData.editedSequence}</div>
                </div>
              </div>
              
              {formData.notes && (
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: DNA_COLORS.text.secondary }}>
                    Notes
                  </div>
                  <div className="p-3 rounded text-xs overflow-auto max-h-[100px]"
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      color: DNA_COLORS.text.primary
                    }}
                  >
                    {formData.notes}
                  </div>
                </div>
              )}
              
              {formData.relatedRecordId && (
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: DNA_COLORS.text.secondary }}>
                    Related Record
                  </div>
                  <div className="p-3 rounded font-mono text-xs"
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      color: DNA_COLORS.text.primary
                    }}
                  >
                    {formData.relatedRecordId}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 rounded-lg space-y-2"
              style={{
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div className="flex justify-between text-sm">
                <span style={{ color: DNA_COLORS.text.secondary }}>Network</span>
                <span className="text-white">Polygon Mainnet</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span style={{ color: DNA_COLORS.text.secondary }}>Estimated Gas Fee</span>
                <span className="text-white">~0.0012 MATIC</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span style={{ color: DNA_COLORS.text.secondary }}>Contract Function</span>
                <span className="font-mono text-white">logGeneEdit(bytes32, bytes, bytes)</span>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Render transaction states
  const renderTransactionState = () => {
    switch (txState) {
      case 'waitingSignature':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm z-10">
            <div className="animate-pulse mb-4 text-5xl">👛</div>
            <h3 className="text-xl font-semibold mb-2 text-white">Awaiting Signature</h3>
            <p className="text-gray-400 text-center max-w-md">
              Please confirm the transaction in your wallet to proceed.
            </p>
          </div>
        );
        
      case 'broadcasting':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm z-10">
            <div className="flex items-center justify-center mb-4">
              <Loader2 size={40} className="animate-spin text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Broadcasting Transaction</h3>
            <p className="text-gray-400 text-center max-w-md">
              Your data is being sent to the blockchain network.
            </p>
          </div>
        );
        
      case 'confirming':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm z-10">
            <div className="w-16 h-16 mb-4 relative">
              <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-cyan-400 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-cyan-400">1/3</div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Confirming Transaction</h3>
            <p className="text-gray-400 text-center max-w-md">
              Waiting for block confirmation. This may take a few moments.
            </p>
          </div>
        );
        
      case 'success':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm z-10">
            <div className="w-16 h-16 mb-4 flex items-center justify-center bg-green-500 bg-opacity-20 rounded-full">
              <Check size={32} className="text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Success!</h3>
            <p className="text-gray-400 text-center max-w-md">
              Your gene edit has been successfully recorded on the blockchain.
            </p>
          </div>
        );
        
      case 'error':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm z-10">
            <div className="w-16 h-16 mb-4 flex items-center justify-center bg-red-500 bg-opacity-20 rounded-full">
              <X size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Transaction Failed</h3>
            <p className="text-gray-400 text-center max-w-md mb-4">
              {errorMessage || "There was an error processing your transaction."}
            </p>
            <button
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white"
              onClick={() => setTxState('idle')}
            >
              Try Again
            </button>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <AnimatePresence>
      {isSequencerOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex justify-end"
          onClick={(e) => {
            if (e.target === e.currentTarget && txState === 'idle') {
              toggleSequencer();
            }
          }}
        >
          <motion.div
            ref={containerRef}
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full h-[85vh] bg-[#080828] rounded-t-2xl overflow-hidden absolute bottom-0"
            style={{
              boxShadow: '0 -5px 30px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 backdrop-blur-md bg-opacity-80 bg-[#080828] z-10 border-b border-gray-800">
              <div className="flex justify-between items-center p-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Sequencer Input</h2>
                  <div className="text-xs text-gray-400">Record genomic edits on-chain</div>
                </div>
                {txState === 'idle' && (
                  <button
                    className="p-2 rounded-full hover:bg-gray-800"
                    onClick={toggleSequencer}
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                )}
              </div>
              
              {/* Stepper */}
              <div className="px-6 pb-4 pt-2 flex justify-between">
                {['Edit', 'Context', 'Commit'].map((step, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 
                      ${currentStep === index 
                        ? 'bg-blue-500 text-white'
                        : currentStep > index
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-700 text-gray-300'}`}
                    >
                      {currentStep > index ? (
                        <Check size={16} />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className={`text-xs ${currentStep >= index ? 'text-white' : 'text-gray-500'}`}>
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 relative">
              {/* Step Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
              
              {/* Transaction State Overlay */}
              {txState !== 'idle' && renderTransactionState()}
            </div>
            
            {/* Footer Actions */}
            {txState === 'idle' && (
              <div className="sticky bottom-0 backdrop-blur-md bg-opacity-80 bg-[#080828] border-t border-gray-800 p-4 flex justify-between">
                <button
                  className="px-4 py-2 rounded-lg flex items-center gap-2 text-white"
                  style={{
                    opacity: currentStep === 0 ? 0.5 : 1,
                    pointerEvents: currentStep === 0 ? 'none' : 'auto',
                  }}
                  onClick={handlePrevStep}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft size={18} />
                  <span>Back</span>
                </button>
                
                <button
                  className="px-6 py-2 rounded-lg flex items-center gap-2 text-white"
                  style={{
                    background: isStepValid() ? (
                      currentStep === 2 
                        ? 'linear-gradient(135deg, #00FFFF 0%, #FF00FF 100%)'
                        : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                    ) : 'rgba(75, 85, 99, 0.5)',
                    opacity: isStepValid() ? 1 : 0.5,
                    pointerEvents: isStepValid() ? 'auto' : 'none',
                    boxShadow: isStepValid() ? '0 4px 10px rgba(0, 0, 0, 0.3)' : 'none'
                  }}
                  onClick={handleNextStep}
                  disabled={!isStepValid()}
                >
                  <span>{currentStep === 2 ? 'Commit to Ledger' : 'Next'}</span>
                  {currentStep === 2 ? null : <ArrowRight size={18} />}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 