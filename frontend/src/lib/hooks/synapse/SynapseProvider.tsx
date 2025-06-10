'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSynapseAI } from './useSynapseAI';
import { SynapseMessage, ChatSession, SynapseContextData } from './useSynapseAI';
import api from '../../api';

// Define a simplified context type that matches what useSynapseAI provides
interface SynapseContextType {
  messages: SynapseMessage[];
  isTyping: boolean;
  error: string | null;
  isChatOpen: boolean;
  sendMessage: (content: string, useAgentMode?: boolean) => Promise<void>;
  sessionId: string | null;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  startNewSession: () => Promise<string | null>;
  loadSession: (id: string) => Promise<boolean>;
  clearConversation: () => void;
  messagesEndRef: any;
  contextData: any;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  agentStatus: {
    state: 'idle' | 'thinking' | 'retrieving' | 'planning' | 'responding';
    currentAction?: string;
  };
  isLoading: boolean;
  showChatHistory: boolean;
  toggleChatHistory: () => void;
  isLoadingHistory: boolean;
  sessions: ChatSession[];
  loadSessions: () => Promise<void>;
  isLoadingSessions: boolean;
  deleteSession: (id: string) => Promise<boolean>;
  sessionsError: string | null;
}

// Create context with default values
const SynapseContext = createContext<SynapseContextType>({
  messages: [],
  isTyping: false,
  error: null,
  isChatOpen: false,
  sendMessage: async () => {},
  sessionId: null,
  openChat: () => {},
  closeChat: () => {},
  toggleChat: () => {},
  startNewSession: async () => null,
  loadSession: async () => false,
  clearConversation: () => {},
  messagesEndRef: null,
  contextData: { pageType: 'general' },
  setError: () => {},
  setIsChatOpen: () => {},
  setIsTyping: () => {},
  agentStatus: {
    state: 'idle'
  },
  isLoading: false,
  showChatHistory: false,
  toggleChatHistory: () => {},
  isLoadingHistory: false,
  sessions: [],
  loadSessions: async () => {},
  isLoadingSessions: false,
  deleteSession: async () => false,
  sessionsError: null
});

export const SynapseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const synapseState = useSynapseAI();
  
  // Sessions are now managed explicitly by user actions (via Chat History component and New Chat button).
  // Automatic session creation/loading on mount has been removed.

  // Map fetchExistingSession to loadSession for the context
  const contextValue: SynapseContextType = {
    ...synapseState,
    loadSession: synapseState.fetchExistingSession,
  };
  
  return (
    <SynapseContext.Provider value={contextValue}>
      {children}
    </SynapseContext.Provider>
  );
};

export const useSynapse = () => useContext(SynapseContext);

export default SynapseProvider; 