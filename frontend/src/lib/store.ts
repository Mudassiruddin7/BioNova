import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// User profile type
interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  walletAddress?: string;
  role: 'user' | 'admin' | 'guest';
  preferences?: {
    theme?: 'light' | 'dark';
    aiVoice?: string;
  };
  profileImageUrl?: string;
  isGuest?: boolean;
}

// User state interface
interface UserState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

// Onboarding state interface
interface OnboardingState {
  completed: boolean;
  role: 'student' | 'researcher' | 'other';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  interests: string[];
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  setCompleted: (completed: boolean) => void;
  setRole: (role: 'student' | 'researcher' | 'other') => void;
  setExperienceLevel: (level: 'beginner' | 'intermediate' | 'advanced') => void;
  setInterests: (interests: string[]) => void;
  addChatMessage: (message: { role: 'user' | 'assistant'; content: string }) => void;
  clearChatHistory: () => void;
}

// Prediction state interface
interface PredictionState {
  currentPrediction: {
    id?: string;
    originalSequence: string;
    predictedSequence: string;
    editCount: number;
    editPositions: number[];
    explanation?: string;
  } | null;
  recentPredictions: Array<{
    id: string;
    originalSequence: string;
    predictedSequence: string;
    editCount: number;
    createdAt: string;
  }>;
  setCurrentPrediction: (prediction: PredictionState['currentPrediction']) => void;
  setRecentPredictions: (predictions: PredictionState['recentPredictions']) => void;
  clearCurrentPrediction: () => void;
}

// Sensor data type
interface SensorReading {
  value: number;
  timestamp: string;
}

// IoT state interface
interface IoTState {
  temperature: SensorReading[];
  humidity: SensorReading[];
  pressure?: SensorReading[];
  light?: SensorReading[];
  co2?: SensorReading[];
  lastUpdated?: string;
  insights?: string;
  setReadings: (readings: {
    temperature: SensorReading[];
    humidity: SensorReading[];
    pressure?: SensorReading[];
    light?: SensorReading[];
    co2?: SensorReading[];
    lastUpdated?: string;
  }) => void;
  addReading: (
    type: 'temperature' | 'humidity' | 'pressure' | 'light' | 'co2',
    reading: SensorReading
  ) => void;
  setInsights: (insights: string) => void;
}

// AI assistant state interface
interface AIAssistantState {
  conversations: Record<
    string,
    Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  >;
  currentContext: string;
  isProcessing: boolean;
  addMessage: (
    context: string,
    message: { role: 'system' | 'user' | 'assistant'; content: string }
  ) => void;
  setContext: (context: string) => void;
  setProcessing: (isProcessing: boolean) => void;
  clearConversation: (context: string) => void;
}

// User store
export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

// Onboarding store with persistence
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      completed: false,
      role: 'student',
      experienceLevel: 'beginner',
      interests: [],
      chatHistory: [],
      setCompleted: (completed) => set({ completed }),
      setRole: (role) => set({ role }),
      setExperienceLevel: (level) => set({ experienceLevel: level }),
      setInterests: (interests) => set({ interests }),
      addChatMessage: (message) =>
        set((state) => ({
          chatHistory: [...state.chatHistory, message],
        })),
      clearChatHistory: () => set({ chatHistory: [] }),
    }),
    {
      name: 'BioNova-onboarding',
    }
  )
);

// Prediction store
export const usePredictionStore = create<PredictionState>((set) => ({
  currentPrediction: null,
  recentPredictions: [],
  setCurrentPrediction: (prediction) => set({ currentPrediction: prediction }),
  setRecentPredictions: (predictions) => set({ recentPredictions: predictions }),
  clearCurrentPrediction: () => set({ currentPrediction: null }),
}));

// IoT store
export const useIoTStore = create<IoTState>((set) => ({
  temperature: [],
  humidity: [],
  pressure: [],
  light: [],
  co2: [],
  insights: '',
  setReadings: (readings) => set({ ...readings }),
  addReading: (type, reading) =>
    set((state) => ({
      [type]: [...(state[type] || []), reading],
    })),
  setInsights: (insights) => set({ insights }),
}));

// AI assistant store
export const useAIAssistantStore = create<AIAssistantState>((set) => ({
  conversations: {},
  currentContext: 'general',
  isProcessing: false,
  addMessage: (context, message) =>
    set((state) => ({
      conversations: {
        ...state.conversations,
        [context]: [
          ...(state.conversations[context] || []),
          message,
        ],
      },
    })),
  setContext: (context) => set({ currentContext: context }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  clearConversation: (context) =>
    set((state) => ({
      conversations: {
        ...state.conversations,
        [context]: [],
      },
    })),
}));

// Blockchain data store
export const useBlockchainStore = create<{
  dataToVerify: any;
  setDataToVerify: (data: any) => void;
}>((set) => ({
  dataToVerify: null,
  setDataToVerify: (data) => set({ dataToVerify: data }),
})); 