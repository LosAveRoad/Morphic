// src/api/routes/generate-content.ts
import { Router } from 'express';
import { ContentController } from '../controllers/content-controller';
import { SessionManager } from '../../services/session-manager';
import { validate, validationSchemas } from '../middleware/validation';
import { rateLimiter } from './rate-limit';

export function createContentRoutes(contentController?: ContentController, sessionManager?: SessionManager): Router {
  const router = Router();
  const controller = contentController || new ContentController(undefined, sessionManager);

  /**
   * @route   POST /api/content/generate
   * @desc    Generate AI content based on selected option or user input
   * @access  Public
   * @body    {
   *           sessionId: string,
   *           selectedOptionId?: string,
   *           userInput?: string,
   *           context?: {
   *             userPreferences?: {
   *               style?: 'academic' | 'casual' | 'minimal',
   *               language?: 'zh-CN' | 'en-US',
   *               outputFormat?: ('text' | 'html' | 'image')[]
   *             },
   *             additionalContext?: string
   *           }
   *         }
   * @returns { success: true, data: GenerateContentResponse }
   */
  router.post(
    '/generate',
    rateLimiter,
    validate(validationSchemas.generateContent),
    controller.generateContent
  );

  /**
   * @route   GET /api/content/health
   * @desc    Health check for content generation service
   * @access  Public
   */
  router.get('/health', controller.healthCheck);

  return router;
}

// Default export for backwards compatibility
export default createContentRoutes();