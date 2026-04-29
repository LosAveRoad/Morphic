import { config } from '../config';
import { AIError } from '../utils/errors';
import type { DeepSeekMessage, DeepSeekOptions } from '../types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callDeepSeek(messages: DeepSeekMessage[], options: DeepSeekOptions = {}): Promise<string> {
  const {
    responseFormat = 'text',
    temperature = 0.7,
    maxTokens = config.deepseek.maxTokens,
    timeout = 30000,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const body: Record<string, unknown> = {
      model: config.deepseek.model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    if (responseFormat === 'json_object') {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch(`${config.deepseek.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.deepseek.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        throw new AIError('AI_RATE_LIMITED', 'DeepSeek rate limited, please retry later');
      }
      const errorBody = await response.json().catch(() => ({}));
      throw new AIError('AI_API_ERROR', `DeepSeek API error (${response.status}): ${(errorBody as Record<string,unknown>).error || 'unknown'}`);
    }

    const data = await response.json() as {
      choices: { message: { content: string } }[];
    };

    return data.choices[0]?.message?.content ?? '';
  } catch (err) {
    clearTimeout(timeoutId);
    if (controller.signal.aborted) {
      throw new AIError('AI_TIMEOUT', `DeepSeek request timeout after ${timeout}ms`);
    }
    if (err instanceof AIError) throw err;
    throw new AIError('AI_NETWORK_ERROR', `DeepSeek network error: ${(err as Error).message}`);
  }
}

export const deepseekClient = {
  async chat(messages: DeepSeekMessage[], options: DeepSeekOptions = {}): Promise<string> {
    const retries = options.retries ?? 1;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await callDeepSeek(messages, { ...options, retries: undefined });
      } catch (err) {
        lastError = err as Error;
        if (attempt < retries - 1) {
          await delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError ?? new AIError('AI_UNKNOWN', 'DeepSeek request failed with all retries');
  },
};
