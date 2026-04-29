import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../../utils/jwt';
import { AuthError } from '../../utils/errors';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new AuthError('Missing or invalid authorization header'));
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    next(new AuthError('Invalid or expired token'));
  }
}
