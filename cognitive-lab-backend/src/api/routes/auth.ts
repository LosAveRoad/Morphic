// src/api/routes/auth.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth-controller';
import { validate, validationSchemas } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

export function createAuthRoutes(authController: AuthController): Router {
  const router = Router();

  // Public routes
  router.post(
    '/register',
    validate(validationSchemas.register),
    authController.register
  );

  router.post(
    '/login',
    validate(validationSchemas.login),
    authController.login
  );

  // Protected routes (require authentication)
  router.get('/me', authenticate, authController.me);
  router.post('/logout', authenticate, authController.logout);

  return router;
}