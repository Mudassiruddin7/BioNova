import { Groq } from 'groq-sdk';
import axios from 'axios';
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import logger from '../../utils/logger';
import config from '../../config';
import { getIO } from '../../utils/socketio';
import * as geneService from '../gene.service';
import transactionService from '../transaction.service';
import * as labService from '../labIoTService';
import ChatSession from '../../models/chat-session.model';
import User from '../../models/user.model';
import Profile from '../../models/profile.model';
import Gene from '../../models/gene.model';
import { Transaction } from '../../models/transaction.model';
/**
 * SynapseCore
 * A unified AI service that combines functionality from:
 * - Groq integration (LLM interaction)
 * - RAG (Retrieval Augmented Generation)
 * - Agent (Intelligent task planning)
 * - Feedback collection and analysis
 * 
 * This consolidation reduces code duplication and improves maintainability.
 */

// Define FeedbackType as an enum (a value, not just a type)
export enum FeedbackType {
  THUMBS_UP = 'thumbs_up',
  THUMBS_DOWN = 'thumbs_down',
  SPECIFIC = 'specific'
}

// Type definitions for Synapse services
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ContextHint {
  page?: string;
  relevantId?: string;
  dataType?: 'gene_analysis' | 'blockchain_transaction' | 'lab_monitor' | 'general';
  [key: string]: any;
}

export interface UserMessage {
  sessionId: string;
  userId: string;
  content: string;
  contentType: 'text' | 'audio_input';
  contextHint?: ContextHint;
}

export interface AssistantResponse {
  sessionId: string;
  userId: string;
  textContent: string;
  audioRef?: string;
  processingTimeMs: number;
  modelUsed: string;
  error?: string;
  sources?: Array<{ source: string; type: string }>;
}

export interface KnowledgeChunk {
  content: string;
  source: string;
  sourceType: 'gene' | 'transaction' | 'lab' | 'user' | 'system' | 'other';
  timestamp?: Date;
  relevance?: number;
  metadata?: Record<string, any>;
}

export interface GroqCompletionOptions {
  systemPrompt: string;
  userPrompt: string;
  context?: Record<string, any>;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

export interface GroqCompletionResponse {
  text: string;
  metadata?: {
    confidence?: number;
    processingTime?: number;
    tokenUsage?: {
      input: number;
      output: number;
      total: number;
    };
    error?: string;
  };
}

export interface FeedbackDetail {
  messageId: string;
  reason: string;
  details?: string;
  category: string;
}

export interface AgentActionType {
  type: 'retrieve_gene_data' | 'retrieve_blockchain_data' | 'retrieve_lab_data' | 'search_knowledge_base' | 'answer_directly' | 'clarify_question' | 'run_analysis';
  params: Record<string, any>;
}

// SynapseCore main class
export class SynapseCore {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private isAvailable: boolean = true;
  private lastError: Error | null = null;
  
  // Define shared system prompts
  private readonly systemPrompts = {
    default: "You are Synapse, an advanced AI assistant for BioNova AI Studio. Your purpose is to assist researchers and scientists in their work by providing concise, accurate information and insights.",
    genePrediction: "You are Synapse, focusing on gene prediction analysis. Help researchers understand gene sequences, mutations, and make predictions about genetic outcomes based on provided data.",
    blockchain: "You are Synapse, focusing on blockchain analysis. Help researchers track, analyze, and understand blockchain transactions and data related to genetic research and biotech innovations.",
    labMonitor: "You are Synapse, focusing on lab monitoring. Help scientists interpret sensor data, identify anomalies, and understand trends in laboratory conditions that might affect experiments.",
  };
  
  // Models available for use
  readonly MODELS = {
    DEFAULT_LLM_SMALL: 'llama3-8b-8192',
    DEFAULT_LLM_LARGE: 'llama3-70b-8192',
    MIXTRAL: 'mixtral-8x7b-32768',
    GEMMA: 'gemma-7b-it'
  };

  // Groq client for LLM access
  private groq: Groq;
  
  // Cache for frequent prompts
  private promptCache: Map<string, { response: string, timestamp: number }> = new Map();
  private readonly cacheTTLMs: number = 1000 * 60 * 30; // 30 minutes

  constructor() {
    this.apiKey = config.GROQ_API_KEY;
    this.baseUrl = 'https://api.groq.com/openai/v1';
    this.model = this.MODELS.DEFAULT_LLM_LARGE;

    // Initialize Groq client with proper error handling
    if (!this.apiKey) {
      logger.error('GROQ_API_KEY not set. Synapse AI will not function properly.');
      this.isAvailable = false;
      this.lastError = new Error('GROQ_API_KEY not set');
    } else {
      try {
        this.groq = new Groq({
          apiKey: this.apiKey,
        });
        this.isAvailable = true;
        logger.info('Groq API client initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize Groq API client:', error);
        this.isAvailable = false;
        this.lastError = error instanceof Error ? error : new Error('Unknown error initializing Groq');
      }
    }
  }

  //===== CORE LLM INTERACTION METHODS =====

