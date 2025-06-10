import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import config from '../config';
import mongoose from 'mongoose';

// We'll no longer extend the Request interface here
// Instead we'll use the one from the @types/express directory

/**
 * Middleware to verify JWT token from cookies
 */
export const verifyJWT = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get token from cookie or Authorization header
    const cookieToken = req.cookies?.accessToken;
    const headerToken = req.header('Authorization')?.replace('Bearer ', '');
    const token = cookieToken || headerToken;
    
    if (!token) {
      throw new ApiError(401, 'Unauthorized request');
    }

    try {
      // Verify token
      // Define the expected payload structure
      interface JwtPayload {
        _id: string;
        email?: string;
        walletAddress?: string;
        role?: string;
      }
      
      const decodedToken = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

      // Check if essential '_id' field exists
      if (!decodedToken._id) {
          throw new ApiError(401, 'Invalid token payload: Missing user ID');
      }

      // Set user in request, handling potentially missing fields
      req.user = {
        _id: new mongoose.Types.ObjectId(decodedToken._id),
        email: decodedToken.email,
        walletAddress: decodedToken.walletAddress,
        role: decodedToken.role
      };

      next();
    } catch (error) {
      // Handle specific JWT errors if needed, otherwise generalize
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(401, `Invalid token: ${error.message}`);
      } else if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError(401, 'Your session has expired. Please login again.');
      } else if (error instanceof ApiError) {
        throw error; // Re-throw our custom API errors
      }
      throw new ApiError(401, 'Invalid token');
    }
  }
); 