'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, Info, Cpu } from 'lucide-react';

interface AgentModeToggleProps {
  isAgentMode: boolean;
  onToggle: () => void;
}

const AgentModeToggle: React.FC<AgentModeToggleProps> = ({ 
  isAgentMode, 
  onToggle 
}) => {
  const [showInfo, setShowInfo] = React.useState(false);
  
  return (
    <div className="relative flex items-center space-x-2 mb-2">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`
          flex items-center px-4 py-1.5 rounded-full cursor-pointer transition-all duration-300 shadow-md
          ${isAgentMode 
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-400/30 text-white shadow-blue-500/20' 
            : 'bg-gradient-to-r from-slate-700 to-slate-800 border border-slate-600/30 text-slate-200 shadow-slate-900/10'}
        `}
        onClick={onToggle}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        {isAgentMode ? (
          <Sparkles className="h-4 w-4 mr-2 text-blue-200 animate-pulse" />
        ) : (
          <Brain className="h-4 w-4 mr-2 text-slate-300" />
        )}
        <span className="text-xs font-medium">
          {isAgentMode ? 'Agent Mode' : 'Basic Mode'}
        </span>
        
        {/* Glow effect when active */}
        {isAgentMode && (
          <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 blur-sm -z-10"></div>
        )}
      </motion.div>
      
      <div className="relative">
        <Info 
          className="h-4 w-4 text-indigo-300 cursor-pointer hover:text-indigo-200 transition-colors" 
          onMouseEnter={() => setShowInfo(true)}
          onMouseLeave={() => setShowInfo(false)}
        />
        
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-full left-0 mb-2 w-72 p-4 bg-gradient-to-br from-slate-800 to-indigo-900/90 border border-indigo-500/30 rounded-xl shadow-xl text-xs text-indigo-100 z-10 backdrop-blur-sm"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-10 blur-sm rounded-xl -z-10"></div>
            
            <p className="font-medium text-sm mb-2 text-blue-200 flex items-center gap-1">
              <Cpu size={14} className="text-blue-300" />
              About Agent Mode
            </p>
            <p className="mb-2 text-indigo-200">
              Agent mode uses advanced retrieval techniques to find specific information relevant to your question.
            </p>
            <ul className="list-disc pl-4 space-y-1 text-indigo-200">
              <li>More precise and contextual answers</li>
              <li>Sources are cited for verification</li>
              <li>Can search across multiple data types</li>
              <li>Handles complex multi-part questions</li>
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AgentModeToggle; 