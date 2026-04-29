import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rate-limit';
import { recommendService } from '../../services/recommend-service';
import type { ApiResponse, RecommendResponse } from '../../types';

const router = Router();

router.post('/', authMiddleware, rateLimitMiddleware, async (req, res, next) => {
  try {
    const result = await recommendService.getRecommendations(req.body);
    const body: ApiResponse<RecommendResponse> = { success: true, data: result };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

export default router;
