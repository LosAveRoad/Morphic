import { Router } from 'express';
import { authService } from '../../services/auth-service';
import { authMiddleware } from '../middleware/auth';
import type { ApiResponse, AuthResponse } from '../../types';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    const body: ApiResponse<AuthResponse> = { success: true, data: result };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    const body: ApiResponse<AuthResponse> = { success: true, data: result };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user!.userId);
    const body: ApiResponse<{ id: string; email: string; name: string | null }> = {
      success: true,
      data: user,
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

export default router;
