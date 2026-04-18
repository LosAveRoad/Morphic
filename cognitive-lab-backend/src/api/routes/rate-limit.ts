// src/api/routes/rate-limit.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';

// Simple in-memory rate limiter
// In production, use Redis-based rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export const rateLimiter = (options: RateLimitOptions = { windowMs: 60000, maxRequests: 100 }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();

    // Get or create client rate limit data
    let clientData = rateLimitMap.get(clientId);

    // Reset if window has expired
    if (!clientData || now > clientData.resetTime) {
      clientData = {
        count: 0,
        resetTime: now + options.windowMs,
      };
      rateLimitMap.set(clientId, clientData);
    }

    // Increment request count
    clientData.count++;

    // Check if limit exceeded
    if (clientData.count > options.maxRequests) {
      const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);

      logger.warn('Rate limit exceeded', {
        clientId,
        count: clientData.count,
        maxRequests: options.maxRequests,
        retryAfter,
      });

      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Please retry after ${retryAfter} seconds.`,
        retryAfter,
      });
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', options.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (options.maxRequests - clientData.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(clientData.resetTime).toISOString());

    next();
  };
};

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [clientId, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(clientId);
    }
  }
}, 5 * 60 * 1000);