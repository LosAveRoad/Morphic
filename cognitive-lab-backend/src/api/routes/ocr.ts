import { Router } from 'express';
import { OcrController } from '../controllers/ocr-controller';
import { rateLimiter } from './rate-limit';

export function createOcrRoutes(ocrController?: OcrController): Router {
  const router = Router();
  const controller = ocrController || new OcrController();

  /**
   * @route   POST /api/ocr/recognize
   * @desc    Perform OCR on a base64 image
   * @access  Public
   */
  router.post(
    '/recognize',
    rateLimiter,
    controller.recognize
  );

  /**
   * @route   GET /api/ocr/health
   * @desc    Health check for OCR service
   * @access  Public
   */
  router.get('/health', controller.healthCheck);

  return router;
}

export default createOcrRoutes();
