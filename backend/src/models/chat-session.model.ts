import mongoose, { Schema, Document } from 'mongoose';

// Define the message interface without extending Document since these are subdocuments
export interface IMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Define the message schema
const MessageSchema: Schema = new Schema({
  id: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['system', 'user', 'assistant'], 
    required: true 
  },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, { _id: false });

// Define the chat session structure
export interface IChatSession extends Document {
  sessionId: string;
  userId: string;
  title: string;
  messages: IMessage[];
  contextData: {
    pageType?: string;
    relevantId?: string;
    additionalContext?: Record<string, any>;
  };
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
}

// Define the chat session schema
const ChatSessionSchema: Schema = new Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  messages: [MessageSchema],
    contextData: {
      pageType: { type: String },
      relevantId: { type: String },
      additionalContext: { type: Schema.Types.Mixed }
  },
  lastMessageAt: { type: Date, default: Date.now }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Add indexes for better query performance
ChatSessionSchema.index({ userId: 1, lastMessageAt: -1 });

// Create and export the model
const ChatSession = mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
export default ChatSession; 