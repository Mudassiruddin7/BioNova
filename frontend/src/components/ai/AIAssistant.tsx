'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, RefreshCw, Minimize2, Maximize2 } from 'lucide-react';
import { useAIAssistant } from '@/lib/hooks/useAIAssistant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AIAssistantProps {
  context?: string;
  systemMessage?: string;
  contextData?: any;
  initialMessage?: string;
  className?: string;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export function AIAssistant({
  context = 'general',
  systemMessage,
  contextData,
  initialMessage = 'How can I help you?',
  className,
  expanded = true,
  onToggleExpand,
}: AIAssistantProps) {
  const {
    conversation,
    isProcessing,
    error,
    initializeAssistant,
    sendMessage,
    clear,
  } = useAIAssistant(context);
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize the assistant when component mounts
  useEffect(() => {
    initializeAssistant(context, systemMessage);
  }, [context, systemMessage, initializeAssistant]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    
    try {
      setInput('');
      await sendMessage(input, contextData);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className={cn(
      "flex flex-col bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300",
      expanded ? "h-96" : "h-16",
      className
    )}>
      {/* Header */}
      <div className="bg-indigo-600 text-white p-3 flex justify-between items-center">
        <h3 className="font-medium">AI Assistant</h3>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-indigo-700 h-8 w-8"
            onClick={clear}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {onToggleExpand && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-indigo-700 h-8 w-8"
              onClick={onToggleExpand}
            >
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
      
      {/* Chat area (only visible when expanded) */}
      {expanded && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence initial={false}>
              {conversation.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-indigo-100 p-4 rounded-xl"
                >
                  <p className="text-indigo-700">{initialMessage}</p>
                </motion.div>
              ) : (
                conversation.map((message, index) => {
                  // Skip system messages
                  if (message.role === 'system') return null;
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "p-4 rounded-xl max-w-[80%]",
                        message.role === "user"
                          ? "bg-indigo-500 text-white ml-auto rounded-br-none"
                          : "bg-gray-100 mr-auto rounded-bl-none"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
            
            {/* Typing indicator */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-100 p-3 rounded-xl max-w-[80%] mr-auto rounded-bl-none"
              >
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '200ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '400ms' }}></div>
                </div>
              </motion.div>
            )}
            
            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-100 p-3 rounded-xl text-red-700"
              >
                <p>Error: {error}</p>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input area */}
          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                disabled={isProcessing}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={isProcessing || !input.trim()}
                variant="default"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
} 