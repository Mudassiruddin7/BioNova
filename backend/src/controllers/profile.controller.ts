import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import Profile from '../models/profile.model';
import User from '../models/user.model';
import mongoose from 'mongoose';

// Extended request with typed user property
interface AuthenticatedRequest extends Request {
  user: {
    _id: mongoose.Types.ObjectId;
    email?: string;
    walletAddress?: string;
    role?: string;
  };
}

/**
 * Get user profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  // User should be available from auth middleware
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized request');
  }

  // Type assertion to get proper TypeScript support
  const authReq = req as AuthenticatedRequest;

  // Find profile by user ID
  const profile = await Profile.findOne({ userId: authReq.user._id }).select('-__v');

  if (!profile) {
    throw new ApiError(404, 'Profile not found');
  }

  // Return response
  return res.status(200).json(
    new ApiResponse(
      200,
      { profile },
      'Profile fetched successfully'
    )
  );
});

/**
 * Update user profile - onboarding information
 */
export const updateOnboardingProfile = asyncHandler(async (req: Request, res: Response) => {
  // User should be available from auth middleware
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized request');
  }

  // Type assertion to get proper TypeScript support
  const authReq = req as AuthenticatedRequest;

  const { role, experienceLevel, interests } = req.body;

  // Validate required fields
  if (!role || !experienceLevel) {
    throw new ApiError(400, 'Role and experience level are required');
  }

  // Find and update profile
  const profile = await Profile.findOneAndUpdate(
    { userId: authReq.user._id },
    {
      role,
      experienceLevel,
      interests: interests || [],
      onboardingCompleted: true,
    },
    { new: true, runValidators: true }
  );

  if (!profile) {
    throw new ApiError(404, 'Profile not found');
  }

  // Return response
  return res.status(200).json(
    new ApiResponse(
      200,
      { profile },
      'Profile updated successfully'
    )
  );
});

/**
 * Update user preferences
 */
export const updatePreferences = asyncHandler(async (req: Request, res: Response) => {
  // User should be available from auth middleware
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized request');
  }

  // Type assertion to get proper TypeScript support
  const authReq = req as AuthenticatedRequest;

  const { theme, aiVoice } = req.body;

  // Update user preferences
  const user = await User.findByIdAndUpdate(
    authReq.user._id,
    {
      'preferences.theme': theme,
      'preferences.aiVoice': aiVoice,
    },
    { new: true, runValidators: true }
  ).select('-__v');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Return response
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        preferences: user.preferences,
      },
      'Preferences updated successfully'
    )
  );
});

/**
 * Add recent activity
 */
export const addRecentActivity = asyncHandler(async (req: Request, res: Response) => {
  // User should be available from auth middleware
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized request');
  }

  // Type assertion to get proper TypeScript support
  const authReq = req as AuthenticatedRequest;

  const { type, data } = req.body;

  // Validate required fields
  if (!type || !data) {
    throw new ApiError(400, 'Activity type and data are required');
  }

  // Find profile
  const profile = await Profile.findOne({ userId: authReq.user._id });

  if (!profile) {
    throw new ApiError(404, 'Profile not found');
  }

  // Add activity to beginning of array
  profile.recentActivity.unshift({
    type,
    data,
    timestamp: new Date(),
  });

  // Keep only the latest 10 activities
  if (profile.recentActivity.length > 10) {
    profile.recentActivity = profile.recentActivity.slice(0, 10);
  }

  // Save profile
  await profile.save();

  // Return response
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        recentActivity: profile.recentActivity,
      },
      'Activity added successfully'
    )
  );
}); 