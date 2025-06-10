import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import config from '../config';
import Gene from '../models/gene.model';
import mongoose from 'mongoose';
import { crisprAnalysisService } from '../services/gene.service';
import logger from '../utils/logger';

// Extend Express Request type to include user
declare module 'express' {
  interface Request {
    user?: {
      _id: mongoose.Types.ObjectId;
      [key: string]: any;
    };
  }
}

// Interface for the expected response from the Python gene service
interface GeneServiceResponse {
  originalSequence: string;
  editedSequence: string;
  changeIndicator: string;
  efficiency: number;
  changedPosition: number;
  originalBase: string;
  newBase: string;
  message: string;
  originalEfficiency: number;
  error?: string; // Optional error field
  id?: string; // Added for database reference
}

// Helper function to validate DNA sequence
const isValidDNASequence = (sequence: string): boolean => {
  // Must contain only A, T, C, G
  const validBases = /^[ATCG]+$/;
  return validBases.test(sequence.toUpperCase());
};

/**
 * Controller to handle DNA sequence prediction requests by calling the Python service
 * and storing the result in the database
 */
export const predictSequence = asyncHandler(async (req: Request, res: Response) => {
  const { sequence, name, description, tags, geneType, isPublic } = req.body;

  console.log('Request body:', req.body);

  console.log(`Received gene sequence request for sequence: ${sequence}`);
  console.log('Request body:', req.body);
  console.log('User authenticated:', req.user ? 'Yes' : 'No');
  if (req.user) {
    console.log('User ID:', req.user._id);
  }

  // --- Validation ---
  if (!sequence) {
    throw new ApiError(400, 'DNA sequence is required');
  }

  const upperSequence = String(sequence).toUpperCase();

  if (!isValidDNASequence(upperSequence)) {
    throw new ApiError(400, 'Invalid DNA sequence. Must contain only A, T, C, G.');
  }

  // For the Python model, we need a sequence of exactly 20 characters
  if (upperSequence.length !== 20) {
    throw new ApiError(400, 'DNA sequence must be exactly 20 characters long for prediction.');
  }

  // --- Call Python Gene Service ---
  const geneServiceUrl = `${config.PREDICTION_SERVICE_URL}/predict`;

  try {
    console.log(`Calling gene service at ${geneServiceUrl} with sequence: ${upperSequence}`);

    const response = await fetch(geneServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sequence: upperSequence }),
      // Adding timeout to avoid long waits if service is down
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    console.log(`Received response with status: ${response.status}`);
    
    // Assert the type of the response data
    const responseData = await response.json() as GeneServiceResponse;

    if (!response.ok) {
      // Forward error from Python service if available
      const errorMessage = responseData?.error || `Gene service failed with status ${response.status}`;
      console.error('Gene service error:', errorMessage);
      // Use 502 Bad Gateway if the downstream service fails
      throw new ApiError(502, `Gene service error: ${errorMessage}`);
    }

    console.log('Gene service responded successfully.');
    console.log('Gene results:', JSON.stringify(responseData, null, 2));

    let geneId: string | undefined = undefined;

    // --- Store prediction in database ---
    // Only save to database if user is authenticated
    if (req.user && req.user._id) {
      try {
        console.log('Attempting to store gene prediction in database...');
        
        // Calculate edit count and positions
        const editPositions: number[] = [];
        let editCount = 0;
        
        for (let i = 0; i < responseData.originalSequence.length; i++) {
          if (responseData.originalSequence[i] !== responseData.editedSequence[i]) {
            editCount++;
            editPositions.push(i);
          }
        }

        // Create new gene prediction record
        const geneData = {
          userId: req.user._id,
          originalSequence: responseData.originalSequence,
          predictedSequence: responseData.editedSequence,
          editCount,
          editPositions,
          efficiency: responseData.efficiency,
          originalEfficiency: responseData.originalEfficiency,
          changedPosition: responseData.changedPosition,
          originalBase: responseData.originalBase,
          newBase: responseData.newBase,
          changeIndicator: responseData.changeIndicator,
          message: responseData.message,
          name: name || `Gene Prediction ${new Date().toISOString().split('T')[0]}`,
          description: description || '',
          tags: tags || [],
          geneType: geneType || 'dna',
          isPublic: isPublic || false,
          isFavorite: false,
          metadata: {
            timestamp: new Date(),
            clientIp: req.ip,
            userAgent: req.headers['user-agent'],
          }
        };

        console.log('Gene data prepared:', { ...geneData, userId: geneData.userId.toString() });

        // Use create method to insert document
        const genePrediction = await Gene.create(geneData);
        console.log('Gene prediction created in database');

        // Convert document to plain object to get ID
        if (genePrediction) {
          console.log('Gene prediction document created:', genePrediction._id);
          geneId = genePrediction._id.toString();
          
          // Include the database ID in the response
          responseData.id = geneId;
          console.log(`Saved gene prediction to database with ID: ${geneId}`);
        } else {
          console.error('Gene prediction document not created properly');
        }
      } catch (dbError) {
        console.error('Error saving gene prediction to database:', dbError);
        // Don't fail the request if DB save fails, just log it
      }
    } else {
      console.log('User not authenticated or missing ID. Skipping database storage.');
    }

    // --- Send Response to Frontend ---
    // Ensure we are sending the correct data structure
    return res.status(200).json(
      new ApiResponse(
        200,
        responseData, // Forward the typed data from the Python service
        'DNA Sequence Analysis successful'
      )
    );

  } catch (error: any) {
    console.error('Error calling gene service:', error);

    // Handle fetch-specific errors (e.g., network issues)
    if (error.name === 'AbortError') {
      throw new ApiError(504, 'Gene service request timed out. The service may be overloaded or unavailable.');
    }
    
    if (error.name === 'FetchError' || error.code === 'ECONNREFUSED') {
      throw new ApiError(503, 'Gene service is unavailable. Please ensure it is running at: ' + config.PREDICTION_SERVICE_URL);
    }
    
    // Re-throw ApiError if it's already formatted
    if (error instanceof ApiError) {
      throw error;
    }

    // Generic internal server error
    throw new ApiError(500, `Failed to get analysis from gene service: ${error.message}`);
  }
});

