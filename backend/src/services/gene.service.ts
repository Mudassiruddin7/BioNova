import mongoose from 'mongoose';
import logger from '../utils/logger';
import { synapseCore } from './synapse/synapseCore.service';

/**
 * Comprehensive Gene Service
 * Provides functions for gene sequence analysis, CRISPR editing, and interpretations
 */

// -------------- UTILITY FUNCTIONS --------------

/**
 * Simple utility to calculate edit distance between sequences
 * @param seq1 First sequence
 * @param seq2 Second sequence
 * @returns Edit distance and positions of edits
 */
export const calculateEditDistance = (seq1: string, seq2: string) => {
  // Make sure sequences are of the same length
  if (seq1.length !== seq2.length) {
    throw new Error('Sequences must be of the same length');
  }

  let editCount = 0;
  const editPositions: number[] = [];

  // Compare each character
  for (let i = 0; i < seq1.length; i++) {
    if (seq1[i] !== seq2[i]) {
      editCount++;
      editPositions.push(i);
    }
  }

  return { editCount, editPositions };
};

/**
 * Calculates GC content of a DNA sequence
 * @param sequence DNA sequence
 * @returns GC content as percentage
 */
export const calculateGCContent = (sequence: string): number => {
  const gcCount = (sequence.match(/[GC]/gi) || []).length;
  return (gcCount / sequence.length) * 100;
};

/**
 * Validates if a sequence is valid DNA
 * @param sequence DNA sequence
 * @returns Boolean indicating if sequence is valid
 */
export const isValidDnaSequence = (sequence: string): boolean => {
  return /^[ATCG]+$/i.test(sequence);
};

// -------------- PREDICTION FUNCTIONS --------------

/**
 * Mock CRISPR gene editing (in a real app, this would be a machine learning model)
 * @param sequence DNA sequence to predict edits for
 * @returns Predicted sequence and edit information
 */
export const predictSequenceEdits = async (sequence: string) => {
  try {
    // Validate sequence (should only contain A, T, C, G)
    const isValidSequence = isValidDnaSequence(sequence);
    if (!isValidSequence) {
      throw new Error('Invalid DNA sequence. Sequence must only contain A, T, C, G bases.');
    }

    // Normalize sequence to uppercase
    const normalizedSequence = sequence.toUpperCase();
    
    // In a real application, this would call a ML model
    // For now, we'll implement a simple mock prediction
    // that randomly changes a few bases
    
    const bases = ['A', 'T', 'C', 'G'];
    let predictedSequence = '';
    const edits = Math.min(3, Math.max(1, Math.floor(normalizedSequence.length * 0.05))); // Edit 5% of bases, min 1, max 3
    
    // Randomly select positions to edit
    const positions = new Set<number>();
    while (positions.size < edits) {
      positions.add(Math.floor(Math.random() * normalizedSequence.length));
    }
    
    // Create predicted sequence with edits
    for (let i = 0; i < normalizedSequence.length; i++) {
      if (positions.has(i)) {
        // Replace with a different base
        const currentBase = normalizedSequence[i];
        const availableBases = bases.filter(b => b !== currentBase);
        const newBase = availableBases[Math.floor(Math.random() * availableBases.length)];
        predictedSequence += newBase;
      } else {
        predictedSequence += normalizedSequence[i];
      }
    }
    
    // Calculate edit information
    const { editCount, editPositions } = calculateEditDistance(normalizedSequence, predictedSequence);
    
    return {
      success: true,
      originalSequence: normalizedSequence,
      predictedSequence,
      editCount,
      editPositions,
    };
  } catch (error) {
    logger.error('Error in gene sequence analysis:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to analyze gene sequence edits',
    };
  }
}; 

// -------------- GENE ANALYZER CLASS --------------

/**
 * GeneAnalyzer Service
 * Provides AI interpretations and risk assessments for gene predictions
 */
