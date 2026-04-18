// tests/utils/errors.test.ts
import {
  createError,
  handleAIError,
  handleValidationError,
} from '../../src/utils/errors';
import { ErrorCode, APIError } from '../../src/types/api.types';
import { logger } from '../../src/utils/logger';

// Mock logger to avoid console output during tests
jest.mock('../../src/utils/logger');

describe('Error Utilities', () => {
  describe('createError', () => {
    it('should create an APIError with basic properties', () => {
      const error = createError(ErrorCode.INVALID_REQUEST, 'Invalid input');

      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toBe(ErrorCode.INVALID_REQUEST);
      expect(error.message).toBe('Invalid input');
      expect(error.technical).toBeUndefined();
      expect(error.retryable).toBe(false);
    });

    it('should create an APIError with technical details', () => {
      const error = createError(
        ErrorCode.INTERNAL_ERROR,
        'Internal error',
        'Stack trace details'
      );

      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.message).toBe('Internal error');
      expect(error.technical).toBe('Stack trace details');
    });

    it('should mark retryable errors correctly', () => {
      const timeoutError = createError(
        ErrorCode.AI_TIMEOUT,
        'AI timeout'
      );

      expect(timeoutError.retryable).toBe(true);

      const rateLimitError = createError(
        ErrorCode.RATE_LIMITED,
        'Rate limited'
      );

      expect(rateLimitError.retryable).toBe(true);

      const modelError = createError(
        ErrorCode.AI_MODEL_ERROR,
        'Model error'
      );

      expect(modelError.retryable).toBe(true);
    });

    it('should mark non-retryable errors correctly', () => {
      const invalidRequestError = createError(
        ErrorCode.INVALID_REQUEST,
        'Invalid request'
      );

      expect(invalidRequestError.retryable).toBe(false);

      const sessionNotFoundError = createError(
        ErrorCode.SESSION_NOT_FOUND,
        'Session not found'
      );

      expect(sessionNotFoundError.retryable).toBe(false);
    });

    it('should convert to JSON correctly', () => {
      const error = createError(
        ErrorCode.AI_TIMEOUT,
        'AI timeout',
        'Technical details'
      );

      const json = error.toJSON();

      expect(json).toEqual({
        success: false,
        error: {
          code: ErrorCode.AI_TIMEOUT,
          message: 'AI timeout',
          technical: 'Technical details',
          retryable: true,
          retryAfter: undefined,
        },
      });
    });
  });

  describe('handleAIError', () => {
    it('should handle timeout errors', () => {
      const error = new Error('Request timeout');
      (error as any).code = 'ETIMEDOUT';

      const apiError = handleAIError(error);

      expect(apiError.code).toBe(ErrorCode.AI_TIMEOUT);
      expect(apiError.message).toBe('AI服务响应超时，请稍后重试');
      expect(apiError.technical).toBe('Request timeout');
      expect(apiError.retryable).toBe(true);
    });

    it('should handle timeout errors with timeout in message', () => {
      const error = new Error('Connection timeout occurred');

      const apiError = handleAIError(error);

      expect(apiError.code).toBe(ErrorCode.AI_TIMEOUT);
      expect(apiError.message).toBe('AI服务响应超时，请稍后重试');
      expect(apiError.retryable).toBe(true);
    });

    it('should handle rate limit errors (429)', () => {
      const error = new Error('Rate limit exceeded');
      (error as any).response = {
        status: 429,
        data: 'Rate limit details',
      };

      const apiError = handleAIError(error);

      expect(apiError.code).toBe(ErrorCode.RATE_LIMITED);
      expect(apiError.message).toBe('AI服务调用过于频繁，请稍后重试');
      expect(apiError.retryable).toBe(true);
    });

    it('should handle bad request errors (400)', () => {
      const error = new Error('Bad request');
      (error as any).response = {
        status: 400,
        data: { error: 'Invalid parameters' },
      };

      const apiError = handleAIError(error);

      expect(apiError.code).toBe(ErrorCode.AI_MODEL_ERROR);
      expect(apiError.message).toBe('AI请求格式错误');
      expect(apiError.technical).toEqual({ error: 'Invalid parameters' });
      expect(apiError.retryable).toBe(true);
    });

    it('should handle generic AI model errors', () => {
      const error = new Error('Unknown AI error');
      (error as any).response = {
        status: 500,
      };

      const apiError = handleAIError(error);

      expect(apiError.code).toBe(ErrorCode.AI_MODEL_ERROR);
      expect(apiError.message).toBe('AI服务暂时不可用，请稍后重试');
      expect(apiError.technical).toBe('Unknown AI error');
      expect(apiError.retryable).toBe(true);
    });

    it('should log errors', () => {
      const error = new Error('Test error');
      handleAIError(error);

      expect(logger.error).toHaveBeenCalledWith('AI model error', error);
    });
  });

  describe('handleValidationError', () => {
    it('should create validation error with field and message', () => {
      const error = handleValidationError('email', 'Invalid email format');

      expect(error.code).toBe(ErrorCode.INVALID_REQUEST);
      expect(error.message).toBe('email: Invalid email format');
      expect(error.technical).toBeUndefined();
      expect(error.retryable).toBe(false);
    });

    it('should handle different field names', () => {
      const error = handleValidationError('sessionId', 'Session ID is required');

      expect(error.message).toBe('sessionId: Session ID is required');
      expect(error.code).toBe(ErrorCode.INVALID_REQUEST);
    });

    it('should always return non-retryable errors', () => {
      const error = handleValidationError('field', 'Validation failed');

      expect(error.retryable).toBe(false);
    });
  });
});
