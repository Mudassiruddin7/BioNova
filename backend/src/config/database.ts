import mongoose from 'mongoose';
import config from './index';
import logger from '../utils/logger';

/**
 * Connect to MongoDB database
 */
const connectToDatabase = async (): Promise<void> => {
  try {
    const connection = await mongoose.connect(config.MONGO_URI);
    logger.info(`MongoDB Connected: ${connection.connection.host}`);
  } catch (error) {
    let errorMessage = 'Failed to connect to MongoDB';
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
    }
    logger.error(errorMessage);
    process.exit(1);
  }
};

export default connectToDatabase; 