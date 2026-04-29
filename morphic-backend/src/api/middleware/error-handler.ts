import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/errors';
import type { ApiResponse } from '../../types';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    const body: ApiResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  console.error('Unexpected error:', err);
  const body: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  };
  res.status(500).json(body);
}
