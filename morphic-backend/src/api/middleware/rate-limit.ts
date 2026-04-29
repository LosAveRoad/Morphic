import { Request, Response, NextFunction } from 'express';
import { config } from '../../config';
import { AppError } from '../../utils/errors';

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimitMiddleware(req: Request, _res: Response, next: NextFunction) {
  const key = req.user?.userId ?? req.ip ?? 'anonymous';
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + config.rateLimit.windowMs });
    next();
    return;
  }

  if (bucket.count >= config.rateLimit.max) {
    next(new AppError(429, 'RATE_LIMITED', 'Too many requests, please slow down'));
    return;
  }

  bucket.count++;
  next();
}

// Clean up expired buckets every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) {
      buckets.delete(key);
    }
  }
}, 10 * 60 * 1000);
