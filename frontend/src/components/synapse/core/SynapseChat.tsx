'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useSynapse } from '../../../lib/hooks/synapse/SynapseProvider';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Send, Loader2, Maximize2, Minimize2, Trash2, Zap, HistoryIcon, Plus, AlertCircle } from 'lucide-react';
import SynapseMessage from './SynapseMessage';
import SynapseSuggestions from './SynapseSuggestions';
import AgentStatusIndicator from './AgentStatusIndicator';
import AgentModeToggle from './AgentModeToggle';
import SynapseSessionHistory from './SynapseSessionHistory';

const SynapseChat: React.FC = () => {
  const {
    messages,
    isTyping,
    error,
    isChatOpen,
    sendMessage,
    clearConversation,
    closeChat,
    messagesEndRef,
    contextData,
    sessionId,
    agentStatus,
    startNewSession,
    toggleChatHistory,
    isLoadingHistory,
    showChatHistory
  } = useSynapse();
  
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [useAgentMode, setUseAgentMode] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(44);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Focus the input field when the chat is opened
  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatOpen]);
  
  // Check if there are any user messages in the conversation
  const hasUserMessages = messages.some(msg => msg.role === 'user');
  
  // Adjust textarea height based on content
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Reset height
    e.target.style.height = '44px';
    
    // Set new height based on scrollHeight
    const newHeight = Math.max(44, e.target.scrollHeight);
    setTextareaHeight(newHeight);
    e.target.style.height = `${newHeight}px`;
  };
  
  // Handle key presses (for submitting on Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isTyping) {
        handleSubmit();
      }
    }
  };
  
  // Submit the message
  const handleSubmit = () => {
    if (inputValue.trim() && !isTyping) {
      sendMessage(inputValue.trim(), useAgentMode);
      setInputValue('');
      setTextareaHeight(44);
    }
  };
  
  // Toggle expanded/collapsed state
  const toggleExpand = () => {
    setIsExpanded(prev => !prev);
  };
  
  // Toggle agent mode
  const toggleAgentMode = () => {
    setUseAgentMode(prev => !prev);
  };
  
  // Start a new chat
  const handleNewChat = () => {
    startNewSession();
  };
  
  // Get a context-appropriate label
  const getContextLabel = () => {
    switch (contextData.pageType) {
      case 'gene-predictor':
        return 'Gene Analysis';
      case 'lab-monitor':
        return 'Lab Monitor';
      case 'blockchain':
        return 'Blockchain Explorer';
      default:
        return 'General Assistant';
    }
  };
  
  return (
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          className={`fixed bottom-4 right-4 z-40 flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-xl shadow-2xl border border-indigo-500/30 transition-all duration-300 backdrop-blur-sm ${
              isExpanded
                ? 'w-[90vw] h-[90vh] sm:w-[80vw] md:w-[60vw] lg:w-[50vw] xl:w-[40vw] sm:h-[80vh]'
                : 'w-[350px] h-[500px]'
            }`}
          >
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-16 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
            </div>
            
            {/* Header */}
            <div className="relative z-10 flex-shrink-0 flex items-center justify-between p-3 border-b border-indigo-500/30 bg-gradient-to-r from-blue-900/50 to-indigo-900/50 backdrop-blur-sm rounded-t-xl">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/50"></div>
                <h3 className="font-semibold text-indigo-50 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">
                  <Zap size={16} className="text-indigo-300" />
                  Synapse AI - {getContextLabel()}
                </h3>
              </div>
              <div className="flex items-center space-x-1">
              <button
                onClick={toggleChatHistory}
                className={`p-1.5 rounded-md hover:text-indigo-100 hover:bg-indigo-700/50 transition-all ${
                  showChatHistory ? 'bg-indigo-700/50 text-indigo-100' : 'text-indigo-300'
                }`}
                title="Chat history"
              >
                <HistoryIcon size={16} />
              </button>
              <button
                onClick={handleNewChat}
                className="p-1.5 rounded-md text-indigo-300 hover:text-indigo-100 hover:bg-indigo-700/50 transition-all"
                title="New chat"
              >
                <Plus size={16} />
              </button>
                <button
                  onClick={clearConversation}
                  className="p-1.5 rounded-md text-indigo-300 hover:text-indigo-100 hover:bg-indigo-700/50 transition-all"
                  title="Clear conversation"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={toggleExpand}
                  className="p-1.5 rounded-md text-indigo-300 hover:text-indigo-100 hover:bg-indigo-700/50 transition-all"
                  title={isExpanded ? "Minimize" : "Maximize"}
                >
                  {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  onClick={closeChat}
                  className="p-1.5 rounded-md text-indigo-300 hover:text-indigo-100 hover:bg-indigo-700/50 transition-all"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            {/* Agent Mode Toggle */}
            <div className="relative z-10 flex-shrink-0 px-3 pt-2">
              <AgentModeToggle 
                isAgentMode={useAgentMode} 
                onToggle={toggleAgentMode} 
              />
            </div>
            
          {/* Main chat area with conditional chat history sidebar */}
          <div className="relative flex-1 flex overflow-hidden">
            {/* Session History Sidebar */}
            <AnimatePresence>
              {showChatHistory && (
                <motion.div 
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "230px", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full overflow-hidden border-r border-indigo-500/30 bg-slate-900/50"
                >
                  <SynapseSessionHistory />
                </motion.div>
              )}
            </AnimatePresence>
          
            {/* Messages and Input Container (click here to collapse history) */}
            <div
              onClick={() => { if (showChatHistory) toggleChatHistory(); }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Messages container */}
            <div
              ref={messagesContainerRef}
                className="synapse-messages relative flex-1 flex flex-col space-y-4 overflow-y-auto p-4"
              style={{
                overscrollBehavior: 'contain',
              }}
            >
                {isLoadingHistory && (
                  <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-10">
                    <div className="flex flex-col items-center bg-slate-800/90 p-6 rounded-xl border border-indigo-500/30 shadow-2xl">
                      <Loader2 size={32} className="text-indigo-400 animate-spin mb-3" />
                      <p className="text-indigo-100">Loading chat history...</p>
                    </div>
                  </div>
                )}
                
              {messages.map(message => (
                <SynapseMessage 
                  key={message.id} 
                  message={message} 
                  sessionId={sessionId || ''} 
                />
              ))}
              
              {/* Show suggestions if there are no user messages yet */}
              {!hasUserMessages && !isTyping && (
                <div className="my-6">
                  <h4 className="text-sm font-medium text-indigo-200 mb-2">
                    Try asking Synapse about:
                  </h4>
                  <SynapseSuggestions />
                </div>
              )}
              
              {/* Agent Status Indicator */}
              {useAgentMode && agentStatus && agentStatus.state !== 'idle' && (
                <AgentStatusIndicator 
                  status={agentStatus.state}
                  currentAction={agentStatus.currentAction}
                />
              )}
              
                {/* Extra div for auto-scrolling */}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input area */}
              <div className="flex-shrink-0 relative border-t border-indigo-500/30 p-3 bg-gradient-to-r from-slate-900 to-indigo-900/50">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                    onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Synapse something..."
                    className="w-full pl-3 pr-12 py-3 bg-slate-800/50 text-indigo-100 placeholder-indigo-300/50 rounded-xl resize-none border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-shadow"
                    rows={1}
                    style={{
                      maxHeight: '120px',
                      minHeight: '44px',
                      height: `${Math.min(textareaHeight, 120)}px`,
                    }}
                />
                <button
                    onClick={handleSubmit}
                  disabled={!inputValue.trim() || isTyping}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg ${
                    inputValue.trim() && !isTyping
                        ? 'text-indigo-100 bg-indigo-600 hover:bg-indigo-700'
                        : 'text-indigo-300/50 bg-indigo-700/20'
                    } transition-colors`}
                >
                    {isTyping ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                </button>
              </div>
                
                {error && (
                  <div className="mt-2 text-xs text-red-400 flex items-center">
                    <AlertCircle size={12} className="mr-1" />
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>
  );
};

export default SynapseChat; 