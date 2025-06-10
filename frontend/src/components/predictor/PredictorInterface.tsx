'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dna, Play, Check, X, ArrowRight, ClipboardCopy, Download, Terminal, AlertCircle } from 'lucide-react';
import Lottie from 'lottie-react';
import { toast } from 'sonner';
import { fetchCrisprPrediction } from '@/lib/services/crisprService';
import { SequenceInput } from './SequenceInput';
import { PredictionResults } from './PredictionResults';

// Types for DNA sequences
interface Base {
  letter: string;
  position: number;
  isEdited: boolean;
  editType?: 'substitution' | 'insertion' | 'deletion';
  originalBase?: string;
  confidence?: number;
}

interface PredictionResult {
  originalSequence: string;
  editedSequence: string;
  changeIndicator: string;
  efficiency: number;
  changedPosition: number;
  originalBase: string;
  newBase: string;
  message: string;
  originalEfficiency: number;
}

// Lottie animation for DNA loading
const dnaLoadingAnimation = {
  v: "5.7.1",
  fr: 30,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: "DNA Loading",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "DNA Strand",
      sr: 1,
      ks: {
        o: { a: 0, k: 100, ix: 11 },
        r: { 
          a: 1, 
          k: [
            { t: 0, s: [0], e: [360] },
            { t: 60, s: [360] }
          ], 
          ix: 10 
        },
        p: { a: 0, k: [100, 100, 0], ix: 2 },
        a: { a: 0, k: [0, 0, 0], ix: 1 },
        s: { a: 0, k: [100, 100, 100], ix: 6 }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [80, 80], ix: 2 },
              p: { a: 0, k: [0, 0], ix: 3 },
              nm: "Ellipse Path 1",
              mn: "ADBE Vector Shape - Ellipse",
              hd: false
            },
            {
              ty: "st",
              c: { a: 0, k: [0.267, 0.384, 0.929, 1], ix: 3 },
              o: { a: 0, k: 100, ix: 4 },
              w: { a: 0, k: 8, ix: 5 },
              lc: 2,
              lj: 1,
              ml: 4,
              bm: 0,
              d: [
                { n: "d", nm: "dash", v: { a: 0, k: 20, ix: 1 } },
                { n: "g", nm: "gap", v: { a: 0, k: 20, ix: 2 } }
              ],
              nm: "Stroke 1",
              mn: "ADBE Vector Graphic - Stroke",
              hd: false
            }
          ],
          nm: "Ellipse 1",
          np: 3,
          cix: 2,
          bm: 0,
          ix: 1,
          mn: "ADBE Vector Group",
          hd: false
        }
      ],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Inner Strand",
      sr: 1,
      ks: {
        o: { a: 0, k: 100, ix: 11 },
        r: { 
          a: 1, 
          k: [
            { t: 0, s: [0], e: [-360] },
            { t: 60, s: [-360] }
          ], 
          ix: 10 
        },
        p: { a: 0, k: [100, 100, 0], ix: 2 },
        a: { a: 0, k: [0, 0, 0], ix: 1 },
        s: { a: 0, k: [60, 60, 100], ix: 6 }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [80, 80], ix: 2 },
              p: { a: 0, k: [0, 0], ix: 3 },
              nm: "Ellipse Path 1",
              mn: "ADBE Vector Shape - Ellipse",
              hd: false
            },
            {
              ty: "st",
              c: { a: 0, k: [0.957, 0.243, 0.275, 1], ix: 3 },
              o: { a: 0, k: 100, ix: 4 },
              w: { a: 0, k: 8, ix: 5 },
              lc: 2,
              lj: 1,
              ml: 4,
              bm: 0,
              d: [
                { n: "d", nm: "dash", v: { a: 0, k: 10, ix: 1 } },
                { n: "g", nm: "gap", v: { a: 0, k: 10, ix: 2 } }
              ],
              nm: "Stroke 1",
              mn: "ADBE Vector Graphic - Stroke",
              hd: false
            }
          ],
          nm: "Ellipse 1",
          np: 3,
          cix: 2,
          bm: 0,
          ix: 1,
          mn: "ADBE Vector Group",
          hd: false
        }
      ],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0
    }
  ],
  markers: []
};

