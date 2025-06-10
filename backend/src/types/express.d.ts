import { IUser } from '../models/user.model';
import mongoose from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: IUser | {
        _id: mongoose.Types.ObjectId;
        email?: string;
        walletAddress?: string;
        role?: string;
      };
    }
  }
} 