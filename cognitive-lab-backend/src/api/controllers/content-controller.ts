// src/api/controllers/content-controller.ts
import { Request, Response } from 'express';
import { ContentAgent } from '../../agents/content-agent';
import { SessionManager } from '../../services/session-manager';
import { logger } from '../../utils/logger';
import { asyncHandler, AppError, NotFoundError } from '../middleware/error-handler';

export class ContentController {
  private contentAgent: ContentAgent;

  constructor(contentAgent?: ContentAgent, sessionManager?: SessionManager) {
    this.contentAgent = contentAgent || new ContentAgent(sessionManager);
  }

  /**
   * POST /api/content/generate
   * Generate AI content based on selected option or user input
   */
  generateContent = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
      const { sessionId, selectedOptionId, userInput, context } = req.body;

      logger.info('Received content generation request', {
        sessionId,
        hasSelectedOption: !!selectedOptionId,
        hasUserInput: !!userInput,
        hasContext: !!context,
      });

      // Build request for ContentAgent
      const agentRequest = {
        sessionId,
        selectedOptionId,
        userInput,
        context,
      };

      // Call ContentAgent
      const response = await this.contentAgent.execute(agentRequest);

      logger.info('Content generation request completed', {
        sessionId,
        contentType: response.content.contentType,
        processingTime: response.metadata.processingTime,
        wordCount: response.metadata.wordCount,
        hasRelatedOptions: !!response.relatedOptions,
      });

      // Send successful response
      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;

      logger.error('Content generation request failed', {
        error: error instanceof Error ? error.message : String(error),
        processingTime,
      });

      // Handle session not found errors
      if (error instanceof Error && error.message.includes('Session not found')) {
        throw new NotFoundError('Session not found or expired. Please request recommendations first.');
      }

      // Handle validation errors
      if (error instanceof Error && error.message.includes('Either selectedOptionId or userInput must be provided')) {
        throw new AppError('Either selectedOptionId or userInput must be provided', 400);
      }

      // Re-throw application errors
      if (error instanceof AppError) {
        throw error;
      }

      // Wrap unknown errors
      throw new AppError(
        'Failed to generate content',
        500
      );
    }
  });

  /**
   * GET /api/content/health
   * Health check endpoint for content generation service
   */
  healthCheck = asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      service: 'content-generation',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  });
}