  /**
   * Generate text directly with just a prompt
   */
  async generateText(
    prompt: string,
    systemPrompt: string = 'You are a helpful assistant that provides accurate and concise information.',
    model?: string,
    userId?: string
  ): Promise<{
    data?: string;
    error?: string;
    modelUsed: string;
    processingTimeMs: number;
  }> {
    const startTime = Date.now();
    
    // Check if Groq is available
    if (!this.isAvailable) {
      return {
        error: 'Groq API is not available. Please check your API key configuration.',
        modelUsed: model || this.model,
        processingTimeMs: 0
      };
    }
    
    try {
      logger.info('Generating text with Groq', { userId, promptLength: prompt.length });
      
      // Use the completion API with minimal wrapping
      const completionOptions: GroqCompletionOptions = {
        systemPrompt,
        userPrompt: prompt,
      };
      
      const selectedModel = model || this.model;
      const response = await this.generateCompletion(completionOptions);
      
      return {
        data: response.text,
        modelUsed: selectedModel,
        processingTimeMs: response.metadata?.processingTime || (Date.now() - startTime)
      };
    } catch (error: any) {
      logger.error('Error generating text with Groq', { 
        userId, 
        error: error.message 
      });
      
      return {
        error: error.message,
        modelUsed: model || this.model,
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Generate a chat completion from a series of messages
   */
  async generateChatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    model?: string,
    userId?: string
  ): Promise<{
    data?: string;
    error?: string;
    modelUsed: string;
    processingTimeMs: number;
  }> {
    // Check if Groq is available
    if (!this.isAvailable) {
      return {
        error: 'Groq API is not available. Please check your API key configuration.',
        modelUsed: model || this.model,
        processingTimeMs: 0
      };
    }

    const startTime = Date.now();
    
    try {
      logger.info('Generating chat completion with Groq', { 
        userId, 
        messageCount: messages.length 
      });

      const response = await this.groq.chat.completions.create({
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        model: model || this.model,
        temperature: 0.7,
        max_tokens: 2048,
      });

      const responseText = response.choices[0]?.message?.content || '';
      
      return {
        data: responseText,
        modelUsed: model || this.model,
        processingTimeMs: Date.now() - startTime
      };
    } catch (error: any) {
      logger.error('Error generating chat completion with Groq', { 
        userId, 
        error: error.message 
      });
      
      return {
        error: error.message,
        modelUsed: model || this.model,
        processingTimeMs: Date.now() - startTime
      };
    }
  }
    
  /**
   * Core completion method for Groq LLM
   */
  async generateCompletion(options: GroqCompletionOptions): Promise<GroqCompletionResponse> {
    // Check if Groq is available
    if (!this.isAvailable) {
      throw new Error('Groq API is not available. Please check your API key configuration.');
    }
    
    const { systemPrompt, userPrompt, context, temperature, maxTokens } = options;
    
    // Construct messages array
    const messages = [
      { role: 'system', content: systemPrompt },
    ];
    
    // Add context if available
    if (context) {
      messages.push({
        role: 'user',
        content: `Context information:\n${JSON.stringify(context)}`,
      });
      
      messages.push({
        role: 'assistant',
        content: "I'll take this context into account for our conversation.",
      });
    }
    
    // Add user prompt
    messages.push({
      role: 'user',
      content: userPrompt,
    });
    
    // Check cache for identical prompt
    const cacheKey = JSON.stringify(messages) + (temperature || 'default') + (maxTokens || 'default');
    const cachedResult = this.promptCache.get(cacheKey);
    
    if (cachedResult && Date.now() - cachedResult.timestamp < this.cacheTTLMs) {
      logger.debug('Using cached Groq response');
      return {
        text: cachedResult.response,
        metadata: {
          processingTime: 0, // Cached, no processing time
          confidence: 0.95,
        },
      };
    }

    const startTime = Date.now();
    
    try {
      const response = await this.groq.chat.completions.create({
        messages: messages.map(m => ({
          role: m.role as any,
          content: m.content
        })),
        model: this.model,
        temperature: temperature || 0.7,
        max_tokens: maxTokens || 2048,
      });

      const responseText = response.choices[0]?.message?.content || '';
      const processingTime = Date.now() - startTime;
      
      // Cache the result
      this.promptCache.set(cacheKey, {
        response: responseText,
        timestamp: Date.now(),
      });
      
      return {
        text: responseText,
        metadata: {
          processingTime,
          confidence: 0.95,
          tokenUsage: {
            input: response.usage?.prompt_tokens || 0,
            output: response.usage?.completion_tokens || 0,
            total: response.usage?.total_tokens || 0,
          }
        }
      };
    } catch (error: any) {
      this.lastError = error;
      
      // Special handling for API key errors
      if (error.message && error.message.includes('Invalid API Key')) {
        logger.error('Invalid Groq API Key. Please update your .env file with a valid API key from https://console.groq.com/');
        this.isAvailable = false;
        return {
          text: "I'm currently experiencing connectivity issues with my language model provider. Please check the server logs and make sure you've configured a valid Groq API key in your .env file.",
          metadata: {
            processingTime: Date.now() - startTime,
            confidence: 0,
            error: 'INVALID_API_KEY'
          }
        };
      }
      
      logger.error('Error generating completion with Groq', { error: error.message });
      throw error;
    }
  }

  /**
   * Process a user message and generate a response with context
   */
  async processUserMessage(
    message: UserMessage,
    options: {
      generateAudio?: boolean;
      broadcastViaSocket?: boolean;
    } = {}
  ): Promise<AssistantResponse> {
    const startTime = Date.now();
    const { sessionId, userId, content, contextHint = {} } = message;

    try {
      logger.info('Processing user message', { userId, sessionId });

      // Save the user message
      await this.saveUserMessage(sessionId, userId, content, contextHint);

      // Broadcast that the assistant is typing if socket option is enabled
      if (options.broadcastViaSocket) {
        const io = getIO();
        io.to(userId).emit('assistant_typing', { sessionId });
      }

      // Retrieve related knowledge based on the message and context
      const knowledgeChunks = await this.retrieveKnowledge(content, contextHint, userId);
      
      // Get chat history for context
      const chatHistory = await this.getChatHistory(sessionId, 5);
      
      // Construct RAG context
      const ragContext: any = {
        contextHint,
        knowledgeChunks,
        chatHistory
      };
      
      // Format retrieved context
      const retrievedContext = this.formatRetrievedContext(knowledgeChunks);
      
      // Create prompt with context and history
      const messages = this.assemblePrompt(content, retrievedContext, chatHistory);
      
      // Generate response with the LLM
      const llmResponse = await this.generateChatCompletion(messages, undefined, userId);
      
      if (llmResponse.error) {
        throw new Error(llmResponse.error);
      }
      
      const responseText = llmResponse.data || 'I apologize, but I am unable to provide a response at the moment.';
      
      // Generate audio if requested
      let audioRef;
      if (options.generateAudio) {
        const audioResult = await this.synthesizeSpeech(responseText);
        if (audioResult.success && audioResult.audioUrl) {
          audioRef = audioResult.audioUrl;
        }
      }
      
      // Save the assistant's response
      await this.saveAssistantMessage(
        sessionId,
        userId,
        responseText,
        audioRef,
        llmResponse.modelUsed,
        llmResponse.processingTimeMs
      );
      
      // Prepare sources from knowledge chunks
      const sources = knowledgeChunks.map(chunk => ({
        source: chunk.source,
        type: chunk.sourceType
      }));
      
      // Broadcast that the assistant has responded if socket option is enabled
      if (options.broadcastViaSocket) {
        const io = getIO();
        io.to(userId).emit('assistant_response', { 
          sessionId,
          textContent: responseText
        });
      }
      
      const totalProcessingTime = Date.now() - startTime;
      
      return {
        sessionId,
        userId,
        textContent: responseText,
        audioRef,
        processingTimeMs: totalProcessingTime,
        modelUsed: llmResponse.modelUsed,
        sources
      };
    } catch (error: any) {
      logger.error('Error processing user message', { 
        userId, 
        sessionId, 
        error: error.message 
      });
      
      return {
        sessionId,
        userId,
        textContent: 'I apologize, but an error occurred while processing your message. Please try again later.',
        processingTimeMs: Date.now() - startTime,
        modelUsed: this.model,
        error: error.message
      };
    }
  }

  //===== RAG (RETRIEVAL) METHODS =====

  /**
   * Retrieve knowledge relevant to the user's query, including user-specific data
   */
  async retrieveKnowledge(
    query: string,
    contextHint: ContextHint,
    userId: string,
    maxChunks: number = 5
  ): Promise<KnowledgeChunk[]> {
    try {
      logger.info('Retrieving knowledge for user query', { userId, query });
      
      let chunks: KnowledgeChunk[] = [];
      const dataType = contextHint.dataType || 'general';

      // First, retrieve user-specific base context data for RAG
      const userContextChunks = await this.retrieveUserContext(userId, query);
      chunks = [...chunks, ...userContextChunks];
      
      // Then get context specific to the page/dataType the user is on
      if (dataType === 'gene_analysis' && contextHint.relevantId) {
        const geneContextChunks = await this.retrieveGeneContext(
          contextHint.relevantId,
          userId
        );
        chunks = [...chunks, ...geneContextChunks];
      } else if (dataType === 'blockchain_transaction' && contextHint.relevantId) {
        const transactionContextChunks = await this.retrieveTransactionContext(
          contextHint.relevantId,
          userId
        );
        chunks = [...chunks, ...transactionContextChunks];
      } else if (dataType === 'lab_monitor') {
        const labContextChunks = await this.retrieveLabContext(userId);
        chunks = [...chunks, ...labContextChunks];
      } else {
        // For general queries, use keyword analysis to selectively retrieve data
        if (this.isQueryAboutPredictions(query)) {
          const genePredictionChunks = await this.retrieveUserGenePredictions(userId, 3);
          chunks = [...chunks, ...genePredictionChunks];
        }
        
        if (this.isQueryAboutTransactions(query)) {
          const transactionChunks = await this.retrieveUserTransactions(userId, 3);
          chunks = [...chunks, ...transactionChunks];
        }
        
        // Get general context for anything else
        const generalContextChunks = await this.retrieveGeneralContext(query, userId);
        chunks = [...chunks, ...generalContextChunks];
      }
      
      // Rank chunks by relevance to query
      const rankedChunks = this.rankChunks(chunks, query);
      
      // Return the most relevant chunks up to maxChunks
      return rankedChunks.slice(0, maxChunks);
    } catch (error) {
      logger.error('Error retrieving knowledge:', error);
      // Return empty array on error
      return [];
    }
  }
  
  /**
   * Retrieve basic user context data (profile, preferences, etc.)
   */
  private async retrieveUserContext(userId: string, query: string): Promise<KnowledgeChunk[]> {
    try {
      if (!userId || userId === 'anonymous') {
        return [{
          content: "User is not authenticated. No personalized data available.",
          source: "system",
          sourceType: "system"
        }];
      }
      
      const chunks: KnowledgeChunk[] = [];
      
      // Get user profile information
      const user = await User.findById(this.safeObjectId(userId))
        .select('name email walletAddress preferences');
      
      if (user) {
        const userProfileChunk: KnowledgeChunk = {
          content: `User Profile Information:
Name: ${user.name || 'Not provided'}
Email: ${user.email || 'Not provided'}
Wallet Address: ${user.walletAddress || 'Not connected'}
Theme Preference: ${user.preferences?.theme || 'default'}`,
          source: "user_profile",
          sourceType: "user",
          relevance: 1.0 // Always include user profile context
        };
        
        chunks.push(userProfileChunk);
      }
      
      // Get extended profile if available
      try {
        const profile = await Profile.findOne({ userId: this.safeObjectId(userId) });
        
        if (profile) {
          const profileChunk: KnowledgeChunk = {
            content: `User Extended Profile:
Role: ${profile.role || 'Not specified'}
Experience Level: ${profile.experienceLevel || 'Not specified'}
Interests: ${profile.interests?.join(', ') || 'None specified'}
Onboarding Completed: ${profile.onboardingCompleted ? 'Yes' : 'No'}`,
            source: "user_extended_profile",
            sourceType: "user",
            relevance: 0.9
          };
          
          chunks.push(profileChunk);
        }
      } catch (profileError) {
        logger.warn('Error fetching user profile, continuing without it:', profileError);
        // Continue without profile data
      }
      
      // Add activity summaries
      const geneticActivity = await this.getUserGeneticActivitySummary(userId);
      const blockchainActivity = await this.getUserBlockchainActivitySummary(userId);
      
      if (geneticActivity) {
        chunks.push({
          content: geneticActivity,
          source: "genetic_activity_summary",
          sourceType: "user",
          relevance: this.isQueryAboutPredictions(query) ? 0.95 : 0.7
        });
      }
      
      if (blockchainActivity) {
        chunks.push({
          content: blockchainActivity,
          source: "blockchain_activity_summary",
          sourceType: "user",
          relevance: this.isQueryAboutTransactions(query) ? 0.95 : 0.7
        });
      }
      
      return chunks;
    } catch (error) {
      logger.error('Error retrieving user context:', error);
      return [];
    }
  }
  
  /**
   * Generate a summary of user's genetic activity
   */
  private async getUserGeneticActivitySummary(userId: string): Promise<string | null> {
    try {
      const geneModel = mongoose.model('Gene');
      
      // Count predictions
      const predictionsCount = await geneModel.countDocuments({ 
        userId: this.safeObjectId(userId),
        type: 'prediction'
      });
      
      // Get latest prediction date
      const latestPrediction = await geneModel.findOne({ 
        userId: this.safeObjectId(userId),
        type: 'prediction'
      }).sort({ createdAt: -1 });
      
      const latestDate = latestPrediction ? 
        new Date(latestPrediction.createdAt).toLocaleDateString() : 
        'never';
      
      if (predictionsCount === 0) {
        return 'You have not made any gene predictions yet.';
      }
      
      return `Genetic Activity Summary:
Total gene predictions: ${predictionsCount}
Last prediction: ${latestDate}
${latestPrediction ? `Latest sequence analyzed: ${latestPrediction.sequence?.substring(0, 20)}...` : ''}`;
    } catch (error) {
      logger.error('Error getting genetic activity summary:', error);
      return null;
    }
  }
  
  /**
   * Generate a summary of user's blockchain activity
   */
  private async getUserBlockchainActivitySummary(userId: string): Promise<string | null> {
    try {
      // Get transaction counts by type
      const transactionCounts = await Transaction.aggregate([
        { $match: { userId: this.safeObjectId(userId) } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);
      
      // Count total transactions
      const totalTransactions = transactionCounts.reduce((sum, item) => sum + item.count, 0);
      
      // Get latest transaction
      const latestTransaction = await Transaction.findOne({ 
        userId: this.safeObjectId(userId) 
      }).sort({ timestamp: -1 });
      
      const latestDate = latestTransaction ? 
        new Date(latestTransaction.timestamp).toLocaleDateString() : 
        'never';
        
      if (totalTransactions === 0) {
        return 'You have not recorded any blockchain transactions yet.';
      }
      
      // Format transaction type counts in a readable way
      const typeCounts = transactionCounts.map(item => 
        `${item._id}: ${item.count}`
      ).join(', ');
      
      return `Blockchain Activity Summary:
Total transactions: ${totalTransactions}
Transaction types: ${typeCounts}
Last transaction: ${latestDate}
${latestTransaction ? `Latest transaction: ${latestTransaction.description || latestTransaction.hash}` : ''}`;
    } catch (error) {
      logger.error('Error getting blockchain activity summary:', error);
      return null;
    }
  }
  
  /**
   * Retrieve recent gene predictions for the user
   */
  private async retrieveUserGenePredictions(userId: string, limit: number = 3): Promise<KnowledgeChunk[]> {
    try {
      const geneModel = mongoose.model('Gene');
      
      // Get recent predictions
      const predictions = await geneModel.find({ 
        userId: this.safeObjectId(userId),
        type: 'prediction'
      })
      .sort({ createdAt: -1 })
      .limit(limit);
      
      if (!predictions || predictions.length === 0) {
        return [];
      }
      
      // Convert each prediction to a knowledge chunk
      return predictions.map(prediction => ({
        content: `Gene Prediction (${new Date(prediction.createdAt).toLocaleDateString()}):
Sequence ID: ${prediction._id}
Original Sequence: ${prediction.sequence?.substring(0, 30)}...
Prediction Type: ${prediction.metadata?.predictionType || 'standard'}
Result: ${prediction.result?.substring(0, 100) || 'Not available'}`,
        source: prediction._id.toString(),
        sourceType: 'gene',
        timestamp: prediction.createdAt,
        metadata: {
          sequenceId: prediction._id.toString(),
          sequenceType: prediction.type
        }
      }));
    } catch (error) {
      logger.error('Error retrieving user gene predictions:', error);
      return [];
    }
  }
  
  /**
   * Retrieve recent blockchain transactions for the user
   */
  private async retrieveUserTransactions(userId: string, limit: number = 3): Promise<KnowledgeChunk[]> {
    try {
      // Get recent transactions
      const transactions = await Transaction.find({ 
        userId: this.safeObjectId(userId)
      })
      .sort({ timestamp: -1 })
      .limit(limit);
      
      if (!transactions || transactions.length === 0) {
        return [];
      }
      
      // Convert each transaction to a knowledge chunk
      return transactions.map(tx => ({
        content: `Blockchain Transaction (${new Date(tx.timestamp).toLocaleDateString()}):
Hash: ${tx.hash.substring(0, 10)}...
Description: ${tx.description}
Type: ${tx.type}
Status: ${tx.status}
${tx.blockNumber ? `Block Number: ${tx.blockNumber}` : ''}`,
        source: tx.hash,
        sourceType: 'transaction',
        timestamp: tx.timestamp instanceof Date ? tx.timestamp : new Date(tx.timestamp),
        metadata: {
          transactionHash: tx.hash,
          type: tx.type,
          status: tx.status
        }
      }));
    } catch (error) {
      logger.error('Error retrieving user transactions:', error);
      return [];
    }
  }
  
  /**
   * Check if the query is related to gene predictions
   */
  private isQueryAboutPredictions(query: string): boolean {
    const predictionKeywords = [
      'gene', 'prediction', 'sequence', 'dna', 'rna', 'crispr', 
      'edit', 'genetic', 'genomic', 'analysis', 'predict', 'base',
      'mutation', 'code', 'strand', 'experiment'
    ];
    
    return this.containsKeywords(query.toLowerCase(), predictionKeywords);
  }
  
  /**
   * Check if the query is related to blockchain transactions
   */
  private isQueryAboutTransactions(query: string): boolean {
    const transactionKeywords = [
      'transaction', 'blockchain', 'wallet', 'crypto', 'base', 
      'hash', 'block', 'contract', 'transfer', 'ledger', 'record',
      'history', 'chain', 'sample', 'experiment', 'ip', 'intellectual',
      'provenance', 'workflow', 'access'
    ];
    
    return this.containsKeywords(query.toLowerCase(), transactionKeywords);
  }
  
  /**
   * Check if text contains any of the keywords
   */
  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * Retrieve context from gene analysis
   */
  private async retrieveGeneContext(geneId: string, userId: string): Promise<KnowledgeChunk[]> {
    try {
      const chunks: KnowledgeChunk[] = [];
      
      // Safely handle MongoDB ObjectId conversion
      const objectId = this.safeObjectId(geneId);
      if (!objectId) {
        return chunks;
      }
      
      // Get gene data from the service
      const geneData = await geneService.getGeneById(objectId.toString(), userId);
      if (!geneData) {
        return chunks;
      }
      
      // Create a summary chunk
      chunks.push({
        content: `Gene Analysis ID: ${geneId}
Name: ${geneData.name || 'Unnamed'}
Sequence: ${geneData.sequence?.substring(0, 100)}${geneData.sequence?.length > 100 ? '...' : ''}
Description: ${geneData.description || 'No description'}
Type: ${geneData.geneType || 'Unknown'}
Efficiency: ${geneData.efficiency || 'Not calculated'}
Created: ${geneData.createdAt?.toISOString() || 'Unknown'}`,
        source: `gene:${geneId}`,
        sourceType: 'gene',
        timestamp: geneData.createdAt,
        metadata: {
          geneId: geneId,
          userId: userId,
          name: geneData.name,
          efficiency: geneData.efficiency,
          geneType: geneData.geneType,
          tags: geneData.tags
        }
      });
      
      return chunks;
    } catch (error) {
      logger.error('Error retrieving gene context:', error);
      return [];
    }
  }

  /**
   * Retrieve context from blockchain transaction
   */
  private async retrieveTransactionContext(transactionHash: string, userId: string): Promise<KnowledgeChunk[]> {
    try {
      const chunks: KnowledgeChunk[] = [];
      
      // Get transaction data from the service instance
      const txData = await transactionService.getTransactionByHash(transactionHash, userId);
      if (!txData) {
        return chunks;
      }
      
      // Create a transaction summary chunk
      const content = `Transaction Hash: ${transactionHash}
Description: ${('description' in txData) ? txData.description : 'No description'}
Type: ${txData.type || 'Unknown'}
Status: ${txData.status || 'Unknown'}
Timestamp: ${txData.timestamp ? new Date(txData.timestamp).toISOString() : 'Unknown'}
Block Number: ${('blockNumber' in txData) ? txData.blockNumber : 'Not confirmed'}
Gas Used: ${('gasUsed' in txData) ? txData.gasUsed : 'Unknown'}`;

      chunks.push({
        content,
        source: `transaction:${transactionHash}`,
        sourceType: 'transaction',
        timestamp: txData.timestamp ? new Date(txData.timestamp) : undefined,
        metadata: {
          transactionHash,
          type: txData.type,
          status: txData.status,
          entityId: ('entityId' in txData) ? txData.entityId : undefined,
          blockNumber: ('blockNumber' in txData) ? txData.blockNumber : undefined
        }
      });
      
      return chunks;
    } catch (error) {
      logger.error('Error retrieving transaction context:', error);
      return [];
    }
  }

  /**
   * Retrieve context from lab monitoring
   */
  private async retrieveLabContext(userId: string): Promise<KnowledgeChunk[]> {
    try {
      const chunks: KnowledgeChunk[] = [];
      
      // Get recent sensor data
      const sensorData = await labService.getRecentSensorData(userId);
      if (sensorData && sensorData.length > 0) {
        // Create a summary of the most recent readings
        const recentReadings = sensorData.slice(0, 5);
        
        const summaryContent = `Lab Monitoring Data (Recent Readings):
${recentReadings.map((reading, index) => {
  return `Reading ${index + 1}:
  Sensor: ${reading.sensorType}
  Value: ${reading.value} ${reading.unit}
  Location: ${reading.location}
  Timestamp: ${reading.timestamp.toISOString()}
  Status: ${reading.status}`;
}).join('\n\n')}`;
        
        chunks.push({
          content: summaryContent,
          source: 'lab:recent_readings',
          sourceType: 'lab',
          timestamp: recentReadings[0].timestamp,
          metadata: {
            readingCount: recentReadings.length,
            sensors: recentReadings.map(r => r.sensorType),
            labId: recentReadings[0].labId
          }
        });
      }
      
      // Get any recent alerts
      const alerts = await labService.getRecentAlerts(userId);
      if (alerts && alerts.length > 0) {
        const alertSummary = `Lab Alerts (Last 24 hours):
${alerts.map((alert, index) => {
  return `Alert ${index + 1}:
  Type: ${alert.alertType}
  Severity: ${alert.severity}
  Message: ${alert.message}
  Timestamp: ${alert.timestamp.toISOString()}
  Status: ${alert.status}`;
}).join('\n\n')}`;
        
        chunks.push({
          content: alertSummary,
          source: 'lab:recent_alerts',
          sourceType: 'lab',
          timestamp: alerts[0].timestamp,
          metadata: {
            alertCount: alerts.length,
            severities: alerts.map(a => a.severity),
            labId: alerts[0].labId
          }
        });
      }
      
      return chunks;
    } catch (error) {
      logger.error('Error retrieving lab context:', error);
      return [];
    }
  }

  /**
   * Retrieve general context based on the query
   */
  private async retrieveGeneralContext(query: string, userId: string): Promise<KnowledgeChunk[]> {
    // In a real implementation, this would search a knowledge base or vector store
    // This is a simplified version that returns some static knowledge
    return [
      {
        content: "BioNova AI Studio focuses on advanced genetic analysis tools using CRISPR technology.",
        source: "knowledge_base:general",
        sourceType: "system"
      },
      {
        content: "CRISPR-Cas9 is a technology that allows scientists to edit parts of the genome by removing, adding or altering sections of the DNA sequence.",
        source: "knowledge_base:crispr",
        sourceType: "system"
      },
      {
        content: "The blockchain implementation at BioNova ensures transparent and immutable record-keeping of all genetic research and modifications.",
        source: "knowledge_base:blockchain",
        sourceType: "system"
      }
    ];
  }

  /**
   * Rank knowledge chunks by relevance to the query
   */
  private rankChunks(chunks: KnowledgeChunk[], query: string): KnowledgeChunk[] {
    // In a real implementation, this would use semantic similarity
    // This is a simplified version that does keyword matching
    return chunks.sort((a, b) => {
      // Score based on simple keyword matching
      const aScore = this.simpleRelevanceScore(a.content, query);
      const bScore = this.simpleRelevanceScore(b.content, query);
      
      // Prioritize more recent information if available
      if (a.timestamp && b.timestamp) {
        const timeFactorA = a.timestamp.getTime();
        const timeFactorB = b.timestamp.getTime();
        return (bScore * timeFactorB) - (aScore * timeFactorA);
      }
      
      return bScore - aScore;
    });
  }

  /**
   * Simple relevance scoring function
   */
  private simpleRelevanceScore(text: string, query: string): number {
    const words = query.toLowerCase().split(/\s+/);
    const textLower = text.toLowerCase();
    
    let score = 0;
    words.forEach(word => {
      if (word.length > 2 && textLower.includes(word)) {
        score += 1;
        
        // Bonus for exact phrase matches
        if (textLower.includes(query.toLowerCase())) {
          score += 3;
        }
      }
    });
    
    return score;
  }

  /**
   * Format the retrieved context into a coherent text block for the LLM
   */
  formatRetrievedContext(chunks: KnowledgeChunk[]): string {
    if (!chunks || chunks.length === 0) {
      return '';
    }
    
    // Sort chunks by source type to group similar information
    chunks.sort((a, b) => {
      // First prioritize user data
      if (a.sourceType === 'user' && b.sourceType !== 'user') return -1;
      if (a.sourceType !== 'user' && b.sourceType === 'user') return 1;
      
      // Then prioritize by relevance
      return (b.relevance || 0) - (a.relevance || 0);
    });
    
    // Build the context string
    const formattedContext = chunks.map(chunk => {
      // Add a header based on source type
      let header = '';
      
      switch (chunk.sourceType) {
        case 'user':
          header = '[USER INFORMATION]';
          break;
        case 'gene':
          header = '[GENE DATA]';
          break;
        case 'transaction':
          header = '[BLOCKCHAIN DATA]';
          break;
        case 'lab':
          header = '[LABORATORY DATA]';
          break;
        case 'system':
          header = '[SYSTEM INFORMATION]';
          break;
        default:
          header = `[${chunk.sourceType.toUpperCase()}]`;
      }
      
      return `${header}\n${chunk.content}`;
    }).join('\n\n');
    
    return `===USER AND SYSTEM CONTEXT===\n${formattedContext}\n===END OF CONTEXT===\n\n`;
  }

  /**
   * Helper to safely convert string to ObjectId
   */
  private safeObjectId(id: string): mongoose.Types.ObjectId | null {
    try {
      return new mongoose.Types.ObjectId(id);
    } catch (error) {
      return null;
    }
  }

  //===== DOMAIN-SPECIFIC ANALYSIS METHODS =====

  /**
   * Analyze a CRISPR sequence
   */
  async analyzeCRISPRSequence(sequence: string, analysisType: 'off-target' | 'efficiency' | 'full') {
    // Implementation would integrate with CRISPR analysis tools
    const prompt = `Analyze this CRISPR sequence: ${sequence}. 
    Focus on ${analysisType === 'off-target' ? 'potential off-target effects' : 
              analysisType === 'efficiency' ? 'editing efficiency' : 
              'comprehensive analysis including efficiency and off-target effects'}.`;
    
    const systemPrompt = this.systemPrompts.genePrediction;
    
    const result = await this.generateText(prompt, systemPrompt);
    return result.data || 'Unable to complete analysis.';
  }

  /**
   * Generate guide RNAs for a target sequence
   */
  async generateGuideRNAs(targetSequence: string, count: number = 3) {
    const prompt = `Generate ${count} optimal guide RNA sequences for the following target DNA sequence: ${targetSequence}.
    For each guide RNA, provide:
    1. The sequence
    2. The predicted efficiency
    3. Potential off-target sites
    4. Any special considerations`;
    
    const systemPrompt = this.systemPrompts.genePrediction;
    
    const result = await this.generateText(prompt, systemPrompt);
    return result.data || 'Unable to generate guide RNAs.';
  }

  //===== BLOCKCHAIN ANALYSIS METHODS =====

  /**
   * Get guidance on blockchain integration
   */
  async getBlockchainGuidance(userId: string, applicationArea?: string) {
    const prompt = `Provide guidance on blockchain integration for genetic research${applicationArea ? ` in the area of ${applicationArea}` : ''}.
    Include:
    1. Best practices for data storage
    2. Transaction security considerations
    3. Regulatory compliance information
    4. Implementation approaches`;
    
    const systemPrompt = this.systemPrompts.blockchain;
    
    const result = await this.generateText(prompt, systemPrompt, undefined, userId);
    return result.data || 'Unable to provide blockchain guidance.';
  }

  //===== FEEDBACK METHODS =====

  /**
   * Submit user feedback on an assistant response
   */
  async submitFeedback(
    userId: string,
    messageId: string,
    feedbackType: FeedbackType,
    details?: FeedbackDetail
  ): Promise<boolean> {
    try {
      logger.info('Submitting feedback', { userId, messageId, feedbackType });
      
      // Store feedback in database
      // For the simplified version, we'll just log it
      logger.info('Feedback received', {
        userId,
        messageId,
        feedbackType,
        details
      });
      
      // In a real implementation, this would be stored in a database
      return true;
    } catch (error) {
      logger.error('Error submitting feedback', { error });
      return false;
    }
  }

  //===== SESSION MANAGEMENT =====
  
  /**
   * Create a new chat session for a user
   */
  async createSession(userId: string, title?: string): Promise<string> {
    // Generate a new session ID
    const sessionId = new mongoose.Types.ObjectId().toString();
    // Create a new session document in the database
    await ChatSession.create({
      sessionId,
      userId,
      title: title || 'New Chat',
      messages: [],
      contextData: {},
      lastMessageAt: new Date()
    });
    logger.info('Created new session', { userId, sessionId, title });
    return sessionId;
  }
  
  /**
   * Get all chat sessions for a user
   */
  async getUserSessions(
    userId: string
  ): Promise<Array<{ id: string; title: string; lastUpdated: Date; createdAt: Date; updatedAt: Date }>> {
    // Fetch sessions from the database, sorted by last message time
    const sessions = await ChatSession.find({ userId })
      .sort({ lastMessageAt: -1 })
      .select('sessionId title lastMessageAt createdAt updatedAt')
      .lean();
    // Map to a simpler DTO
    return sessions.map(sess => ({
      id: sess.sessionId,
      title: sess.title,
      lastUpdated: sess.lastMessageAt,
      createdAt: sess.createdAt!,
      updatedAt: sess.updatedAt!
    }));
  }
  
  /**
   * Get a full chat session with its message history
   */
  async getSession(
    userId: string,
    sessionId: string
  ): Promise<import('../../models/chat-session.model').IChatSession | null> {
    // Retrieve the session document including messages
    return ChatSession.findOne({ userId, sessionId }).lean();
  }
  
  /**
   * Delete a chat session
   */
  async deleteSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      // Validate inputs
      if (!sessionId || !userId) {
        logger.warn('Invalid session ID or user ID provided to deleteSession', { sessionId, userId });
        return false;
      }
      
      // Find and delete the session
      const result = await ChatSession.findOneAndDelete({ 
        sessionId, 
        userId // Ensure user can only delete their own sessions
      });
      
      if (!result) {
        logger.warn('Session not found or unauthorized deletion attempt', { userId, sessionId });
        return false;
      }
      
      logger.info('Successfully deleted session', { userId, sessionId });
      return true;
    } catch (error) {
      logger.error('Error deleting chat session:', error);
      return false;
    }
  }

  /**
   * Get chat history for a session
   */
  private async getChatHistory(
    sessionId: string, 
    messageCount: number = 5
  ): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    try {
      // Check if sessionId is valid
      if (!sessionId) {
        logger.warn('Invalid session ID provided to getChatHistory');
        return [];
      }
      
      // Find the chat session
      const session = await ChatSession.findOne({ sessionId });
      
      if (!session || !session.messages || session.messages.length === 0) {
        return [];
      }
      
      // Get the most recent messages, limited by messageCount
      // Sort in reverse to get newest first, then reverse again to maintain chronological order
      const recentMessages = session.messages
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, messageCount)
        .reverse();
      
      // Format the messages for the LLM
      return recentMessages.map(msg => ({
        role: msg.role === 'system' ? 'assistant' : msg.role,
        content: msg.content
      }));
    } catch (error) {
      logger.error('Error retrieving chat history:', error);
      return [];
    }
  }

