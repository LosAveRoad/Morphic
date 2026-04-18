// tests/auth/auth-controller.test.ts
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express, { Application } from 'express';
import { AuthController } from '../../src/api/controllers/auth-controller';
import { AuthService } from '../../src/services/auth-service';
import { PrismaClient } from '@prisma/client';
import { validate } from '../../src/api/middleware/validation';
import { validationSchemas } from '../../src/api/middleware/validation';
import { errorHandler } from '../../src/api/middleware/error-handler';

const prisma = new PrismaClient();

describe('AuthController', () => {
  let app: Application;
  let authService: AuthService;
  let authController: AuthController;

  beforeEach(async () => {
    // Clean up database
    await prisma.user.deleteMany({});

    // Setup
    authService = new AuthService(prisma);
    authController = new AuthController(authService);

    app = express();
    app.use(express.json());

    // Routes
    app.post('/api/auth/register', validate(validationSchemas.register), authController.register);
    app.post('/api/auth/login', validate(validationSchemas.login), authController.login);
    app.get('/api/auth/me', authController.me);
    app.post('/api/auth/logout', authController.logout);

    // Error handler (must be last)
    app.use(errorHandler);
  });

  afterEach(async () => {
    await prisma.user.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        user: {
          email: 'test@example.com',
          username: 'testuser',
        },
        token: expect.any(String),
      });
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 409 for duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password456',
        })
        .expect(409);

      expect(response.body).toMatchObject({
        error: 'ConflictError',
        message: 'Email already exists',
      });
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      // First register
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      // Then login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        user: {
          email: 'test@example.com',
        },
        token: expect.any(String),
      });
    });

    it('should return 401 for wrong password', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'UnauthorizedError',
        message: 'Invalid email or password',
      });
    });

    it('should return 401 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'UnauthorizedError',
      });
    });
  });
});