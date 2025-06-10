'use client';

import React, { useState } from 'react';
import { 
  Box, Button, Card, CardBody, CardHeader, Heading, Input, Stack, Text, 
  Spinner, Badge, HStack, VStack, Flex, Textarea, Select, Tab, Tabs, TabList, 
  TabPanel, TabPanels, Divider, Alert, AlertIcon, AlertTitle, AlertDescription,
  Progress, useToast
} from '@chakra-ui/react';
import { FormControl, FormHelperText, FormLabel } from '@chakra-ui/react';

interface AnalysisResult {
  success: boolean;
  editStatistics: {
    editCount: number;
    editPositions: number[];
    sequenceLengthDifference: number;
    editPercentage: number;
    originalGCContent: number;
    editedGCContent: number;
    gcContentChange: number;
  };
  aiAnalysis: {
    analysis: string;
    timestamp: string;
  };
  offTargetAnalysis: {
    riskScore: number;
    riskLevel: string;
    assessment: string;
    timestamp: string;
  };
  biologicalAssessment: {
    isCodingRegion: boolean;
    frameshift: boolean;
    impactLevel: string;
    assessment: string;
    timestamp: string;
  };
  riskLevel: {
    score: number;
    level: string;
    explanation: string;
  };
  visualizationGuidance: {
    recommendedViews: any[];
    contextWindowSize: number;
    highlightColor: string;
  };
  timestamp: string;
  error?: string;
}

interface ExperimentMetadata {
  purpose: string;
  organism: string;
  gene: string;
  isCodingRegion: boolean;
}

