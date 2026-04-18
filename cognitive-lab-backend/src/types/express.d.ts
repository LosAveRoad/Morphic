// src/types/express.d.ts
import { JWTPayload } from './auth.types';

declare module 'express' {
  export interface Request {
    user?: {
      id: string;
      email: string;
    };
  }
}