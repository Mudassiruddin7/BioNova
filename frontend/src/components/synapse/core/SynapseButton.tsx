'use client'

import React from 'react';
import { useSynapse } from '../../../lib/hooks/synapse/SynapseProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, MessageSquare } from 'lucide-react';

const SynapseButton: React.FC = () => {
  const { toggleChat, isChatOpen, contextData } = useSynapse();
  
  // Get a different color based on context type
  const getContextColor = () => {
    switch (contextData.pageType) {
      case 'gene-predictor':
        return 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800';
      case 'lab-monitor':
        return 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800';
      case 'blockchain':
        return 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800';
      default:
        return 'bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-800';
    }
  };
  
  return (
    <AnimatePresence>
      {!isChatOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          onClick={toggleChat}
          className={`fixed bottom-4 right-4 z-40 flex items-center justify-center p-3 rounded-full shadow-lg ${getContextColor()} text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          title="Open Synapse AI Assistant"
        >
          <div className="relative">
            <BrainCircuit size={24} />
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </div>
          <span className="ml-2 font-medium hidden sm:inline">Synapse AI</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default SynapseButton; 