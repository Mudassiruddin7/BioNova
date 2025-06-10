import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Environment configuration
const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '8000'),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/BioNova',
  
  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '30d',
  
  // Cookie configuration
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'cookie-secret-change-in-production',
  
  // Groq API configuration
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  
  // Frontend URL for CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Base blockchain configuration (for read-only checks)
  RPC_URL: process.env.RPC_URL || 'https://sepolia.base.org',
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || '',
  
  // Prediction Service URL
  PREDICTION_SERVICE_URL: process.env.PREDICTION_SERVICE_URL || 'http://localhost:4000',
  
  // Email configuration
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587'),
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || '"BioNova" <noreply@BioNova.ai>',
  MAILTRAP_API_TOKEN: process.env.MAILTRAP_API_TOKEN || '',
  
  // Token expiry times (in milliseconds)
  EMAIL_VERIFICATION_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_RESET_EXPIRY: 30 * 60 * 1000, // 30 minutes
};

// Validate required environment variables
const requiredEnvVars = ['GROQ_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !config[envVar as keyof typeof config]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

export default config; 