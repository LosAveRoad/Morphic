// src/services/auth-service.ts
import { PrismaClient, User } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { RegisterRequest, LoginRequest, AuthResponse, UserResponse } from '../types/auth.types';
import { ConflictError, UnauthorizedError, NotFoundError } from '../api/middleware/error-handler';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        username: data.username || null,
      },
    });

    // Generate token
    const token = generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username || undefined,
        createdAt: user.createdAt.toISOString(),
      },
      token,
    };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username || undefined,
        createdAt: user.createdAt.toISOString(),
      },
      token,
    };
  }

  async getUserById(userId: string): Promise<UserResponse | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username || undefined,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}