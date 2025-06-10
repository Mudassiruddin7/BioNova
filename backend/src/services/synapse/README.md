# Synapse AI Service

## Overview

Synapse is a unified AI assistant service that powers BioNova AI Studio's intelligent features. It integrates with Groq's high-performance LLM inference API to provide fast, context-aware responses using RAG (Retrieval Augmented Generation) for enhanced accuracy and relevance.

## Core Features

- **Unified Architecture**: Consolidated services for improved maintainability and performance
- **Context-Aware Responses**: Integrates knowledge from multiple sources
- **Domain-Specific Intelligence**: Specialized for CRISPR gene analysis, blockchain, and lab monitoring
- **Voice Capabilities**: Audio transcription and text-to-speech conversion
- **Feedback Collection**: User feedback tracking to improve responses
- **Session Management**: Contextual conversation tracking

## Architecture

Synapse uses a consolidated architecture pattern with all functionality in a single core service:

```
synapse/
├── README.md           # Documentation
├── index.ts            # Exports and service initialization
└── synapseCore.service.ts  # Unified service implementation
```

## API Documentation

### General Methods

- `generateText(prompt, systemPrompt, model, userId)`: Generate text with a simple prompt
- `generateChatCompletion(messages, model, userId)`: Generate a response from chat history
- `processUserMessage(message, options)`: Process a complete user message with context

### CRISPR Analysis

- `analyzeCRISPRSequence(sequence, analysisType)`: Analyze a CRISPR sequence
- `generateGuideRNAs(targetSequence, count)`: Generate guide RNAs for a target

### Blockchain

- `getBlockchainGuidance(userId, applicationArea)`: Get blockchain integration guidance

### Session Management

- `createSession(userId, title)`: Create a new chat session
- `getUserSessions(userId)`: Get all sessions for a user
- `deleteSession(sessionId, userId)`: Delete a session

### Feedback

- `submitFeedback(userId, messageId, feedbackType, details)`: Submit user feedback

## Usage Example

```typescript
import { synapseService } from '../services/synapse';

// Generate a simple response
const result = await synapseService.generateText(
  "What is CRISPR technology?",
  undefined, // use default system prompt
  undefined, // use default model
  "user123"
);

console.log(result.data); // The generated response
``` 