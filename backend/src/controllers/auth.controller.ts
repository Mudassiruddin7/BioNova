import { Request, Response, CookieOptions } from 'express';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import User, { IUser } from '../models/user.model';
import Profile from '../models/profile.model';
import config from '../config';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import emailService from '../utils/email';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

// Extended request with typed user property
export interface AuthenticatedRequest extends Request {
  user: {
    _id: mongoose.Types.ObjectId;
    email?: string;
    walletAddress?: string;
    role?: string;
  };
}

// Options for cookies
const cookieOptions: CookieOptions = {
  httpOnly: true,
  // In development, cookies should NOT be secure (http works)
  // In production, cookies must be secure (https required)
  secure: config.NODE_ENV === 'production',
  // For cross-site requests (like OAuth flows), 'none' is needed
  // But 'none' requires 'secure: true', so we need to handle differently for dev
  sameSite: config.NODE_ENV === 'development' ? 'lax' : 'none',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/',
};

// When clearing cookies on logout, use the same settings
const clearCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: config.NODE_ENV === 'development' ? 'lax' : 'none',
  path: '/',
};

/**
 * Login as a guest user
 */
export const loginAsGuest = asyncHandler(async (req: Request, res: Response) => {
  // Generate a unique ID for the guest
  const guestId = uuidv4();
  
  // Create a temporary guest user
  const guestUser = await User.create({
    name: `Guest-${guestId.substring(0, 8)}`,
    role: 'guest',
    authProvider: 'guest',
    isVerified: true, // Guest users are auto-verified
    guestId: guestId,
  });

  // Create profile
  await Profile.create({
    userId: guestUser._id,
    onboardingCompleted: false,
  });

  // Generate access token
  const accessToken = guestUser.generateAccessToken();

  // Set cookie
  res.cookie('accessToken', accessToken, cookieOptions);

  // Return response
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          id: guestUser._id,
          name: guestUser.name,
          role: guestUser.role,
          isGuest: true,
          guestId: guestId,
          preferences: guestUser.preferences,
        },
        accessToken,
      },
      'Guest login successful'
    )
  );
});

/**
 * Login or register user with wallet address
 */
export const loginWithWallet = asyncHandler(async (req: Request, res: Response) => {
  const { walletAddress } = req.body;

  if (!walletAddress) {
    throw new ApiError(400, 'Wallet address is required');
  }

  // Normalize wallet address (lowercase)
  const normalizedWalletAddress = walletAddress.toLowerCase();

  // Find or create user
  let user = await User.findOne({ walletAddress: normalizedWalletAddress });
  
  if (!user) {
    // Create new user
    user = await User.create({
      walletAddress: normalizedWalletAddress,
      role: 'user',
      authProvider: 'wallet',
      isVerified: true, // Wallet users are automatically verified
    });

    // Create profile
    await Profile.create({
      userId: user._id,
      onboardingCompleted: false,
    });
  }

  // Generate access token
  const accessToken = user.generateAccessToken();

  // Set cookie
  res.cookie('accessToken', accessToken, cookieOptions);

  // Return response
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          id: user._id,
          walletAddress: user.walletAddress,
          role: user.role,
          preferences: user.preferences,
          profileImageUrl: user.profileImageUrl,
          isVerified: user.isVerified,
        },
        accessToken,
      },
      'User logged in successfully'
    )
  );
});

/**
 * Register user with email and password
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpire = new Date(Date.now() + config.EMAIL_VERIFICATION_EXPIRY);

  // Create user
  const user = await User.create({
    email,
    password: hashedPassword,
    name,
    role: 'user',
    authProvider: 'email',
    isVerified: false, // Email users need verification
    verificationToken,
    verificationExpire,
  });

  // Create profile
  await Profile.create({
    userId: user._id,
    onboardingCompleted: false,
  });

  // Send verification email
  await emailService.sendVerificationEmail(
    email,
    name || '',
    verificationToken
  );

  // Return response without password
  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
      'User registered successfully. Please check your email to verify your account.'
    )
  );
});

/**
 * Login user with email and password
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  // Find user
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Check if user is using email authentication
  if (user.authProvider !== 'email') {
    throw new ApiError(400, `This account uses ${user.authProvider} for authentication. Please login with ${user.authProvider}.`);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Check if user is verified
  if (!user.isVerified) {
    throw new ApiError(403, 'Please verify your email before logging in');
  }

  // Generate access token
  const accessToken = user.generateAccessToken();

  // Set cookie
  res.cookie('accessToken', accessToken, cookieOptions);

  // Return response
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          preferences: user.preferences,
          profileImageUrl: user.profileImageUrl,
          isVerified: user.isVerified,
        },
        accessToken,
      },
      'User logged in successfully'
    )
  );
});

/**
 * Verify user email with token
 */
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  console.log('Email verification request received:', { token: token ? `${token.substring(0, 6)}...${token.substring(token.length - 6)}` : 'undefined' });

  if (!token) {
    console.error('Email verification failed: No token provided');
    throw new ApiError(400, 'Verification token is required');
  }

  // Find user with this token
  console.log('Searching for user with verification token...');
  const user = await User.findOne({
    verificationToken: token,
    verificationExpire: { $gt: Date.now() }
  });

  if (!user) {
    console.error('Email verification failed: Invalid or expired token');
    throw new ApiError(400, 'Invalid or expired verification token');
  }

  console.log(`User found: ${user.email}, updating verification status...`);
  
  // Update user verification status
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationExpire = undefined;
  await user.save();

  console.log(`Email verified successfully for user: ${user.email}`);

  // Return success response
  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      'Email verified successfully. You can now log in.'
    )
  );
});

/**
 * Resend verification email
 */