/**
 * Get all gene predictions for the authenticated user
 */
export const getUserGenes = asyncHandler(async (req: Request, res: Response) => {
  const { 
    page = 1, 
    limit = 10, 
    sort = 'createdAt', 
    order = 'desc',
    geneType,
    tags,
    favorite,
    query,
    minEfficiency
  } = req.query;

  // Ensure user is authenticated
  if (!req.user || !req.user._id) {
    throw new ApiError(401, 'You must be logged in to view your gene predictions');
  }

  // Build filter
  const filter: any = { userId: req.user._id };
  
  // Apply additional filters
  if (geneType) filter.geneType = geneType;
  if (favorite === 'true') filter.isFavorite = true;
  
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    filter.tags = { $in: tagArray };
  }
  
  if (minEfficiency) {
    filter.efficiency = { $gte: Number(minEfficiency) };
  }
  
  // Text search if query parameter is provided
  if (query) {
    filter.$or = [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { originalSequence: { $regex: query, $options: 'i' } },
      { predictedSequence: { $regex: query, $options: 'i' } }
    ];
  }

  // Parse pagination parameters
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  // Determine sort order
  const sortOptions: any = {};
  sortOptions[sort as string] = order === 'asc' ? 1 : -1;

  // Count total documents for pagination
  const total = await Gene.countDocuments(filter);

  // Fetch genes with pagination
  const genes = await Gene.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .select('-__v'); // Exclude version field

  // Return response
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        genes,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      },
      'Gene predictions retrieved successfully'
    )
  );
});

/**
 * Get a single gene prediction by ID
 */
export const getGeneById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Validate object ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid gene prediction ID');
  }
  
  // Find gene prediction
  const gene = await Gene.findById(id);
  
  if (!gene) {
    throw new ApiError(404, 'Gene prediction not found');
  }
  
  // Check if user has permission to view this gene prediction
  // Allow if: user owns the gene OR gene is public
  if (gene.isPublic !== true && 
      (!req.user || !req.user._id || gene.userId.toString() !== req.user._id.toString())) {
    throw new ApiError(403, 'You do not have permission to view this gene prediction');
  }
  
  // Return gene prediction
  return res.status(200).json(
    new ApiResponse(
      200,
      { gene },
      'Gene prediction retrieved successfully'
    )
  );
});

/**
 * Update gene prediction metadata
 */
