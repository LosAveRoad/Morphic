import { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { ValidationError, AuthError, NotFoundError } from '../utils/errors';
import type { RegisterRequest, LoginRequest, AuthResponse } from '../types';

const prisma = new PrismaClient();

function sanitizeUser(user: { id: string; email: string; name: string | null }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export const authService = {
  async register(input: RegisterRequest): Promise<AuthResponse> {
    if (!input.email || !input.password) {
      throw new ValidationError('Email and password are required');
    }

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ValidationError('Email already registered');
    }

    const hashed = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashed,
        name: input.name ?? null,
      },
    });

    const token = signToken({ userId: user.id, email: user.email });
    return { token, user: sanitizeUser(user) };
  },

  async login(input: LoginRequest): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new AuthError('Invalid email or password');
    }

    const valid = await verifyPassword(input.password, user.password);
    if (!valid) {
      throw new AuthError('Invalid email or password');
    }

    const token = signToken({ userId: user.id, email: user.email });
    return { token, user: sanitizeUser(user) };
  },

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return sanitizeUser(user);
  },
};
