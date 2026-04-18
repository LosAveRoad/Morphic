// tests/auth/auth-service.test.ts
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { AuthService } from '../../src/services/auth-service';
import { PrismaClient } from '@prisma/client';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    // Create a new PrismaClient instance for each test
    prisma = new PrismaClient();
    await prisma.$connect();
    authService = new AuthService(prisma);
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await prisma.user.deleteMany({});
    } catch (error) {
      // Ignore cleanup errors
    }
    // Disconnect after cleanup
    await prisma.$disconnect();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.username).toBe('testuser');
      expect(result.user.id).toBeDefined();
      expect(result.token).toBeDefined();
    });

    it('should throw error if email already exists', async () => {
      await authService.register({
        email: 'test@example.com',
        password: 'password123',
      });

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password456',
        })
      ).rejects.toThrow('Email already exists');
    });

    it('should register user without username', async () => {
      const result = await authService.register({
        email: 'notest@example.com',
        password: 'password123',
      });

      expect(result.user.username).toBeUndefined();
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      await authService.register({
        email: 'test@example.com',
        password: 'password123',
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBeDefined();
    });

    it('should throw error with incorrect password', async () => {
      await authService.register({
        email: 'test@example.com',
        password: 'password123',
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error with non-existent email', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const registerResult = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      });

      const user = await authService.getUserById(registerResult.user.id);

      expect(user).toBeDefined();
      expect(user?.id).toBe(registerResult.user.id);
      expect(user?.email).toBe('test@example.com');
    });

    it('should return null when user not found', async () => {
      const user = await authService.getUserById('non-existent-id');
      expect(user).toBeNull();
    });
  });
});