// User profile type
export interface UserProfile {
  id: string;
  walletAddress: string;
  role: 'user' | 'admin';
  preferences: {
    theme?: 'light' | 'dark';
    aiVoice?: string;
  };
  profileImageUrl?: string;
}

// User profile type
export interface ProfileData {
  userId: string;
  role: 'student' | 'researcher' | 'other';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  interests: string[];
  recentActivity: {
    type: 'prediction' | 'monitoring';
    data: Record<string, any>;
    timestamp: string;
  }[];
}

// Prediction types
export interface Prediction {
  id: string;
  originalSequence: string;
  predictedSequence: string;
  editCount: number;
  editPositions: number[];
  explanations?: {
    text: string;
    timestamp: string;
  }[];
  visualizations?: {
    imageUrl: string;
    type: 'sequence' | 'diagram';
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// Sensor data types
export interface SensorReading {
  value: number;
  timestamp: string;
}

export interface SensorData {
  temperature: SensorReading[];
  humidity: SensorReading[];
  pressure?: SensorReading[];
  light?: SensorReading[];
  co2?: SensorReading[];
  lastUpdated?: string;
}

// API response types
export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
} 