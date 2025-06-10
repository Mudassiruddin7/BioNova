'use client'

import { useState, useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import api from '../../api';
import { useAuth } from '../useAuth';
import { getSocket } from '../../socket';

export type MessageRole = 'system' | 'user' | 'assistant';

export interface Source {
  source: string;
  type: string;
}

export interface SynapseMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  processing?: boolean;
  sources?: Source[];
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  lastUpdated?: Date;
}

export interface SynapseContextData {
  pageType: 'gene-predictor' | 'lab-monitor' | 'blockchain' | 'general';
  relevantId?: string;
  additionalContext?: Record<string, any>;
}

export const useSynapseAI = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // State for messages and UI
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SynapseMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Chat sessions state - ensure it's always initialized as an array
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  
  const [agentStatus, setAgentStatus] = useState<{ 
    state: 'idle' | 'thinking' | 'retrieving' | 'planning' | 'responding'; 
    currentAction?: string;
  }>({
    state: 'idle'
  });
  
  // Add debug logging to track typing state changes
  useEffect(() => {
    console.log('Typing state changed:', isTyping);
  }, [isTyping]);
  
  // Determine context from current path
  const determineContext = useCallback((): SynapseContextData => {
    const context: SynapseContextData = {
      pageType: 'general',
    };
    
    // Extract page type from URL
    if (pathname?.includes('gene-predictor') || pathname?.includes('sequence-comparer')) {
      context.pageType = 'gene-predictor';
      // Extract gene ID if present
      const geneMatch = pathname?.match(/gene-predictor\/([a-zA-Z0-9-_]+)/);
      if (geneMatch && geneMatch[1]) {
        context.relevantId = geneMatch[1];
      }
    } else if (pathname?.includes('lab-monitor')) {
      context.pageType = 'lab-monitor';
    } else if (pathname?.includes('chainSight') || pathname?.includes('blockchain')) {
      context.pageType = 'blockchain';
      // Extract transaction hash if present
      const txMatch = pathname?.match(/transaction\/([a-zA-Z0-9]+)/);
      if (txMatch && txMatch[1]) {
        context.relevantId = txMatch[1];
      }
    }
    
    return context;
  }, [pathname]);
  
  // Fetch all sessions
  const fetchSessions = useCallback(async () => {
    try {
      if (!user?.id) return [];
      
      setIsLoadingSessions(true);
      setSessionsError(null);
      
      console.log('Fetching all sessions for user:', user.id);
      const response = await api.get('/synapse/chat/sessions');
      
      // Handle different response formats
      let sessionsData: ChatSession[] = [];
      if (response.data?.data?.sessions && Array.isArray(response.data.data.sessions)) {
        // The preferred structure
        sessionsData = response.data.data.sessions;
      } else if (response.data?.sessions && Array.isArray(response.data.sessions)) {
        // Alternative structure
        sessionsData = response.data.sessions;
      } else if (Array.isArray(response.data)) {
        // Directly an array
        sessionsData = response.data;
      } else {
        console.error('Unexpected sessions data format:', response.data);
        throw new Error('Unexpected response format for sessions');
      }
      
      console.log('Sessions loaded:', sessionsData);
      setSessions(sessionsData || []);
      return sessionsData;
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessionsError('Failed to load chat sessions. Please try again.');
      // Always ensure sessions is an array, even on error
      setSessions([]);
      return [];
    } finally {
      setIsLoadingSessions(false);
    }
  }, [user?.id]);

  // Load sessions when component mounts or when sessionId changes (to refresh after creating new sessions)
  useEffect(() => {
    // Don't auto-refresh sessions - only load them once initially
    // This will be controlled manually through loadSessions/refreshSessions
  }, []);

  const handleNewChat = () => {
    startNewSession();
  };

  const handleSelectSession = (id: string) => {
    fetchExistingSession(id);
  };
  
  // Open the chat
  const openChat = useCallback(() => {
    setIsChatOpen(true);
  }, []);

  // Close the chat
  const closeChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  // Toggle chat open/closed
  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  // Toggle chat history visibility
  const toggleChatHistory = useCallback(() => {
    setShowChatHistory(prev => !prev);
  }, []);

  // Refresh sessions by reusing fetchSessions
  const refreshSessions = useCallback(async () => {
    await fetchSessions();
  }, [fetchSessions]);

  // Start a new chat session
  const startNewSession = useCallback(async (title?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Clear the current chat state
      setMessages([]);
      setSessionId(null);
      
      console.log('Creating new chat session');
      const response = await api.post('/synapse/chat/session', {
        title: title || 'New Chat'
      });
      
      // Check for the session ID in the response
      const responseData = response.data;
      const newSessionId = responseData?.data?.sessionId || responseData?.sessionId || responseData?.id;
      
      if (newSessionId) {
        console.log('New session created:', newSessionId);
          setSessionId(newSessionId);
          
        // Add a welcome message
        setMessages([{
          id: `welcome_${Date.now()}`,
            role: 'assistant',
          content: "Hello! How can I help you today?",
            timestamp: new Date()
        }]);
        
        // Update the sessions list, but only after creating a new session
        fetchSessions();
        
        // Open the chat if it's not already open
        if (!isChatOpen) {
          setIsChatOpen(true);
        }
        
        return newSessionId;
      } else {
        console.error('Failed to create new chat session - missing session ID:', response.data);
        throw new Error('Failed to create new chat - session ID not returned');
        }
    } catch (error) {
      console.error('Error creating new chat session:', error);
      setError('Failed to create new chat. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isChatOpen, fetchSessions]);

  // Load an existing session
  const fetchExistingSession = useCallback(async (id: string) => {
    try {
      if (!user?.id || !id) return false;
      
      setIsLoading(true);
      setError(null);
      
      console.log('Loading session:', id);
      const response = await api.get(`/synapse/chat/sessions/${id}/history`);
      
      // Handle different response formats
      let sessionData;
      let messagesData;
      
      if (response.data?.data?.session) {
        // The preferred structure
        sessionData = response.data.data.session;
      } else if (response.data?.session) {
        // Alternative structure
        sessionData = response.data.session;
      } else {
        sessionData = response.data;
      }
      
      // Extract messages from the session data
      if (sessionData?.messages) {
        messagesData = sessionData.messages;
      } else if (Array.isArray(sessionData)) {
        // If the session data itself is an array of messages
        messagesData = sessionData;
      } else {
        console.error('Failed to load session - no messages found:', response.data);
        throw new Error('No messages found in session data');
      }
      
      console.log('Session loaded:', sessionData);
      setSessionId(id);
      
      // Convert messages to the right format if necessary
      const formattedMessages = messagesData.map((msg: any) => ({
        id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
      }));
      
      setMessages(formattedMessages);
      setIsChatOpen(true);
      return true;
    } catch (error) {
      console.error('Error loading session:', error);
      setError('Failed to load chat session. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, setIsChatOpen]);
    
  // Set up socket.io listeners for real-time updates
  useEffect(() => {
    const socket = getSocket();
    
    socket.on('synapse_message_update', (data) => {
      if (data.sessionId === sessionId) {
        // Handle typing and message updates
        if (data.status === 'typing') setIsTyping(true);
        else if (data.status === 'completed') setIsTyping(false);
        
        if (data.message) {
          setMessages(prev => {
            if (data.replaceLoadingMessage && prev.some(msg => msg.isLoading)) {
              if (!data.message.isLoading) setIsTyping(false);
              return prev.map(msg => msg.isLoading
                ? { id: data.message.id || msg.id, role: 'assistant', content: data.message.content, timestamp: new Date(), isLoading: false }
                  : msg
              );
            }
            if (!data.message.isLoading) setIsTyping(false);
            return [...prev, { id: data.message.id || `msg_${Date.now()}`, role: data.message.role, content: data.message.content, timestamp: new Date(), isLoading: false }];
          });
        }
      }
    });
    
    socket.on('synapse_agent_update', (data) => {
      if (data.sessionId === sessionId) {
        setAgentStatus({ state: data.status, currentAction: data.action });
      }
    });
    
    return () => {
      socket.off('synapse_message_update');
      socket.off('synapse_agent_update');
    };
  }, [sessionId, user?.id]);
  
  // Send a message to Synapse
  const sendMessage = useCallback(async (content: string, useAgentMode: boolean = false) => {
    if (!content.trim()) return;  // allow anonymous
    
    // Anonymous user flow: one-off chat without sessions
    if (!user?.id) {
    try {
        // Add user message locally
        const tempUserId = `anon_msg_${Date.now()}`;
      const userMessage: SynapseMessage = {
          id: tempUserId,
        role: 'user',
        content,
        timestamp: new Date()
      };
        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);

        // Build chat history for API
        const history = [...messages, userMessage].map(msg => ({ role: msg.role, content: msg.content }));

        // Call public chat endpoint
        const response = await api.post('/synapse/chat', { messages: history });
        const botText = response.data?.data?.message || response.data?.message;

        // Add assistant reply
        const assistantMessage: SynapseMessage = {
          id: `anon_bot_${Date.now()}`,
        role: 'assistant',
          content: botText || '',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Anonymous chat error:', error);
        setError('Failed to get response. Please try again.');
      } finally {
        setIsTyping(false);
      }
      return;
    }

    // Logged-in user flow: session-based chat
    // Ensure a chat session exists: create one if first message
    let sid = sessionId;
    if (!sid) {
      const newSid = await startNewSession();
      if (!newSid) {
        setError('Failed to create chat session. Please try again.');
        return;
      }
      sid = newSid;
    }

    try {
      const messageId = `msg_${Date.now()}`;
      // Add user message
      const userMessage: SynapseMessage = { id: messageId, role: 'user', content, timestamp: new Date() };
      const tempAssistantMessage: SynapseMessage = { id: `msg_${Date.now()+1}`, role: 'assistant', content: '', timestamp: new Date(), isLoading: true, processing: true };
      setMessages(prev => [...prev, userMessage, tempAssistantMessage]);
      setIsTyping(true);
      
      const context = determineContext();
      const contextHint = {
        page: pathname,
        dataType: context.pageType === 'gene-predictor' 
          ? 'gene_analysis' 
          : context.pageType === 'lab-monitor' 
            ? 'lab_monitor' 
            : context.pageType === 'blockchain' 
              ? 'blockchain_transaction' 
              : 'general',
        relevantId: context.relevantId
      };
      const endpoint = useAgentMode ? '/synapse/agent/message' : '/synapse/bot/message';
      if (useAgentMode) setAgentStatus({ state: 'thinking', currentAction: 'Processing your request...' });

      const response = await api.post(endpoint, { sessionId: sid, message: content, contextHint });
      if (response.data && response.data.success) {
        const sources = useAgentMode && response.data.data.sources ? response.data.data.sources : undefined;
        setMessages(prev => prev.map(msg => msg.isLoading ? { id: msg.id, role: 'assistant', content: response.data.data.response, timestamp: new Date(), isLoading: false, processing: false, sources } : msg ));
        setIsTyping(false);
        if (useAgentMode) setAgentStatus({ state: 'idle' });
      } else {
        throw new Error(response.data?.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      setIsTyping(false);
      if (useAgentMode) setAgentStatus({ state: 'idle' });
    }
  }, [sessionId, user?.id, pathname, determineContext, startNewSession, messages]);

  // Clear the conversation
  const clearConversation = useCallback(() => {
    if (!sessionId) return;
    
    setMessages([{
      id: `welcome_${Date.now()}`,
      role: 'assistant',
      content: "I've cleared our conversation. How else can I help you?",
      timestamp: new Date()
    }]);
  }, [sessionId]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Delete a session
  const deleteSession = useCallback(async (id: string) => {
    try {
      if (!user?.id || !id) return false;
      
      setIsLoading(true);
      setError(null);
      
      console.log('Deleting session:', id);
      const response = await api.delete(`/synapse/chat/sessions/${id}`);
      
      // Check for success in various response formats
      const isSuccess = 
        response.data?.success === true || 
        response.data?.data?.success === true || 
        response.status === 200;
      
      if (isSuccess) {
        console.log('Session deleted:', id);
        
        // If the deleted session is the current one, reset
        if (id === sessionId) {
          setSessionId('');
          setMessages([{
            id: `welcome_${Date.now()}`,
            role: 'assistant',
            content: "Hello! How can I help you today?",
            timestamp: new Date()
          }]);
        }
        
        // Refresh sessions list after explicit deletion
        fetchSessions();
        return true;
      } else {
        console.error('Failed to delete session:', response.data);
        throw new Error(response.data?.message || response.data?.data?.message || 'Failed to delete chat session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      setError('Failed to delete chat session. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, sessionId, fetchSessions]);
  
  return {
    messages,
    sendMessage,
    isTyping,
    error,
    setError,
    isChatOpen,
    setIsChatOpen,
    setIsTyping,
    sessionId,
    startNewSession,
    fetchExistingSession,
    openChat,
    closeChat,
    toggleChat,
    clearConversation,
    messagesEndRef,
    contextData: determineContext(),
    agentStatus,
    isLoading,
    showChatHistory,
    toggleChatHistory,
    isLoadingHistory,
    sessions,
    loadSessions: refreshSessions,
    isLoadingSessions,
    deleteSession,
    sessionsError,
    fetchSessions
  };
};

export default useSynapseAI; 