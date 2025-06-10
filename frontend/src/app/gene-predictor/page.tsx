'use client';

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Dna, CheckCircle, AlertCircle, ChevronRight, Lightbulb, RotateCw, Info, Zap, Lock } from 'lucide-react';
import { geneAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import LoadingScreen from '@/components/ui/LoadingScreen';

// Define the structure of the prediction result
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

export default function GenePredictorPage() {
  const [sequence, setSequence] = useState('');
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExample, setShowExample] = useState(false);

  const handlePredict = async () => {
    if (!sequence || sequence.length !== 20 || !/^[ATCG]+$/.test(sequence.toUpperCase())) {
      setError('Please enter a valid 20-character DNA sequence (A, T, C, G only).');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Sending gene analysis request for sequence:', sequence.toUpperCase());
      
      // Use the geneAPI.predictSequence method
      const response = await geneAPI.predictSequence(sequence.toUpperCase(), {
        name: `Gene Analysis ${new Date().toLocaleDateString()}`,
        geneType: 'dna',
        isPublic: false,
      });
      
      console.log('Received gene analysis response:', response);
      
      if (response.data && response.data.data) {
        setResult(response.data.data);
        toast.success('Gene analysis successful!');
      } else {
        throw new Error('Received empty or invalid response from gene service');
      }
    } catch (err: any) {
      console.error('Gene API error:', err);
      
      // Handle different error scenarios
      if (err.response?.status === 503 || err.response?.status === 504) {
        // Service unavailable or timeout
        const errMsg = 'The gene analysis service is currently unavailable. Please try again later.';
        setError(errMsg);
        toast.error('Service Unavailable', { description: errMsg });
      } else if (err.response?.status === 400) {
        // Bad request - invalid sequence
        const errMsg = err.response?.data?.message || 'Invalid DNA sequence. Please check your input.';
        setError(errMsg);
        toast.error('Invalid Input', { description: errMsg });
      } else {
        // General error
        const errMsg = err.response?.data?.message || err.message || 'Failed to analyze gene sequence';
        setError(errMsg);
        toast.error('Analysis failed', { description: errMsg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const useExampleSequence = () => {
    setSequence('CTACTTCAAATGGGGCTACA');
    setShowExample(false);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Show the loading screen when making predictions */}
      {isLoading && <LoadingScreen text="Analyzing DNA sequence..." />}
      
      {/* DNA helix background animation */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute left-1/4 top-0 w-1 h-screen bg-indigo-500 animate-pulse" style={{ animationDuration: '5s' }}></div>
        <div className="absolute left-1/3 top-0 w-1 h-screen bg-cyan-500 animate-pulse" style={{ animationDuration: '7s' }}></div>
        <div className="absolute left-1/2 top-0 w-1 h-screen bg-blue-500 animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute left-2/3 top-0 w-1 h-screen bg-purple-500 animate-pulse" style={{ animationDuration: '6s' }}></div>
        <div className="absolute left-3/4 top-0 w-1 h-screen bg-indigo-500 animate-pulse" style={{ animationDuration: '8s' }}></div>
      </div>
      
      <div className="container mx-auto py-16 px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto"
        >
          <header className="text-center mb-12">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center mb-5"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 shadow-lg shadow-indigo-500/30">
                <Dna className="h-8 w-8 text-white" />
              </div>
            </motion.div>
            <motion.h1 
              className="text-5xl font-bold mb-4 text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-400 to-purple-400">
                Gene Predictor
              </span>
            </motion.h1>
            <motion.p 
              className="text-center text-lg text-gray-300 max-w-3xl mx-auto"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              AI-powered prediction of the best single-base modifications for your specific DNA sequence.
            </motion.p>
          </header>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card className="backdrop-blur-xl bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-indigo-500/30 overflow-hidden shadow-2xl shadow-indigo-500/20 rounded-xl">
              <CardHeader className="border-b border-indigo-500/20 pb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-full bg-indigo-500/20">
                    <Zap className="h-5 w-5 text-indigo-400" />
                  </div>
                  <CardTitle className="text-xl text-indigo-100">Enter DNA Sequence</CardTitle>
                </div>
                <CardDescription className="text-indigo-300/70 mt-1.5">
                  Provide a 20-character target DNA sequence using only A, T, C, and G nucleotides.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative mb-6">
                  <div className="absolute top-0 left-0 -ml-3 -mt-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-medium text-indigo-300">1</span>
                  </div>
                  <Label htmlFor="dna-sequence" className="text-sm font-medium text-indigo-200 mb-2 block ml-4">
                    DNA Sequence Input
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                      <Input
                        id="dna-sequence"
                        type="text"
                        placeholder="ATCG..."
                        value={sequence}
                        onChange={(e) => {
                          // Filter out any non-DNA characters (allow only A, T, C, G)
                          const validDnaSequence = e.target.value
                            .toUpperCase()
                            .split('')
                            .filter(char => ['A', 'T', 'C', 'G'].includes(char))
                            .join('');
                          setSequence(validDnaSequence);
                        }}
                        maxLength={20}
                        className="bg-gray-800/70 border-indigo-500/30 focus:border-indigo-400 text-white font-mono tracking-widest h-12 pl-4 pr-12 shadow-inner shadow-indigo-500/10 transition-all focus:ring-2 focus:ring-indigo-500/50"
                        disabled={isLoading}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        {sequence.length}/20
                      </div>
                    </div>
                    <Button 
                      onClick={handlePredict} 
                      disabled={isLoading || sequence.length !== 20}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all h-12 px-6"
                    >
                      <Dna className="mr-2 h-4 w-4" />
                      Predict Edit
                    </Button>
                  </div>
                  <div className="flex justify-between mt-2">
                    <button 
                      onClick={() => setShowExample(!showExample)} 
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center transition-colors"
                    >
                      <Info className="h-3 w-3 mr-1" />
                      See example
                    </button>
                    <span className="text-xs text-gray-500">
                      {sequence.length === 20 && /^[ATCG]+$/.test(sequence) ? 
                        <span className="text-green-400 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Valid sequence
                        </span> : 
                        <span className="text-gray-400">
                          Need 20 characters (A, T, C, G only)
                        </span>
                      }
                    </span>
                  </div>
                  <AnimatePresence>
                    {showExample && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 text-xs bg-indigo-900/30 p-3 rounded-md border border-indigo-500/20">
                          <div className="flex justify-between mb-1">
                            <span className="text-indigo-300 font-medium">Example Sequence:</span>
                            <button 
                              onClick={useExampleSequence}
                              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                              Use this example
                            </button>
                          </div>
                          <div className="font-mono text-gray-300 tracking-wider">CTACTTCAAATGGGGCTACA</div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative mb-2">
                  <div className="absolute top-0 left-0 -ml-3 -mt-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-medium text-indigo-300">2</span>
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    <div className="p-1 rounded-full bg-indigo-500/20">
                      <Lock className="h-3 w-3 text-indigo-400" />
                    </div>
                    <span className="text-sm font-medium text-indigo-200">End-to-end encrypted analysis</span>
                  </div>
                </div>
                
                {error && (
                  <Alert variant="destructive" className="mt-4 bg-red-900/30 border border-red-500/30 text-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mt-8"
              >
                <Card className="backdrop-blur-xl bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-purple-500/30 overflow-hidden shadow-2xl shadow-purple-500/20 rounded-xl">
                  <CardHeader className="border-b border-purple-500/20 pb-4">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-full bg-purple-500/20">
                        <CheckCircle className="h-5 w-5 text-purple-400" />
                      </div>
                      <CardTitle className="text-xl text-purple-100">Prediction Result</CardTitle>
                    </div>
                    <CardDescription className="text-purple-300/70 mt-1.5">
                      AI-powered analysis for optimizing gene editing efficiency.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-8">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                      <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-wider text-purple-400 flex items-center">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 text-xs font-medium text-purple-300 mr-2">1</span>
                          Original Sequence
                        </Label>
                        <div className="font-mono text-lg tracking-widest text-gray-300 p-4 bg-gray-800/50 rounded-lg border border-purple-500/10 relative overflow-hidden">
                          {result.originalSequence}
                          <div className="absolute bottom-0 right-0 px-2 py-1 text-xs rounded-tl-md bg-purple-800/40 text-purple-300">
                            {result.originalEfficiency.toFixed(1)}% match
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-wider text-green-400 flex items-center">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20 text-xs font-medium text-green-300 mr-2">2</span>
                          Suggested Edit
                        </Label>
                        <div className="font-mono text-lg tracking-widest p-4 bg-gray-800/50 rounded-lg border border-green-500/20 relative overflow-hidden">
                          <span 
                            className="absolute left-0 top-0 h-full w-full pointer-events-none"
                            style={{ 
                              backgroundImage: `linear-gradient(to right, transparent ${((result.changedPosition-1)/20)*100}%, rgba(74, 222, 128, 0.15) ${((result.changedPosition-1)/20)*100}%, rgba(74, 222, 128, 0.15) ${((result.changedPosition)/20)*100}%, transparent ${((result.changedPosition)/20)*100}%)`
                            }}
                          />
                          {result.editedSequence.split('').map((char, index) => (
                            <span 
                              key={index} 
                              className={`relative ${index === result.changedPosition-1 ? 'text-green-400 font-bold' : 'text-gray-300'}`}
                            >
                              {char}
                              {index === result.changedPosition-1 && (
                                <motion.span 
                                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-green-400"
                                  initial={{ width: 0 }}
                                  animate={{ width: '100%' }}
                                  transition={{ delay: 0.6, duration: 0.3 }}
                                />
                              )}
                            </span>
                          ))}
                          <div className="absolute bottom-0 right-0 px-2 py-1 text-xs rounded-tl-md bg-green-800/40 text-green-300">
                            {result.efficiency.toFixed(1)}% match
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      className="bg-gray-800/50 p-4 rounded-lg border border-indigo-500/20"
                    >
                      <Label className="text-xs uppercase tracking-wider text-indigo-400 flex items-center mb-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-medium text-indigo-300 mr-2">3</span>
                        Change Details
                      </Label>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gray-900/60 p-3 rounded-lg border border-indigo-500/10 text-center">
                          <span className="text-xs text-gray-400 block mb-1">Position</span>
                          <span className="text-xl font-mono font-bold text-indigo-300">{result.changedPosition}</span>
                        </div>
                        
                        <div className="flex items-center justify-center">
                          <div className="bg-gray-900/60 p-3 rounded-lg border border-red-500/10 text-center">
                            <span className="text-xs text-gray-400 block mb-1">From Base</span>
                            <span className="text-xl font-mono font-bold text-red-300">{result.originalBase}</span>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-500 mx-2"/>
                          <div className="bg-gray-900/60 p-3 rounded-lg border border-green-500/10 text-center">
                            <span className="text-xs text-gray-400 block mb-1">To Base</span>
                            <span className="text-xl font-mono font-bold text-green-300">{result.newBase}</span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-900/60 p-3 rounded-lg border border-purple-500/10 text-center">
                          <span className="text-xs text-gray-400 block mb-1">Improvement</span>
                          <span className="text-xl font-bold">
                            <span className={`${result.efficiency > result.originalEfficiency ? 'text-green-400' : 'text-indigo-400'}`}>
                              {(result.efficiency - result.originalEfficiency).toFixed(1)}%
                            </span>
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7, duration: 0.5 }}
                    >
                      <Alert 
                        className={`${result.efficiency > result.originalEfficiency ? 'bg-green-900/30 border-green-500/30 text-green-200' : 'bg-blue-900/30 border-blue-500/30 text-blue-200'}`}
                      >
                        {result.efficiency > result.originalEfficiency ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Lightbulb className="h-4 w-4" />
                        )}
                        <AlertTitle className="font-medium text-base">
                          {result.efficiency > result.originalEfficiency ? 'Improvement Suggested' : 'Sequence Optimal'}
                        </AlertTitle>
                        <AlertDescription className="mt-1">{result.message}</AlertDescription>
                      </Alert>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                      className="flex justify-center pt-2"
                    >
                      <Button 
                        onClick={() => setResult(null)}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                      >
                        Try Another Sequence
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-12 text-center text-gray-500 text-sm"
          >
            BioNova AI Studio • Advanced Gene Editing Platform
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 