export const updateGene = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, tags, geneType, isFavorite, isPublic } = req.body;
  
  // Validate object ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid gene prediction ID');
  }
  
  // Ensure user is authenticated
  if (!req.user || !req.user._id) {
    throw new ApiError(401, 'You must be logged in to update gene predictions');
  }
  
  // Find gene prediction
  const gene = await Gene.findById(id);
  
  if (!gene) {
    throw new ApiError(404, 'Gene prediction not found');
  }
  
  // Verify ownership
  if (gene.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have permission to update this gene prediction');
  }
  
  // Update fields if provided
  if (name !== undefined) gene.name = name;
  if (description !== undefined) gene.description = description;
  if (tags !== undefined) gene.tags = tags;
  if (geneType !== undefined) gene.geneType = geneType;
  if (isFavorite !== undefined) gene.isFavorite = isFavorite;
  if (isPublic !== undefined) gene.isPublic = isPublic;
  
  // Save changes
  await gene.save();
  
  // Return updated gene prediction
  return res.status(200).json(
    new ApiResponse(
      200,
      { gene },
      'Gene prediction updated successfully'
    )
  );
});

/**
 * Delete a gene prediction
 */
export const deleteGene = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Validate object ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid gene prediction ID');
  }
  
  // Ensure user is authenticated
  if (!req.user || !req.user._id) {
    throw new ApiError(401, 'You must be logged in to delete gene predictions');
  }
  
  // Find gene prediction
  const gene = await Gene.findById(id);
  
  if (!gene) {
    throw new ApiError(404, 'Gene prediction not found');
  }
  
  // Verify ownership
  if (gene.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have permission to delete this gene prediction');
  }
  
  // Delete gene prediction
  await Gene.findByIdAndDelete(id);
  
  // Return success response
  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      'Gene prediction deleted successfully'
    )
  );
});

/**
 * Add an explanation to a gene prediction
 */
export const addExplanation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { text } = req.body;
  
  // Validate input
  if (!text) {
    throw new ApiError(400, 'Explanation text is required');
  }
  
  // Validate object ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid gene prediction ID');
  }
  
  // Ensure user is authenticated
  if (!req.user || !req.user._id) {
    throw new ApiError(401, 'You must be logged in to add explanations');
  }
  
  // Find gene prediction
  const gene = await Gene.findById(id);
  
  if (!gene) {
    throw new ApiError(404, 'Gene prediction not found');
  }
  
  // Verify ownership
  if (gene.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have permission to modify this gene prediction');
  }
  
  // Add explanation
  gene.explanations.push({
    text,
    timestamp: new Date()
  });
  
  // Save changes
  await gene.save();
  
  // Return updated gene prediction
  return res.status(200).json(
    new ApiResponse(
      200,
      { 
        gene,
        explanation: gene.explanations[gene.explanations.length - 1] 
      },
      'Explanation added successfully'
    )
  );
});

/**
 * Analyze a CRISPR gene edit and provide comprehensive insights
 */
export const analyzeCrisprEdit = asyncHandler(async (req: Request, res: Response) => {
  const { originalSequence, editedSequence, experimentMetadata } = req.body;

  // Validate input
  if (!originalSequence || !editedSequence) {
    throw new ApiError(400, 'Original and edited sequences are required');
  }

  // Validate sequence format (should contain only A, T, C, G)
  const dnaRegex = /^[ATCG]+$/i;
  if (!dnaRegex.test(originalSequence) || !dnaRegex.test(editedSequence)) {
    throw new ApiError(400, 'Sequences must contain only valid DNA bases (A, T, C, G)');
  }

  logger.info('CRISPR edit analysis requested', {
    originalLength: originalSequence.length,
    editedLength: editedSequence.length,
    hasMetadata: !!experimentMetadata
  });

  // Call the CRISPR analysis service
  const analysis = await crisprAnalysisService.analyzeEdit(
    originalSequence,
    editedSequence,
    experimentMetadata || {}
  );

  if (!analysis.success) {
    logger.error('CRISPR analysis failed', { error: analysis.error });
    throw new ApiError(500, `Analysis failed: ${analysis.error || 'Unknown error'}`);
  }

  logger.info('CRISPR analysis completed successfully', {
    riskLevel: analysis.riskLevel?.level
  });

  // Return the analysis results
  return res.status(200).json(
    new ApiResponse(
      200,
      analysis,
      'CRISPR edit analysis completed successfully'
    )
  );
});

/**
 * Batch analyze multiple CRISPR edits
 */
