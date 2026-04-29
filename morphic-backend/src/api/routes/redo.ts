import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rate-limit';
import { redoService } from '../../services/redo-service';
import { PrismaClient } from '@prisma/client';
import type { ApiResponse, RedoResponse } from '../../types';

const prisma = new PrismaClient();
const router = Router();

router.post('/', authMiddleware, rateLimitMiddleware, async (req, res, next) => {
  try {
    const result = await redoService.redo(req.body);

    try {
      await prisma.message.create({
        data: {
          sessionId: req.body.sessionId,
          role: 'ai',
          inputText: 'Redo request',
          canvasContext: req.body.context?.additionalContext
            ? JSON.stringify(req.body.context.additionalContext)
            : null,
          recommendations: req.body.previousRecommendations
            ? JSON.stringify(req.body.previousRecommendations)
            : null,
          selectedOption: req.body.selectedOptionId || null,
          generatedType: result.content.type,
          generatedContent: result.content.type === 'html'
            ? result.content.html
            : result.content.text,
        },
      });
    } catch (dbErr) {
      console.error('Failed to save redo message:', dbErr);
    }

    const body: ApiResponse<RedoResponse> = { success: true, data: result };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

export default router;
