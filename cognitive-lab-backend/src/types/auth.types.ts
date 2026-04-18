// src/types/auth.types.ts

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username?: string;
    createdAt: string;
  };
  token: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}