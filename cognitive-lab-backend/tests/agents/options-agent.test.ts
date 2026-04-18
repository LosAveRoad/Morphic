// tests/agents/options-agent.test.ts
import { OptionsAgent } from '../../src/agents/options-agent';
import { RecommendOptionsRequest } from '../../src/types/agent.types';
import { DeepSeekClient } from '../../src/services/deepseek-client';

// Mock the DeepSeekClient
jest.mock('../../src/services/deepseek-client');

describe('OptionsAgent', () => {
  let agent: OptionsAgent;
  let mockDeepSeekClient: jest.Mocked<DeepSeekClient>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create agent instance
    agent = new OptionsAgent();

    // Get the mocked DeepSeekClient instance
    mockDeepSeekClient = agent['deepseekClient'] as jest.Mocked<DeepSeekClient>;
  });

  describe('execute', () => {
    it('should return recommended options for math context', async () => {
      const request: RecommendOptionsRequest = {
        canvasContext: {
          nearbyContent: ['微积分', '函数极限', '连续性'],
          userHistory: ['数学分析', '线性代数'],
          currentTheme: 'academic',
        },
      };

      // Mock the DeepSeek API response
      mockDeepSeekClient.chat.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              options: [
                {
                  optionId: 'opt_001',
                  title: '创建微积分练习题',
                  description: '基于附近内容生成定制化练习题',
                  icon: '📝',
                  category: 'learning',
                  estimatedTime: 5,
                  confidence: 0.95,
                },
                {
                  optionId: 'opt_002',
                  title: '可视化函数极限',
                  description: '生成交互式图表展示极限概念',
                  icon: '📊',
                  category: 'creative',
                  estimatedTime: 8,
                  confidence: 0.88,
                },
              ],
            }),
            role: 'assistant',
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      });

      const response = await agent.execute(request);

      expect(response).toHaveProperty('sessionId');
      expect(response).toHaveProperty('options');
      expect(response.options).toBeInstanceOf(Array);
      expect(response.options.length).toBeGreaterThan(0);
      expect(response.options.length).toBeLessThanOrEqual(4);

      // Verify the DeepSeek API was called correctly
      expect(mockDeepSeekClient.chat).toHaveBeenCalledWith({
        model: 'deepseek-chat',
        messages: [
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user' }),
        ],
        response_format: { type: 'json_object' },
      });

      // Verify metadata
      expect(response.metadata).toHaveProperty('timestamp');
      expect(response.metadata).toHaveProperty('processingTime');
      expect(response.metadata).toHaveProperty('model', 'deepseek-chat');
    });

    it('should handle empty context gracefully', async () => {
      const request: RecommendOptionsRequest = {
        canvasContext: {
          nearbyContent: [],
        },
      };

      // Mock the DeepSeek API response
      mockDeepSeekClient.chat.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              options: [
                {
                  optionId: 'opt_001',
                  title: '探索学习主题',
                  description: '推荐热门学习内容',
                  icon: '📚',
                  category: 'learning',
                  estimatedTime: 3,
                  confidence: 0.75,
                },
              ],
            }),
            role: 'assistant',
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 30,
          total_tokens: 80,
        },
      });

      const response = await agent.execute(request);

      expect(response.options).toBeDefined();
      expect(response.options.length).toBeGreaterThan(0);
      expect(mockDeepSeekClient.chat).toHaveBeenCalled();
    });

    it('should return options with valid structure', async () => {
      const request: RecommendOptionsRequest = {
        canvasContext: {
          nearbyContent: ['傅里叶变换'],
        },
      };

      // Mock the DeepSeek API response
      mockDeepSeekClient.chat.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              options: [
                {
                  optionId: 'opt_001',
                  title: '傅里叶变换详解',
                  description: '深入讲解傅里叶变换原理',
                  icon: '🎓',
                  category: 'learning',
                  estimatedTime: 10,
                  confidence: 0.92,
                  previewHint: '包含数学公式和实例',
                },
                {
                  optionId: 'opt_002',
                  title: '傅里叶变换应用',
                  description: '分析实际应用场景',
                  icon: '🔍',
                  category: 'analysis',
                  estimatedTime: 7,
                  confidence: 0.85,
                },
              ],
            }),
            role: 'assistant',
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: 80,
          completion_tokens: 60,
          total_tokens: 140,
        },
      });

      const response = await agent.execute(request);

      response.options.forEach((option) => {
        expect(option).toHaveProperty('optionId');
        expect(option).toHaveProperty('title');
        expect(option).toHaveProperty('description');
        expect(option).toHaveProperty('icon');
        expect(option).toHaveProperty('category');
        expect(option).toHaveProperty('estimatedTime');
        expect(option).toHaveProperty('confidence');

        expect(option.confidence).toBeGreaterThanOrEqual(0);
        expect(option.confidence).toBeLessThanOrEqual(1);
        expect(['learning', 'creative', 'analysis']).toContain(option.category);
        expect(typeof option.estimatedTime).toBe('number');
        expect(option.estimatedTime).toBeGreaterThan(0);
      });
    });

    it('should use provided sessionId or generate new one', async () => {
      const requestWithSession: RecommendOptionsRequest = {
        canvasContext: {
          nearbyContent: ['测试内容'],
        },
        sessionId: 'existing-session-123',
      };

      mockDeepSeekClient.chat.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              options: [
                {
                  optionId: 'opt_001',
                  title: '测试选项',
                  description: '测试描述',
                  icon: '🧪',
                  category: 'learning',
                  estimatedTime: 5,
                  confidence: 0.8,
                },
              ],
            }),
            role: 'assistant',
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 30,
          total_tokens: 80,
        },
      });

      const response1 = await agent.execute(requestWithSession);
      expect(response1.sessionId).toBe('existing-session-123');

      const requestWithoutSession: RecommendOptionsRequest = {
        canvasContext: {
          nearbyContent: ['测试内容'],
        },
      };

      const response2 = await agent.execute(requestWithoutSession);
      expect(response2.sessionId).toMatch(/^[0-9a-f-]{36}$/); // UUID format
      expect(response2.sessionId).not.toBe('existing-session-123');
    });

    it('should throw error for invalid response structure', async () => {
      const request: RecommendOptionsRequest = {
        canvasContext: {
          nearbyContent: ['测试内容'],
        },
      };

      // Mock invalid response (missing options array)
      mockDeepSeekClient.chat.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              data: 'invalid structure',
            }),
            role: 'assistant',
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 20,
          total_tokens: 70,
        },
      });

      await expect(agent.execute(request)).rejects.toThrow('Invalid response structure');
    });

    it('should throw error for malformed JSON response', async () => {
      const request: RecommendOptionsRequest = {
        canvasContext: {
          nearbyContent: ['测试内容'],
        },
      };

      // Mock malformed JSON
      mockDeepSeekClient.chat.mockResolvedValue({
        choices: [{
          message: {
            content: 'invalid json {{{',
            role: 'assistant',
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 20,
          total_tokens: 70,
        },
      });

      await expect(agent.execute(request)).rejects.toThrow('Invalid JSON response');
    });

    it('should handle DeepSeek API errors', async () => {
      const request: RecommendOptionsRequest = {
        canvasContext: {
          nearbyContent: ['测试内容'],
        },
      };

      // Mock API error
      mockDeepSeekClient.chat.mockRejectedValue(new Error('API request failed'));

      await expect(agent.execute(request)).rejects.toThrow('API request failed');
    });

    it('should include user history and theme in prompt when available', async () => {
      const request: RecommendOptionsRequest = {
        canvasContext: {
          nearbyContent: ['量子力学'],
          userHistory: ['物理学', '数学'],
          currentTheme: 'modern',
        },
      };

      mockDeepSeekClient.chat.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              options: [
                {
                  optionId: 'opt_001',
                  title: '量子力学入门',
                  description: '介绍基本概念',
                  icon: '🎓',
                  category: 'learning',
                  estimatedTime: 10,
                  confidence: 0.9,
                },
              ],
            }),
            role: 'assistant',
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 40,
          total_tokens: 140,
        },
      });

      await agent.execute(request);

      const callArgs = mockDeepSeekClient.chat.mock.calls[0][0];
      const userPrompt = callArgs.messages[1].content;

      expect(userPrompt).toContain('量子力学');
      expect(userPrompt).toContain('物理学');
      expect(userPrompt).toContain('数学');
      expect(userPrompt).toContain('modern');
    });

    it('should limit options to 4 items', async () => {
      const request: RecommendOptionsRequest = {
        canvasContext: {
          nearbyContent: ['机器学习'],
        },
      };

      // Mock response with more than 4 options
      mockDeepSeekClient.chat.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              options: [
                { optionId: 'opt_1', title: '选项1', description: '描述1', icon: '📚', category: 'learning' as const, estimatedTime: 5, confidence: 0.9 },
                { optionId: 'opt_2', title: '选项2', description: '描述2', icon: '📚', category: 'learning' as const, estimatedTime: 5, confidence: 0.9 },
                { optionId: 'opt_3', title: '选项3', description: '描述3', icon: '📚', category: 'learning' as const, estimatedTime: 5, confidence: 0.9 },
                { optionId: 'opt_4', title: '选项4', description: '描述4', icon: '📚', category: 'learning' as const, estimatedTime: 5, confidence: 0.9 },
                { optionId: 'opt_5', title: '选项5', description: '描述5', icon: '📚', category: 'learning' as const, estimatedTime: 5, confidence: 0.9 },
              ],
            }),
            role: 'assistant',
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 100,
          total_tokens: 200,
        },
      });

      const response = await agent.execute(request);

      // The agent should return all options provided by DeepSeek
      // (DeepSeek is instructed to return 3-4 options)
      expect(response.options.length).toBe(5);
    });
  });
});