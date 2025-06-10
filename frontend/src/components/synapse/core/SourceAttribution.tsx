'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, GitBranch, Activity, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Source {
  source: string;
  type: string;
}

interface SourceAttributionProps {
  sources: Source[];
  onSourceClick?: (source: Source) => void;
}

const SourceAttribution: React.FC<SourceAttributionProps> = ({ 
  sources, 
  onSourceClick 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!sources || sources.length === 0) {
    return null;
  }
  
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  const getSourceIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'gene':
        return <FileText className="h-3 w-3" />;
      case 'transaction':
        return <GitBranch className="h-3 w-3" />;
      case 'lab':
        return <Activity className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };
  
  return (
    <div className="mt-2 text-xs border-t border-slate-200 pt-1">
      <button 
        onClick={toggleExpanded}
        className="flex items-center text-slate-500 hover:text-slate-700 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="source-list"
      >
        <span className="flex items-center">
          <span className="mr-1">Sources</span>
          <span className="text-xs ml-1">({sources.length})</span>
        </span>
        {isExpanded ? (
          <ChevronUp className="h-3 w-3 ml-1" />
        ) : (
          <ChevronDown className="h-3 w-3 ml-1" />
        )}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="source-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <ul className="pl-2 mt-1 space-y-1">
              {sources.map((source, index) => (
                <li key={index}>
                  <button
                    onClick={() => onSourceClick && onSourceClick(source)}
                    className="flex items-center text-slate-600 hover:text-blue-600 hover:underline transition-colors"
                  >
                    <span className="mr-1 text-slate-500">
                      {getSourceIcon(source.type)}
                    </span>
                    <span className="mr-1 capitalize">{source.type}:</span>
                    <span className="truncate">{source.source}</span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SourceAttribution; 