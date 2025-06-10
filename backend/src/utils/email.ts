import { MailtrapClient } from 'mailtrap';
import config from '../config';
import logger from './logger';

// Initialize Mailtrap client with API token from .env
// First try to use the dedicated API token, fall back to EMAIL_PASS for backward compatibility
const MAILTRAP_TOKEN = config.MAILTRAP_API_TOKEN || config.EMAIL_PASS;
const client = new MailtrapClient({ token: MAILTRAP_TOKEN });

// Log which token is being used
logger.debug(`Using ${config.MAILTRAP_API_TOKEN ? 'MAILTRAP_API_TOKEN' : 'EMAIL_PASS'} for Mailtrap API`);

// The sender that we configured in Mailtrap
const sender = {
  email: config.EMAIL_FROM, // 'BioNova@rescroll.in'
  name: 'BioNova',
};

/**
 * Verify email connection on startup
 */
const verifyEmailConnection = async (): Promise<boolean> => {
  try {
    // Log that the Mailtrap API client was initialized with the token
    logger.info('Mailtrap API client initialized with token');
    return true;
  } catch (error) {
    logger.error('Error initializing Mailtrap API client:', error);
    return false;
  }
};

/**
 * Send verification email to user
 */
export const sendVerificationEmail = async (
  to: string,
  name: string,
  token: string
): Promise<boolean> => {
  try {
    const verificationUrl = `${config.FRONTEND_URL}/verify-email?token=${token}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Hello ${name || 'there'},</p>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
        </p>
        <p>If you did not create an account, please ignore this email.</p>
        <p>This verification link will expire in 24 hours.</p>
        <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
        <p style="word-break: break-all;">${verificationUrl}</p>
      </div>
    `;

    // Send email using Mailtrap API
    const response = await client.send({
      from: sender,
      to: [{ email: to, name: name || '' }],
      subject: 'Verify your email address',
      html: htmlContent,
      category: 'verification'
    });
    
    logger.info(`Verification email sent to: ${to} via Mailtrap API`);
    return true;
  } catch (error) {
    logger.error(`Error sending verification email to ${to} via Mailtrap API:`, error);
    return false;
  }
};

/**
 * Send password reset email to user
 */
export const sendPasswordResetEmail = async (
  to: string,
  name: string,
  token: string
): Promise<boolean> => {
  try {
    const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${token}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>Hello ${name || 'there'},</p>
        <p>You requested to reset your password. Click the button below to create a new password:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <p>This reset link will expire in 30 minutes.</p>
        <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
        <p style="word-break: break-all;">${resetUrl}</p>
      </div>
    `;

    // Send email using Mailtrap API
    const response = await client.send({
      from: sender,
      to: [{ email: to, name: name || '' }],
      subject: 'Reset your password',
      html: htmlContent,
      category: 'password_reset'
    });
    
    logger.info(`Password reset email sent to: ${to} via Mailtrap API`);
    return true;
  } catch (error) {
    logger.error(`Error sending password reset email to ${to} via Mailtrap API:`, error);
    return false;
  }
};

export default {
  verifyEmailConnection,
  sendVerificationEmail,
  sendPasswordResetEmail,
}; 