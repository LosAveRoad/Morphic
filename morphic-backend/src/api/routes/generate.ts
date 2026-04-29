import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rate-limit';
import { generateService } from '../../services/generate-service';
import { PrismaClient } from '@prisma/client';
import type { ApiResponse, GenerateResponse } from '../../types';

const prisma = new PrismaClient();
const router = Router();

router.post('/', authMiddleware, rateLimitMiddleware, async (req, res, next) => {
  try {
    const result = await generateService.generate(req.body);

    // Save to database (non-fatal)
    try {
      let session = req.body.sessionId
        ? await prisma.session.findUnique({ where: { id: req.body.sessionId } })
        : null;

      if (!session) {
        session = await prisma.session.create({
          data: {
            userId: req.user!.userId,
            title: req.body.userInput?.slice(0, 50) || 'Untitled',
          },
        });
      }

      await prisma.message.create({
        data: {
          sessionId: session.id,
          role: 'ai',
          inputText: req.body.userInput || null,
          canvasContext: req.body.context?.additionalContext
            ? JSON.stringify(req.body.context.additionalContext)
            : null,
          selectedOption: req.body.selectedOptionId || null,
          generatedType: result.content.type,
          generatedContent: result.content.type === 'html'
            ? result.content.html
            : result.content.text,
        },
      });

      (result as Record<string, unknown>).sessionId = session.id;
    } catch (dbErr) {
      console.error('Failed to save message:', dbErr);
    }

    const body: ApiResponse<GenerateResponse> = { success: true, data: result };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

export default router;
