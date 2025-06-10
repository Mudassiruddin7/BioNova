import { Transaction, TransactionDocument, TransactionType, TransactionStatus } from '../models/transaction.model';
import mongoose from 'mongoose';
import logger from '../utils/logger';
import {synapseCore}  from './synapse/synapseCore.service';
import ApiError from '../utils/ApiError';

export interface CreateTransactionDTO {
  userId: mongoose.Types.ObjectId;
  hash: string;
  description: string;
  type: TransactionType;
  timestamp: Date;
  status: TransactionStatus;
  walletAddress: string;
  blockNumber?: number;
  gasUsed?: number;
  metadata?: Record<string, any>;
  entityId?: string;
  contractAddress?: string;
}

export interface TransactionQuery {
  userId?: mongoose.Types.ObjectId;
  type?: TransactionType | TransactionType[];
  status?: TransactionStatus | TransactionStatus[];
  walletAddress?: string;
  fromDate?: Date;
  toDate?: Date;
  entityId?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// -------------- TRANSACTION SERVICE --------------

class TransactionService {
  /**
   * Create a new blockchain transaction record
   */
  async createTransaction(transactionData: CreateTransactionDTO): Promise<TransactionDocument> {
    try {
      // Instead of creating a new transaction, use findOneAndUpdate with upsert
      // This will update existing transactions with the same hash or create a new one if not found
      const transaction = await Transaction.findOneAndUpdate(
        { hash: transactionData.hash },
        { ...transactionData },
        { 
          new: true, // Return the updated document
          upsert: true, // Create if it doesn't exist
          setDefaultsOnInsert: true // Apply schema defaults for new documents
        }
      );
      
      // Log successful transaction creation/update
      logger.info(`Transaction ${transaction.hash} upserted successfully`);
      
      return transaction;
    } catch (error) {
      logger.error('Error in transaction service - createTransaction:', error);
      throw error;
    }
  }

  /**
   * Update a transaction's status
   */
  async updateTransactionStatus(hash: string, status: TransactionStatus, blockData?: { 
    blockNumber: number;
    gasUsed: number;
  }): Promise<TransactionDocument | null> {
    const updateData: Partial<TransactionDocument> = { status };
    
    if (blockData) {
      updateData.blockNumber = blockData.blockNumber;
      updateData.gasUsed = blockData.gasUsed;
    }
    
    return await Transaction.findOneAndUpdate(
      { hash },
      { $set: updateData },
      { new: true }
    );
  }

  /**
   * Get transaction by hash
   * @param {string} transactionHash - The hash of the transaction to retrieve
   * @param {string} [userId] - User ID for access control (optional)
   * @returns {Promise<any>} Promise resolving to transaction data or null if not found
   */
  async getTransactionByHash(transactionHash: string, userId?: string): Promise<any> {
    try {
      // Validate input
      if (!transactionHash) {
        logger.warn('Transaction hash not provided for retrieval');
        throw new ApiError(400, 'Transaction hash is required');
      }

      // Query the database for the transaction
      const Transaction = mongoose.model('Transaction');
      const transaction = await Transaction.findOne({ hash: transactionHash });

      // If no transaction found, return null
      if (!transaction) {
        logger.info(`No transaction found with hash: ${transactionHash}`);
        return null;
      }

      // Access control - if userId is provided and doesn't match transaction owner
      if (userId && transaction.userId && transaction.userId.toString() !== userId.toString()) {
        logger.info(`User ${userId} attempted to access transaction ${transactionHash} owned by ${transaction.userId}`);
        
        // Return limited data for transactions not owned by the user
        return {
          hash: transaction.hash,
          type: transaction.type,
          status: transaction.status,
          timestamp: transaction.timestamp,
          restricted: true
        };
      }

      // Return the full transaction data
      return transaction;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error; // Re-throw API errors
      }
      logger.error('Error retrieving transaction by hash:', error);
      throw new ApiError(500, 'Failed to retrieve transaction data');
    }
  }

  /**
   * Get all transactions for a user with filtering and pagination
   */
  async getUserTransactions(query: TransactionQuery): Promise<{
    transactions: TransactionDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      userId,
      type,
      status,
      walletAddress,
      fromDate,
      toDate,
      entityId,
      page = 1,
      limit = 10,
      sort = 'timestamp',
      order = 'desc'
    } = query;

