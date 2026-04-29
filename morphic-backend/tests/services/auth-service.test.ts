import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { authService } from '../../src/services/auth-service';

const prisma = new PrismaClient();

describe('authService', () => {
  beforeEach(async () => {
    await prisma.message.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  it('registers a new user and returns token', async () => {
    const result = await authService.register({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test',
    });

    expect(result.token).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.name).toBe('Test');
    expect(result.user).not.toHaveProperty('password');
  });

  it('throws on duplicate email', async () => {
    await authService.register({ email: 'dup@example.com', password: 'pw1' });
    await expect(
      authService.register({ email: 'dup@example.com', password: 'pw2' }),
    ).rejects.toThrow();
  });

  it('logs in with correct credentials', async () => {
    await authService.register({ email: 'login@example.com', password: 'pw' });
    const result = await authService.login({
      email: 'login@example.com',
      password: 'pw',
    });

    expect(result.token).toBeDefined();
    expect(result.user.email).toBe('login@example.com');
  });

  it('throws on wrong password', async () => {
    await authService.register({ email: 'x@x.com', password: 'correct' });
    await expect(
      authService.login({ email: 'x@x.com', password: 'wrong' }),
    ).rejects.toThrow();
  });

  it('gets user by id', async () => {
    const { user: created } = await authService.register({
      email: 'me@example.com',
      password: 'pw',
    });
    const user = await authService.getUserById(created.id);
    expect(user).toBeDefined();
    expect(user!.email).toBe('me@example.com');
  });
});
