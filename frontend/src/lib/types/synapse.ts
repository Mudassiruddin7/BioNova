export type ChatRole = 'user' | 'assistant' | 'system';

export interface Source {
  source: string;
  type: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  processing?: boolean;
  sources?: Source[];
}

export interface ChatSession {
  sessionId: string;
  title: string;
  lastUpdated: Date;
  messages?: ChatMessage[];
}

export interface AgentStatus {
  state: 'idle' | 'thinking' | 'retrieving' | 'planning' | 'responding';
  currentAction?: string;
}

export interface FeedbackStats {
  total: number;
  positive: number;
  negative: number;
  specific: number;
  averageRatings?: {
    accuracy: number;
    relevance: number;
    helpfulness: number;
    clarity: number;
  };
}

export interface SynapseContextData {
  isOpen: boolean;
  currentSessionId: string | null;
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  isLoading: boolean;
  isRecording: boolean;
  sessionId: string | null;
  messages: ChatMessage[];
  isTyping: boolean;
  error: string | null;
  isChatOpen: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  contextData: {
    pageType: string;
    relevantId?: string;
  };
  agentStatus: AgentStatus;
}

export interface SynapseContextActions {
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  sendMessage: (content: string, useAgentMode?: boolean) => Promise<void>;
  startNewSession: () => void;
  selectSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => Promise<void>;
  startRecording: () => void;
  stopRecording: () => void;
  getPageContext: () => Record<string, any>;
  clearConversation: () => void;
}

export interface SynapseContextType extends SynapseContextData, SynapseContextActions {
  messages: SynapseMessage[];
  isTyping: boolean;
  error: string | null;
  isChatOpen: boolean;
  sessionId: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  contextData: SynapseContextData;
  agentStatus: {
    state: 'idle' | 'thinking' | 'retrieving' | 'planning' | 'responding';
    currentAction?: string;
  };
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
}

export type SynapseMessage = ChatMessage; 