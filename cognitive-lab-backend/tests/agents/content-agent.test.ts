// tests/agents/content-agent.test.ts
import { ContentAgent } from '../../src/agents/content-agent';
import { DeepSeekClient } from '../../src/services/deepseek-client';
import { SessionManager } from '../../src/services/session-manager';
import { RecommendedOption } from '../../src/types/agent.types';
import { logger } from '../../src/utils/logger';

// Mock DeepSeekClient
jest.mock('../../src/services/deepseek-client');

// Mock SessionManager
jest.mock('../../src/services/session-manager');

// Mock logger to avoid console output in tests
jest.mock('../../src/utils/logger');

describe('ContentAgent', () => {
  let contentAgent: ContentAgent;
  let mockDeepSeekClient: jest.Mocked<DeepSeekClient>;
  let mockSessionManager: jest.Mocked<SessionManager>;
  let mockOptions: RecommendedOption[];

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockDeepSeekClient = new DeepSeekClient() as jest.Mocked<DeepSeekClient>;
    mockSessionManager = new SessionManager() as jest.Mocked<SessionManager>;

    // Mock the constructor calls
    (DeepSeekClient as jest.Mock).mockImplementation(() => mockDeepSeekClient);
    (SessionManager as jest.Mock).mockImplementation(() => mockSessionManager);

    // Create agent instance
    contentAgent = new ContentAgent();

    // Setup mock options
    mockOptions = [
      {
        optionId: 'opt_1',
        title: 'Create Math Quiz',
        description: 'Generate a math quiz with 5 questions',
        icon: '🧮',
        category: 'learning',
        estimatedTime: 5,
        confidence: 0.9,
      },
      {
        optionId: 'opt_2',
        title: 'Write Creative Story',
        description: 'Create an imaginative story',
        icon: '💡',
        category: 'creative',
        estimatedTime: 10,
        confidence: 0.8,
      },
    ];

    // Mock session manager to return valid session
    mockSessionManager.getSession.mockReturnValue({
      sessionId: 'test-session',
      recommendedOptions: mockOptions,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    });
  });

  describe('execute with option selection', () => {
    it('should generate text content successfully', async () => {
      const request = {
        sessionId: 'test-session',
        selectedOptionId: 'opt_1',
        context: {
          userPreferences: {
            style: 'academic' as const,
            language: 'en-US' as const,
            outputFormat: ['text' as const],
          },
        },
      };

      const mockAIResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                contentType: 'text',
                text: {
                  markdown: '# Math Quiz\\n\\n1. What is 2 + 2?',
                  plainText: 'Math Quiz\\n\\n1. What is 2 + 2?',
                  sections: [
                    {
                      type: 'heading' as const,
                      content: 'Math Quiz',
                      level: 1,
                    },
                    {
                      type: 'paragraph' as const,
                      content: '1. What is 2 + 2?',
                    },
                  ],
                },
                metadata: {
                  wordCount: 10,
                  confidence: 0.9,
                  tags: ['math', 'quiz', 'learning'],
                  difficulty: 'beginner' as const,
                },
              }),
              role: 'assistant',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      };

      mockDeepSeekClient.chat.mockResolvedValue(mockAIResponse);

      const response = await contentAgent.execute(request);

      expect(response.content.contentType).toBe('text');
      expect(response.content.text?.markdown).toContain('Math Quiz');
      expect(response.metadata.wordCount).toBe(10);
      expect(response.metadata.confidence).toBe(0.9);
      expect(mockDeepSeekClient.chat).toHaveBeenCalledTimes(1);
      expect(mockSessionManager.getSession).toHaveBeenCalledWith('test-session');
    });

    it('should generate html content successfully', async () => {
      const request = {
        sessionId: 'test-session',
        selectedOptionId: 'opt_1',
        context: {
          userPreferences: {
            style: 'casual' as const,
            language: 'en-US' as const,
            outputFormat: ['html' as const],
          },
        },
      };

      const mockAIResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                contentType: 'html',
                html: {
                  code: '<div class="quiz-container"><h1>Math Quiz</h1></div>',
                  styles: '.quiz-container { padding: 20px; }',
                  interactive: true,
                  components: [
                    {
                      type: 'button' as const,
                      props: { label: 'Check Answer', onClick: 'checkAnswer()' },
                    },
                  ],
                },
                metadata: {
                  wordCount: 5,
                  confidence: 0.85,
                  tags: ['math', 'interactive', 'quiz'],
                  difficulty: 'intermediate' as const,
                },
              }),
              role: 'assistant',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 80,
          total_tokens: 180,
        },
      };

      mockDeepSeekClient.chat.mockResolvedValue(mockAIResponse);

      const response = await contentAgent.execute(request);

      expect(response.content.contentType).toBe('html');
      expect(response.content.html?.code).toContain('quiz-container');
      expect(response.content.html?.interactive).toBe(true);
      expect(response.content.html?.components).toHaveLength(1);
      expect(mockDeepSeekClient.chat).toHaveBeenCalledTimes(1);
    });

    it('should generate hybrid content successfully', async () => {
      const request = {
        sessionId: 'test-session',
        selectedOptionId: 'opt_1',
        context: {
          userPreferences: {
            style: 'minimal' as const,
            language: 'zh-CN' as const,
            outputFormat: ['text' as const, 'html' as const],
          },
        },
      };

      const mockAIResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                contentType: 'hybrid',
                hybrid: {
                  textContent: '# 混合内容\\n\\n这是文本部分',
                  htmlComponents: '<button>点击我</button>',
                  layout: 'vertical' as const,
                },
                metadata: {
                  wordCount: 8,
                  confidence: 0.88,
                  tags: ['mixed', 'content'],
                  difficulty: 'beginner' as const,
                },
              }),
              role: 'assistant',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 60,
          total_tokens: 160,
        },
      };

      mockDeepSeekClient.chat.mockResolvedValue(mockAIResponse);

      const response = await contentAgent.execute(request);

      expect(response.content.contentType).toBe('hybrid');
      expect(response.content.hybrid?.textContent).toContain('混合内容');
      expect(response.content.hybrid?.htmlComponents).toContain('button');
      expect(response.content.hybrid?.layout).toBe('vertical');
    });
  });

  describe('execute with direct user input', () => {
    it('should handle direct user input without option selection', async () => {
      const request = {
        sessionId: 'test-session',
        userInput: 'Create a summary of quantum physics',
        context: {
          userPreferences: {
            style: 'academic' as const,
            language: 'en-US' as const,
            outputFormat: ['text' as const],
          },
        },
      };

      const mockAIResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                contentType: 'text',
                text: {
                  markdown: '# Quantum Physics Summary\\n\\nQuantum mechanics is...',
                  plainText: 'Quantum Physics Summary\\n\\nQuantum mechanics is...',
                  sections: [
                    {
                      type: 'heading' as const,
                      content: 'Quantum Physics Summary',
                      level: 1,
                    },
                  ],
                },
                metadata: {
                  wordCount: 20,
                  confidence: 0.92,
                  tags: ['physics', 'quantum', 'summary'],
                  difficulty: 'advanced' as const,
                },
              }),
              role: 'assistant',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 150,
          completion_tokens: 100,
          total_tokens: 250,
        },
      };

      mockDeepSeekClient.chat.mockResolvedValue(mockAIResponse);

      const response = await contentAgent.execute(request);

      expect(response.content.contentType).toBe('text');
      expect(response.content.text?.markdown).toContain('Quantum Physics Summary');
      expect(response.metadata.wordCount).toBe(20);
      expect(mockDeepSeekClient.chat).toHaveBeenCalledTimes(1);
    });
  });

  describe('validation and error handling', () => {
    it('should throw error if neither optionId nor userInput provided', async () => {
      const request = {
        sessionId: 'test-session',
        context: {
          userPreferences: {
            style: 'academic' as const,
            language: 'en-US' as const,
            outputFormat: ['text' as const],
          },
        },
      };

      await expect(contentAgent.execute(request)).rejects.toThrow(
        'Either selectedOptionId or userInput must be provided'
      );
    });

    it('should throw error if session not found', async () => {
      mockSessionManager.getSession.mockReturnValue(null);

      const request = {
        sessionId: 'non-existent-session',
        selectedOptionId: 'opt_1',
        context: {
          userPreferences: {
            style: 'academic' as const,
            language: 'en-US' as const,
            outputFormat: ['text' as const],
          },
        },
      };

      await expect(contentAgent.execute(request)).rejects.toThrow('Session not found or expired');
    });

    it('should throw error if selected option not found', async () => {
      const request = {
        sessionId: 'test-session',
        selectedOptionId: 'non-existent-option',
        context: {
          userPreferences: {
            style: 'academic' as const,
            language: 'en-US' as const,
            outputFormat: ['text' as const],
          },
        },
      };

      await expect(contentAgent.execute(request)).rejects.toThrow('Selected option not found');
    });

    it('should handle invalid JSON response', async () => {
      const request = {
        sessionId: 'test-session',
        userInput: 'Test input',
        context: {
          userPreferences: {
            style: 'academic' as const,
            language: 'en-US' as const,
            outputFormat: ['text' as const],
          },
        },
      };

      mockDeepSeekClient.chat.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Invalid JSON response{{{',
              role: 'assistant',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 30,
          total_tokens: 80,
        },
      });

      await expect(contentAgent.execute(request)).rejects.toThrow();
    });

    it('should handle API errors gracefully', async () => {
      const request = {
        sessionId: 'test-session',
        userInput: 'Test input',
        context: {
          userPreferences: {
            style: 'academic' as const,
            language: 'en-US' as const,
            outputFormat: ['text' as const],
          },
        },
      };

      mockDeepSeekClient.chat.mockRejectedValue(new Error('API Error'));

      await expect(contentAgent.execute(request)).rejects.toThrow('API Error');
    });
  });

  describe('metadata generation', () => {
    it('should include correct metadata in response', async () => {
      const request = {
        sessionId: 'test-session',
        userInput: 'Test input',
        context: {
          userPreferences: {
            style: 'casual' as const,
            language: 'en-US' as const,
            outputFormat: ['text' as const],
          },
          additionalContext: 'This is additional context',
        },
      };

      const mockAIResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                contentType: 'text',
                text: {
                  markdown: '# Test Content',
                  plainText: 'Test Content',
                  sections: [],
                },
                metadata: {
                  wordCount: 2,
                  confidence: 0.95,
                  tags: ['test'],
                  difficulty: 'beginner' as const,
                },
              }),
              role: 'assistant',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      };

      // Add a small delay to ensure processing time is measurable
      mockDeepSeekClient.chat.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return mockAIResponse;
      });

      const response = await contentAgent.execute(request);

      expect(response.metadata.timestamp).toBeDefined();
      expect(response.metadata.processingTime).toBeGreaterThanOrEqual(0);
      expect(response.metadata.model).toBe('deepseek-chat');
      expect(response.metadata.wordCount).toBe(2);
      expect(response.metadata.confidence).toBe(0.95);
      expect(response.metadata.tags).toContain('test');
    });

    it('should generate related options based on content', async () => {
      const request = {
        sessionId: 'test-session',
        selectedOptionId: 'opt_1',
        context: {
          userPreferences: {
            style: 'academic' as const,
            language: 'en-US' as const,
            outputFormat: ['text' as const],
          },
        },
      };

      const mockAIResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                contentType: 'text',
                text: {
                  markdown: '# Math Quiz',
                  plainText: 'Math Quiz',
                  sections: [],
                },
                metadata: {
                  wordCount: 2,
                  confidence: 0.9,
                  tags: ['math', 'quiz'],
                  difficulty: 'beginner' as const,
                },
                relatedOptions: [
                  {
                    optionId: 'opt_related_1',
                    title: 'Create More Questions',
                    description: 'Add more math problems',
                    icon: '📝',
                    category: 'learning' as const,
                    estimatedTime: 3,
                    confidence: 0.85,
                  },
                ],
              }),
              role: 'assistant',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 70,
          total_tokens: 170,
        },
      };

      mockDeepSeekClient.chat.mockResolvedValue(mockAIResponse);

      const response = await contentAgent.execute(request);

      expect(response.relatedOptions).toBeDefined();
      expect(response.relatedOptions).toHaveLength(1);
      expect(response.relatedOptions?.[0].optionId).toBe('opt_related_1');
    });
  });

  describe('content type preferences', () => {
    it('should respect user output format preferences', async () => {
      const request = {
        sessionId: 'test-session',
        userInput: 'Test input',
        context: {
          userPreferences: {
            style: 'minimal' as const,
            language: 'zh-CN' as const,
            outputFormat: ['html' as const],
          },
        },
      };

      const mockAIResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                contentType: 'html',
                html: {
                  code: '<div>Test</div>',
                  styles: 'div { color: red; }',
                  interactive: false,
                  components: [],
                },
                metadata: {
                  wordCount: 1,
                  confidence: 0.8,
                  tags: ['test'],
                  difficulty: 'beginner' as const,
                },
              }),
              role: 'assistant',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 40,
          total_tokens: 140,
        },
      };

      mockDeepSeekClient.chat.mockResolvedValue(mockAIResponse);

      const response = await contentAgent.execute(request);

      expect(response.content.contentType).toBe('html');
      expect(response.content.html).toBeDefined();
    });

    it('should default to text content if no preference specified', async () => {
      const request = {
        sessionId: 'test-session',
        userInput: 'Test input',
      };

      const mockAIResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                contentType: 'text',
                text: {
                  markdown: '# Test',
                  plainText: 'Test',
                  sections: [],
                },
                metadata: {
                  wordCount: 1,
                  confidence: 0.8,
                  tags: ['test'],
                  difficulty: 'beginner' as const,
                },
              }),
              role: 'assistant',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 30,
          total_tokens: 130,
        },
      };

      mockDeepSeekClient.chat.mockResolvedValue(mockAIResponse);

      const response = await contentAgent.execute(request);

      expect(response.content.contentType).toBe('text');
      expect(response.content.text).toBeDefined();
    });
  });

  describe('prompt construction', () => {
    it('should include option context when optionId provided', async () => {
      const request = {
        sessionId: 'test-session',
        selectedOptionId: 'opt_1',
        context: {
          userPreferences: {
            style: 'academic' as const,
            language: 'en-US' as const,
            outputFormat: ['text' as const],
          },
        },
      };

      const mockAIResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                contentType: 'text',
                text: {
                  markdown: '# Test',
                  plainText: 'Test',
                  sections: [],
                },
                metadata: {
                  wordCount: 1,
                  confidence: 0.8,
                  tags: ['test'],
                  difficulty: 'beginner' as const,
                },
              }),
              role: 'assistant',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 30,
          total_tokens: 130,
        },
      };

      mockDeepSeekClient.chat.mockResolvedValue(mockAIResponse);

      await contentAgent.execute(request);

      expect(mockDeepSeekClient.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
            }),
          ]),
        })
      );
    });

    it('should include user input and additional context', async () => {
      const request = {
        sessionId: 'test-session',
        userInput: 'Create a quiz',
        context: {
          userPreferences: {
            style: 'casual' as const,
            language: 'en-US' as const,
            outputFormat: ['text' as const],
          },
          additionalContext: 'Focus on algebra',
        },
      };

      const mockAIResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                contentType: 'text',
                text: {
                  markdown: '# Algebra Quiz',
                  plainText: 'Algebra Quiz',
                  sections: [],
                },
                metadata: {
                  wordCount: 2,
                  confidence: 0.85,
                  tags: ['algebra', 'quiz'],
                  difficulty: 'intermediate' as const,
                },
              }),
              role: 'assistant',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 120,
          completion_tokens: 40,
          total_tokens: 160,
        },
      };

      mockDeepSeekClient.chat.mockResolvedValue(mockAIResponse);

      await contentAgent.execute(request);

      expect(mockDeepSeekClient.chat).toHaveBeenCalled();
    });
  });
});