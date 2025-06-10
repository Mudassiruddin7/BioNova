'use client';

import React, { useState } from 'react';
import { Box, Button, Card, Heading, Input, Stack, Text, Spinner, Badge, HStack, Flex } from '@chakra-ui/react';
import { FormControl, FormHelperText, FormLabel, Divider, Stat, StatLabel, StatNumber, StatHelpText, useToast } from './custom-chakra-components';

interface PredictionResult {
  originalSequence: string;
  editedSequence: string;
  changeIndicator: string;
  efficiency: number;
  changedPosition: number;
  originalBase: string;
  newBase: string;
  message: string;
  originalEfficiency: number;
}

const GenePredictor: React.FC = () => {
  const [sequence, setSequence] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    // Basic validation
    const cleanedSequence = sequence.trim().toUpperCase();
    if (!cleanedSequence) {
      setError('Please enter a DNA sequence');
      setIsLoading(false);
      return;
    }

    if (!/^[ATCG]+$/.test(cleanedSequence)) {
      setError('Invalid DNA sequence. Only A, T, C, G bases are allowed.');
      setIsLoading(false);
      return;
    }

    if (cleanedSequence.length !== 20) {
      setError('DNA sequence must be exactly 20 characters long for Gene prediction.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/gene/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sequence: cleanedSequence }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get prediction');
      }

      setResult(data.data);
      toast({
        title: 'Prediction successful',
        description: 'Your DNA sequence has been analyzed successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred while getting the prediction');
      toast({
        title: 'Prediction failed',
        description: err.message || 'An error occurred while getting the prediction',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to highlight the changed base
  const renderSequenceComparison = () => {
    if (!result) return null;

    const { originalSequence, editedSequence, changedPosition } = result;

    const beforeChange = originalSequence.substring(0, changedPosition);
    const originalBase = originalSequence.charAt(changedPosition);
    const afterChange = originalSequence.substring(changedPosition + 1);

    const beforeNewBase = editedSequence.substring(0, changedPosition);
    const newBase = editedSequence.charAt(changedPosition);
    const afterNewBase = editedSequence.substring(changedPosition + 1);

    return (
      <Stack spacing={2} mt={4}>
        <Text fontWeight="bold">Sequence Comparison:</Text>
        <Box fontFamily="monospace" fontSize="md">
          <Text>Original: {beforeChange}<Badge colorScheme="red">{originalBase}</Badge>{afterChange}</Text>
          <Text>Edited:   {beforeNewBase}<Badge colorScheme="green">{newBase}</Badge>{afterNewBase}</Text>
        </Box>
        <Text fontSize="sm" color="gray.600">
          Position changed: {changedPosition} (0-indexed)
        </Text>
      </Stack>
    );
  };

  return (
    <Card p={6} boxShadow="md" borderRadius="lg">
      <Heading size="lg" mb={4}>Gene Sequence Predictor</Heading>
      <Text mb={4}>
        Submit a 20-base DNA sequence to predict optimal Gene editing changes for improved efficiency.
      </Text>
      
      <form onSubmit={handleSubmit}>
        <FormControl isRequired isInvalid={!!error}>
          <FormLabel>DNA Sequence (20 bases)</FormLabel>
          <Input
            value={sequence}
            onChange={(e) => setSequence(e.target.value.toUpperCase())}
            placeholder="ATCGATCGATCGATCGATCG"
            pattern="[ATCGatcg]{20}"
            fontFamily="monospace"
            maxLength={20}
          />
          {error && <FormHelperText color="red.500">{error}</FormHelperText>}
          <FormHelperText>
            Enter exactly 20 DNA bases (A, T, C, G only)
          </FormHelperText>
        </FormControl>

        <Button 
          mt={4} 
          colorScheme="blue" 
          type="submit" 
          isLoading={isLoading}
          loadingText="Predicting..."
          isDisabled={!sequence || sequence.length !== 20}
          width="full"
        >
          Predict Gene Edits
        </Button>
      </form>

      {isLoading && (
        <Flex justify="center" align="center" direction="column" mt={6}>
          <Spinner size="xl" />
          <Text mt={2}>Analyzing DNA sequence...</Text>
        </Flex>
      )}

      {result && (
        <Box mt={6}>
          <Divider mb={4} />
          <Heading size="md" mb={4}>Prediction Results</Heading>
          
          {renderSequenceComparison()}
          
          <HStack spacing={8} mt={6} justify="center">
            <Stat>
              <StatLabel>Original Efficiency</StatLabel>
              <StatNumber>{(result.originalEfficiency * 100).toFixed(2)}%</StatNumber>
              <StatHelpText>Before editing</StatHelpText>
            </Stat>
            
            <Stat>
              <StatLabel>New Efficiency</StatLabel>
              <StatNumber>{(result.efficiency * 100).toFixed(2)}%</StatNumber>
              <StatHelpText>After editing</StatHelpText>
            </Stat>
          </HStack>
          
          <Box mt={4} p={3} bg="gray.50" borderRadius="md">
            <Text fontWeight="bold">Recommended Change:</Text>
            <Text>{result.message}</Text>
          </Box>
        </Box>
      )}
    </Card>
  );
};

export default GenePredictor; 