export default function PredictorInterface() {
  // State for sequence input and validation
  const [sequence, setSequence] = useState<string>('');
  const [isValidSequence, setIsValidSequence] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // State for prediction process
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  // State for prediction results
  const [result, setResult] = useState<PredictionResult | null>(null);
  
  // Ref for console log auto-scroll
  const consoleRef = useRef<HTMLDivElement>(null);
  
  // Processing steps
  const processingSteps = [
    'Initializing prediction system',
    'Analyzing DNA sequence structure',
    'Identifying CRISPR PAM sites',
    'Calculating gRNA binding efficiency',
    'Simulating Cas9 cleavage',
    'Predicting DNA repair outcomes',
    'Generating final edit predictions'
  ];
  
  // Handle input change with validation
  const handleSequenceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newSequence = e.target.value.toUpperCase();
    setSequence(newSequence);
    
    // Validate that input only contains A, T, G, C
    const isValid = /^[ATGC]*$/.test(newSequence);
    setIsValidSequence(isValid);
    
    if (!isValid && newSequence) {
      setErrorMessage('Invalid sequence: Only A, T, G, C nucleotides are allowed');
    } else if (newSequence.length < 10 && newSequence.length > 0) {
      setIsValidSequence(false);
      setErrorMessage('Sequence must be at least 10 nucleotides long');
    } else {
      setErrorMessage('');
    }
  };
  
  // Add log entry
  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };
  
  // Run prediction using the API
  const runPrediction = async () => {
    if (!isValidSequence || sequence.length < 10) {
      toast.error('Please enter a valid DNA sequence (at least 10 bases)');
      return;
    }
    
    setIsLoading(true);
    setResult(null);
    setLogs([]);
    setProcessingStep(0);
    
    // Initial log
    addLog(`[${new Date().toLocaleTimeString()}] Starting CRISPR prediction for sequence of length ${sequence.length}`);
    
    try {
      // Log each step with some delay to show progress
      for (let i = 0; i < processingSteps.length; i++) {
        setProcessingStep(i);
        addLog(`[${new Date().toLocaleTimeString()}] ${processingSteps[i]}...`);
        
        // Add a small delay between steps to show progress
        if (i < processingSteps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Make the actual API call
      const prediction = await fetchCrisprPrediction(sequence);
      
      // Log success
      addLog(`[${new Date().toLocaleTimeString()}] Prediction completed successfully!`);
      addLog(`[${new Date().toLocaleTimeString()}] Editing efficiency: ${prediction.efficiency}%`);
      addLog(`[${new Date().toLocaleTimeString()}] Changed position: ${prediction.changedPosition}`);
      
      // Set result
      setResult(prediction);
      
      // Notify success
      toast.success('CRISPR prediction completed successfully!');
      
    } catch (error) {
      console.error('Error during prediction:', error);
      
      // Log error
      addLog(`[${new Date().toLocaleTimeString()}] Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Notify error
      toast.error(`Prediction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Effect to scroll console to bottom when logs change
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);
  
  // Reset state for a new prediction
  const handleNewPrediction = () => {
    setSequence('');
    setResult(null);
    setLogs([]);
    setProcessingStep(0);
  };
  
  // Render the interface
  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header Section */}
      <header className="mb-8 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500"
        >
          CRISPR Editing Predictor
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 text-gray-300 max-w-2xl mx-auto text-lg"
        >
          Advanced genome editing prediction using AI to optimize your CRISPR experiments
        </motion.p>
      </header>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-900/50 p-6 rounded-xl border border-indigo-500/30 shadow-lg"
        >
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-indigo-300 flex items-center">
              <Dna className="mr-2 h-5 w-5" />
              Input DNA Sequence
            </h2>
          </div>
          
          {!result ? (
            <>
              <div className="mb-6">
                <textarea
                  value={sequence}
                  onChange={handleSequenceChange}
                  placeholder="Enter DNA sequence (A, T, G, C only)..."
                  className={`w-full h-60 p-4 bg-black/30 rounded-lg border ${
                    isValidSequence ? 'border-indigo-500/50' : 'border-red-500/50'
                  } text-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                  spellCheck={false}
                />
                
                {errorMessage && (
                  <div className="mt-2 text-red-400 text-sm flex items-start">
                    <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <motion.button
                  onClick={runPrediction}
                  disabled={!isValidSequence || sequence.length < 10 || isLoading}
                  className={`px-6 py-3 rounded-lg font-medium flex items-center ${
                    !isValidSequence || sequence.length < 10 || isLoading
                      ? 'bg-indigo-700/30 text-indigo-300/50 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <>
                      <div className="h-5 w-5 mr-2 animate-spin">
                        <div className="h-full w-full rounded-full border-2 border-t-transparent border-indigo-200"></div>
                      </div>
                      Processing...
                    </>
                  ) : (
                    <>
                      Run Prediction
                      <Play className="ml-2 h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="text-center mb-6"
              >
                <div className="bg-green-500/20 text-green-400 p-4 rounded-full inline-block mb-4">
                  <Check className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Prediction Complete</h3>
                <p className="text-gray-400">View the results on the right panel</p>
              </motion.div>
              
              <motion.button
                onClick={handleNewPrediction}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                Start New Prediction
              </motion.button>
            </div>
          )}
        </motion.div>
        
        {/* Results and Console Section */}
        <div className="space-y-6">
          {/* Console Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-900/50 p-4 rounded-xl border border-indigo-500/30 shadow-lg"
          >
            <div className="flex items-center mb-2">
              <Terminal className="h-4 w-4 mr-2 text-indigo-400" />
              <h3 className="text-sm font-medium text-indigo-300">Prediction Console</h3>
            </div>
            
            <div
              ref={consoleRef}
              className="bg-black/60 rounded-lg p-3 h-32 overflow-y-auto font-mono text-xs text-gray-400 whitespace-pre-wrap"
            >
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-gray-600 italic">
                  Waiting for prediction to start...
                </div>
              )}
              
              {isLoading && (
                <div className="flex items-center text-indigo-400 mt-2">
                  <div className="h-2 w-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></div>
                  Processing...
                </div>
              )}
            </div>
          </motion.div>
          
          {/* Results Section */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-gray-900/50 p-8 rounded-xl border border-indigo-500/30 shadow-lg h-80 flex flex-col items-center justify-center"
              >
                <div className="h-32 w-32 mb-4">
                  <Lottie animationData={dnaLoadingAnimation} loop={true} />
                </div>
                <h3 className="text-lg font-medium text-indigo-300 mb-2">
                  Analyzing DNA Sequence
                </h3>
                <p className="text-gray-400 text-center max-w-md">
                  Our AI is scanning for optimal edit positions for CRISPR-Cas9...
                </p>
                <div className="mt-4 w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${(processingStep / (processingSteps.length - 1)) * 100}%` 
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="mt-2 text-xs text-indigo-300">
                  {Math.round((processingStep / (processingSteps.length - 1)) * 100)}% Complete
                </p>
              </motion.div>
            ) : result ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-900/50 p-6 rounded-xl border border-indigo-500/30 shadow-lg"
              >
                <h3 className="text-lg font-bold text-indigo-300 mb-4 flex items-center">
                  <ArrowRight className="mr-2 h-5 w-5 text-green-500" />
                  Prediction Results
                </h3>
                
                <div className="space-y-6">
                  {/* Original Sequence */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-white">Original Sequence</h4>
                    <div className="bg-gray-900 p-3 rounded-lg border border-gray-800 overflow-x-auto">
                      <code className="text-red-400 font-mono text-sm whitespace-nowrap">
                        {result.originalSequence}
                      </code>
                    </div>
                  </div>
                  
                  {/* Edited Sequence */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-white">Edited Sequence</h4>
                    <div className="bg-gray-900 p-3 rounded-lg border border-gray-800 overflow-x-auto">
                      <code className="text-green-400 font-mono text-sm whitespace-nowrap">
                        {result.editedSequence}
                      </code>
                    </div>
                  </div>
                  
                  {/* Modifications */}
                  <div className="bg-indigo-900/20 p-4 rounded-lg border border-indigo-900/30">
                    <h4 className="text-sm font-medium text-white mb-2">Edit Information</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">Position:</span>
                        <span className="ml-2 text-indigo-300 font-mono">{result.changedPosition}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Change:</span>
                        <span className="ml-2 font-mono">
                          <span className="text-red-400">{result.originalBase}</span>
                          {" → "}
                          <span className="text-green-400">{result.newBase}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Original Efficiency:</span>
                        <span className="ml-2 text-yellow-300 font-mono">{result.originalEfficiency}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">New Efficiency:</span>
                        <span className="ml-2 text-green-300 font-mono">{result.efficiency}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm">
                      <span className="text-gray-400">Message:</span>
                      <p className="mt-1 text-white">{result.message}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-900/50 p-8 rounded-xl border border-indigo-500/30 shadow-lg h-80 flex flex-col items-center justify-center"
              >
                <div className="text-center">
                  <div className="bg-indigo-900/30 p-4 rounded-full inline-block mb-4">
                    <Dna className="h-8 w-8 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-medium text-indigo-300 mb-2">
                    Enter a DNA Sequence
                  </h3>
                  <p className="text-gray-400 max-w-md">
                    Input a valid DNA sequence on the left panel and run the prediction to see results here.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
} 