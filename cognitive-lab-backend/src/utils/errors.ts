// src/utils/errors.ts
import { APIError, ErrorCode } from '../types/api.types';
import { logger } from './logger';

export function createError(
  code: ErrorCode,
  message: string,
  technical?: string
): APIError {
  const retryable = [
    ErrorCode.AI_TIMEOUT,
    ErrorCode.RATE_LIMITED,
    ErrorCode.AI_MODEL_ERROR,
  ].includes(code);

  return new APIError(code, message, technical, retryable);
}

export function handleAIError(error: any): APIError {
  logger.error('AI model error', error);

  if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
    return createError(
      ErrorCode.AI_TIMEOUT,
      'AI服务响应超时，请稍后重试',
      error.message
    );
  }

  if (error.response?.status === 429) {
    return createError(
      ErrorCode.RATE_LIMITED,
      'AI服务调用过于频繁，请稍后重试',
      error.message
    );
  }

  if (error.response?.status === 400) {
    return createError(
      ErrorCode.AI_MODEL_ERROR,
      'AI请求格式错误',
      error.response.data
    );
  }

  return createError(
    ErrorCode.AI_MODEL_ERROR,
    'AI服务暂时不可用，请稍后重试',
    error.message
  );
}

export function handleValidationError(
  field: string,
  message: string
): APIError {
  const error = createError(
    ErrorCode.INVALID_REQUEST,
    `${field}: ${message}`,
    undefined
  );
  // Override retryable to false for validation errors
  error.retryable = false;
  return error;
}
