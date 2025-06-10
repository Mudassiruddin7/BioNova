import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <Box mb={6}>
      <Heading as="h1" size="xl" mb={2} fontWeight="bold" color="blue.500">
        {title}
      </Heading>
      {subtitle && (
        <Text fontSize="lg" color="gray.600">
          {subtitle}
        </Text>
      )}
    </Box>
  );
} 