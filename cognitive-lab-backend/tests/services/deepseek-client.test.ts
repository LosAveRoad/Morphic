// tests/services/deepseek-client.test.ts
import { DeepSeekClient } from '../../src/services/deepseek-client';
import { config } from '../../src/config';
import axios from 'axios';

// Mock axios to avoid real API calls
jest.mock('axios');

// Mock the logger to avoid console output during tests
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('DeepSeekClient', () => {
  let client: DeepSeekClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a mock axios instance with post method
    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };

    // Mock axios.create to return our mock instance
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

    // Create a new client instance for each test
    client = new DeepSeekClient();
  });

  describe('chat', () => {
    it('should call DeepSeek API with correct parameters', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Hello! How can I help you today?',
                role: 'assistant',
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 9,
            total_tokens: 19,
          },
        },
      };

      // Mock the axios post method to return our mock response
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const response = await client.chat({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello' },
        ],
      });

      // Verify the response structure
      expect(response).toHaveProperty('choices');
      expect(response.choices[0]).toHaveProperty('message');
      expect(response.choices[0].message.content).toBeDefined();
      expect(response.choices[0].message.content).toBe('Hello! How can I help you today?');

      // Verify the API was called correctly
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/v1/chat/completions',
        expect.objectContaining({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Hello' },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Request failed with status code 400');

      // Mock the axios post method to reject with our mock error
      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(
        client.chat({
          model: 'invalid-model',
          messages: [{ role: 'user', content: 'test' }],
        })
      ).rejects.toThrow('Request failed with status code 400');

      // Verify the error was logged and re-thrown
      expect(mockAxiosInstance.post).toHaveBeenCalled();
    });

    it('should support JSON response format', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: '{"result": "success", "data": "test"}',
                role: 'assistant',
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 15,
            completion_tokens: 12,
            total_tokens: 27,
          },
        },
      };

      // Mock the axios post method to return our mock response
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const response = await client.chat({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Respond in JSON format: {"result": "success"}',
          },
          { role: 'user', content: 'Generate JSON' },
        ],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      expect(() => JSON.parse(content)).not.toThrow();
      expect(JSON.parse(content)).toEqual({ result: 'success', data: 'test' });

      // Verify response_format was sent correctly
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/v1/chat/completions',
        expect.objectContaining({
          response_format: { type: 'json_object' },
        })
      );
    });

    it('should use custom temperature and max_tokens when provided', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Custom response',
                role: 'assistant',
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 5,
            completion_tokens: 2,
            total_tokens: 7,
          },
        },
      };

      // Mock the axios post method to return our mock response
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await client.chat({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Test' }],
        temperature: 0.5,
        max_tokens: 1000,
      });

      // Verify custom parameters were sent
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/v1/chat/completions',
        expect.objectContaining({
          temperature: 0.5,
          max_tokens: 1000,
        })
      );
    });

    it('should handle timeout errors', async () => {
      const mockError = new Error('timeout of 30000ms exceeded');

      // Mock the axios post method to reject with our mock error
      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(
        client.chat({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow('timeout');
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Network Error');

      // Mock the axios post method to reject with our mock error
      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(
        client.chat({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow('Network Error');
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        data: {
          choices: [],
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
          },
        },
      };

      // Mock the axios post method to return our mock response
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const response = await client.chat({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(response.choices).toEqual([]);
    });

    it('should handle multiple messages in conversation', async () => {
      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'Response to conversation',
                role: 'assistant',
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 50,
            completion_tokens: 10,
            total_tokens: 60,
          },
        },
      };

      // Mock the axios post method to return our mock response
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await client.chat({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are helpful.' },
          { role: 'user', content: 'First message' },
          { role: 'assistant', content: 'First response' },
          { role: 'user', content: 'Second message' },
        ],
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/v1/chat/completions',
        expect.objectContaining({
          messages: [
            { role: 'system', content: 'You are helpful.' },
            { role: 'user', content: 'First message' },
            { role: 'assistant', content: 'First response' },
            { role: 'user', content: 'Second message' },
          ],
        })
      );
    });
  });

  describe('constructor', () => {
    it('should create axios instance with correct configuration', () => {
      const testClient = new DeepSeekClient();

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: config.deepseek.baseUrl,
          headers: {
            'Authorization': `Bearer ${config.deepseek.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: config.deepseek.timeout,
        })
      );
    });
  });
});