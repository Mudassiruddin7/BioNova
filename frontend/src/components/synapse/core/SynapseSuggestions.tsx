'use client'

import React from 'react';
import { useSynapse } from '../../../lib/hooks/synapse/SynapseProvider';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

const SynapseSuggestions: React.FC = () => {
  const { contextData, sendMessage } = useSynapse();
  
  // Get suggestions based on the current context
  const getSuggestions = () => {
    switch (contextData.pageType) {
      case 'gene-predictor':
        return [
          "Explain the CRISPR efficiency score",
          "What's the significance of off-target effects?",
          "How can I optimize this gene sequence?",
          "Explain the predicted protein function"
        ];
      case 'lab-monitor':
        return [
          "What's causing the temperature fluctuation?",
          "Is this humidity level normal?",
          "Analyze the CO2 levels trend",
          "What's the optimal condition for this experiment?"
        ];
      case 'blockchain':
        return [
          "Explain this transaction in simple terms",
          "Is this hash verification secure?",
          "What does this smart contract do?",
          "How is my gene data stored on-chain?"
        ];
      default:
        return [
          "What can Synapse help me with?",
          "Tell me about BioNova's capabilities",
          "How does the gene prediction work?",
          "What's the difference between sequence analysis types?"
        ];
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 mb-2">
      {getSuggestions().map((suggestion, index) => (
        <motion.button
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3, 
            delay: index * 0.1,
            type: "spring",
            stiffness: 100
          }}
          onClick={() => handleSuggestionClick(suggestion)}
          className="relative text-left p-3 text-sm rounded-xl 
                     border border-indigo-500/30 overflow-hidden group
                     bg-gradient-to-br from-slate-800/70 to-indigo-900/70
                     hover:from-indigo-800/70 hover:to-violet-900/70
                     text-indigo-100 shadow-md hover:shadow-lg
                     transition-all duration-300"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-indigo-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Animated icon on hover */}
          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Zap size={12} className="text-indigo-300" />
          </div>
          
          {/* Text content */}
          <div className="relative z-10">
          {suggestion}
          </div>
        </motion.button>
      ))}
    </div>
  );
};

export default SynapseSuggestions; 