'use client'

import React from 'react';
import { SynapseMessage as SynapseMessageType } from '../../../lib/hooks/synapse/useSynapseAI';
import { User, BrainCircuit, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import MessageFeedback from './MessageFeedback';
import SourceAttribution from './SourceAttribution';

interface SynapseMessageProps {
  message: SynapseMessageType;
  sessionId: string;
}

const SynapseMessage: React.FC<SynapseMessageProps> = ({ message, sessionId }) => {
  const isAssistant = message.role === 'assistant';
  
  const handleSourceClick = (source: { source: string; type: string }) => {
    // In a real implementation, this could show a modal with source details
    console.log('Source clicked:', source);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
      className={`flex ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}
    >
      <div 
        className={`flex items-center justify-center w-8 h-8 rounded-full shadow-lg ${
          isAssistant 
            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/20' 
            : 'bg-gradient-to-br from-indigo-400 to-purple-500 text-white shadow-purple-500/20'
        }`}
      >
        {isAssistant ? 
          <Sparkles size={15} className="animate-pulse" /> : 
          <User size={15} />
        }
      </div>
      
      <div className={`max-w-[85%] px-3 ${isAssistant ? 'ml-2' : 'mr-2'}`}>
        <div 
          className={`p-3 rounded-xl relative ${
            isAssistant 
              ? 'bg-gradient-to-br from-slate-800/90 to-indigo-900/80 border border-indigo-500/30 text-indigo-50 shadow-xl' 
              : 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20'
          }`}
        >
          {/* Glow effect for assistant messages */}
          {isAssistant && (
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-20 blur-sm rounded-xl z-0"></div>
          )}
          
          <div className="relative z-10">
          {message.processing ? (
            <div className="flex items-center justify-center py-2">
                <Loader2 size={20} className="animate-spin text-indigo-300" />
            </div>
          ) : (
              <div className={`prose prose-sm max-w-none ${isAssistant ? 'prose-headings:text-indigo-200 prose-a:text-blue-300 hover:prose-a:text-blue-200 prose-strong:text-blue-200 prose-code:text-violet-300 prose-code:bg-indigo-950/50 prose-code:rounded prose-code:px-1' : 'prose-invert'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
              
              {/* Add source attribution for assistant messages if sources are available */}
              {isAssistant && message.sources && message.sources.length > 0 && (
                <SourceAttribution 
                  sources={message.sources} 
                  onSourceClick={handleSourceClick}
                />
              )}
            </div>
          )}
          </div>
        </div>
        
        <div className="mt-1 text-xs text-indigo-300/70 flex justify-between items-center">
          <span>
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </span>
          
          {/* Add feedback component for assistant messages that aren't processing */}
          {isAssistant && !message.processing && (
            <MessageFeedback
              sessionId={sessionId}
              messageId={message.id}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SynapseMessage; 