class GeneAnalyzerService {
  /**
   * Interpret a gene prediction result
   */
  async interpretPrediction(
    userId: string,
    dnaSequence: string,
    predictionModelOutput: any,
    geneInputId?: string,
    options: {
      includeRiskAssessment?: boolean;
      includeSuggestions?: boolean;
    } = { includeRiskAssessment: true, includeSuggestions: false }
  ): Promise<{
    interpretation: string;
    riskAssessment?: string;
    suggestions?: string;
    miniReport: string;
    modelUsed: string;
    processingTimeMs: number;
    analysisId?: string;
    error?: string;
  }> {
    const startTime = Date.now();
    let modelUsed = '';
    
    try {
      logger.info('Starting gene prediction interpretation', {
        userId,
        geneInputId,
        sequenceLength: dnaSequence.length
      });
      
      // Step 1: Generate plain-language interpretation
      const interpretationResult = await this.generateInterpretation(
        dnaSequence,
        predictionModelOutput,
        userId
      );
      
      if (!interpretationResult.data) {
        throw new Error('Failed to generate interpretation: ' + interpretationResult.error);
      }
      
      const interpretation = interpretationResult.data;
      modelUsed = interpretationResult.modelUsed || '';
      
      // Step 2: Generate risk assessment if requested and off-targets exist
      let riskAssessment: string | undefined = undefined;
      
      if (options.includeRiskAssessment && this.hasOffTargets(predictionModelOutput)) {
        const riskResult = await this.generateRiskAssessment(
          predictionModelOutput,
          userId
        );
        
        if (riskResult.data) {
          riskAssessment = riskResult.data;
          // Update modelUsed if different
          if (riskResult.modelUsed && riskResult.modelUsed !== modelUsed) {
            modelUsed = `${modelUsed},${riskResult.modelUsed}`;
          }
        } else {
          logger.warn('Risk assessment generation failed', {
            error: riskResult.error
          });
          // Continue without risk assessment
        }
      }
      
      // Step 3: Generate optimization suggestions if requested
      let suggestions: string | undefined = undefined;
      
      if (options.includeSuggestions) {
        const suggestionsResult = await this.generateOptimizations(
          dnaSequence,
          predictionModelOutput,
          userId
        );
        
        if (suggestionsResult.data) {
          suggestions = suggestionsResult.data;
          // Update modelUsed if different
          if (suggestionsResult.modelUsed && !modelUsed.includes(suggestionsResult.modelUsed)) {
            modelUsed = `${modelUsed},${suggestionsResult.modelUsed}`;
          }
        } else {
          logger.warn('Suggestions generation failed', {
            error: suggestionsResult.error
          });
          // Continue without suggestions
        }
      }
      
      // Step 4: Compile mini-report
      const miniReport = this.compileMiniReport(
        interpretation,
        riskAssessment,
        suggestions
      );
      
      // Step 5: Save to database
      const analysisId = await this.saveGeneAnalysis(
        userId,
        dnaSequence,
        predictionModelOutput,
        interpretation,
        riskAssessment,
        suggestions,
        miniReport,
        modelUsed,
        Date.now() - startTime,
        geneInputId
      );
      
      return {
        interpretation,
        riskAssessment,
        suggestions,
        miniReport,
        modelUsed,
        processingTimeMs: Date.now() - startTime,
        analysisId
      };
    } catch (error: any) {
      logger.error('Error in gene prediction interpretation', {
        userId,
        geneInputId,
        error: error.message
      });
      
      return {
        interpretation: "Error generating interpretation.",
        miniReport: "An error occurred while analyzing the gene prediction results.",
        modelUsed,
        processingTimeMs: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Generate plain-language interpretation of prediction results
   */
  private async generateInterpretation(
    dnaSequence: string,
    predictionModelOutput: any,
    userId: string
  ) {
    // Construct the system prompt
    const systemPrompt = `You are Synapse, a specialized bio-AI assistant focused on gene editing technologies. 
    Your task is to analyze gene prediction outputs. 
    Explain complex biological concepts accurately using clear language suitable for molecular biology researchers. 
    Emphasize potential implications and actionable insights based only on the provided data.`;
    
    // Construct the user prompt
    const userPrompt = `Analyze the following CRISPR prediction results for the input DNA sequence:
    
    Sequence: ${dnaSequence.substring(0, 100)}... [sequence truncated for prompt length]
    
    Prediction Output: ${JSON.stringify(predictionModelOutput, null, 2)}
    
    Generate a brief, plain-language explanation (2-3 sentences) summarizing these results. 
    Focus on the predicted on-target efficiency score and briefly mention the presence and 
    potential significance (if any) of predicted off-target sites based on the provided output data.`;
    
    // Call Groq LLM
    return await synapseCore.generateText(
      userPrompt,
      systemPrompt,
      undefined, // use default model
      userId
    );
  }

  /**
   * Generate risk assessment for off-target effects
   */
  private async generateRiskAssessment(
    predictionModelOutput: any,
    userId: string
  ) {
    // Construct the system prompt
    const systemPrompt = `You are Synapse, a specialized bio-AI assistant focused on gene editing technologies.
    Your task is to assess potential off-target risks from CRISPR prediction data.
    Be cautious and balanced in your assessment, explaining implications clearly while avoiding definitive claims.
    Base your assessment only on the data provided.`;
    
    // Construct the user prompt
    const userPrompt = `Based on the gene editing prediction output provided:
    
    Prediction Output: ${JSON.stringify(predictionModelOutput, null, 2)}
    
    Generate a brief risk assessment (2-3 sentences) focusing on potential off-target effects.
    Address only concrete risks evident in the data, such as high-scoring off-target sites, 
    rather than hypothetical concerns.`;
    
    // Call Groq LLM
    return await synapseCore.generateText(
      userPrompt,
      systemPrompt,
      undefined, // use default model
      userId
    );
  }

  /**
   * Generate optimization suggestions
   */
  private async generateOptimizations(
    dnaSequence: string,
    predictionModelOutput: any,
    userId: string
  ) {
    // Construct the system prompt
    const systemPrompt = `You are Synapse, a specialized bio-AI assistant focused on gene editing technologies.
    Your task is to suggest optimizations for CRISPR gene editing experiments based on prediction data.
    Provide specific, actionable suggestions based only on the data provided.`;
    
    // Construct the user prompt
    const userPrompt = `Based on the gene editing prediction for this sequence:
    
    Sequence: ${dnaSequence.substring(0, 100)}... [sequence truncated for prompt length]
    
    Prediction Output: ${JSON.stringify(predictionModelOutput, null, 2)}
    
    Suggest 1-2 concrete optimizations that could improve targeting efficiency or reduce off-target effects.
    Focus on actionable modifications to the guide RNA design, experimental conditions, or alternative target sites
    based on patterns in the prediction data.`;
    
    // Call Groq LLM
    return await synapseCore.generateText(
      userPrompt,
      systemPrompt,
      undefined, // use default model
      userId
    );
  }

  /**
   * Check if prediction output includes off-targets
   */
  private hasOffTargets(predictionModelOutput: any): boolean {
    // This is a simplified check that would need to be customized based on
    // the actual structure of your prediction model's output
    
    // Example implementation:
    if (predictionModelOutput && 
        predictionModelOutput.offTargets && 
        Array.isArray(predictionModelOutput.offTargets) && 
        predictionModelOutput.offTargets.length > 0) {
      return true;
    }
    
    // Alternative structure example
    if (predictionModelOutput && 
        predictionModelOutput.offTargetAnalysis && 
        predictionModelOutput.offTargetAnalysis.sites && 
        predictionModelOutput.offTargetAnalysis.sites.length > 0) {
      return true;
    }
    
    // For the mock implementation or if structure doesn't match
    return false;
  }

  /**
   * Compile a mini-report from analysis components
   */
  private compileMiniReport(
    interpretation: string,
    riskAssessment?: string,
    suggestions?: string
  ): string {
    let report = `## Gene Editing Analysis\n\n${interpretation}\n\n`;
    
    if (riskAssessment) {
      report += `## Risk Assessment\n\n${riskAssessment}\n\n`;
    }
    
    if (suggestions) {
      report += `## Optimization Suggestions\n\n${suggestions}\n\n`;
    }
    
    report += `\nAnalysis generated at ${new Date().toISOString()}`;
    
    return report;
  }

  /**
   * Save gene analysis to database (mock implementation)
   */
  private async saveGeneAnalysis(
    userId: string,
    dnaSequence: string,
    predictionModelOutput: any,
    interpretation: string,
    riskAssessment?: string,
    suggestions?: string,
    miniReport?: string,
    modelUsed?: string,
    processingTimeMs?: number,
    geneInputId?: string
  ): Promise<string> {
    // In a real implementation, this would save to a database
    // For now, we just log the analysis and return a mock ID
    
    logger.info('Saving gene analysis', {
      userId,
      geneInputId,
      hasRiskAssessment: !!riskAssessment,
      hasSuggestions: !!suggestions,
      processingTimeMs
    });
    
    // Mock ID generation - would be a DB ID in real implementation
    return `analysis_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }
}

// -------------- CRISPR ANALYSIS CLASS --------------

/**
 * Service for analyzing CRISPR gene edits and providing AI-powered insights
 */
export class CrisprAnalysisService {
  // Severity levels for CRISPR edit assessments
  private readonly SEVERITY_LEVELS = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
  };

  /**
   * Analyzes a CRISPR edit and provides comprehensive insights
   * @param originalSequence The original DNA sequence
   * @param editedSequence The edited DNA sequence after CRISPR modifications
   * @param experimentMetadata Optional metadata about the experiment
   * @returns Comprehensive analysis of the edit and its potential impacts
   */
  async analyzeEdit(
    originalSequence: string,
    editedSequence: string,
    experimentMetadata: Record<string, any> = {}
  ) {
    logger.info('Starting CRISPR edit analysis', { 
      originalSequenceLength: originalSequence.length,
      editedSequenceLength: editedSequence.length
    });

    try {
      // Identify differences between sequences
      const { editPositions, editTypes } = this.identifyEdits(originalSequence, editedSequence);
      
      // Generate basic statistics about the edit
      const editStats = this.generateEditStatistics(originalSequence, editedSequence, editPositions);
      
      // Get AI analysis of the edit and its potential impacts
      const aiAnalysis = await this.generateAIAnalysis(
        originalSequence,
        editedSequence,
        editPositions,
        editTypes,
        experimentMetadata
      );
      
      // Assess potential off-target effects
      const offTargetAnalysis = await this.assessOffTargetEffects(
        originalSequence,
        editedSequence,
        editPositions
      );
      
      // Generate assessment of biological implications
      const biologicalAssessment = await this.assessBiologicalImplications(
        originalSequence,
        editedSequence,
        editStats,
        experimentMetadata
      );
      
      // Determine overall risk level
      const riskLevel = this.determineRiskLevel(editStats, offTargetAnalysis, biologicalAssessment);
      
      // Generate visualization guidance
      const visualizationGuidance = this.generateVisualizationGuidance(
        originalSequence,
        editedSequence,
        editPositions,
        editTypes
      );
      
      // Log successful analysis
      logger.info('CRISPR edit analysis completed successfully', {
        editCount: editStats.editCount,
        riskLevel
      });
      
      // Return comprehensive analysis
      return {
        success: true,
        editStatistics: editStats,
        aiAnalysis,
        offTargetAnalysis,
        biologicalAssessment,
        riskLevel,
        visualizationGuidance,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error in CRISPR edit analysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in CRISPR analysis',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Identifies the positions and types of edits between two sequences
   * @param originalSequence Original DNA sequence
   * @param editedSequence Edited DNA sequence
   * @returns Positions and types of edits
   */
  private identifyEdits(originalSequence: string, editedSequence: string) {
    const editPositions: number[] = [];
    const editTypes: { position: number, type: 'substitution' | 'insertion' | 'deletion', original?: string, edited?: string }[] = [];
    
    // Simple comparison for substitutions (assuming sequences are same length)
    if (originalSequence.length === editedSequence.length) {
      for (let i = 0; i < originalSequence.length; i++) {
        if (originalSequence[i] !== editedSequence[i]) {
          editPositions.push(i);
          editTypes.push({
            position: i,
            type: 'substitution',
            original: originalSequence[i],
            edited: editedSequence[i]
          });
        }
      }
    } else {
      // Simplified handling for insertions/deletions (real implementation would use sequence alignment)
      // This is a placeholder - production code would use a proper sequence alignment algorithm
      if (originalSequence.length < editedSequence.length) {
        editTypes.push({
          position: 0, // Would need alignment to determine exact position
          type: 'insertion'
        });
      } else {
        editTypes.push({
          position: 0, // Would need alignment to determine exact position
          type: 'deletion'
        });
      }
      editPositions.push(0); // Placeholder
    }
    
    return { editPositions, editTypes };
  }

  /**
   * Generates statistics about the edit
   * @param originalSequence Original DNA sequence
   * @param editedSequence Edited DNA sequence
   * @param editPositions Positions where edits occurred
   * @returns Statistics about the edit
   */
  private generateEditStatistics(
    originalSequence: string,
    editedSequence: string,
    editPositions: number[]
  ) {
    // Calculate basic edit statistics
    const editCount = editPositions.length;
    const sequenceLengthDifference = editedSequence.length - originalSequence.length;
    const editPercentage = (editCount / originalSequence.length) * 100;
    
    // Calculate GC content before and after
    const originalGCContent = calculateGCContent(originalSequence);
    const editedGCContent = calculateGCContent(editedSequence);
    const gcContentChange = editedGCContent - originalGCContent;
    
    return {
      editCount,
      editPositions,
      sequenceLengthDifference,
      editPercentage,
      originalGCContent,
      editedGCContent,
      gcContentChange
    };
  }

  /**
   * Generates AI analysis of the CRISPR edit
   * @param originalSequence Original DNA sequence
   * @param editedSequence Edited DNA sequence
   * @param editPositions Positions where edits occurred
   * @param editTypes Types of edits that occurred
   * @param experimentMetadata Metadata about the experiment
   * @returns AI-generated analysis of the edit
   */
  private async generateAIAnalysis(
    originalSequence: string,
    editedSequence: string,
    editPositions: number[],
    editTypes: Array<{ position: number, type: string, original?: string, edited?: string }>,
    experimentMetadata: Record<string, any>
  ) {
    try {
      // Prepare a helpful prompt for the AI
      const prompt = `
        Analyze this CRISPR gene edit:
        
        Original Sequence: ${originalSequence.length > 100 ? originalSequence.substring(0, 100) + "..." : originalSequence}
        Edited Sequence: ${editedSequence.length > 100 ? editedSequence.substring(0, 100) + "..." : editedSequence}
        
        Edit Positions: ${editPositions.join(', ')}
        Edit Types: ${editTypes.map(e => `${e.type} at position ${e.position}`).join('; ')}
        
        Experiment Context: ${JSON.stringify(experimentMetadata)}
        
        Provide a concise scientific analysis of:
        1. The likely impact of this edit at the molecular level
        2. Potential functional consequences based on the edit type and location
        3. Any concerns or recommendations about this edit design
        
        Keep your analysis concise (150-200 words) and focus on scientific implications.
      `;
      
      // System prompt for scientific context
      const systemPrompt = `You are a CRISPR gene editing expert analyzing DNA edits. 
      Provide accurate, scientific analysis of edits with molecular and functional insights. 
      Be precise, technical but clear, and avoid speculation beyond what the data shows.`;
      
      // Get analysis from synapseService
      const result = await synapseCore.generateText(
        prompt,
        systemPrompt,
        undefined,
        undefined
      );
      
      return {
        analysis: result.data || "Unable to generate analysis.",
        modelUsed: result.modelUsed
      };
    } catch (error) {
      logger.error('Error generating CRISPR AI analysis:', error);
      return {
        analysis: "Error generating analysis. Please try again later.",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Assesses potential off-target effects of the CRISPR edit
   * @param originalSequence Original DNA sequence
   * @param editedSequence Edited DNA sequence
   * @param editPositions Positions where edits occurred
   * @returns Assessment of potential off-target effects
   */
  private async assessOffTargetEffects(
    originalSequence: string,
    editedSequence: string,
    editPositions: number[]
  ) {
    // In a real implementation, this would:
    // 1. Use a reference genome database to search for similar sequences
    // 2. Apply bioinformatics algorithms to predict off-target binding
    // 3. Score potential off-target sites based on similarity and PAM context
    
    // For this demo, we'll generate a simulated analysis
    const offTargetRiskScore = Math.min(
      100,
      Math.max(0, 20 + Math.random() * 30 + editPositions.length * 5)
    );
    
    let riskLevel = 'LOW';
    if (offTargetRiskScore > 70) riskLevel = this.SEVERITY_LEVELS.CRITICAL;
    else if (offTargetRiskScore > 50) riskLevel = this.SEVERITY_LEVELS.HIGH;
    else if (offTargetRiskScore > 30) riskLevel = this.SEVERITY_LEVELS.MEDIUM;
    
    // Generate human-readable assessment based on risk level
    let assessment = '';
    switch (riskLevel) {
      case this.SEVERITY_LEVELS.LOW:
        assessment = 'Low probability of off-target effects. The edit appears highly specific.';
        break;
      case this.SEVERITY_LEVELS.MEDIUM:
        assessment = 'Moderate risk of off-target effects. Consider validation with whole-genome sequencing.';
        break;
      case this.SEVERITY_LEVELS.HIGH:
        assessment = 'High risk of off-target effects. Multiple potential binding sites detected.';
        break;
      case this.SEVERITY_LEVELS.CRITICAL:
        assessment = 'Critical off-target risk. This guide RNA may bind to multiple genomic locations.';
        break;
    }
    
    return {
      riskScore: offTargetRiskScore,
      riskLevel,
      assessment,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Assesses biological implications of the edit
   * @param originalSequence Original DNA sequence
   * @param editedSequence Edited DNA sequence
   * @param editStats Statistics about the edit
   * @param experimentMetadata Metadata about the experiment
   * @returns Assessment of biological implications
   */
  private async assessBiologicalImplications(
    originalSequence: string,
    editedSequence: string,
    editStats: any,
    experimentMetadata: Record<string, any>
  ) {
    // Simulate coding region analysis
    const isCodingRegion = experimentMetadata.isCodingRegion || Math.random() > 0.5;
    const frameshift = isCodingRegion && (editStats.sequenceLengthDifference % 3 !== 0);
    
    // Determine biological impact level
    let impactLevel = this.SEVERITY_LEVELS.LOW;
    if (frameshift) {
      impactLevel = this.SEVERITY_LEVELS.HIGH;
    } else if (editStats.editCount > 3) {
      impactLevel = this.SEVERITY_LEVELS.MEDIUM;
    }
    
    // Generate assessment text
    let assessment = '';
    if (frameshift) {
      assessment = 'Frameshift detected. This edit likely results in a non-functional protein due to altered reading frame.';
    } else if (isCodingRegion) {
      assessment = 'Edit within coding region. May result in amino acid substitution without frameshift.';
    } else {
      assessment = 'Edit likely in non-coding region. May affect regulatory elements, but unlikely to directly alter protein structure.';
    }
    
    return {
      isCodingRegion,
      frameshift,
      impactLevel,
      assessment,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Determines the overall risk level of the edit
   * @param editStats Statistics about the edit
   * @param offTargetAnalysis Analysis of potential off-target effects
   * @param biologicalAssessment Assessment of biological implications
   * @returns Overall risk level and explanation
   */
  private determineRiskLevel(
    editStats: any,
    offTargetAnalysis: any,
    biologicalAssessment: any
  ) {
    // Weighted scoring system
    let overallScore = 0;
    
    // Factor 1: Number of edits (more edits = higher risk)
    overallScore += Math.min(50, editStats.editCount * 10);
    
    // Factor 2: Off-target risk
    switch (offTargetAnalysis.riskLevel) {
      case this.SEVERITY_LEVELS.CRITICAL:
        overallScore += 50;
        break;
      case this.SEVERITY_LEVELS.HIGH:
        overallScore += 35;
        break;
      case this.SEVERITY_LEVELS.MEDIUM:
        overallScore += 20;
        break;
      case this.SEVERITY_LEVELS.LOW:
        overallScore += 5;
        break;
    }
    
    // Factor 3: Biological impact
    switch (biologicalAssessment.impactLevel) {
      case this.SEVERITY_LEVELS.HIGH:
        overallScore += 30;
        break;
      case this.SEVERITY_LEVELS.MEDIUM:
        overallScore += 15;
        break;
      case this.SEVERITY_LEVELS.LOW:
        overallScore += 5;
        break;
    }
    
    // Normalize to 0-100 scale
    overallScore = Math.min(100, overallScore);
    
    // Determine risk level
    let riskLevel = this.SEVERITY_LEVELS.LOW;
    if (overallScore > 70) riskLevel = this.SEVERITY_LEVELS.CRITICAL;
    else if (overallScore > 50) riskLevel = this.SEVERITY_LEVELS.HIGH;
    else if (overallScore > 30) riskLevel = this.SEVERITY_LEVELS.MEDIUM;
    
    // Generate explanation
    let explanation = '';
    switch (riskLevel) {
      case this.SEVERITY_LEVELS.CRITICAL:
        explanation = 'The edit carries critical risk due to high off-target probability and significant biological impacts.';
        break;
      case this.SEVERITY_LEVELS.HIGH:
        explanation = 'The edit presents high risk, with notable concerns in either off-target effects or biological function.';
        break;
      case this.SEVERITY_LEVELS.MEDIUM:
        explanation = 'The edit has moderate risk. Consider additional validation before proceeding to further experiments.';
        break;
      case this.SEVERITY_LEVELS.LOW:
        explanation = 'The edit appears low-risk, with minimal off-target concerns and predicted biological impact.';
        break;
    }
    
    return {
      score: overallScore,
      level: riskLevel,
      explanation
    };
  }

  /**
   * Generates guidance for visualizing the edit
   * @param originalSequence Original DNA sequence
   * @param editedSequence Edited DNA sequence
   * @param editPositions Positions where edits occurred
   * @param editTypes Types of edits that occurred
   * @returns Guidance for visualization
   */
  private generateVisualizationGuidance(
    originalSequence: string,
    editedSequence: string,
    editPositions: number[],
    editTypes: Array<{ position: number, type: string, original?: string, edited?: string }>
  ) {
    // In a real implementation, this would provide specific formatting 
    // instructions for various visualization tools
    
    // For this demo, we'll provide some basic guidance
    const visualizationOptions = [
      {
        type: 'sequence-view',
        description: 'Linear sequence comparison highlighting changed bases',
        regions: editPositions.map(pos => ({
          start: Math.max(0, pos - 5),
          end: Math.min(originalSequence.length, pos + 6),
          highlight: pos
        }))
      },
      {
        type: 'circular-view',
        description: 'Circular plasmid map showing edit locations',
        edits: editTypes.map(edit => ({
          position: edit.position,
          type: edit.type,
          label: `${edit.original || ''} → ${edit.edited || ''}`
        }))
      }
    ];
    
    return {
      recommendedViews: visualizationOptions,
      contextWindowSize: 10, // Show 10bp before and after each edit
      highlightColor: '#FF5733', // Red-orange highlight for edits
    };
  }
}

// Create and export service instances
export const geneAnalyzer = new GeneAnalyzerService();
export const crisprAnalysisService = new CrisprAnalysisService(); 

/**
 * Get gene data by its ID
 */
export const getGeneById = async (id: string, userId: string) => {
  try {
    // Check if the id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.error(`Invalid gene ID format: ${id}`);
      return null;
    }

    const objectId = new mongoose.Types.ObjectId(id);
    
    // Query the Gene model for the gene data
    // Assuming the Gene model has a 'userId' field for ownership validation
    const Gene = mongoose.model('Gene');
    const gene = await Gene.findOne({ _id: objectId });
    
    // If no gene was found, return null
    if (!gene) {
      logger.info(`No gene found with ID: ${id}`);
      return null;
    }
    
    // Check if the gene belongs to the requesting user or is marked as public
    if (gene.userId && gene.userId.toString() !== userId && !gene.isPublic) {
      logger.info(`User ${userId} attempted to access gene owned by ${gene.userId}`);
      // Return limited data for non-public genes
      return {
        name: gene.name || 'Restricted Gene',
        geneType: gene.geneType,
        createdAt: gene.createdAt,
        isPublic: false,
        restricted: true
      };
    }
    
    // Return the full gene data
    return gene;
  } catch (error) {
    logger.error('Error retrieving gene by ID:', error);
    throw new Error('Failed to retrieve gene data');
  }
}; 