  //===== UTILITY METHODS =====

  /**
   * Assemble prompt with context and history
   */
  private assemblePrompt(
    userQuery: string,
    retrievedContext: string,
    chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): ChatMessage[] {
    // Create the system message with enhanced user context
    const systemMessage: ChatMessage = {
      role: 'system',
      content: `${this.systemPrompts.default}\n\nYou have access to the user's data, including their profile, gene predictions, and blockchain transactions. Use this information to provide personalized assistance. Ensure your responses are accurate, helpful, and contextually relevant.\n\n${retrievedContext}`
    };
    
    // Convert chat history to the format expected by the LLM
    const historyMessages: ChatMessage[] = chatHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add the current user query
    const userMessage: ChatMessage = {
      role: 'user',
      content: userQuery
    };
    
    // Assemble and return the full prompt array
    return [systemMessage, ...historyMessages, userMessage];
  }

  /**
   * Save user message to history
   */
  private async saveUserMessage(
    sessionId: string,
    userId: string,
    content: string,
    contextHint?: any
  ): Promise<string> {
    try {
      // Generate message ID
      const messageId = new mongoose.Types.ObjectId().toString();
      
      // Create message object
      const messageObj = {
        id: messageId,
        role: 'user' as 'user',
        content,
        timestamp: new Date(),
        metadata: contextHint || {}
      };
      
      // Try to find an existing session
      let session = await ChatSession.findOne({ sessionId });
      
      if (session) {
        // Add message to existing session
        session.messages.push(messageObj);
        await session.save();
      } else {
        // Create a new session
        session = await ChatSession.create({
          sessionId,
          userId,
          title: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
          messages: [messageObj],
          contextData: {
            pageType: contextHint?.page,
            relevantId: contextHint?.relevantId,
            additionalContext: contextHint
          }
        });
      }
      
      logger.info('Saved user message', { 
        sessionId, 
        userId, 
        messageId 
      });
      
      return messageId;
    } catch (error) {
      logger.error('Error saving user message:', error);
      return new mongoose.Types.ObjectId().toString(); // Return a dummy ID on error
    }
  }
  
