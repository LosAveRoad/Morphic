// src/api/controllers/recommend-controller.ts
import { Request, Response } from 'express';
import { OptionsAgent } from '../../agents/options-agent';
import { SessionManager } from '../../services/session-manager';
import { logger } from '../../utils/logger';
import { asyncHandler, AppError } from '../middleware/error-handler';

export class RecommendController {
  private optionsAgent: OptionsAgent;
  private sessionManager: SessionManager;

  constructor(optionsAgent?: OptionsAgent, sessionManager?: SessionManager) {
    this.optionsAgent = optionsAgent || new OptionsAgent();
    this.sessionManager = sessionManager || new SessionManager();
  }

  /**
   * POST /api/recommendations
   * Get AI-powered interaction recommendations based on canvas context
   */
  getRecommendations = asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
      logger.info('Received recommendation request', {
        body: req.body,
      });

      // Call OptionsAgent
      const response = await this.optionsAgent.execute(req.body);

      // Store session data for later use
      this.sessionManager.createSession(response.sessionId, response.options);

      logger.info('Recommendation request completed', {
        sessionId: response.sessionId,
        optionCount: response.options.length,
        processingTime: response.metadata.processingTime,
      });

      // Send successful response
      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;

      logger.error('Recommendation request failed', {
        error: error instanceof Error ? error.message : String(error),
        processingTime,
      });

      // Re-throw application errors
      if (error instanceof AppError) {
        throw error;
      }

      // Wrap unknown errors
      throw new AppError(
        'Failed to generate recommendations',
        500
      );
    }
  });

  /**
   * GET /api/recommendations/health
   * Health check endpoint for recommendations service
   */
  healthCheck = asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      service: 'recommendations',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  });
}