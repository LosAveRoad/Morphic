import { Request, Response, NextFunction } from 'express';
import { OcrService } from '../../services/ocr-service';
import { createSuccessResponse, createErrorResponse } from '../../utils/errors';
import { logger } from '../../utils/logger';

export class OcrController {
  private ocrService: OcrService;

  constructor() {
    this.ocrService = new OcrService();
  }

  public recognize = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { image } = req.body;

      if (!image) {
        res.status(400).json(createErrorResponse('MISSING_INPUT', 'Image is required'));
        return;
      }

      logger.info('Received OCR recognition request');
      const text = await this.ocrService.recognize(image);
      logger.info('OCR recognition successful');

      res.status(200).json(createSuccessResponse({ text }));
    } catch (error) {
      logger.error('Failed to recognize text via OCR:', error);
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to perform OCR on image'));
    }
  };

  public healthCheck = (req: Request, res: Response): void => {
    res.status(200).json(createSuccessResponse({ status: 'ok', service: 'ocr' }));
  };
}
