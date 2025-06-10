import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';
import config from '../config';

/**
 * Global error handler middleware
 */
const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  let statusCode = 500;
  let data: null | Record<string, any> = null;
  let message = 'Internal Server Error';
  let errors: string[] = [];

  // If the error is an ApiError, use its properties
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    data = err.data;
    message = err.message;
    errors = err.errors;
  } else {
    message = err.message || 'Something went wrong';
  }

  // Log error
  logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${statusCode}, Message:: ${message}`);
  
  // Log stack trace in development
  if (config.NODE_ENV === 'development' && err.stack) {
    logger.error(err.stack);
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : undefined,
    data,
    ...(config.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler; 