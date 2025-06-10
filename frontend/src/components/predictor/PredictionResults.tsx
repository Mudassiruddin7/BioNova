'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Download, ArrowRight, Award, Zap, ChevronDown, ChevronUp, Dna, BarChart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePredictor } from '@/lib/hooks/usePredictor';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { highlightDifferences } from '@/lib/utils';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PredictionResultsProps {
  onNewPrediction: () => void;
}

export function PredictionResults({ onNewPrediction }: PredictionResultsProps) {
  const router = useRouter();
  const { currentPrediction, prepareForVerification } = usePredictor();
  const [copied, setCopied] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(true);
  const [sequenceRendered, setSequenceRendered] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'sequence' | 'analytics'>('sequence');
  
  // Reference for the original and edited sequence displays
  const originalSequenceRef = useRef<HTMLDivElement>(null);
  const editedSequenceRef = useRef<HTMLDivElement>(null);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };
  
  // Format sequences with highlighted changes
  const formatSequences = () => {
    if (!originalSequenceRef.current || !editedSequenceRef.current) return;
    
    // Clear previous content
    originalSequenceRef.current.innerHTML = '';
    editedSequenceRef.current.innerHTML = '';
    
    // Format the original sequence
    const originalSequence = currentPrediction.originalSequence.split('');
    let delay = 0;
    
    originalSequence.forEach((base, index) => {
      const isChanged = index + 1 === currentPrediction.changedPosition;
      const span = document.createElement('span');
      span.innerText = base;
      span.className = `inline-block transition-all duration-300 ${
        isChanged ? 'text-red-500 relative' : ''
      }`;
      
      if (isChanged) {
        span.classList.add('hover:font-bold');
        span.style.textDecoration = 'line-through';
        
        // Add position indicator
        const positionIndicator = document.createElement('div');
        positionIndicator.className = 'absolute -top-5 text-xs text-indigo-300';
        positionIndicator.innerText = `${index + 1}`;
        span.appendChild(positionIndicator);
      }
      
      // Add hover effect and highlight base in DNA visualization
      span.addEventListener('mouseenter', () => {
        onEditPositionHighlight(index);
        span.classList.add('scale-150', 'font-bold', 'z-10');
      });
      
      span.addEventListener('mouseleave', () => {
        onEditPositionHighlight(null);
        span.classList.remove('scale-150', 'font-bold', 'z-10');
      });
      
      // Staggered animation
      span.style.opacity = '0';
      span.style.transform = 'translateY(10px)';
      
      setTimeout(() => {
        span.style.opacity = '1';
        span.style.transform = 'translateY(0)';
      }, delay += 10);
      
      originalSequenceRef.current?.appendChild(span);
    });
    
    // Format the edited sequence
    const editedSequence = currentPrediction.editedSequence.split('');
    delay = 0; // Reset delay
    
    editedSequence.forEach((base, index) => {
      const isChanged = index + 1 === currentPrediction.changedPosition;
      const span = document.createElement('span');
      span.innerText = base;
      
      span.className = `inline-block transition-all duration-300 ${
        isChanged ? 'text-green-500 font-bold relative' : ''
      }`;
      
      if (isChanged) {
        // Add highlight effect
        const highlight = document.createElement('div');
        highlight.className = 'absolute inset-0 bg-green-500/20 rounded-full -z-10 blur-sm';
        span.appendChild(highlight);
        
        // Add position indicator
        const positionIndicator = document.createElement('div');
        positionIndicator.className = 'absolute -top-5 text-xs text-green-300';
        positionIndicator.innerText = `${index + 1}`;
        span.appendChild(positionIndicator);
        
        // Add animated pulse
        const pulse = document.createElement('div');
        pulse.className = 'absolute inset-0 animate-ping bg-green-500/30 rounded-full -z-10';
        span.appendChild(pulse);
      }
      
      // Add hover effect and highlight base in DNA visualization
      span.addEventListener('mouseenter', () => {
        onEditPositionHighlight(index);
        span.classList.add('scale-150', 'font-bold', 'z-10');
      });
      
      span.addEventListener('mouseleave', () => {
        onEditPositionHighlight(null);
        span.classList.remove('scale-150', 'font-bold', 'z-10');
      });
      
      // Staggered animation with longer delay for edited sequence
      span.style.opacity = '0';
      span.style.transform = 'translateY(10px)';
      
      setTimeout(() => {
        span.style.opacity = '1';
        span.style.transform = 'translateY(0)';
      }, 800 + (delay += 20)); // Start after original sequence is shown
      
      editedSequenceRef.current?.appendChild(span);
    });
    
    setSequenceRendered(true);
  };
  
  // Format sequences after component mount
  useEffect(() => {
    if (currentPrediction && !sequenceRendered) {
      formatSequences();
    }
    
    // Cleanup event listeners on unmount
    return () => {
      originalSequenceRef.current?.childNodes.forEach(node => {
        if (node instanceof HTMLElement) {
          node.removeEventListener('mouseenter', () => {});
          node.removeEventListener('mouseleave', () => {});
        }
      });
      
      editedSequenceRef.current?.childNodes.forEach(node => {
        if (node instanceof HTMLElement) {
          node.removeEventListener('mouseenter', () => {});
          node.removeEventListener('mouseleave', () => {});
        }
      });
    };
  }, [currentPrediction, sequenceRendered]);
  
  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  // If no prediction data, show nothing
  if (!currentPrediction) return null;

  // Highlight differences between original and predicted sequences
  const highlightedSequences = highlightDifferences(
    currentPrediction.originalSequence,
    currentPrediction.editedSequence
  );

  // Create a string representation of edit positions
  const editPositionsString = currentPrediction.editPositions.join(', ');

  // Handle copy to clipboard
  const copyToClipboard = () => {
    const text = `
Original Sequence: ${currentPrediction.originalSequence}
Predicted Sequence: ${currentPrediction.editedSequence}
Edit Count: ${currentPrediction.editCount}
Edit Positions: ${editPositionsString}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Prediction copied to clipboard');
  };

  // Handle download as JSON
  const downloadJson = () => {
    const dataStr = JSON.stringify(currentPrediction, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'crispr-prediction.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Prediction downloaded as JSON');
  };

  // Handle verification
  const handleVerify = () => {
    if (prepareForVerification()) {
      router.push('/blockchain');
    }
  };

  return (
    <motion.div 
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex justify-between items-center">
        <motion.h2 
          className="text-xl font-semibold text-indigo-100 flex items-center"
          variants={itemVariants}
        >
          <Dna className="h-5 w-5 mr-2 text-cyan-400" />
          CRISPR Edit Prediction
        </motion.h2>
        
        <motion.div 
          className="flex space-x-2"
          variants={itemVariants}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="border-indigo-500/30 bg-indigo-900/20 hover:bg-indigo-800/30 text-indigo-100"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy to clipboard</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadJson}
                  className="border-indigo-500/30 bg-indigo-900/20 hover:bg-indigo-800/30 text-indigo-100"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download as JSON</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onNewPrediction}
            className="border-indigo-500/30 bg-indigo-900/20 hover:bg-indigo-800/30 text-indigo-100"
          >
            <ArrowRight className="h-4 w-4 mr-1" />
            New Prediction
          </Button>
        </motion.div>
      </div>
      
      {/* Tabs for sequence view and analytics */}
      <motion.div 
        className="flex space-x-2 border-b border-indigo-500/20 pb-2"
        variants={itemVariants}
      >
        <Button
          variant="ghost"
          size="sm"
          className={`${
            selectedTab === 'sequence'
              ? 'bg-indigo-900/30 text-indigo-100'
              : 'text-indigo-300/70 hover:text-indigo-100 hover:bg-indigo-900/20'
          }`}
          onClick={() => setSelectedTab('sequence')}
        >
          <Dna className="h-4 w-4 mr-1" />
          Sequence View
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className={`${
            selectedTab === 'analytics'
              ? 'bg-indigo-900/30 text-indigo-100'
              : 'text-indigo-300/70 hover:text-indigo-100 hover:bg-indigo-900/20'
          }`}
          onClick={() => setSelectedTab('analytics')}
        >
          <BarChart className="h-4 w-4 mr-1" />
          Analytics
        </Button>
      </motion.div>
      
      <AnimatePresence mode="wait">
        {selectedTab === 'sequence' ? (
          <motion.div
            key="sequence-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="backdrop-blur-sm bg-gray-900/30 border-indigo-500/20 overflow-hidden">
              <CardContent className="p-6 space-y-6">
                {/* Sequences comparison */}
                <motion.div className="space-y-4" variants={itemVariants}>
                  <div>
                    <h3 className="text-sm font-medium text-indigo-300/70 mb-2">Original Sequence</h3>
                    <div 
                      ref={originalSequenceRef}
                      className="p-3 bg-gray-900/40 border border-indigo-500/20 rounded-md font-mono text-sm overflow-x-auto h-12 flex items-center text-indigo-100 relative"
                    />
                  </div>

                  <div className="relative">
                    <h3 className="text-sm font-medium text-indigo-300/70 mb-2">Edited Sequence</h3>
                    <div 
                      ref={editedSequenceRef}
                      className="p-3 bg-gray-900/40 border border-indigo-500/20 rounded-md font-mono text-sm overflow-x-auto h-12 flex items-center text-indigo-100 relative"
                    />
                    
                    {/* Position indicator line connecting the sequences */}
                    <motion.div 
                      className="absolute left-0 top-0 h-full border-l-2 border-dashed border-green-500/50 pointer-events-none"
                      style={{ 
                        left: `calc(${currentPrediction.changedPosition / currentPrediction.originalSequence.length * 100}% + 12px)`,
                        top: '-36px',
                        height: '100px'
                      }}
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ delay: 1.2, duration: 0.5 }}
                    />
                  </div>
                </motion.div>

                {/* Edit information */}
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-indigo-500/20"
                  variants={itemVariants}
                >
                  <div>
                    <h3 className="text-xs font-medium text-indigo-300/70 mb-1">EDIT POSITION</h3>
                    <p className="text-2xl font-mono font-semibold text-indigo-100">
                      {currentPrediction.changedPosition}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-medium text-indigo-300/70 mb-1">BASE CHANGE</h3>
                    <p className="text-2xl font-mono font-semibold flex items-center">
                      <span className="text-red-400">{currentPrediction.originalBase}</span>
                      <ArrowRight className="h-4 w-4 mx-1 text-indigo-300/50" />
                      <span className="text-green-400">{currentPrediction.newBase}</span>
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-medium text-indigo-300/70 mb-1">EFFICIENCY GAIN</h3>
                    <p className="text-2xl font-mono font-semibold text-green-400 flex items-center">
                      +{(currentPrediction.efficiency - currentPrediction.originalEfficiency).toFixed(1)}%
                      <Zap className="h-4 w-4 ml-1" />
                    </p>
                  </div>
                </motion.div>
                
                {/* AI Explanation */}
                <motion.div 
                  className="pt-4 mt-2 border-t border-indigo-500/20"
                  variants={itemVariants}
                >
                  <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setAiExpanded(!aiExpanded)}
                  >
                    <h3 className="text-sm font-medium text-indigo-200 flex items-center">
                      <Award className="h-4 w-4 mr-1 text-yellow-400" />
                      AI Analysis
                    </h3>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 w-6 p-0 text-indigo-300"
                    >
                      {aiExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <AnimatePresence>
                    {aiExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="mt-2 text-indigo-200/90 text-sm leading-relaxed">
                          {currentPrediction.explanation || currentPrediction.message || 
                            `I've analyzed this sequence and found an optimal edit at position ${currentPrediction.changedPosition}, 
                            changing ${currentPrediction.originalBase} to ${currentPrediction.newBase}. This edit is predicted to 
                            improve efficiency from ${currentPrediction.originalEfficiency.toFixed(1)}% to ${currentPrediction.efficiency.toFixed(1)}%.`
                          }
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="analytics-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="backdrop-blur-sm bg-gray-900/30 border-indigo-500/20 overflow-hidden">
              <CardContent className="p-6 space-y-6">
                {/* Efficiency comparison chart */}
                <div>
                  <h3 className="text-sm font-medium text-indigo-300/70 mb-4">Efficiency Comparison</h3>
                  
                  <div className="space-y-6">
                    {/* Original efficiency bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-indigo-300/70">Original</span>
                        <span className="font-mono text-indigo-300">{currentPrediction.originalEfficiency.toFixed(1)}%</span>
                      </div>
                      
                      <div className="h-4 bg-gray-900/50 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-indigo-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${currentPrediction.originalEfficiency}%` }}
                          transition={{ delay: 0.2, duration: 1 }}
                        />
                      </div>
                    </div>
                    
                    {/* Predicted efficiency bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-indigo-300/70">Predicted</span>
                        <span className="font-mono text-green-400">{currentPrediction.efficiency.toFixed(1)}%</span>
                      </div>
                      
                      <div className="h-4 bg-gray-900/50 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-green-500 to-green-400 relative"
                          initial={{ width: 0 }}
                          animate={{ width: `${currentPrediction.efficiency}%` }}
                          transition={{ delay: 0.6, duration: 1.2 }}
                        >
                          {/* Pulse effect at the end of the bar */}
                          <motion.div 
                            className="absolute right-0 top-0 h-full w-1 bg-white"
                            animate={{ 
                              opacity: [1, 0.2, 1],
                              scale: [1, 1.5, 1]
                            }}
                            transition={{ 
                              duration: 1.5, 
                              repeat: Infinity,
                              repeatType: "mirror"
                            }}
                          />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Technical details */}
                <motion.div 
                  className="pt-4 border-t border-indigo-500/20 space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <h3 className="text-sm font-medium text-indigo-300/70">Technical Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-900/40 p-3 rounded-md border border-indigo-500/20">
                      <h4 className="text-xs text-indigo-300/70 mb-1">EDIT TYPE</h4>
                      <p className="text-indigo-100">Base Substitution</p>
                    </div>
                    
                    <div className="bg-gray-900/40 p-3 rounded-md border border-indigo-500/20">
                      <h4 className="text-xs text-indigo-300/70 mb-1">SEQUENCE LENGTH</h4>
                      <p className="text-indigo-100">{currentPrediction.originalSequence.length} bp</p>
                    </div>
                    
                    <div className="bg-gray-900/40 p-3 rounded-md border border-indigo-500/20">
                      <h4 className="text-xs text-indigo-300/70 mb-1">POSITION RATIO</h4>
                      <p className="text-indigo-100">
                        {Math.round((currentPrediction.changedPosition / currentPrediction.originalSequence.length) * 100)}%
                      </p>
                    </div>
                    
                    <div className="bg-gray-900/40 p-3 rounded-md border border-indigo-500/20">
                      <h4 className="text-xs text-indigo-300/70 mb-1">EFFICIENCY CHANGE</h4>
                      <p className="text-green-400">
                        +{(currentPrediction.efficiency - currentPrediction.originalEfficiency).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 