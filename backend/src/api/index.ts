import express from 'express';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import iotRoutes from './routes/iot.routes';
import synapseRoutes from './routes/synapse.routes';
import healthRoutes from './routes/health.routes';
import geneRoutes from './routes/gene.routes';
import transactionRoutes from './routes/transaction.routes';

const router = express.Router();

/**
 * API Routes
 * 
 * All API routes are prefixed with /api
 * This is registered in server.ts
 */

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes
router.use('/auth', authRoutes);

// Profile routes
router.use('/profile', profileRoutes);

// Gene prediction/analysis routes
router.use('/gene', geneRoutes);

// Blockchain transaction routes
router.use('/transactions', transactionRoutes);

// IoT/Lab monitoring routes
router.use('/iot', iotRoutes);

// Synapse AI Assistant routes
router.use('/synapse', synapseRoutes);

export default router; 