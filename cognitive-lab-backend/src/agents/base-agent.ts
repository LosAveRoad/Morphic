// src/agents/base-agent.ts
import { v4 as uuidv4 } from 'uuid';
import { DeepSeekClient } from '../services/deepseek-client';
import { logger } from '../utils/logger';

export abstract class BaseAgent {
  protected deepseekClient: DeepSeekClient;

  constructor() {
    this.deepseekClient = new DeepSeekClient();
  }

  protected generateSessionId(): string {
    return uuidv4();
  }

  protected buildSystemPrompt(template: string, variables: Record<string, any> = {}): string {
    let prompt = template;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return prompt;
  }

  protected parseJSONResponse<T>(jsonString: string, context: string): T {
    try {
      const parsed = JSON.parse(jsonString);
      return parsed as T;
    } catch (error) {
      logger.error(`Failed to parse JSON response for ${context}`, { jsonString });
      throw new Error(`Invalid JSON response from AI model for ${context}`);
    }
  }

  protected validateResponse<T>(response: any, validator: (obj: any) => boolean): T {
    if (!validator(response)) {
      throw new Error('AI response validation failed');
    }
    return response as T;
  }

  abstract execute(input: any): Promise<any>;
}