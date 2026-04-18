// src/services/deepseek-client.ts
import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'text' | 'json_object' };
}

interface ChatResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepSeekClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.deepseek.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.deepseek.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: config.deepseek.timeout,
    });
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      logger.info('DeepSeek API request', {
        model: request.model,
        messageCount: request.messages.length,
      });

      const response = await this.client.post('/v1/chat/completions', {
        model: request.model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || 2000,
        response_format: request.response_format,
      });

      const duration = Date.now() - startTime;
      logger.info('DeepSeek API response', {
        duration: `${duration}ms`,
        tokens: response.data.usage?.total_tokens,
      });

      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('DeepSeek API error', {
        duration: `${duration}ms`,
        error: error.message,
      });

      throw error;
    }
  }
}