'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import api from '../../api';
import { synapseAPI } from '../../api';
import { useAuth } from '../useAuth';
import { ChatMessage, ChatSession } from '../../types/synapse';

interface UseSynapseChatProps {
  initialSessionId?: string;
  useAgentMode?: boolean;
}

export const useSynapseChat = ({ initialSessionId, useAgentMode = false }: UseSynapseChatProps = {}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(initialSessionId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<{
    state: 'idle' | 'thinking' | 'retrieving' | 'planning' | 'responding';
    currentAction?: string;
  }>({ state: 'idle' });
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Fetch user sessions
  const fetchSessions = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      const response = await synapseAPI.getUserSessions();
      
      if (response.data.success) {
        setSessions(response.data.data.sessions);
        // Sessions are loaded; active session must be selected by user or via initialSessionId
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to load chat sessions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);
  
  // Fetch messages for the current session
  const fetchMessages = useCallback(async () => {
    if (!currentSessionId || !user?.id) return;
    
    try {
      setIsLoading(true);
      
      const response = await synapseAPI.getSessionHistory(currentSessionId);
      
      if (response.data.success) {
        const sessionData = response.data.data.session;
        setActiveSession(sessionData);
        setMessages(sessionData.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load chat history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, user?.id]);
  
  // Create a new chat session
  const startNewSession = useCallback(async (title?: string) => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      const response = await synapseAPI.createSession(title);
      
      if (response.data.success) {
        const newSessionId = response.data.data.sessionId;
        setCurrentSessionId(newSessionId);
        
        // Refresh sessions list
        await fetchSessions();
        
        return newSessionId;
      }
    } catch (error) {
      console.error('Error creating new session:', error);
      setError('Failed to create new chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, fetchSessions]);
  
  // Delete a chat session
  const deleteSession = useCallback(async (sessionId: string) => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      const response = await synapseAPI.deleteSession(sessionId);
      
      if (response.data.success) {
        // If the deleted session was active, clear the current session
        if (sessionId === currentSessionId) {
          setCurrentSessionId(null);
          setActiveSession(null);
          setMessages([]);
        }
        
        // Refresh sessions list
        await fetchSessions();
        
        return true;
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      setError('Failed to delete chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, currentSessionId, fetchSessions]);
  
  // Select a different session
  const selectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
  }, []);
  
  // Get context hint from current page
  const getPageContext = useCallback(() => {
    let contextHint: {
      page?: string;
      dataType?: string;
      relevantId?: string;
    } = {
      page: pathname,
    };
    
    // Extract context from URL
    if (pathname?.includes('gene-predictor') || pathname?.includes('sequence-comparer')) {
      contextHint.dataType = 'gene_analysis';
      
      // Extract gene ID if present
      const geneMatch = pathname?.match(/gene-predictor\/([a-zA-Z0-9-_]+)/);
      if (geneMatch && geneMatch[1]) {
        contextHint.relevantId = geneMatch[1];
      }
    } else if (pathname?.includes('lab-monitor')) {
      contextHint.dataType = 'lab_monitor';
    } else if (pathname?.includes('chainSight') || pathname?.includes('blockchain')) {
      contextHint.dataType = 'blockchain_transaction';
      
      // Extract transaction hash if present
      const txMatch = pathname?.match(/transaction\/([a-zA-Z0-9]+)/);
      if (txMatch && txMatch[1]) {
        contextHint.relevantId = txMatch[1];
      }
    }
    
    return contextHint;
  }, [pathname]);
  
  // Set up socket listeners for agent status updates
  useEffect(() => {
    if (!user?.id) return;
    
    const handleSynapseUpdate = (update: any) => {
      const { type, data } = update;
      
      switch (type) {
        case 'thinking':
          setAgentStatus({ state: 'thinking' });
          break;
        case 'planning':
          setAgentStatus({ 
            state: 'planning', 
            currentAction: data?.message || 'Planning how to answer your question...'
          });
          break;
        case 'retrieving':
          setAgentStatus({ 
            state: 'retrieving', 
            currentAction: data?.message || `Retrieving information...`
          });
          break;
        case 'response':
          setAgentStatus({ 
            state: 'responding', 
            currentAction: 'Generating response...'
          });
          break;
        default:
          setAgentStatus({ state: 'idle' });
      }
    };
    
    // Set up socket.io listeners (if implemented in the app)
    if (typeof window !== 'undefined' && (window as any).socket) {
      (window as any).socket.on('synapse_update', handleSynapseUpdate);
      
      return () => {
        (window as any).socket.off('synapse_update', handleSynapseUpdate);
      };
    }
  }, [user?.id]);
  
  // Send a message to the AI
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !user?.id) return;
    
    try {
      // If no active session, create one first
      if (!currentSessionId) {
        const newSessionId = await startNewSession();
        if (!newSessionId) return;
      }
      
      // Add user message locally immediately for better UX
      const tempUserMsg: ChatMessage = {
        id: `temp_${Date.now()}`,
        sessionId: currentSessionId!,
        role: 'user',
        content,
        timestamp: new Date()
      };
      
      const tempAssistantMsg: ChatMessage = {
        id: `temp_${Date.now() + 1}`,
        sessionId: currentSessionId!,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        processing: true
      };
      
      setMessages(prevMessages => [...prevMessages, tempUserMsg, tempAssistantMsg]);
      setIsLoading(true);
      
      // Set initial agent status if in agent mode
      if (useAgentMode) {
        setAgentStatus({ state: 'thinking' });
      }
      
      // Get context information
      const contextHint = getPageContext();
      
      // Send to API - use either agent endpoint or regular endpoint
      const response = useAgentMode 
        ? await synapseAPI.sendAgentMessage(currentSessionId!, content, contextHint)
        : await synapseAPI.sendMessage(currentSessionId!, content, contextHint);
      
      // Reset agent status
      setAgentStatus({ state: 'idle' });
      
      // Update messages with real response
      if (response.data.success) {
        const responseText = response.data.data.response;
        const sources = response.data.data.sources || [];
        
        // Add source attribution to message if available and in agent mode
        const formattedResponse = useAgentMode && sources.length > 0
          ? `${responseText}\n\n${formatSources(sources)}`
          : responseText;
        
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === tempAssistantMsg.id 
              ? {
                  ...msg,
                  id: `msg_${Date.now()}`,
                  content: formattedResponse,
                  processing: false,
                  sources
                } 
              : msg
          )
        );
      } else {
        throw new Error(response.data?.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      
      // Reset agent status
      setAgentStatus({ state: 'idle' });
      
      // Update the temporary message with error state
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.processing 
            ? {
                ...msg,
                content: "I'm sorry, I encountered an error. Please try again.",
                processing: false
              } 
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, user?.id, getPageContext, startNewSession, useAgentMode]);
  
  // Format sources for display
  const formatSources = (sources: Array<{ source: string; type: string }>): string => {
    if (!sources || sources.length === 0) return '';
    
    let formatted = '**Sources:**';
    sources.forEach((source, i) => {
      formatted += `\n- ${source.type.charAt(0).toUpperCase() + source.type.slice(1)}: ${source.source}`;
    });
    
    return formatted;
  };
  
  // Toggle agent mode
  const toggleAgentMode = useCallback(() => {
    setAgentStatus({ state: 'idle' });
  }, []);
  
  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      fetchMessages();
    }
  }, [currentSessionId, fetchMessages]);
  
  return {
    // State
    sessions,
    activeSession,
    currentSessionId,
    messages,
    isLoading,
    error,
    agentStatus,
    isAgentMode: useAgentMode,
    
    // Actions
    sendMessage,
    startNewSession,
    selectSession,
    deleteSession,
    refreshSessions: fetchSessions,
    getPageContext,
    toggleAgentMode
  };
};

export default useSynapseChat; 