export const resendVerificationEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  // Find user by email
  const user = await User.findOne({ email });
  
  if (!user) {
    // Don't reveal that user doesn't exist
    return res.status(200).json(
      new ApiResponse(200, {}, 'If your email exists in our system, a verification email has been sent.')
    );
  }

  // Check if user is already verified
  if (user.isVerified) {
    return res.status(400).json(
      new ApiResponse(400, {}, 'Email is already verified')
    );
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpire = new Date(Date.now() + config.EMAIL_VERIFICATION_EXPIRY);

  // Update user with new token
  user.verificationToken = verificationToken;
  user.verificationExpire = verificationExpire;
  await user.save();

  // Send verification email
  await emailService.sendVerificationEmail(
    email,
    user.name || '',
    verificationToken
  );

  // Return success response
  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      'Verification email has been sent. Please check your inbox.'
    )
  );
});

/**
 * Logout user
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // Clear cookie using the consistent options
  res.clearCookie('accessToken', clearCookieOptions);

  // Return response
  return res.status(200).json(
    new ApiResponse(200, {}, 'User logged out successfully')
  );
});

/**
 * Login or register with Google
 */
export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const { idToken, name, email } = req.body;

  if (!idToken || !email) {
    throw new ApiError(400, 'Google ID token and email are required');
  }

  // Verify the ID token with Google - in a real implementation
  // Here we're just accepting the token and email from the frontend
  // In a production app, use the google-auth-library to verify the token

  // Find user by email
  let user = await User.findOne({ email });

  if (user) {
    // User exists - check auth provider
    if (!user.googleId) {
      user.googleId = idToken.split('.')[0]; // Just using a part of the token as an ID for demo
      user.isVerified = true; // Mark as verified since this is Google auth
      await user.save();
    }
  } else {
    // Create new user
    user = await User.create({
      email,
      name: name || email.split('@')[0],
      googleId: idToken.split('.')[0], // Just using a part of the token as an ID for demo
      authProvider: 'google',
      isVerified: true, // Google users are automatically verified
      role: 'user',
    });

    // Create profile
    await Profile.create({
      userId: user._id,
      onboardingCompleted: false,
    });
  }

  // Generate access token
  const accessToken = user.generateAccessToken();

  // Set cookie
  res.cookie('accessToken', accessToken, cookieOptions);

  // Return response
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          preferences: user.preferences,
          profileImageUrl: user.profileImageUrl,
          authProvider: user.authProvider,
          isVerified: user.isVerified,
        },
        accessToken,
      },
      'Google authentication successful'
    )
  );
});

/**
 * Get current user
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  // User should be available from auth middleware
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized request');
  }
  
  // Type assertion to get proper TypeScript support
  const authReq = req as AuthenticatedRequest;
  
  // Find user by ID
  const user = await User.findById(authReq.user._id).select('-__v -password');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Add profile information if needed
  await user.populate('profile');

  // Return response
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          walletAddress: user.walletAddress,
          role: user.role,
          preferences: user.preferences,
          profileImageUrl: user.profileImageUrl,
          authProvider: user.authProvider,
          isVerified: user.isVerified,
          onboardingCompleted: user.profile?.onboardingCompleted
        },
      },
      'User fetched successfully'
    )
  );
});

/**
 * Forgot password - sends a reset email with token
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal that the user doesn't exist
    return res.status(200).json(
      new ApiResponse(200, {}, 'Password reset email sent, if email exists')
    );
  }
  
  // Check if user is a wallet user
  if (user.authProvider === 'wallet') {
    return res.status(400).json(
      new ApiResponse(400, {}, 'This account uses wallet authentication. Password reset is not applicable.')
    );
  }

  // Check if user is a Google user
  if (user.authProvider === 'google') {
    return res.status(400).json(
      new ApiResponse(400, {}, 'This account uses Google authentication. Password reset is not applicable.')
    );
  }

  // Check if user is verified
  if (!user.isVerified) {
    return res.status(400).json(
      new ApiResponse(400, {}, 'Please verify your email address first. Check your inbox for a verification email.')
    );
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash the token and set to resetPasswordToken field
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set expiry to match config
  user.resetPasswordExpire = new Date(Date.now() + config.PASSWORD_RESET_EXPIRY);
  
  await user.save();

  // Send the password reset email
  await emailService.sendPasswordResetEmail(
    email,
    user.name || '',
    resetToken
  );

  // Return response
  return res.status(200).json(
    new ApiResponse(
      200, 
      {}, 
      'Password reset email sent. Please check your inbox.'
    )
  );
});

/**
 * Reset password using token
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw new ApiError(400, 'Token and new password are required');
  }

  // Hash the token from params
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with this token and valid expiry
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired token');
  }

  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);
  
  // Clear reset token fields
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  
  await user.save();

  // Return success
  return res.status(200).json(
    new ApiResponse(200, {}, 'Password reset successful')
  );
});

/**
 * Change password (when user is logged in)
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!req.user) {
    throw new ApiError(401, 'Unauthorized request');
  }
  
  // Type assertion to get proper TypeScript support
  const authReq = req as AuthenticatedRequest;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current password and new password are required');
  }

  // Find user by ID with password
  const user = await User.findById(authReq.user._id).select('+password');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  // Check auth provider
  if (user.authProvider === 'wallet') {
    throw new ApiError(400, 'Password change is not applicable for wallet-based accounts.');
  }

  if (user.authProvider === 'google') {
    throw new ApiError(400, 'Password change is not applicable for Google-based accounts.');
  }

  // Check if password exists in user document
  if (!user.password) {
    throw new ApiError(400, 'User does not have a password set. Try setting a password first.');
  }

  // Check if current password is correct
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  
  await user.save();

  // Return success
  return res.status(200).json(
    new ApiResponse(200, {}, 'Password changed successfully')
  );
}); 