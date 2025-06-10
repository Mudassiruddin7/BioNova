import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async function to properly catch errors and pass them to Express error handler
 * @param fn Async Express route handler
 */
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler; 