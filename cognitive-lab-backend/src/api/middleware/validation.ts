// src/api/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../../utils/logger';

export interface ValidationSchema {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}

export const validate =
  (schema: ValidationSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (schema.body) {
        const { error, value } = schema.body.validate(req.body, {
          abortEarly: false,
          stripUnknown: true,
        });

        if (error) {
          const validationErrors = error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
          }));

          logger.warn('Request body validation failed', {
            path: req.path,
            errors: validationErrors,
          });

          return res.status(400).json({
            error: 'Validation Error',
            message: 'Request body validation failed',
            details: validationErrors,
          });
        }

        // Replace request body with sanitized value
        req.body = value;
      }

      // Validate request query
      if (schema.query) {
        const { error, value } = schema.query.validate(req.query, {
          abortEarly: false,
          stripUnknown: true,
        });

        if (error) {
          const validationErrors = error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
          }));

          logger.warn('Request query validation failed', {
            path: req.path,
            errors: validationErrors,
          });

          return res.status(400).json({
            error: 'Validation Error',
            message: 'Request query validation failed',
            details: validationErrors,
          });
        }

        // Replace request query with sanitized value
        req.query = value;
      }

      // Validate request params
      if (schema.params) {
        const { error, value } = schema.params.validate(req.params, {
          abortEarly: false,
          stripUnknown: true,
        });

        if (error) {
          const validationErrors = error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
          }));

          logger.warn('Request params validation failed', {
            path: req.path,
            errors: validationErrors,
          });

          return res.status(400).json({
            error: 'Validation Error',
            message: 'Request params validation failed',
            details: validationErrors,
          });
        }

        // Replace request params with sanitized value
        req.params = value;
      }

      next();
    } catch (error) {
      logger.error('Validation middleware error', {
        error: error instanceof Error ? error.message : String(error),
        path: req.path,
      });

      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred during validation',
      });
    }
  };

// Validation schemas for API endpoints
export const validationSchemas = {
  recommendOptions: {
    body: Joi.object({
      canvasContext: Joi.object({
        nearbyContent: Joi.array()
          .items(Joi.string().min(1))
          .min(1)
          .max(50)
          .required()
          .messages({
            'array.min': 'nearbyContent must contain at least 1 item',
            'array.max': 'nearbyContent must contain at most 50 items',
            'string.empty': 'nearbyContent items cannot be empty strings',
          }),
        userHistory: Joi.array()
          .items(Joi.string().min(1))
          .max(100)
          .optional()
          .messages({
            'array.max': 'userHistory must contain at most 100 items',
            'string.empty': 'userHistory items cannot be empty strings',
          }),
        currentTheme: Joi.string().max(200).optional().messages({
          'string.max': 'currentTheme must be at most 200 characters',
        }),
      })
        .required()
        .messages({
          'any.required': 'canvasContext is required',
        }),
      sessionId: Joi.string().uuid().optional().messages({
        'string.guid': 'sessionId must be a valid UUID',
      }),
    }),
  },

  generateContent: {
    body: Joi.object({
      sessionId: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'sessionId must be a valid UUID',
          'any.required': 'sessionId is required',
        }),
      selectedOptionId: Joi.string().min(1).max(100).optional().messages({
        'string.min': 'selectedOptionId must be at least 1 character',
        'string.max': 'selectedOptionId must be at most 100 characters',
      }),
      userInput: Joi.string().min(1).max(5000).optional().messages({
        'string.min': 'userInput must be at least 1 character',
        'string.max': 'userInput must be at most 5000 characters',
      }),
      context: Joi.object({
        userPreferences: Joi.object({
          style: Joi.string()
            .valid('academic', 'casual', 'minimal')
            .optional()
            .messages({
              'any.only': 'style must be one of: academic, casual, minimal',
            }),
          language: Joi.string()
            .valid('zh-CN', 'en-US')
            .optional()
            .messages({
              'any.only': 'language must be either zh-CN or en-US',
            }),
          outputFormat: Joi.array()
            .items(Joi.string().valid('text', 'html', 'image'))
            .min(1)
            .max(3)
            .optional()
            .messages({
              'array.min': 'outputFormat must contain at least 1 item',
              'array.max': 'outputFormat must contain at most 3 items',
              'any.only': 'outputFormat items must be one of: text, html, image',
            }),
        }).optional(),
        additionalContext: Joi.string().max(2000).optional().messages({
          'string.max': 'additionalContext must be at most 2000 characters',
        }),
      }).optional(),
    })
      .or('selectedOptionId', 'userInput')
      .messages({
        'object.missing': 'Either selectedOptionId or userInput must be provided',
        'any.required': 'Either selectedOptionId or userInput must be provided',
      }),
  },

  register: {
    body: Joi.object({
      email: Joi.string()
        .email()
        .required()
        .messages({
          'string.email': 'Invalid email format',
          'any.required': 'Email is required',
        }),
      password: Joi.string()
        .min(8)
        .max(100)
        .required()
        .messages({
          'string.min': 'Password must be at least 8 characters',
          'string.max': 'Password must be at most 100 characters',
          'any.required': 'Password is required',
        }),
      username: Joi.string()
        .min(3)
        .max(50)
        .pattern(/^[a-zA-Z0-9_-]+$/)
        .optional()
        .messages({
          'string.min': 'Username must be at least 3 characters',
          'string.max': 'Username must be at most 50 characters',
          'string.pattern.base': 'Username can only contain letters, numbers, underscores, and hyphens',
        }),
    }),
  },

  login: {
    body: Joi.object({
      email: Joi.string()
        .email()
        .required()
        .messages({
          'string.email': 'Invalid email format',
          'any.required': 'Email is required',
        }),
      password: Joi.string()
        .required()
        .messages({
          'any.required': 'Password is required',
        }),
    }),
  },
};