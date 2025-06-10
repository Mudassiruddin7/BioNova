'use client';

import React from 'react';
import { Container, Heading, Text, Box, VStack } from '@chakra-ui/react';
import GenePredictor from '@/components/genePredictor/GenePredictor';
import { PageHeader } from '@/components/layouts/PageHeader';

export default function GenePageClient() {
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <PageHeader
          title="Gene Sequence Predictor"
          subtitle="Optimize your gene editing experiments with AI-powered sequence predictions"
        />
        
        <Box mb={6}>
          <Text fontSize="lg">
            Our Gene sequence prediction tool uses deep learning to analyze your DNA sequences 
            and suggest optimal edits to improve gene editing efficiency. Simply enter your 
            target 20-base sequence, and our model will predict the most effective edit.
          </Text>
        </Box>

        <GenePredictor />
      </VStack>
    </Container>
  );
} 