// tests/services/session-manager.test.ts
import { SessionManager } from '../../src/services/session-manager';
import { RecommendedOption } from '../../src/types/agent.types';

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let mockOptions: RecommendedOption[];

  beforeEach(() => {
    sessionManager = new SessionManager();
    mockOptions = [
      {
        optionId: 'opt_1',
        title: 'Test Option 1',
        description: 'Description 1',
        icon: '📚',
        category: 'learning',
        estimatedTime: 5,
        confidence: 0.9,
      },
      {
        optionId: 'opt_2',
        title: 'Test Option 2',
        description: 'Description 2',
        icon: '💡',
        category: 'creative',
        estimatedTime: 10,
        confidence: 0.8,
      },
    ];
  });

  describe('createSession', () => {
    it('should create a new session with valid data', () => {
      const sessionId = 'session_123';
      sessionManager.createSession(sessionId, mockOptions);

      const session = sessionManager.getSession(sessionId);
      expect(session).not.toBeNull();
      expect(session?.sessionId).toBe(sessionId);
      expect(session?.recommendedOptions).toEqual(mockOptions);
      expect(session?.recommendedOptions).toHaveLength(2);
    });

    it('should set correct expiration time', () => {
      const sessionId = 'session_456';
      const now = Date.now();
      sessionManager.createSession(sessionId, mockOptions);

      const session = sessionManager.getSession(sessionId);
      expect(session).not.toBeNull();
      expect(session!.createdAt).toBeGreaterThanOrEqual(now);
      expect(session!.expiresAt).toBeGreaterThan(session!.createdAt);
      expect(session!.expiresAt - session!.createdAt).toBe(3600 * 1000); // 1 hour
    });

    it('should overwrite existing session with same ID', () => {
      const sessionId = 'session_789';
      sessionManager.createSession(sessionId, mockOptions);

      const newOptions = [mockOptions[0]];
      sessionManager.createSession(sessionId, newOptions);

      const session = sessionManager.getSession(sessionId);
      expect(session?.recommendedOptions).toHaveLength(1);
      expect(session?.recommendedOptions[0].optionId).toBe('opt_1');
    });
  });

  describe('getSession', () => {
    it('should return existing session', () => {
      const sessionId = 'session_abc';
      sessionManager.createSession(sessionId, mockOptions);

      const session = sessionManager.getSession(sessionId);
      expect(session).not.toBeNull();
      expect(session?.sessionId).toBe(sessionId);
    });

    it('should return null for non-existent session', () => {
      const session = sessionManager.getSession('non_existent');
      expect(session).toBeNull();
    });

    it('should return null and delete expired session', () => {
      const sessionId = 'session_expired';
      sessionManager.createSession(sessionId, mockOptions);

      // Manually expire the session
      const session = (sessionManager as any).sessions.get(sessionId);
      session.expiresAt = Date.now() - 1000; // Set to past
      (sessionManager as any).sessions.set(sessionId, session);

      const retrievedSession = sessionManager.getSession(sessionId);
      expect(retrievedSession).toBeNull();

      // Verify session was deleted
      const deletedSession = (sessionManager as any).sessions.get(sessionId);
      expect(deletedSession).toBeUndefined();
    });

    it('should return valid session before expiration', () => {
      const sessionId = 'session_valid';
      sessionManager.createSession(sessionId, mockOptions);

      // Session should still be valid immediately after creation
      const session = sessionManager.getSession(sessionId);
      expect(session).not.toBeNull();
      expect(session!.expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('getRecommendedOption', () => {
    it('should return correct option by ID', () => {
      const sessionId = 'session_option';
      sessionManager.createSession(sessionId, mockOptions);

      const option = sessionManager.getRecommendedOption(sessionId, 'opt_2');
      expect(option).not.toBeNull();
      expect(option?.optionId).toBe('opt_2');
      expect(option?.title).toBe('Test Option 2');
    });

    it('should return null for non-existent option ID', () => {
      const sessionId = 'session_option_2';
      sessionManager.createSession(sessionId, mockOptions);

      const option = sessionManager.getRecommendedOption(sessionId, 'opt_999');
      expect(option).toBeNull();
    });

    it('should return null for non-existent session', () => {
      const option = sessionManager.getRecommendedOption('non_existent', 'opt_1');
      expect(option).toBeNull();
    });

    it('should return null for expired session', () => {
      const sessionId = 'session_expired_option';
      sessionManager.createSession(sessionId, mockOptions);

      // Manually expire the session
      const session = (sessionManager as any).sessions.get(sessionId);
      session.expiresAt = Date.now() - 1000;
      (sessionManager as any).sessions.set(sessionId, session);

      const option = sessionManager.getRecommendedOption(sessionId, 'opt_1');
      expect(option).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('should delete existing session', () => {
      const sessionId = 'session_delete';
      sessionManager.createSession(sessionId, mockOptions);

      expect(sessionManager.getSession(sessionId)).not.toBeNull();

      sessionManager.deleteSession(sessionId);

      expect(sessionManager.getSession(sessionId)).toBeNull();
    });

    it('should not throw error when deleting non-existent session', () => {
      expect(() => {
        sessionManager.deleteSession('non_existent');
      }).not.toThrow();
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should remove expired sessions', () => {
      const activeSessionId = 'session_active';
      const expiredSessionId1 = 'session_expired_1';
      const expiredSessionId2 = 'session_expired_2';

      // Create sessions
      sessionManager.createSession(activeSessionId, mockOptions);
      sessionManager.createSession(expiredSessionId1, mockOptions);
      sessionManager.createSession(expiredSessionId2, mockOptions);

      // Expire two sessions
      const expired1 = (sessionManager as any).sessions.get(expiredSessionId1);
      expired1.expiresAt = Date.now() - 1000;
      (sessionManager as any).sessions.set(expiredSessionId1, expired1);

      const expired2 = (sessionManager as any).sessions.get(expiredSessionId2);
      expired2.expiresAt = Date.now() - 2000;
      (sessionManager as any).sessions.set(expiredSessionId2, expired2);

      // Run cleanup
      sessionManager.cleanupExpiredSessions();

      // Verify results
      expect(sessionManager.getSession(activeSessionId)).not.toBeNull();
      expect(sessionManager.getSession(expiredSessionId1)).toBeNull();
      expect(sessionManager.getSession(expiredSessionId2)).toBeNull();
    });

    it('should not remove active sessions', () => {
      const sessionIds = ['session_1', 'session_2', 'session_3'];

      sessionIds.forEach(id => sessionManager.createSession(id, mockOptions));

      sessionManager.cleanupExpiredSessions();

      sessionIds.forEach(id => {
        expect(sessionManager.getSession(id)).not.toBeNull();
      });
    });

    it('should handle empty session manager', () => {
      expect(() => {
        sessionManager.cleanupExpiredSessions();
      }).not.toThrow();
    });

    it('should handle all sessions expired', () => {
      const sessionIds = ['session_1', 'session_2', 'session_3'];

      sessionIds.forEach(id => sessionManager.createSession(id, mockOptions));

      // Expire all sessions
      sessionIds.forEach(id => {
        const session = (sessionManager as any).sessions.get(id);
        session.expiresAt = Date.now() - 1000;
        (sessionManager as any).sessions.set(id, session);
      });

      sessionManager.cleanupExpiredSessions();

      sessionIds.forEach(id => {
        expect(sessionManager.getSession(id)).toBeNull();
      });
    });
  });

  describe('session lifecycle', () => {
    it('should handle complete session lifecycle', () => {
      const sessionId = 'session_lifecycle';

      // Create
      sessionManager.createSession(sessionId, mockOptions);
      expect(sessionManager.getSession(sessionId)).not.toBeNull();

      // Read
      const option = sessionManager.getRecommendedOption(sessionId, 'opt_1');
      expect(option?.optionId).toBe('opt_1');

      // Delete
      sessionManager.deleteSession(sessionId);
      expect(sessionManager.getSession(sessionId)).toBeNull();
    });

    it('should handle multiple sessions independently', () => {
      const sessionId1 = 'session_multi_1';
      const sessionId2 = 'session_multi_2';

      const options1 = [mockOptions[0]];
      const options2 = [mockOptions[1]];

      sessionManager.createSession(sessionId1, options1);
      sessionManager.createSession(sessionId2, options2);

      expect(sessionManager.getSession(sessionId1)?.recommendedOptions).toHaveLength(1);
      expect(sessionManager.getSession(sessionId2)?.recommendedOptions).toHaveLength(1);

      expect(sessionManager.getRecommendedOption(sessionId1, 'opt_1')).not.toBeNull();
      expect(sessionManager.getRecommendedOption(sessionId1, 'opt_2')).toBeNull();

      expect(sessionManager.getRecommendedOption(sessionId2, 'opt_2')).not.toBeNull();
      expect(sessionManager.getRecommendedOption(sessionId2, 'opt_1')).toBeNull();

      sessionManager.deleteSession(sessionId1);
      expect(sessionManager.getSession(sessionId1)).toBeNull();
      expect(sessionManager.getSession(sessionId2)).not.toBeNull();
    });
  });
});