    // Build filter query
    const filter: any = {};
    
    if (userId) {
      filter.userId = userId;
    }
    
    if (type) {
      filter.type = Array.isArray(type) ? { $in: type } : type;
    }
    
    if (status) {
      filter.status = Array.isArray(status) ? { $in: status } : status;
    }
    
    if (walletAddress) {
      filter.walletAddress = walletAddress;
    }
    
    if (entityId) {
      filter.entityId = entityId;
    }
    
    // Handle date range
    if (fromDate || toDate) {
      filter.timestamp = {};
      if (fromDate) {
        filter.timestamp.$gte = fromDate;
      }
      if (toDate) {
        filter.timestamp.$lte = toDate;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortDirection = order === 'asc' ? 1 : -1;
    const sortOptions: any = {};
    sortOptions[sort] = sortDirection;

    // Execute query
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      Transaction.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      transactions,
      total,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Delete a transaction by hash
   */
  async deleteTransaction(hash: string): Promise<boolean> {
    const result = await Transaction.deleteOne({ hash });
    return result.deletedCount === 1;
  }

  /**
   * Get transaction counts by type
   */
  async getTransactionCountsByType(userId: mongoose.Types.ObjectId): Promise<Record<TransactionType, number>> {
    const counts = await Transaction.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    // Initialize counts object with zeros
    const result: Record<TransactionType, number> = {
      sample: 0,
      experiment: 0,
      access: 0,
      workflow: 0,
      ip: 0,
      other: 0
    };
    
    // Fill in actual counts
    counts.forEach((item) => {
      const type = item._id as TransactionType;
      result[type] = item.count;
    });
    
    return result;
  }
}

// -------------- BLOCKCHAIN ANALYZER SERVICE --------------

/**
 * BlockchainAnalyzer Service
 * Provides AI-powered transaction narration and natural language querying
 * for blockchain data within the ChainSight module
 */
class BlockchainAnalyzerService {
  /**
   * Generate a narration for a blockchain transaction
   */
  async narrateTransaction(
    userId: string,
    transactionDetails: any,
    transactionHash?: string
  ): Promise<{
    narration: string;
    modelUsed: string;
    processingTimeMs: number;
    analysisId?: string;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting blockchain transaction narration', {
        userId,
        transactionHash: transactionHash || 'unknown'
      });
      
      // Check if we already have a narration for this transaction
      const existingNarration = await this.getExistingNarration(transactionHash);
      if (existingNarration) {
        logger.info('Using existing narration', {
          userId,
          transactionHash
        });
        
        return {
          narration: existingNarration.narration,
          modelUsed: existingNarration.modelUsed,
          processingTimeMs: 0, // Already cached
          analysisId: existingNarration.analysisId
        };
      }
      
      // Construct the narration prompt
      const systemPrompt = `You are Synapse, an AI assistant specialized in explaining blockchain transactions in the BioNova platform. 
      Your role is to translate technical blockchain transaction details into clear, concise explanations 
      that researchers can easily understand. Focus on who did what, what data was involved, and when it happened.`;
      
      const userPrompt = `Explain this blockchain transaction in simple terms:
      
      Transaction Details: ${JSON.stringify(transactionDetails, null, 2)}
      
      Focus on the sender, the action performed (e.g., 'registered gene data', 'updated analysis'), 
      the key data reference involved, and when it occurred. Be specific but concise (2-3 sentences).`;
      
      // Call Groq LLM for narration
      const narrationResult = await synapseCore.generateText(
        userPrompt,
        systemPrompt,
        undefined, // use default model
        userId
      );
      
      if (!narrationResult.data) {
        throw new Error('Failed to generate narration: ' + narrationResult.error);
      }
      
      // Save narration to database
      const analysisId = await this.saveBlockchainAnalysis(
        userId,
        'narration',
        narrationResult.data,
        transactionHash,
        transactionDetails,
        narrationResult.modelUsed,
        Date.now() - startTime
      );
      
      return {
        narration: narrationResult.data,
        modelUsed: narrationResult.modelUsed || '',
        processingTimeMs: Date.now() - startTime,
        analysisId
      };
    } catch (error: any) {
      logger.error('Error in blockchain transaction narration', {
        userId,
        transactionHash,
        error: error.message
      });
      
      return {
        narration: "Error generating transaction narration.",
        modelUsed: '',
        processingTimeMs: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Execute a natural language query against blockchain data
   */
  async executeNaturalLanguageQuery(
    userId: string,
    nlQuery: string
  ): Promise<{
    answer: string;
    results?: any[];
    modelUsed: string;
    processingTimeMs: number;
    analysisId?: string;
    error?: string;
  }> {
    const startTime = Date.now();
    let paramExtractionModel = '';
    
    try {
      logger.info('Processing natural language blockchain query', {
        userId,
        queryLength: nlQuery.length
      });
      
      // Step 1: Extract structured parameters from the natural language query
      const extractionResult = await this.extractQueryParameters(nlQuery, userId);
      
      if (!extractionResult.data) {
        throw new Error('Failed to extract query parameters: ' + extractionResult.error);
      }
      
      paramExtractionModel = extractionResult.modelUsed || '';
      
      // Parse the extracted parameters
      let extractedParams;
      try {
        // Find the JSON object in the response
        const jsonMatch = extractionResult.data.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON found in parameter extraction response');
        }
        
        extractedParams = JSON.parse(jsonMatch[0]);
        logger.info('Extracted query parameters', {
          userId,
          params: extractedParams
        });
      } catch (parseError: any) {
        throw new Error('Failed to parse extracted parameters: ' + parseError.message);
      }
      
      // Step 2: Execute structured query against blockchain data
      const results = await this.executeStructuredQuery(extractedParams, userId);
      
      // Step 3: Generate natural language answer based on results
      const summarizationResult = await this.summarizeQueryResults(
        nlQuery,
        results,
        extractedParams,
        userId
      );
      
      if (!summarizationResult.data) {
        throw new Error('Failed to generate answer: ' + summarizationResult.error);
      }
      
      const modelUsed = `${paramExtractionModel},${summarizationResult.modelUsed || ''}`;
      
      // Save the query and answer to database
      const analysisId = await this.saveBlockchainAnalysis(
        userId,
        'query_summary',
        summarizationResult.data,
        undefined,
        {
          nlQuery,
          extractedParams,
          resultCount: results.length
        },
        modelUsed,
        Date.now() - startTime
      );
      
      return {
        answer: summarizationResult.data,
        results: results.slice(0, 5), // Return limited results for context
        modelUsed,
        processingTimeMs: Date.now() - startTime,
        analysisId
      };
    } catch (error: any) {
      logger.error('Error in natural language blockchain query', {
        userId,
        nlQuery,
        error: error.message
      });
      
      return {
        answer: "I couldn't process your blockchain query. Please try rephrasing or provide more specific details.",
        modelUsed: paramExtractionModel,
        processingTimeMs: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Extract structured parameters from a natural language query
   */
  private async extractQueryParameters(query: string, userId: string) {
    // Construct the system prompt for parameter extraction
    const systemPrompt = `You are an AI assistant that converts natural language queries about blockchain 
    data into structured JSON parameters for database lookup. Extract key filters like:
    - senderAddress: Wallet address or user name of the transaction sender
    - dateRange: Time period to search within (as specific dates or relative terms like "last week")
    - transactionType: Type of transaction (e.g., "gene registration", "analysis", "experiment")
    - geneId: Specific gene identifier mentioned
    
    Output ONLY a valid JSON object with the extracted parameters, nothing else.`;
    
    // Include few-shot examples in the user prompt for better extraction
    const userPrompt = `Extract query parameters as JSON from: "${query}"

Example 1:
Query: "Show gene registrations by 0x123abc last week"
Output: {"senderAddress": "0x123abc", "transactionType": "gene registration", "dateRange": {"relative": "last week"}}

Example 2:
Query: "Any blockchain activity related to GeneID-789 between January and March"
Output: {"geneId": "GeneID-789", "dateRange": {"start": "January", "end": "March"}}

Now process my query and output ONLY the JSON:`;
    
    // Call Groq LLM
    return await synapseCore.generateText(
      userPrompt,
      systemPrompt,
      undefined, // use default model
      userId
    );
  }

  /**
   * Execute a structured query against blockchain data
   */
  private async executeStructuredQuery(
    params: any,
    userId: string
  ): Promise<any[]> {
    try {
      // In a real implementation, you would:
      // 1. Translate the extracted parameters to a MongoDB query
      // 2. Execute it against your Transaction collection
      
      // For the hackathon, simulate database query and results
      const TransactionModel = mongoose.model('Transaction');
      
      const query: any = {};
      
      // Build query based on extracted parameters
      if (params.senderAddress) {
        query.walletAddress = params.senderAddress;
      }
      
      if (params.transactionType) {
        // Map natural language type to your schema's type values
        const typeMap: {[key: string]: string} = {
          'gene registration': 'sample',
          'gene analysis': 'experiment',
          'experiment': 'experiment',
          'access': 'access',
          'workflow': 'workflow',
          'ip': 'ip'
        };
        
        // Try exact match first, then fuzzy mapping
        query.type = typeMap[params.transactionType.toLowerCase()] || params.transactionType;
      }
      
      if (params.geneId) {
        // Assuming geneId might be stored in metadata or entityId
        query.$or = [
          { entityId: params.geneId },
          { 'metadata.geneId': params.geneId }
        ];
      }
      
      if (params.dateRange) {
        query.timestamp = {};
        
        // Handle specific date range
        if (params.dateRange.start) {
          const startDate = this.parseDate(params.dateRange.start);
          if (startDate) {
            query.timestamp.$gte = startDate.getTime();
          }
        }
        
        if (params.dateRange.end) {
          const endDate = this.parseDate(params.dateRange.end);
          if (endDate) {
            query.timestamp.$lte = endDate.getTime();
          }
        }
        
        // Handle relative date range like "last week"
        if (params.dateRange.relative) {
          const { startDate, endDate } = this.parseRelativeDate(params.dateRange.relative);
          query.timestamp.$gte = startDate.getTime();
          query.timestamp.$lte = endDate.getTime();
        }
      }
      
      // Execute query
      const results = await TransactionModel.find(query)
        .sort({ timestamp: -1 })
        .limit(10)
        .lean();
      
      return results;
    } catch (error: any) {
      logger.error('Error executing structured blockchain query', {
        userId,
        params,
        error: error.message
      });
      
      // Return empty results on error
      return [];
    }
  }

  /**
   * Summarize query results in natural language
   */
  private async summarizeQueryResults(
    originalQuery: string,
    results: any[],
    extractedParams: any,
    userId: string
  ) {
    // Create a concise summary of the results to avoid overwhelming the LLM
    const resultsSummary = results.length > 0
      ? `Found ${results.length} matching transaction(s). ${this.createResultsSummary(results)}`
      : 'No matching transactions were found for this query.';
    
    // Construct system prompt
    const systemPrompt = `You are Synapse, providing clear, helpful answers about blockchain data in the BioNova platform.
    Your task is to explain query results in plain language, focusing only on the provided data.`;
    
    // Construct user prompt
    const userPrompt = `The user asked: "${originalQuery}"

The following results were found based on the structured parameters ${JSON.stringify(extractedParams)}:

${resultsSummary}

Generate a natural language answer that directly responds to the user's question using only the information provided. 
Be conversational but concise (2-4 sentences). If no results were found, clearly state that and suggest possible reasons.`;
    
    // Call Groq LLM
    return await synapseCore.generateText(
      userPrompt,
      systemPrompt,
      undefined, // use default model
      userId
    );
  }

  /**
   * Create a concise summary of transaction results
   */
  private createResultsSummary(results: any[]): string {
    // Limit to first 5 for summary
    const limitedResults = results.slice(0, 5);
    
    // Create a summary line for each transaction
    const summaryLines = limitedResults.map(tx => {
      const date = new Date(tx.timestamp).toLocaleDateString();
      return `Transaction ${tx.hash.substring(0, 10)}...: ${tx.type} by ${tx.walletAddress.substring(0, 8)}... on ${date}${tx.description ? ` (${tx.description.substring(0, 30)}...)` : ''}`;
    });
    
    let summary = summaryLines.join('. ');
    
    // Add indication of more results if truncated
    if (results.length > 5) {
      summary += ` Plus ${results.length - 5} more transactions.`;
    }
    
    return summary;
  }

  /**
   * Parse a date string into a Date object
   */
  private parseDate(dateStr: string): Date | null {
    try {
      // Handle various date formats
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        // Try more flexible parsing for formats like "January 2023"
        const months = ['january', 'february', 'march', 'april', 'may', 'june', 
                       'july', 'august', 'september', 'october', 'november', 'december'];
        
        const lowercaseDate = dateStr.toLowerCase();
        for (let i = 0; i < months.length; i++) {
          if (lowercaseDate.includes(months[i])) {
            // Extract year if present, otherwise use current year
            const yearMatch = lowercaseDate.match(/\d{4}/);
            const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
            return new Date(year, i, 1);
          }
        }
        return null;
      }
      return date;
    } catch (e) {
      return null;
    }
  }

  /**
   * Parse relative date references like "last week" into date range
   */
  private parseRelativeDate(relativeStr: string): { startDate: Date, endDate: Date } {
    const now = new Date();
    const endDate = new Date(now);
    let startDate = new Date(now);
    
    const lowercaseRel = relativeStr.toLowerCase();
    
    if (lowercaseRel.includes('hour')) {
      const hours = this.extractNumber(lowercaseRel) || 1;
      startDate.setHours(now.getHours() - hours);
    } else if (lowercaseRel.includes('day')) {
      const days = this.extractNumber(lowercaseRel) || 1;
      startDate.setDate(now.getDate() - days);
    } else if (lowercaseRel.includes('week')) {
      const weeks = this.extractNumber(lowercaseRel) || 1;
      startDate.setDate(now.getDate() - (weeks * 7));
    } else if (lowercaseRel.includes('month')) {
      const months = this.extractNumber(lowercaseRel) || 1;
      startDate.setMonth(now.getMonth() - months);
    } else if (lowercaseRel.includes('year')) {
      const years = this.extractNumber(lowercaseRel) || 1;
      startDate.setFullYear(now.getFullYear() - years);
    } else {
      // Default to last 24 hours if unrecognized
      startDate.setDate(now.getDate() - 1);
    }
    
    return { startDate, endDate };
  }

  /**
   * Extract a number from a string like "last 3 weeks"
   */
  private extractNumber(text: string): number | null {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }

  /**
   * Check if we already have a narration for this transaction
   */
  private async getExistingNarration(transactionHash?: string): Promise<{
    narration: string;
    modelUsed: string;
    analysisId: string;
  } | null> {
    if (!transactionHash) return null;
    
    try {
      // In a real implementation, query your BlockchainAnalysis collection
      // For hackathon, simulate cache miss
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Save blockchain analysis to database
   */
  private async saveBlockchainAnalysis(
    userId: string,
    analysisType: 'narration' | 'query_summary' | 'anomaly',
    output: string,
    transactionHash?: string,
    inputData?: any,
    modelUsed?: string,
    processingTimeMs?: number
  ): Promise<string> {
    try {
      // For hackathon, simplified simulation
      // In production, save to a BlockchainAnalysis collection
      const analysisId = 'analysis_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      
      logger.info('Saved blockchain analysis', { 
        userId, 
        analysisId,
        analysisType,
        transactionHash,
        processingTimeMs
      });
      
      return analysisId;
    } catch (error: any) {
      logger.error('Error saving blockchain analysis', { 
        userId,
        analysisType,
        transactionHash,
        error: error.message 
      });
      return 'error_saving_analysis';
    }
  }

  /**
   * Detect anomalies in blockchain data (future feature)
   */
  async detectAnomalies(
    transactionData: any,
    userId: string
  ): Promise<{
    isAnomaly: boolean;
    description?: string;
    confidence?: number;
    modelUsed?: string;
    analysisId?: string;
    error?: string;
  }> {
    // For hackathon, return placeholder
    return {
      isAnomaly: false,
      description: "Anomaly detection is not implemented in this version.",
      confidence: 0
    };
  }
}

// Create instances
const transactionService = new TransactionService();
const blockchainAnalyzer = new BlockchainAnalyzerService();

// Export services
export default transactionService;
export { blockchainAnalyzer }; 