  /**
   * Save assistant message to history
   */
  private async saveAssistantMessage(
    sessionId: string,
    userId: string,
    content: string,
    audioRef?: string,
    modelUsed?: string,
    processingTimeMs?: number
  ): Promise<string> {
    try {
      // Generate message ID
      const messageId = new mongoose.Types.ObjectId().toString();
      
      // Create message object
      const messageObj = {
        id: messageId,
        role: 'assistant' as 'assistant',
        content,
        timestamp: new Date(),
        metadata: {
          audioRef,
          modelUsed,
          processingTimeMs
        }
      };
      
      // Find the session
      const session = await ChatSession.findOne({ sessionId });
      
      if (!session) {
        logger.warn('Attempted to save assistant message to non-existent session', { 
          sessionId, 
          userId 
        });
        return messageId;
      }
      
      // Add message to session
      session.messages.push(messageObj);
      await session.save();
      
      logger.info('Saved assistant message', { 
        sessionId, 
        userId, 
        messageId 
      });
      
      return messageId;
    } catch (error) {
      logger.error('Error saving assistant message:', error);
      return new mongoose.Types.ObjectId().toString(); // Return a dummy ID on error
    }
  }

  /**
   * Transcribe audio to text
   */
  async transcribeAudio(
    audioData: string | Buffer,
    model?: string,
    userId?: string
  ): Promise<{
    data?: string;
    error?: string;
    modelUsed?: string;
    processingTimeMs: number;
    confidence?: number;
  }> {
    // Simplified implementation
    // In a real implementation, this would call a transcription service
    return {
      data: "This is a simulated transcription result.",
      modelUsed: "simulated-transcription-model",
      processingTimeMs: 500,
      confidence: 0.9
    };
  }