export const batchAnalyzeCrisprEdits = asyncHandler(async (req: Request, res: Response) => {
  const { edits } = req.body;

  // Validate input
  if (!edits || !Array.isArray(edits) || edits.length === 0) {
    throw new ApiError(400, 'An array of edits is required');
  }

  if (edits.length > 10) {
    throw new ApiError(400, 'Maximum 10 edits can be analyzed in a single batch');
  }

  logger.info('Batch CRISPR analysis requested', { editCount: edits.length });

  // Process each edit in the batch
  const results = await Promise.all(
    edits.map(async (edit, index) => {
      const { originalSequence, editedSequence, experimentMetadata } = edit;

      // Skip invalid entries
      if (!originalSequence || !editedSequence) {
        return {
          index,
          success: false,
          error: 'Missing original or edited sequence'
        };
      }

      // Validate sequence format
      const dnaRegex = /^[ATCG]+$/i;
      if (!dnaRegex.test(originalSequence) || !dnaRegex.test(editedSequence)) {
        return {
          index,
          success: false,
          error: 'Invalid DNA sequence format'
        };
      }

      try {
        // Analyze the edit
        const analysis = await crisprAnalysisService.analyzeEdit(
          originalSequence,
          editedSequence,
          experimentMetadata || {}
        );

        return {
          index,
          ...analysis
        };
      } catch (error) {
        logger.error(`Error analyzing edit at index ${index}`, { error });
        return {
          index,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    })
  );

  const successCount = results.filter(r => r.success).length;
  logger.info('Batch CRISPR analysis completed', {
    totalEdits: edits.length,
    successfulAnalyses: successCount
  });

  // Return all results
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        results,
        summary: {
          total: edits.length,
          successful: successCount,
          failed: edits.length - successCount
        }
      },
      'Batch CRISPR edit analysis completed'
    )
  );
});

/**
 * Compare multiple CRISPR edits and rank them by quality/safety
 */
export const compareAndRankEdits = asyncHandler(async (req: Request, res: Response) => {
  const { originalSequence, editedSequences, experimentMetadata } = req.body;

  // Validate input
  if (!originalSequence || !editedSequences || !Array.isArray(editedSequences)) {
    throw new ApiError(400, 'Original sequence and array of edited sequences are required');
  }

  if (editedSequences.length === 0) {
    throw new ApiError(400, 'At least one edited sequence is required');
  }

  if (editedSequences.length > 5) {
    throw new ApiError(400, 'Maximum 5 edited sequences can be compared at once');
  }

  // Validate original sequence format
  const dnaRegex = /^[ATCG]+$/i;
  if (!dnaRegex.test(originalSequence)) {
    throw new ApiError(400, 'Original sequence must contain only valid DNA bases (A, T, C, G)');
  }

  // Validate all edited sequences
  for (const sequence of editedSequences) {
    if (!dnaRegex.test(sequence)) {
      throw new ApiError(400, 'All edited sequences must contain only valid DNA bases (A, T, C, G)');
    }
  }

  logger.info('CRISPR edit comparison requested', {
    variantCount: editedSequences.length
  });

  // Analyze each edited sequence
  const analyses = await Promise.all(
    editedSequences.map(async (editedSequence) => {
      const analysis = await crisprAnalysisService.analyzeEdit(
        originalSequence,
        editedSequence,
        experimentMetadata || {}
      );
      
      return {
        editedSequence,
        analysis
      };
    })
  );

  // Rank the results by safety/quality score (lower risk score = better)
  const rankedResults = analyses
    .filter(item => item.analysis.success)
    .sort((a, b) => {
      const scoreA = a.analysis.riskLevel?.score || 100;
      const scoreB = b.analysis.riskLevel?.score || 100;
      return scoreA - scoreB;
    });

  // Add rank information
  const resultsWithRanking = rankedResults.map((item, index) => ({
    rank: index + 1,
    editedSequence: item.editedSequence,
    analysis: item.analysis,
    comparisonNotes: index === 0 ? 'Best option based on risk assessment' : undefined
  }));

  logger.info('CRISPR edit comparison completed', {
    comparedCount: resultsWithRanking.length
  });

  // Return the ranked results
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        originalSequence,
        rankedEdits: resultsWithRanking,
        bestEdit: resultsWithRanking[0] || null
      },
      'CRISPR edit comparison and ranking completed'
    )
  );
}); 