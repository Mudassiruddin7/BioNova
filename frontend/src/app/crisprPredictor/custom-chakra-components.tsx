'use client';

import React, { ReactNode } from 'react';
import { Box, Text } from '@chakra-ui/react';

// Simple FormControl adapter
export const FormControl: React.FC<{
  isRequired?: boolean;
  isInvalid?: boolean;
  children: ReactNode;
}> = ({ children, isInvalid }) => {
  return (
    <Box mb={4} className={isInvalid ? 'border-red-500' : ''}>
      {children}
    </Box>
  );
};

// Simple FormLabel adapter
export const FormLabel: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  return <Text as="label" display="block" mb={2} fontWeight="medium">{children}</Text>;
};

// Simple FormHelperText adapter
export const FormHelperText: React.FC<{
  children: ReactNode;
  color?: string;
}> = ({ children, color }) => {
  return <Text fontSize="sm" color={color || "gray.600"} mt={1}>{children}</Text>;
};

// Simple Divider adapter
export const Divider: React.FC = () => {
  return <Box h="1px" bg="gray.200" my={4} />;
};

// Simple Stat adapter
export const Stat: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  return <Box textAlign="center">{children}</Box>;
};

// Simple StatLabel adapter
export const StatLabel: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  return <Text color="gray.500" fontSize="sm">{children}</Text>;
};

// Simple StatNumber adapter
export const StatNumber: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  return <Text fontSize="2xl" fontWeight="bold">{children}</Text>;
};

// Simple StatHelpText adapter
export const StatHelpText: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  return <Text fontSize="xs" color="gray.500">{children}</Text>;
};

// Simple useToast hook adapter
export const useToast = () => {
  return (props: any) => {
    // Fallback to console and alert
    console.log(`Toast: ${props.title} - ${props.description}`);
    if (props.status === 'error') {
      alert(`Error: ${props.description}`);
    }
  };
}; 