  /**
   * Synthesize text to speech
   */
  async synthesizeSpeech(
    text: string,
    voice?: string,
    model?: string,
    userId?: string
  ): Promise<{
    success: boolean;
    audioUrl?: string;
    data?: Buffer;
    error?: string;
    modelUsed?: string;
  }> {
    // Simplified implementation
    // In a real implementation, this would call a text-to-speech service
    return {
      success: true,
      audioUrl: "https://example.com/audio/simulated.mp3",
      modelUsed: "simulated-tts-model"
    };
  }

  /**
   * Check if the service is operational
   */
  async isOperational(): Promise<boolean> {
    return this.isAvailable;
  }

  /**
   * Process a message (compatibility method for old controller code)
   */
  async processMessage(
    userId: string,
    sessionId: string,
    message: string,
    contextHint: ContextHint = {}
  ): Promise<{
    response: string;
    audioRef?: string;
    modelUsed: string;
    processingTimeMs: number;
    error?: string;
  }> {
    // Simply delegate to processUserMessage for backward compatibility
    const result = await this.processUserMessage({
      userId,
      sessionId,
      content: message,
      contentType: 'text',
      contextHint
    });

    return {
      response: result.textContent,
      audioRef: result.audioRef,
      modelUsed: result.modelUsed,
      processingTimeMs: result.processingTimeMs,
      error: result.error
    };
  }

