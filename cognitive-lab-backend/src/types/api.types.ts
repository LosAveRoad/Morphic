// src/types/api.types.ts
export interface APIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    technical?: string;
    retryable: boolean;
    retryAfter?: number;
  };
}

export enum ErrorCode {
  // General errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  RATE_LIMITED = 'RATE_LIMITED',

  // AI model errors
  AI_MODEL_ERROR = 'AI_MODEL_ERROR',
  AI_TIMEOUT = 'AI_TIMEOUT',
  AI_CONTENT_FILTERED = 'AI_CONTENT_FILTERED',

  // Session errors
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_OPTION_ID = 'INVALID_OPTION_ID',
}

export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public technical?: string,
    public retryable: boolean = false,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'APIError';
  }

  toJSON(): APIErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        technical: this.technical,
        retryable: this.retryable,
        retryAfter: this.retryAfter,
      },
    };
  }
}
