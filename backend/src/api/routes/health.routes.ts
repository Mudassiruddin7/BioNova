import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import asyncHandler from '../../utils/asyncHandler';
import ApiResponse from '../../utils/ApiResponse';
import emailService from '../../utils/email';
import config from '../../config';
import logger from '../../utils/logger';

const router = Router();

/**
 * @route GET /api/health
 * @desc Get detailed health status of backend services
 * @access Public
 */
router.get(
  '/',
  asyncHandler(async (_: Request, res: Response) => {
    const startTime = Date.now();
    
    // MongoDB connection status
    const mongoStatus = mongoose.connection.readyState === 1;
    
    // Email service status
    let emailServiceStatus = false;
    try {
      emailServiceStatus = await emailService.verifyEmailConnection();
    } catch (error) {
      logger.error('Error checking email service health:', error);
    }

    // Overall system status
    const systemStatus = {
      status: mongoStatus && emailServiceStatus ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      services: {
        mongodb: {
          connected: mongoStatus,
          message: mongoStatus ? 'Connected' : 'Disconnected',
        },
        email: {
          connected: emailServiceStatus,
          message: emailServiceStatus ? 'Connected' : 'Disconnected',
          provider: 'Mailtrap API',
        },
      },
      responseTime: `${Date.now() - startTime}ms`,
    };

    return res.status(200).json(
      new ApiResponse(
        200,
        systemStatus,
        'Health check completed successfully'
      )
    );
  })
);

/**
 * @route GET /api/health/ping
 * @desc Simple ping endpoint to check if API is responsive
 * @access Public
 */
router.get('/ping', (_: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'pong' });
});

export default router; 