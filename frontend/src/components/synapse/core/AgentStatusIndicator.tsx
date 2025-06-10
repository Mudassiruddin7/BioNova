'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Search, FlaskConical, MessagesSquare, Loader2, Sparkles } from 'lucide-react';

interface AgentStatusIndicatorProps {
  status: 'idle' | 'thinking' | 'retrieving' | 'planning' | 'responding';
  currentAction?: string;
}

const AgentStatusIndicator: React.FC<AgentStatusIndicatorProps> = ({ 
  status, 
  currentAction 
}) => {
  if (status === 'idle') return null;
  
  const statusIcons = {
    thinking: <Brain className="h-4 w-4" />,
    retrieving: <Search className="h-4 w-4" />,
    planning: <FlaskConical className="h-4 w-4" />,
    responding: <MessagesSquare className="h-4 w-4" />
  };
  
  const statusGradients = {
    thinking: 'from-blue-600/20 to-indigo-700/30 border-blue-500/30',
    retrieving: 'from-amber-600/20 to-orange-700/30 border-amber-500/30',
    planning: 'from-purple-600/20 to-fuchsia-700/30 border-purple-500/30',
    responding: 'from-emerald-600/20 to-teal-700/30 border-emerald-500/30'
  };
  
  const statusTextColors = {
    thinking: 'text-blue-300',
    retrieving: 'text-amber-300',
    planning: 'text-purple-300',
    responding: 'text-emerald-300'
  };
  
  const statusGlowColors = {
    thinking: 'bg-blue-500',
    retrieving: 'bg-amber-500',
    planning: 'bg-purple-500', 
    responding: 'bg-emerald-500'
  };
  
  const statusMessages = {
    thinking: 'Processing query...',
    retrieving: 'Searching knowledge base...',
    planning: 'Formulating approach...',
    responding: 'Generating response...'
  };
  
  const icon = statusIcons[status];
  const gradientClasses = statusGradients[status];
  const textColorClass = statusTextColors[status];
  const glowColorClass = statusGlowColors[status];
  const message = currentAction || statusMessages[status];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      className={`relative flex items-center p-3 rounded-lg border bg-gradient-to-r ${gradientClasses} text-xs ${textColorClass} backdrop-blur-sm shadow-lg overflow-hidden`}
    >
      {/* Subtle glow effect */}
      <div className={`absolute -inset-0.5 ${glowColorClass} opacity-10 blur-md -z-10`}></div>
      
      {/* Animated "sparkle" effect */}
      <motion.div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ 
          repeat: Infinity, 
          duration: 2, 
          ease: "easeInOut" 
        }}
    >
        <Sparkles className="absolute right-4 top-1 w-3 h-3" />
        <Sparkles className="absolute left-8 bottom-1 w-2 h-2" />
      </motion.div>
      
      <div className="flex-shrink-0 animate-pulse mr-2">
        {icon}
      </div>
      <span className="font-medium">{message}</span>
      <Loader2 className="h-3 w-3 animate-spin ml-2" />
    </motion.div>
  );
};

export default AgentStatusIndicator; 