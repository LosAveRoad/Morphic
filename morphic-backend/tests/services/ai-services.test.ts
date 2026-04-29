import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/services/deepseek-client', () => ({
  deepseekClient: {
    chat: vi.fn(),
  },
}));

import { deepseekClient } from '../../src/services/deepseek-client';
import { recommendService } from '../../src/services/recommend-service';
import { generateService } from '../../src/services/generate-service';
import { redoService } from '../../src/services/redo-service';

describe('recommendService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns parsed recommendations', async () => {
    const mockChat = vi.mocked(deepseekClient.chat);
    mockChat.mockResolvedValue(JSON.stringify({
      recommendations: [
        { id: '1', label: 'Explain', description: 'Generate explanation card' },
        { id: '2', label: 'Outline', description: 'Extract key points' },
      ],
    }));

    const result = await recommendService.getRecommendations({
      canvasContext: { nearbyContent: ['Spectral theorem'] },
    });

    expect(result.recommendations).toHaveLength(2);
    expect(result.sessionId).toBeDefined();
  });

  it('returns fallback on invalid JSON response', async () => {
    const mockChat = vi.mocked(deepseekClient.chat);
    mockChat.mockResolvedValue('not json');

    const result = await recommendService.getRecommendations({
      canvasContext: { nearbyContent: ['test'] },
    });

    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations[0]).toHaveProperty('id');
  });
});

describe('generateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns text content', async () => {
    const mockChat = vi.mocked(deepseekClient.chat);
    mockChat.mockResolvedValue(JSON.stringify({
      type: 'text',
      content: '# Hello\n\nThis is markdown content.',
    }));

    const result = await generateService.generate({
      sessionId: 'session-1',
      userInput: 'Explain spectral theorem',
      selectedOptionId: 'explain',
      context: { additionalContext: 'Notes about spectral theorem' },
    });

    expect(result.content.type).toBe('text');
    expect(result.content.text).toBe('# Hello\n\nThis is markdown content.');
  });

  it('returns html content', async () => {
    const mockChat = vi.mocked(deepseekClient.chat);
    mockChat.mockResolvedValue(JSON.stringify({
      type: 'html',
      content: '<div style="width:400px"><h1>Demo</h1></div>',
    }));

    const result = await generateService.generate({
      sessionId: 'session-1',
      userInput: 'Create a demo',
      context: {},
    });

    expect(result.content.type).toBe('html');
    expect(result.content.html).toContain('400px');
  });
});

describe('redoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates redo with previous context', async () => {
    const mockChat = vi.mocked(deepseekClient.chat);
    mockChat.mockResolvedValue(JSON.stringify({
      type: 'text',
      content: 'Redo content',
    }));

    const result = await redoService.redo({
      sessionId: 'session-1',
      messageId: 'msg-1',
      previousRecommendations: [
        { id: 'a', label: 'Previous guess A', description: '...' },
      ],
      selectedOptionId: 'b',
      context: { additionalContext: 'Notes content' },
    });

    expect(result.content.text).toBe('Redo content');
    const callArgs = mockChat.mock.calls[0][0] as Array<{ content: string }>;
    const userPrompt = callArgs.map(m => m.content).join(' ');
    expect(userPrompt).toContain('Previous guess A');
  });
});
