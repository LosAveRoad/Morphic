// src/api/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../../utils/jwt';
import { UnauthorizedError } from './error-handler';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    // Verify token
    const payload = verifyToken(token);

    // Attach user info to request
    req.user = {
      id: payload.sub,
      email: payload.email,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }
    return next(new UnauthorizedError('Invalid or expired token'));
  }
};