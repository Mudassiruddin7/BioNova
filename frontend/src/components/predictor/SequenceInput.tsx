'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dna, Play, AlertCircle, Lightbulb, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Sample sequences for quick testing
const SAMPLE_SEQUENCES = [
  { 
    name: 'Human BRCA1', 
    description: 'Breast cancer susceptibility gene fragment',
    sequence: 'ATGGATTTATCTGCTCTTCGCGTTGAAGAAGTACAAAATGTCATTAATGCTATGCAGAAAATCTTAGAGTGTCCC' 
  },
  { 
    name: 'E. coli lacZ', 
    description: 'Beta-galactosidase gene fragment',
    sequence: 'ATGACCATGATTACGGATTCACTGGCCGTCGTTTTACAACGTCGTGACTGGGAAAACCCTGGCGTTACCCAACTT' 
  },
  { 
    name: 'SARS-CoV-2 Spike', 
    description: 'COVID-19 spike protein gene fragment',
    sequence: 'ATGTTTGTTTTTCTTGTTTTATTGCCACTAGTCTCTAGTCAGTGTGTTAATCTTACAACCAGAACTCAATTACCC' 
  },
];

// Define base colors for validation
const BASE_COLORS: Record<string, string> = {
  'A': '#3a86ff', // Blue
  'T': '#ff006e', // Pink
  'G': '#8338ec', // Purple
  'C': '#06d6a0'  // Green
};

interface SequenceInputProps {
  onSubmit: (sequence: string) => void;
  isLoading: boolean;
  onBaseHighlight?: (index: number | null) => void;
}

