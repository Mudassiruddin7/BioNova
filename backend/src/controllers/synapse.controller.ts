import { Request, Response } from 'express';
import { synapseService, synapseAgent, synapseFeedback, FeedbackType } from '../services/synapse';
import logger from '../utils/logger';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import mongoose from 'mongoose';

// Extended request with typed user property
interface AuthenticatedRequest extends Request {
  user: {
    _id: mongoose.Types.ObjectId;
    email?: string;
    walletAddress?: string;
    role?: string;
  };
}

/**
 * Helper function to get user ID consistently across the controller
 */
const getUserId = (req: Request): string => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }
  
  // If ID exists as _id, convert to string
  if ((req.user as any)._id) {
    return (req.user as any)._id.toString();
  }
  
  // If ID exists as id, use that
  if ((req.user as any).id) {
    return (req.user as any).id;
  }
  
  // No valid ID found
  throw new ApiError(401, 'User ID not found in authentication data');
};

/**
 * Synapse AI Assistant Controller
 * Handles Synapse chat API endpoints
 */
export const synapseController = {
  /**
   * Process a message from the user and generate a response
   */
  processMessage: asyncHandler(async (req: Request, res: Response) => {
      const { message, contextHint, sessionId } = req.body;
      
    // Get user ID consistently
    const userId = getUserId(req);
    
    // Validate required fields
    if (!message || typeof message !== 'string') {
      throw new ApiError(400, 'Message is required and must be a string');
    }
    
    if (!sessionId) {
      throw new ApiError(400, 'Session ID is required');
      }
      
      // Process message and get response
      const result = await synapseService.processMessage(
        userId,
        sessionId,
        message,
      contextHint || {}
    );
    
    // Check for errors in the result
    if (result.error) {
      throw new ApiError(500, `Error processing message: ${result.error}`);
    }
    
    // Return successful response
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          response: result.response,
          processingTimeMs: result.processingTimeMs,
          modelUsed: result.modelUsed
        },
        'Message processed successfully'
      )
    );
  }),

  /**
   * Process a message using the agentic approach
   * This endpoint uses the new SynapseAgent service for intelligent retrieval
   */
  processAgentMessage: asyncHandler(async (req: Request, res: Response) => {
      const { message, contextHint, sessionId } = req.body;
      
    // Get user ID consistently
    const userId = getUserId(req);
    
    // Validate required fields
    if (!message || typeof message !== 'string') {
      throw new ApiError(400, 'Message is required and must be a string');
    }
    
    if (!sessionId) {
      throw new ApiError(400, 'Session ID is required');
      }
      
      // Process with the agentic service
      const result = await synapseAgent.processAgentMessage({
        userId,
        sessionId,
        content: message,
        contentType: 'text',
      contextHint: contextHint || {}
    });
    
    // Return successful response
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          response: result.textContent,
          processingTimeMs: result.processingTimeMs,
          modelUsed: result.modelUsed,
          sources: result.sources
        },
        'Agent message processed successfully'
      )
    );
  }),
  
  /**
   * Create a new chat session
   */
  createSession: asyncHandler(async (req: Request, res: Response) => {
      const { title } = req.body;
      
    // Get user ID consistently
    const userId = getUserId(req);
    
    try {
      // Validate title if provided
      if (title && (typeof title !== 'string' || title.length > 100)) {
        throw new ApiError(400, 'Title must be a string with maximum length of 100 characters');
      }
      
      // Create new session
      const sessionId = await synapseService.createSession(userId, title || 'New Chat');
      
      if (!sessionId) {
        throw new ApiError(500, 'Failed to create chat session');
      }
      
      // Return successful response
      return res.status(201).json(
        new ApiResponse(
          201,
          {
          sessionId,
          title: title || 'New Chat'
          },
          'Session created successfully'
        )
      );
    } catch (error) {
      // Enhanced error logging
      logger.error('Error creating chat session:', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Rethrow the error to be handled by the error middleware
      throw error;
    }
  }),
  
  /**
   * Get all chat sessions for the current user
   */
  getUserSessions: asyncHandler(async (req: Request, res: Response) => {
    // Get user ID consistently
    const userId = getUserId(req);
      
      // Get sessions
      const sessions = await synapseService.getUserSessions(userId);
      
    // Return successful response
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          sessions
        },
        'Sessions retrieved successfully'
      )
    );
  }),
  
  /**
   * Get chat history for a specific session
   */
  getSessionHistory: asyncHandler(async (req: Request, res: Response) => {
      const { sessionId } = req.params;
      
    // Get user ID consistently
    const userId = getUserId(req);

    // Validate session ID
      if (!sessionId) {
      throw new ApiError(400, 'Session ID is required');
      }
      
    // Retrieve the full session including messages
    const session = await synapseService.getSession(userId, sessionId);
      if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    // Return successful response with full session data
    return res.status(200).json(
      new ApiResponse(
        200,
        { session },
        'Session history retrieved successfully'
      )
    );
  }),
  
  /**
   * Delete a chat session
   */
  deleteSession: asyncHandler(async (req: Request, res: Response) => {
      const { sessionId } = req.params;
      
    // Get user ID consistently
    const userId = getUserId(req);
    
    // Validate session ID
      if (!sessionId) {
      throw new ApiError(400, 'Session ID is required');
    }
    
    // Delete the session using synapseService
    const result = await synapseService.deleteSession(sessionId, userId);
    
    if (!result) {
      throw new ApiError(404, 'Session not found or you do not have permission to delete it');
    }
    
    // Return successful response
    return res.status(200).json(
      new ApiResponse(
        200,
        {
        success: true,
          message: 'Session deleted successfully'
        },
        'Session deleted'
      )
    );
  }),
  
  /**
   * Submit feedback for a Synapse response
   */
  submitFeedback: asyncHandler(async (req: Request, res: Response) => {
    const { messageId, feedbackType, comment } = req.body;
    
    // Get user ID consistently
    const userId = getUserId(req);
    
    // Validate required fields
    if (!messageId || !feedbackType) {
      throw new ApiError(400, 'Message ID and feedback type are required');
    }
    
    // Validate feedback type
    if (![FeedbackType.THUMBS_UP, FeedbackType.THUMBS_DOWN, FeedbackType.SPECIFIC].includes(feedbackType)) {
      throw new ApiError(400, 'Invalid feedback type. Must be one of: thumbs_up, thumbs_down, specific');
    }
    
    // Prepare feedback details if needed
    const details = comment ? {
      messageId,
      reason: comment,
      details: comment,
      category: 'general'
    } : undefined;
    
    // Submit feedback
    const result = await synapseFeedback.submitFeedback(
      userId,
      messageId,
      feedbackType as FeedbackType,
      details
    );
    
    // Return successful response
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          success: result
        },
        'Feedback submitted successfully'
      )
    );
  }),
  
  /**
   * Get feedback statistics for the current user
   */
  getUserFeedbackStats: asyncHandler(async (req: Request, res: Response) => {
    // Get user ID consistently
    const userId = getUserId(req);
    
    // Get feedback stats
    const stats = await synapseFeedback.getUserFeedbackStats(userId);
    
    // Return successful response
    return res.status(200).json(
      new ApiResponse(
        200,
        stats,
        'Feedback statistics retrieved successfully'
      )
    );
  }),

  /**
   * Chat completion with AI
   */
  handleChatCompletion: asyncHandler(async (req: Request, res: Response) => {
    const { messages, stream = false } = req.body;
  
    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new ApiError(400, 'Valid messages array is required');
    }
    
    // Get user ID if authenticated, or use 'anonymous'
    let userId = 'anonymous';
    try {
      if (req.user) {
        userId = getUserId(req);
      }
    } catch (error) {
      // If getting user ID fails, continue with anonymous
      logger.info('User not authenticated for chat completion, using anonymous mode');
    }
  
    // Get chat completion
    const completion = await synapseService.generateChatCompletion(
      messages,
      undefined, // Use default model
      userId
    );
  
    if (!completion.data) {
      throw new ApiError(500, 'Failed to get response from AI: ' + (completion.error || 'Unknown error'));
    }
  
    // Return response
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          message: completion.data,
          modelUsed: completion.modelUsed,
          processingTimeMs: completion.processingTimeMs,
        },
        'Chat completion successful'
      )
    );
  }),
  
  /**
   * Process user message through Synapse
   */
  processUserMessage: asyncHandler(async (req: Request, res: Response) => {
    const { message, sessionId, contextHint } = req.body;
  
    // Validate required fields
    if (!message) {
      throw new ApiError(400, 'Message is required');
    }
  
    if (!sessionId) {
      throw new ApiError(400, 'Session ID is required');
    }
  
    // Get user ID consistently
    const userId = getUserId(req);
  
    // Process message
    const response = await synapseService.processMessage(
      userId,
      sessionId,
      message,
      contextHint || {}
    );
  
    if (response.error) {
      throw new ApiError(500, 'Error processing message: ' + response.error);
    }
  
    // Return response
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          response: response.response,
          audioRef: response.audioRef,
          modelUsed: response.modelUsed,
          processingTimeMs: response.processingTimeMs
        },
        'Message processed successfully'
      )
    );
  }),
  
  /**
   * Get blockchain guidance based on user data type preference
   */
  getBlockchainGuidance: asyncHandler(async (req: Request, res: Response) => {
    // Get user ID consistently
    const userId = getUserId(req);
    
    // Get authenticated request with proper typing
    const authReq = req as AuthenticatedRequest;
  
    // Check if wallet address exists on the user object
    if (!authReq.user.walletAddress) {
      throw new ApiError(400, 'Wallet address not found for user. Cannot get blockchain guidance.');
    }
  
    const { dataType } = req.query;
  
    // Validate data type
    if (!dataType || (dataType !== 'prediction' && dataType !== 'monitoring')) {
      throw new ApiError(400, 'Valid data type is required (prediction or monitoring)');
    }
  
    // Generate prompt for blockchain guidance
    const prompt = `
      Generate guidance for using blockchain features in the BioNova platform.
      User wallet address: ${authReq.user.walletAddress}
      Data type: ${dataType}
      
      Provide specific recommendations for how the user can leverage blockchain for their ${dataType} data,
      including security best practices, transaction optimization, and data management strategies.
    `;
  
    // Get guidance from AI
    const guidance = await synapseService.generateText(
      prompt,
      'You are a blockchain expert providing guidance on the BioNova platform. Your advice should be specific, practical, and security-focused.',
      undefined,
      userId
    );
  
    if (!guidance.data) {
      throw new ApiError(500, 'Failed to get guidance: ' + (guidance.error || 'Unknown error'));
    }
  
    // Return response
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          guidance: guidance.data,
          modelUsed: guidance.modelUsed,
          processingTimeMs: guidance.processingTimeMs
        },
        'Blockchain guidance fetched successfully'
      )
    );
  }),
  
  /**
   * Handle onboarding chat
   */
  handleOnboardingChat: asyncHandler(async (req: Request, res: Response) => {
    const { message, history } = req.body;
  
    // Validate message
    if (!message) {
      throw new ApiError(400, 'Message is required');
    }
  
    // Define message types for proper typing
    type MessageRole = 'system' | 'user' | 'assistant';
    
    interface ChatMessage {
      role: MessageRole;
      content: string;
    }
  
    // Prepare messages array
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are BioNova AI Assistant, an onboarding guide for the BioNova AI Studio platform. Your goal is to understand the user\'s background and preferences to personalize their experience. Ask about their role (student, researcher), experience level with CRISPR, and specific interests. Keep your responses friendly, concise, and helpful. Don\'t overwhelm with too much information at once.',
      },
    ];
  
    // Add history messages if provided
    if (history && Array.isArray(history)) {
      messages.push(...history);
    }
  
    // Add current user message
    messages.push({
      role: 'user',
      content: message,
    });
    
    // Get user ID if authenticated, or use 'anonymous'
    let userId = 'anonymous';
    try {
      if (req.user) {
        userId = getUserId(req);
      }
    } catch (error) {
      // If getting user ID fails, continue with anonymous
      logger.info('User not authenticated for onboarding chat, using anonymous mode');
    }
  
    // Get chat completion
    const completion = await synapseService.generateChatCompletion(
      messages,
      undefined,
      userId
    );
  
    if (!completion.data) {
      throw new ApiError(500, 'Failed to get response from AI: ' + (completion.error || 'Unknown error'));
    }
  
    // Extract user profile information from conversation (simplified example)
    let role = 'student';
    let experienceLevel = 'beginner';
    const interests: string[] = [];
  
    // Very basic extraction logic (in a real system, this would be more sophisticated)
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('researcher') || lowerMessage.includes('scientist')) {
      role = 'researcher';
    }
    if (lowerMessage.includes('advanced') || lowerMessage.includes('expert')) {
      experienceLevel = 'advanced';
    } else if (lowerMessage.includes('intermediate')) {
      experienceLevel = 'intermediate';
    }
  
    // Check for mentioned interests
    const interestKeywords = ['gene editing', 'crispr', 'biology', 'science', 'dna', 'research'];
    interestKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        interests.push(keyword);
      }
    });
  
    // Return response
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          message: completion.data,
          profileData: {
            role,
            experienceLevel,
            interests,
          },
          modelUsed: completion.modelUsed,
          processingTimeMs: completion.processingTimeMs
        },
        'Onboarding chat response successful'
      )
    );
  }),
  
  /**
   * Analyze a lab image
   */
  analyzeLabImage: asyncHandler(async (req: Request, res: Response) => {
    const { imageUrl, query } = req.body;
  
    // Validate inputs
    if (!imageUrl) {
      throw new ApiError(400, 'Image URL is required');
    }
  
    if (!query) {
      throw new ApiError(400, 'Analysis query is required');
    }
    
    // TODO: Replace this simulation with actual image analysis service integration
    
    // Simulated image analysis based on the query
    let analysisText = '';
    if (query.toLowerCase().includes('lab') || query.toLowerCase().includes('equipment')) {
      analysisText = 'The image shows laboratory equipment in what appears to be a research setting. Multiple instruments are visible, including what looks like a PCR machine and several microscopes. The lab appears to be well-organized and following proper safety protocols.';
    } else if (query.toLowerCase().includes('gene') || query.toLowerCase().includes('sequence')) {
      analysisText = 'The image shows a gene sequence visualization, likely from a DNA sequencing analysis. The sequence appears to have several notable regions with high conservation scores. There are approximately 3-4 regions that show significant variation from the reference genome.';
    } else if (query.toLowerCase().includes('sensor')) {
      analysisText = 'The image shows sensor data visualized on a monitoring dashboard. Multiple sensor readings are displayed, with temperature showing an upward trend over the past hour. The humidity levels appear stable, while CO2 readings show minor fluctuations within an acceptable range.';
    } else {
      analysisText = 'The image has been analyzed. Without specific instructions on what to look for, I can provide a general description. The image appears to contain visual data relevant to a laboratory or research setting.';
    }
  
    // Return response
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          analysis: analysisText,
          imageUrl,
          modelUsed: 'simulated-vision-model'
        },
        'Image analyzed successfully'
      )
    );
  }),
  
  /**
   * Transcribe lab audio
   */
  transcribeLabAudio: asyncHandler(async (req: Request, res: Response) => {
    const { audioData } = req.body;
  
    // Validate input
    if (!audioData) {
      throw new ApiError(400, 'Audio data is required');
    }
    
    // Get user ID if authenticated, or use 'anonymous'
    let userId = 'anonymous';
    try {
      if (req.user) {
        userId = getUserId(req);
      }
    } catch (error) {
      // If getting user ID fails, continue with anonymous
      logger.info('User not authenticated for audio transcription, using anonymous mode');
    }
    
    // TODO: Check if the transcribeAudio method is implemented in synapseService
    
    // Call transcription service
    const transcription = await synapseService.transcribeAudio(
      audioData,
      undefined,
      userId
    );
  
    if (!transcription || !transcription.data) {
      throw new ApiError(500, 'Failed to transcribe audio: ' + 
        (transcription && transcription.error ? transcription.error : 'Transcription service unavailable'));
    }
  
    // Return response
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          transcription: transcription.data,
          confidence: transcription.confidence,
          modelUsed: transcription.modelUsed,
          processingTimeMs: transcription.processingTimeMs
        },
        'Audio transcribed successfully'
      )
    );
  }),
  
  /**
   * Interpret lab command
   */
  interpretLabCommand: asyncHandler(async (req: Request, res: Response) => {
    const { command } = req.body;
  
    // Validate input
    if (!command) {
      throw new ApiError(400, 'Command is required');
    }
    
    // Get user ID if authenticated, or use 'anonymous'
    let userId = 'anonymous';
    try {
      if (req.user) {
        userId = getUserId(req);
      }
    } catch (error) {
      // If getting user ID fails, continue with anonymous
      logger.info('User not authenticated for lab command interpretation, using anonymous mode');
    }
  
    // Process command with AI
    const prompt = `
      Interpret the following laboratory voice command and extract the intent and entities:
      
      Command: "${command}"
      
      Return a JSON object with:
      1. intent: The primary action being requested (e.g., "adjust_temperature", "record_observation", "set_timer")
      2. entities: Key parameters mentioned (e.g., {"temperature": "25", "location": "incubator", "duration": "30 minutes"})
      3. confidence: Your confidence level in this interpretation (0-1)
      
      Format your response as valid JSON only, no other text.
    `;
  
    const interpretation = await synapseService.generateText(
      prompt,
      'You are a laboratory voice command interpreter. Extract the precise intent and entities from voice commands accurately.',
      undefined,
      userId
    );
  
    if (!interpretation || !interpretation.data) {
      throw new ApiError(500, 'Failed to interpret command: ' + 
        (interpretation && interpretation.error ? interpretation.error : 'Text generation service unavailable'));
    }
  
    // Parse the JSON response
    let interpretationData;
    try {
      // Extract JSON from the response (it might contain explanatory text)
      const jsonMatch = interpretation.data.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in the response');
      }
      
      interpretationData = JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error('Error parsing interpretation result:', error);
      throw new ApiError(500, 'Failed to parse command interpretation');
    }
  
    // Return response
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          ...interpretationData,
          modelUsed: interpretation.modelUsed,
          processingTimeMs: interpretation.processingTimeMs
        },
        'Command interpreted successfully'
      )
    );
  }),
  
  /**
   * Get sensor insights
   */
  getSensorInsights: asyncHandler(async (req: Request, res: Response) => {
    const { temperature, humidity } = req.body;
  
    // Validate inputs
    if (temperature === undefined || humidity === undefined) {
      throw new ApiError(400, 'Temperature and humidity are required');
    }
    
    // Get user ID if authenticated, or use 'anonymous'
    let userId = 'anonymous';
    try {
      if (req.user) {
        userId = getUserId(req);
      }
    } catch (error) {
      // If getting user ID fails, continue with anonymous
      logger.info('User not authenticated for sensor insights, using anonymous mode');
    }
  
    // Generate prompt for insights
    const prompt = `
      Analyze the following laboratory sensor readings:
      
      Temperature: ${temperature}°C
      Humidity: ${humidity}%
      
      Provide a brief, helpful insight about these readings and their implications for laboratory conditions.
      Keep your analysis concise (1-2 sentences) and focus on actionable insights.
    `;
  
    // Get insights from AI
    const insights = await synapseService.generateText(
      prompt,
      'You are a lab monitoring assistant analyzing sensor data. Provide concise, accurate insights about laboratory conditions.',
      undefined,
      userId
    );
  
    if (!insights || !insights.data) {
      throw new ApiError(500, 'Failed to generate insights: ' + 
        (insights && insights.error ? insights.error : 'Text generation service unavailable'));
    }
  
    // Return response
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          message: insights.data,
          sensorData: { temperature, humidity },
          modelUsed: insights.modelUsed,
          processingTimeMs: insights.processingTimeMs
        },
        'Sensor insights generated successfully'
      )
    );
  }),
  
  /**
   * Get system information
   */
  getSystemInfo: asyncHandler(async (req: Request, res: Response) => {
    let isOperational = true;
    
    // Try to check if service is operational
    try {
      // The isOperational method might not be fully implemented, so handle any errors
      isOperational = await synapseService.isOperational();
    } catch (error) {
      logger.warn('Error checking system operational status:', error);
      isOperational = false;
    }
  
    // Return response
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          name: "Unified Synapse AI",
          version: "1.0.0",
          models: {
            primary: "llama3-70b-8192 via Groq",
            fallback: "simulated-model"
          },
          capabilities: [
            "Natural language understanding and generation",
            "Context-aware responses",
            "Domain-specific knowledge in genetics, blockchain, and lab monitoring",
            "Voice query processing",
            "Simulated image analysis",
            "Sensor data insights"
          ],
          status: isOperational ? "operational" : "degraded"
        },
        'System information retrieved successfully'
      )
    );
  })
}; 