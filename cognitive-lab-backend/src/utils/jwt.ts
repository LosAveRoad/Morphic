// src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/auth.types';

const SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function generateToken(userId: string, email: string): string {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: userId,
    email: email,
  };

  return jwt.sign(payload, SECRET, {
    expiresIn: EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, SECRET) as JWTPayload;
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}