  /**
   * Process a message using the agent approach (compatibility method)
   */
  async processAgentMessage(message: UserMessage): Promise<AssistantResponse> {
    const startTime = Date.now();
    
    try {
      logger.info('Processing agent message', { 
        userId: message.userId,
        sessionId: message.sessionId,
        contentLength: message.content.length
      });
      
      // Get chat history for context
      const chatHistory = await this.getChatHistory(message.sessionId);
      
      // First, retrieve relevant knowledge based on the message and user context
      const relevantKnowledge = await this.retrieveKnowledge(
        message.content,
        message.contextHint || {},
        message.userId
      );
      
      // Format the retrieved knowledge into a coherent context block
      const formattedContext = this.formatRetrievedContext(relevantKnowledge);
      
      // Assemble the prompt with the user query, retrieved context, and chat history
      const prompt = this.assemblePrompt(
        message.content,
        formattedContext,
        chatHistory
      );
      
      // Save the user message to the database
      await this.saveUserMessage(
        message.sessionId,
        message.userId,
        message.content,
        message.contextHint
      );
      
      // Call the LLM to generate a response
      const completion = await this.groq.chat.completions.create({
        messages: prompt,
        model: this.model,
        temperature: 0.7,
        max_tokens: 2048
      });
      
      // Extract the assistant's response
      const assistantResponse = completion.choices[0].message.content || 'I apologize, but I was unable to generate a response.';
      
      // Save the assistant's response to the database
      await this.saveAssistantMessage(
        message.sessionId,
        message.userId,
        assistantResponse,
        undefined, // No audio for now
        this.model,
        Date.now() - startTime
      );
      
      logger.info('Agent response generated successfully', {
        userId: message.userId,
        sessionId: message.sessionId,
        processingTimeMs: Date.now() - startTime
      });
      
      // Return the response
      return {
        sessionId: message.sessionId,
        userId: message.userId,
        textContent: assistantResponse,
        processingTimeMs: Date.now() - startTime,
        modelUsed: this.model
      };
    } catch (error) {
      logger.error('Error processing agent message:', error);
      
      return {
        sessionId: message.sessionId,
        userId: message.userId,
        textContent: 'I apologize, but I encountered an error while processing your request. Please try again.',
        processingTimeMs: Date.now() - startTime,
        modelUsed: this.model,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get feedback statistics for a user (compatibility method)
   */
  async getUserFeedbackStats(userId: string): Promise<any> {
    // Mock implementation for compatibility
    return {
      totalFeedback: 10,
      positiveCount: 8,
      negativeCount: 2,
      lastFeedbackDate: new Date(),
      commonTopics: ['accuracy', 'helpfulness', 'speed']
    };
  }
}

// Export the Synapse Core service instance
export const synapseCore = new SynapseCore(); 