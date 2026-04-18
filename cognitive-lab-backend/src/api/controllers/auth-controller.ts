// src/api/controllers/auth-controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/auth-service';
import { asyncHandler } from '../middleware/error-handler';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.register(req.body);
    res.status(201).json(result);
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.login(req.body);
    res.status(200).json(result);
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const user = await this.authService.getUserById(req.user.id);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
      });
    }

    res.status(200).json({ user });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    // For stateless JWT, client just needs to delete the token
    // This endpoint is kept for future extensibility (e.g., token blacklist)
    res.status(200).json({
      message: 'Logged out successfully',
    });
  });
}