export function SequenceInput({ onSubmit, isLoading, onBaseHighlight }: SequenceInputProps) {
  const [sequence, setSequence] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastKeyPressed, setLastKeyPressed] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [showSamples, setShowSamples] = useState(false);

  // Play sound on valid/invalid input
  const playSound = (type: 'valid' | 'invalid') => {
    try {
      const audio = new Audio(`/sounds/${type}-input.mp3`);
      audio.volume = type === 'valid' ? 0.2 : 0.3;
      audio.play().catch(() => {
        // Browser may block autoplay, handle it silently
      });
    } catch (error) {
      // Handle any errors silently
    }
  };

  // Format sequence for display with colors
  const formatSequence = (seq: string) => {
    return seq.split('').map((base, index) => {
      const color = BASE_COLORS[base.toUpperCase()] || 'text-red-500';
      return (
        <motion.span 
          key={index}
          className={`inline-block ${base.match(/[ATGC]/i) ? color : 'text-red-500'}`}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.005 }}
          onMouseEnter={() => onBaseHighlight?.(index)}
          onMouseLeave={() => onBaseHighlight?.(null)}
        >
          {base}
        </motion.span>
      );
    });
  };

  // Validate the sequence
  const validateSequence = (seq: string): boolean => {
    // Check if sequence is empty
    if (!seq.trim()) {
      setError('Please enter a DNA sequence');
      return false;
    }

    // Check if sequence contains only A, T, C, G (case insensitive)
    const isValid = /^[ATCGatcg]+$/.test(seq);
    if (!isValid) {
      setError('Sequence must contain only A, T, C, G bases');
      setValidationStatus('invalid');
      return false;
    }

    // Check length (minimum 10 characters)
    if (seq.length < 10) {
      setError('Sequence must be at least 10 bases long');
      setValidationStatus('invalid');
      return false;
    }

    // Clear any existing error if validation passes
    setError(null);
    setValidationStatus('valid');
    return true;
  };

  // Handle input change with validation
  const handleSequenceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newSequence = e.target.value.toUpperCase();
    setSequence(newSequence);
    
    // Get the last character entered
    const lastChar = newSequence.slice(-1);
    if (lastChar && lastChar !== sequence.slice(-1).toUpperCase()) {
      setLastKeyPressed(lastChar);
      
      // Validate the last character
      const isValidChar = /^[ATGC]$/.test(lastChar);
      
      // Play sound based on validation
      if (isValidChar) {
        playSound('valid');
      } else if (lastChar.trim()) {
        playSound('invalid');
      }
    }
    
    // Validate the entire sequence
    validateSequence(newSequence);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateSequence(sequence)) {
      toast.success('Sequence validated successfully');
      onSubmit(sequence.toUpperCase());
    } else {
      toast.error('Please correct the sequence errors');
    }
  };

  // Use a sample sequence
  const useSampleSequence = (sample: typeof SAMPLE_SEQUENCES[0]) => {
    setSequence(sample.sequence);
    validateSequence(sample.sequence);
    setShowSamples(false);
    toast.info(`Loaded sample: ${sample.name}`);
  };

  return (
        <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label 
                htmlFor="sequence-input" 
                className="text-sm font-medium text-indigo-200 flex items-center"
              >
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center"
                >
                  <Dna className="h-4 w-4 mr-1" />
                  DNA SEQUENCE INPUT
                </motion.span>
              </Label>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm"
                  className="text-xs text-indigo-300 hover:text-indigo-100"
                  onClick={() => setShowSamples(!showSamples)}
                  disabled={isLoading}
                >
                  <Lightbulb className="h-3 w-3 mr-1" />
                  Sample Sequences
                </Button>
              </motion.div>
            </div>
            
            <div className="relative">
              <Textarea
                id="sequence-input"
                value={sequence}
                onChange={handleSequenceChange}
                placeholder="Enter DNA sequence (A, T, G, C only)..."
                className="font-mono tracking-wider h-40 resize-none bg-gray-900/50 border-indigo-500/30 focus:border-indigo-400 placeholder:text-indigo-500/50 text-white"
                disabled={isLoading}
              />
              
              {/* Floating validation indicator */}
              <AnimatePresence>
                {validationStatus !== 'idle' && (
                  <motion.div
                    className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                      validationStatus === 'valid' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  >
                    {validationStatus === 'valid' ? (
                      <span className="text-white text-xs">✓</span>
                    ) : (
                      <span className="text-white text-xs">✗</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Animated caret/cursor */}
              <motion.div
                className="absolute bottom-3 right-3 h-6 w-px bg-cyan-400"
                animate={{ 
                  opacity: [0.3, 1, 0.3],
                  height: lastKeyPressed ? [6, 20, 6] : 12
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.5,
                  times: [0, 0.5, 1]
                }}
              />
              
              {/* Last key pressed indicator */}
              <AnimatePresence>
                {lastKeyPressed && (
                  <motion.div
                    key={`key-${Date.now()}`}
                    className={`absolute bottom-3 right-3 font-mono text-lg ${
                      /^[ATGC]$/.test(lastKeyPressed) 
                        ? BASE_COLORS[lastKeyPressed] 
                        : 'text-red-500'
                    }`}
                    initial={{ opacity: 1, scale: 1.5, y: 0 }}
                    animate={{ opacity: 0, scale: 0.8, y: -20 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {lastKeyPressed}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Formatted sequence preview */}
            {sequence.length > 0 && (
              <motion.div
                className="mt-2 p-2 bg-gray-900/40 border border-indigo-500/20 rounded-md overflow-x-auto max-h-24 font-mono text-xs tracking-wider"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                {formatSequence(sequence)}
              </motion.div>
            )}
            
            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="text-red-400 text-xs flex items-center mt-1"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Button 
              type="submit" 
              className="w-full relative overflow-hidden bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isLoading || !!error || sequence.length < 10}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-cyan-500 to-indigo-600 opacity-80"
                animate={{ 
                  x: ['-100%', '100%']
                }}
                transition={{ 
                  repeat: Infinity,
                  repeatType: 'mirror',
                  duration: 2,
                  ease: 'linear'
                }}
                style={{ filter: 'blur(8px)' }}
              />
              <motion.div className="relative flex items-center justify-center">
            {isLoading ? (
                  <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {isLoading ? 'Processing...' : 'Predict CRISPR Edits'}
              </motion.div>
            </Button>
          </motion.div>
        </form>
      </motion.div>
      
      {/* Sample sequences dropdown */}
      <AnimatePresence>
        {showSamples && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 p-3 bg-gray-900/50 border border-indigo-500/30 rounded-md">
              <div className="flex items-center text-indigo-200 text-xs font-medium">
                <Sparkles className="h-3 w-3 mr-1" />
                SELECT A SAMPLE SEQUENCE
              </div>
              
              <div className="space-y-2">
                {SAMPLE_SEQUENCES.map((sample, index) => (
                  <motion.div
                  key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-2 bg-gray-800/50 hover:bg-indigo-900/40 rounded-md cursor-pointer border border-indigo-500/20 hover:border-indigo-500/40 transition-colors"
                    onClick={() => useSampleSequence(sample)}
                  >
                    <div className="font-medium text-indigo-100 text-sm">{sample.name}</div>
                    <div className="text-xs text-indigo-300/70">{sample.description}</div>
                    <div className="mt-1 text-xs font-mono text-indigo-400/90 truncate">
                      {sample.sequence.substring(0, 20)}...
                    </div>
                  </motion.div>
              ))}
            </div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>
        </div>
  );
} 