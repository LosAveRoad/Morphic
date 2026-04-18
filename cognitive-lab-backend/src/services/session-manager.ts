// src/services/session-manager.ts
import { logger } from '../utils/logger';
import { RecommendedOption } from '../types/agent.types';

interface SessionData {
  sessionId: string;
  recommendedOptions: RecommendedOption[];
  createdAt: number;
  expiresAt: number;
}

export class SessionManager {
  private sessions: Map<string, SessionData> = new Map();
  private readonly SESSION_TTL = 3600 * 1000; // 1 hour in milliseconds

  createSession(sessionId: string, options: RecommendedOption[]): void {
    const now = Date.now();
    const sessionData: SessionData = {
      sessionId,
      recommendedOptions: options,
      createdAt: now,
      expiresAt: now + this.SESSION_TTL,
    };

    this.sessions.set(sessionId, sessionData);
    logger.info('Session created', { sessionId });
  }

  getSession(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId);

    if (!session) {
      logger.warn('Session not found', { sessionId });
      return null;
    }

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      logger.info('Session expired', { sessionId });
      return null;
    }

    return session;
  }

  getRecommendedOption(sessionId: string, optionId: string): RecommendedOption | null {
    const session = this.getSession(sessionId);
    if (!session) {
      return null;
    }

    return (
      session.recommendedOptions.find((opt) => opt.optionId === optionId) || null
    );
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    logger.info('Session deleted', { sessionId });
  }

  cleanupExpiredSessions(): void {
    const now = Date.now();
    let deletedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.info('Cleaned up expired sessions', { deletedCount });
    }
  }
}