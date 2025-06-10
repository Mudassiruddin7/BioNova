import { IUser } from '../../models/user.model';

// Type definitions for Express
// This extends Express.Request to add the user property

declare namespace Express {
  interface Request {
    user?: {
      _id: string;
      email?: string;
      walletAddress?: string;
      role?: string;
    };
  }
}

export {}; 