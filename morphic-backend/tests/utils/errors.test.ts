import { describe, it, expect } from 'vitest';
import { AppError, ValidationError, AuthError, NotFoundError, AIError } from '../../src/utils/errors';

describe('Error classes', () => {
  it('ValidationError has status 400', () => {
    const err = new ValidationError('bad input');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('AuthError has status 401', () => {
    const err = new AuthError('unauthorized');
    expect(err.statusCode).toBe(401);
  });

  it('NotFoundError has status 404', () => {
    const err = new NotFoundError('not found');
    expect(err.statusCode).toBe(404);
  });

  it('AIError has status 502', () => {
    const err = new AIError('AI_TIMEOUT', 'timeout');
    expect(err.statusCode).toBe(502);
    expect(err.code).toBe('AI_TIMEOUT');
  });

  it('all extend AppError', () => {
    expect(new ValidationError('x')).toBeInstanceOf(AppError);
    expect(new AuthError('x')).toBeInstanceOf(AppError);
    expect(new NotFoundError('x')).toBeInstanceOf(AppError);
    expect(new AIError('x', 'x')).toBeInstanceOf(AppError);
  });
});