const GeneAnalysis: React.FC = () => {
  const [originalSequence, setOriginalSequence] = useState('');
  const [editedSequence, setEditedSequence] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [metadata, setMetadata] = useState<ExperimentMetadata>({
    purpose: '',
    organism: '',
    gene: '',
    isCodingRegion: true
  });
  
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    // Basic validation
    const cleanedOriginalSequence = originalSequence.trim().toUpperCase();
    const cleanedEditedSequence = editedSequence.trim().toUpperCase();
    
    if (!cleanedOriginalSequence || !cleanedEditedSequence) {
      setError('Both original and edited sequences are required');
      setIsLoading(false);
      return;
    }

    if (!/^[ATCG]+$/.test(cleanedOriginalSequence) || !/^[ATCG]+$/.test(cleanedEditedSequence)) {
      setError('Invalid DNA sequences. Only A, T, C, G bases are allowed.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/gene/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          originalSequence: cleanedOriginalSequence, 
          editedSequence: cleanedEditedSequence,
          experimentMetadata: metadata
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to analyze Gene edit');
      }

      setResult(data.data);
      toast({
        title: 'Analysis successful',
        description: 'Your Gene edit has been analyzed successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis');
      toast({
        title: 'Analysis failed',
        description: err.message || 'An error occurred during analysis',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to render sequences with edits highlighted
  const renderSequenceComparison = () => {
    if (!result) return null;
    
    const { editStatistics } = result;
    const originalSeq = originalSequence.toUpperCase();
    const editedSeq = editedSequence.toUpperCase();
    
    // Break sequences into chunks for better visibility
    const chunkSize = 10;
    const highlightedOriginal = [];
    const highlightedEdited = [];
    
    for (let i = 0; i < originalSeq.length; i += chunkSize) {
      const chunk = originalSeq.substring(i, i + chunkSize);
      highlightedOriginal.push(
        <Text key={i} as="span" fontFamily="monospace" fontSize="md" whiteSpace="pre">
          {chunk}
        </Text>
      );
      if ((i + chunkSize) % 50 === 0) {
        highlightedOriginal.push(<br key={`br-${i}`} />);
      }
    }
    
    for (let i = 0; i < editedSeq.length; i += chunkSize) {
      const chunk = editedSeq.substring(i, i + chunkSize);
      highlightedEdited.push(
        <Text key={i} as="span" fontFamily="monospace" fontSize="md" whiteSpace="pre">
          {chunk}
        </Text>
      );
      if ((i + chunkSize) % 50 === 0) {
        highlightedEdited.push(<br key={`br-${i}`} />);
      }
    }
    
    return (
      <Box mt={4} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
        <Heading size="sm" mb={2}>Sequence Comparison</Heading>
        <Text fontWeight="bold">Original:</Text>
        <Box>{highlightedOriginal}</Box>
        
        <Text fontWeight="bold" mt={2}>Edited:</Text>
        <Box>{highlightedEdited}</Box>
        
        <Text fontSize="sm" mt={2}>
          {editStatistics.editCount} edit{editStatistics.editCount !== 1 ? 's' : ''} detected at position{editStatistics.editCount !== 1 ? 's' : ''}: {editStatistics.editPositions.join(', ')}
        </Text>
      </Box>
    );
  };
  
  // Render risk score as a colored progress bar
  const renderRiskScore = () => {
    if (!result || !result.riskLevel) return null;
    
    const { score, level, explanation } = result.riskLevel;
    
    let color = 'green';
    if (score > 70) color = 'red';
    else if (score > 50) color = 'orange';
    else if (score > 30) color = 'yellow';
    
    return (
      <Box mt={4} p={4} borderWidth="1px" borderRadius="md">
        <Heading size="sm" mb={2}>Overall Risk Assessment</Heading>
        <HStack spacing={4} mb={2}>
          <Text fontWeight="bold">Risk Score:</Text>
          <Progress 
            value={score} 
            max={100} 
            colorScheme={color}
            height="20px"
            width="100%"
            borderRadius="md"
          />
          <Badge colorScheme={color}>{score}/100</Badge>
        </HStack>
        <Text fontWeight="bold">Risk Level: <Badge colorScheme={color} fontSize="md">{level}</Badge></Text>
        <Text mt={2}>{explanation}</Text>
      </Box>
    );
  };

  return (
    <Card boxShadow="md" borderRadius="lg">
      <CardHeader>
        <Heading size="lg">Gene Edit Analyzer</Heading>
        <Text mt={2}>
          Analyze the impact and safety of your Gene edits with AI-powered insights.
        </Text>
      </CardHeader>
      
      <CardBody>
        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            <FormControl isRequired isInvalid={!!error}>
              <FormLabel>Original DNA Sequence</FormLabel>
              <Textarea
                value={originalSequence}
                onChange={(e) => setOriginalSequence(e.target.value.toUpperCase())}
                placeholder="ATCGATCGATCGATCGATCG..."
                fontFamily="monospace"
                rows={4}
              />
              <FormHelperText>
                Enter the original DNA sequence (A, T, C, G only)
              </FormHelperText>
            </FormControl>

            <FormControl isRequired isInvalid={!!error}>
              <FormLabel>Edited DNA Sequence</FormLabel>
              <Textarea
                value={editedSequence}
                onChange={(e) => setEditedSequence(e.target.value.toUpperCase())}
                placeholder="ATCGATCGATCGATCGATCG..."
                fontFamily="monospace"
                rows={4}
              />
              <FormHelperText>
                Enter the edited DNA sequence (A, T, C, G only)
              </FormHelperText>
            </FormControl>
            
            <Divider />
            
            <Heading size="sm">Experiment Metadata (Optional)</Heading>
            
            <FormControl>
              <FormLabel>Experiment Purpose</FormLabel>
              <Input
                value={metadata.purpose}
                onChange={(e) => setMetadata({...metadata, purpose: e.target.value})}
                placeholder="e.g., Gene knockout, SNP introduction"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Target Organism</FormLabel>
              <Input
                value={metadata.organism}
                onChange={(e) => setMetadata({...metadata, organism: e.target.value})}
                placeholder="e.g., Human, E. coli, Mouse"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Target Gene</FormLabel>
              <Input
                value={metadata.gene}
                onChange={(e) => setMetadata({...metadata, gene: e.target.value})}
                placeholder="e.g., BRCA1, TP53"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Region Type</FormLabel>
              <Select 
                value={metadata.isCodingRegion ? "coding" : "noncoding"}
                onChange={(e) => setMetadata({...metadata, isCodingRegion: e.target.value === "coding"})}
              >
                <option value="coding">Coding Region</option>
                <option value="noncoding">Non-coding Region</option>
              </Select>
            </FormControl>

            {error && (
              <Alert status="error">
                <AlertIcon />
                <AlertTitle>Error:</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              mt={4} 
              colorScheme="blue" 
              type="submit" 
              isLoading={isLoading}
              loadingText="Analyzing..."
              isDisabled={!originalSequence || !editedSequence}
              width="full"
            >
              Analyze Gene Edit
            </Button>
          </Stack>
        </form>

        {isLoading && (
          <Flex justify="center" align="center" direction="column" mt={6}>
            <Spinner size="xl" />
            <Text mt={2}>Analyzing DNA sequences and assessing impacts...</Text>
          </Flex>
        )}

        {result && (
          <Box mt={6}>
            <Divider mb={4} />
            <Heading size="md" mb={4}>Analysis Results</Heading>
            
            {renderSequenceComparison()}
            {renderRiskScore()}
            
            <Tabs mt={6} colorScheme="blue" variant="enclosed">
              <TabList>
                <Tab>Edit Statistics</Tab>
                <Tab>AI Analysis</Tab>
                <Tab>Off-Target Risk</Tab>
                <Tab>Biological Impact</Tab>
              </TabList>
              
              <TabPanels>
                <TabPanel>
                  <Box>
                    <Heading size="sm" mb={3}>Edit Statistics</Heading>
                    <Grid columns={2} spacing={4}>
                      <Stat
                        label="Edit Count"
                        value={result.editStatistics.editCount}
                        description="Number of changes detected"
                      />
                      <Stat
                        label="Edit Percentage"
                        value={`${result.editStatistics.editPercentage.toFixed(2)}%`}
                        description="Percentage of sequence modified"
                      />
                      <Stat
                        label="Length Change"
                        value={result.editStatistics.sequenceLengthDifference}
                        description="Change in sequence length"
                      />
                      <Stat
                        label="GC Content Change"
                        value={`${result.editStatistics.gcContentChange > 0 ? '+' : ''}${result.editStatistics.gcContentChange.toFixed(2)}%`}
                        description="Change in GC content percentage"
                      />
                    </Grid>
                  </Box>
                </TabPanel>
                
                <TabPanel>
                  <Box>
                    <Heading size="sm" mb={3}>AI Analysis</Heading>
                    <Text whiteSpace="pre-wrap">{result.aiAnalysis.analysis}</Text>
                  </Box>
                </TabPanel>
                
                <TabPanel>
                  <Box>
                    <Heading size="sm" mb={3}>Off-Target Risk Assessment</Heading>
                    <HStack spacing={4} mb={4}>
                      <Text fontWeight="bold">Risk Score:</Text>
                      <Progress 
                        value={result.offTargetAnalysis.riskScore} 
                        max={100} 
                        colorScheme={result.offTargetAnalysis.riskLevel === 'LOW' ? 'green' : 
                                    result.offTargetAnalysis.riskLevel === 'MEDIUM' ? 'yellow' :
                                    result.offTargetAnalysis.riskLevel === 'HIGH' ? 'orange' : 'red'}
                        height="20px"
                        width="60%"
                        borderRadius="md"
                      />
                      <Badge colorScheme={result.offTargetAnalysis.riskLevel === 'LOW' ? 'green' : 
                                        result.offTargetAnalysis.riskLevel === 'MEDIUM' ? 'yellow' :
                                        result.offTargetAnalysis.riskLevel === 'HIGH' ? 'orange' : 'red'}>
                        {result.offTargetAnalysis.riskScore}/100
                      </Badge>
                    </HStack>
                    <Text>{result.offTargetAnalysis.assessment}</Text>
                  </Box>
                </TabPanel>
                
                <TabPanel>
                  <Box>
                    <Heading size="sm" mb={3}>Biological Impact Assessment</Heading>
                    <VStack align="start" spacing={2} mb={4}>
                      <Text>
                        <Badge colorScheme={result.biologicalAssessment.isCodingRegion ? 'blue' : 'purple'}>
                          {result.biologicalAssessment.isCodingRegion ? 'Coding Region' : 'Non-coding Region'}
                        </Badge>
                      </Text>
                      {result.biologicalAssessment.isCodingRegion && (
                        <Text>
                          <Badge colorScheme={result.biologicalAssessment.frameshift ? 'red' : 'green'}>
                            {result.biologicalAssessment.frameshift ? 'Frameshift Detected' : 'No Frameshift'}
                          </Badge>
                        </Text>
                      )}
                      <Text>
                        <Badge colorScheme={result.biologicalAssessment.impactLevel === 'LOW' ? 'green' : 
                                          result.biologicalAssessment.impactLevel === 'MEDIUM' ? 'yellow' : 'red'}>
                          {result.biologicalAssessment.impactLevel} Impact
                        </Badge>
                      </Text>
                    </VStack>
                    <Text>{result.biologicalAssessment.assessment}</Text>
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        )}
      </CardBody>
    </Card>
  );
};

// Helper component for statistics display
const Grid: React.FC<{
  columns: number;
  spacing: number;
  children: React.ReactNode;
}> = ({ columns, spacing, children }) => {
  return (
    <Box 
      display="grid" 
      gridTemplateColumns={`repeat(${columns}, 1fr)`}
      gap={spacing}
    >
      {children}
    </Box>
  );
};

// Helper component for stat display
const Stat: React.FC<{
  label: string;
  value: string | number;
  description?: string;
}> = ({ label, value, description }) => {
  return (
    <Box p={4} borderWidth="1px" borderRadius="md">
      <Text fontSize="sm" color="gray.500">{label}</Text>
      <Text fontSize="2xl" fontWeight="bold">{value}</Text>
      {description && <Text fontSize="xs" color="gray.500">{description}</Text>}
    </Box>
  );
};

export default GeneAnalysis; 