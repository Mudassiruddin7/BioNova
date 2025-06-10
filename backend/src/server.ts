import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { createWriteStream } from 'fs';

import config from './config';
import connectToDatabase from './config/database';
import { setSocketIOInstance } from './services/labIoTService';
import { initializeIO } from './utils/socketio';
import logger from './utils/logger';
import ApiError from './utils/ApiError';
import apiRoutes from './api';
import emailService from './utils/email';

// Create Express app
const app = express();

// Set up access log stream
const accessLogStream = createWriteStream(
  path.join(__dirname, '../logs/access.log'),
  { flags: 'a' }
);

// Middleware
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 204,
  preflightContinue: false,
  maxAge: 86400
}));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser(config.COOKIE_SECRET));
app.use(morgan('combined', { stream: accessLogStream }));

// Routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// Error handler middleware
app.use((err: Error | ApiError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || 'Something went wrong';
  
  logger.error(`Error: ${message}`, { 
    path: req.path,
    method: req.method,
    statusCode 
  });
  
  res.status(statusCode).json({
    success: false,
    message,
    stack: config.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Create HTTP server
const server = http.createServer(app);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Verify email service connection
    await emailService.verifyEmailConnection();

    // Initialize Socket.IO in utils for global access (only initialize once)
    const ioInstance = initializeIO(server);
    
    // Share the Socket.IO instance with labIoTService instead of initializing again
    setSocketIOInstance(ioInstance);

    // Start server
    server.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Start server
startServer(); 