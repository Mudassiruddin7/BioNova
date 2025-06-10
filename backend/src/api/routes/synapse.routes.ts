import express from 'express';
import { synapseController } from '../../controllers/synapse.controller';
import { verifyJWT } from '../../middleware/auth';

const router = express.Router();

/**
 * Synapse AI Assistant Routes
 * Unified API for all AI-related functionality
 */

// Public endpoints (no authentication required)
router.post('/chat', synapseController.handleChatCompletion);
router.post('/onboarding-chat', synapseController.handleOnboardingChat);
router.get('/system-info', synapseController.getSystemInfo);

// Apply authentication middleware to all protected routes
router.use(verifyJWT);

// Chat message endpoints
router.post('/bot/message', synapseController.processMessage);
router.post('/agent/message', synapseController.processAgentMessage);
router.post('/message', synapseController.processUserMessage);

// Session management
router.post('/chat/session', synapseController.createSession);
router.get('/chat/sessions', synapseController.getUserSessions);
router.get('/chat/sessions/:sessionId/history', synapseController.getSessionHistory);
router.delete('/chat/sessions/:sessionId', synapseController.deleteSession);

// Feedback endpoints
router.post('/feedback', synapseController.submitFeedback);
router.get('/feedback/stats', synapseController.getUserFeedbackStats);

export default router; 