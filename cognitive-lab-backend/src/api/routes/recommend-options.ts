// src/api/routes/recommend-options.ts
import { Router } from 'express';
import { RecommendController } from '../controllers/recommend-controller';
import { SessionManager } from '../../services/session-manager';
import { validate, validationSchemas } from '../middleware/validation';
import { rateLimiter } from './rate-limit';

export function createRecommendationRoutes(recommendController?: RecommendController, sessionManager?: SessionManager): Router {
  const router = Router();
  const controller = recommendController || new RecommendController(undefined, sessionManager);

  /**
   * @route   POST /api/recommendations
   * @desc    Get AI-powered interaction recommendations
   * @access  Public
   * @body    {
   *           canvasContext: {
   *             nearbyContent: string[],
   *             userHistory?: string[],
   *             currentTheme?: string
   *           },
   *           sessionId?: string
   *         }
   * @returns { success: true, data: RecommendOptionsResponse }
   */
  router.post(
    '/',
    rateLimiter,
    validate(validationSchemas.recommendOptions),
    controller.getRecommendations
  );

  /**
   * @route   GET /api/recommendations/health
   * @desc    Health check for recommendations service
   * @access  Public
   */
  router.get('/health', controller.healthCheck);

  return router;
}

// Default export for backwards compatibility
export default createRecommendationRoutes();