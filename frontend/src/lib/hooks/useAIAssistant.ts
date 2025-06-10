import { useState, useEffect } from 'react';
import { groqAPI } from '../api';
import { useAIAssistantStore } from '../store';

export function useAIAssistant(context: string = 'general') {
  const {
    conversations,
    currentContext,
    isProcessing,
    addMessage,
    setContext,
    setProcessing,
    clearConversation,
  } = useAIAssistantStore();
  
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Use effect to set context only once
  useEffect(() => {
    if (context !== currentContext) {
      setContext(context);
    }
  }, [context, currentContext, setContext]);

  // Initialize assistant for a specific context if needed
  const initializeAssistant = (newContext: string, systemMessage?: string) => {
    // Only add system message if it doesn't exist
    if (systemMessage && (!conversations[newContext] || conversations[newContext].length === 0)) {
      addMessage(newContext, {
        role: 'system',
        content: systemMessage,
      });
      setInitialized(true);
    }
    
    return conversations[newContext] || [];
  };

  // Get conversation for current context
  const getConversation = () => {
    return conversations[context] || [];
  };

  // Send message to AI assistant
  const sendMessage = async (message: string, contextData?: any) => {
    try {
      setProcessing(true);
      setError(null);
      
      // Add user message to conversation
      const userMessage = { role: 'user' as const, content: message };
      addMessage(context, userMessage);
      
      // Prepare messages array for API
      const convo = getConversation();
      
      // If we have context data, include it in the first system message or add one
      let messages = [...convo];
      if (contextData) {
        // Format context data as string
        const contextString = typeof contextData === 'string' 
          ? contextData 
          : JSON.stringify(contextData, null, 2);
        
        // Add or update system message
        if (messages.length > 0 && messages[0].role === 'system') {
          messages[0] = {
            ...messages[0],
            content: `${messages[0].content}\n\nContext: ${contextString}`,
          };
        } else {
          messages = [
            { 
              role: 'system', 
              content: `You are a helpful AI assistant. Use this context in your responses: ${contextString}` 
            },
            ...messages,
          ];
        }
      }
      
      // Make API call to Groq chat
      const response = await groqAPI.chat(messages);
      
      // Extract AI response
      const { message: aiMessage } = response.data.data;
      
      // Add AI response to conversation
      const assistantMessage = { role: 'assistant' as const, content: aiMessage };
      addMessage(context, assistantMessage);
      
      return assistantMessage;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to process message';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  // Get blockchain guidance from AI
  const getBlockchainGuidance = async (dataType: 'prediction' | 'monitoring') => {
    try {
      setProcessing(true);
      setError(null);
      
      const response = await groqAPI.getBlockchainGuidance(dataType);
      
      return response.data.data.guidance;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to get blockchain guidance';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  // Clear current conversation
  const clear = () => {
    clearConversation(context);
  };

  return {
    conversation: getConversation(),
    isProcessing,
    error,
    initializeAssistant,
    sendMessage,
    getBlockchainGuidance,
    clear,
  };
} 