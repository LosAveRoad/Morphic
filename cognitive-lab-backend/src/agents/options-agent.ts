// src/agents/options-agent.ts
import { BaseAgent } from './base-agent';
import {
  RecommendOptionsRequest,
  RecommendOptionsResponse,
  RecommendedOption,
} from '../types/agent.types';
import { logger } from '../utils/logger';

export class OptionsAgent extends BaseAgent {
  private readonly SYSTEM_PROMPT = `你是AI交互选项推荐专家。

任务：基于画布上下文，推荐3-4个最实用的AI交互选项。

严格要求：
1. 标题不超过8个字
2. 描述不超过15个字
3. JSON必须完整有效
4. 输出必须简洁

JSON格式：
{
  "options": [
    {
      "optionId": "opt_1",
      "title": "简短标题",
      "description": "一句话描述",
      "icon": "📝",
      "category": "learning",
      "estimatedTime": 3,
      "confidence": 0.8
    }
  ]
}

分类：learning(学习) | creative(创意) | analysis(分析)
图标：📚🎓📝✏️🧮💡🎨📖✨📊🔍📈🤔💭
时间：1-10分钟，根据复杂度
置信度：0.5-1.0，越高越相关

记住：简洁是关键，只输出最核心的信息。`;

  async execute(request: RecommendOptionsRequest): Promise<RecommendOptionsResponse> {
    const startTime = Date.now();

    try {
      logger.info('OptionsAgent executing', {
        contextSize: request.canvasContext.nearbyContent.length,
        hasUserHistory: !!request.canvasContext.userHistory?.length,
        hasTheme: !!request.canvasContext.currentTheme,
      });

      // Build user prompt
      const userPrompt = this.buildUserPrompt(request);

      // Call DeepSeek
      const aiResponse = await this.deepseekClient.chat({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: this.SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 500, // Reduced for concise options
        response_format: { type: 'json_object' },
      });

      // Parse response
      const content = aiResponse.choices[0].message.content;
      const parsedResponse = this.parseJSONResponse<{
        options: RecommendedOption[];
      }>(content, 'recommend-options');

      // Validate response
      if (!parsedResponse.options || !Array.isArray(parsedResponse.options)) {
        throw new Error('Invalid response structure: missing options array');
      }

      // Validate each option has required fields
      parsedResponse.options.forEach((option, index) => {
        if (!option.optionId || !option.title || !option.description ||
            !option.icon || !option.category || !option.estimatedTime) {
          throw new Error(`Invalid option at index ${index}: missing required fields`);
        }

        if (typeof option.confidence !== 'number' || option.confidence < 0 || option.confidence > 1) {
          throw new Error(`Invalid option at index ${index}: confidence must be between 0 and 1`);
        }

        if (!['learning', 'creative', 'analysis'].includes(option.category)) {
          throw new Error(`Invalid option at index ${index}: category must be learning, creative, or analysis`);
        }
      });

      // Generate session ID
      const sessionId = request.sessionId || this.generateSessionId();

      // Build response
      const response: RecommendOptionsResponse = {
        sessionId,
        options: parsedResponse.options,
        metadata: {
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          model: 'deepseek-chat',
        },
      };

      logger.info('OptionsAgent completed', {
        sessionId,
        optionCount: response.options.length,
        processingTime: response.metadata.processingTime,
      });

      return response;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('OptionsAgent error', {
        error: error instanceof Error ? error.message : String(error),
        processingTime,
      });
      throw error;
    }
  }

  private buildUserPrompt(request: RecommendOptionsRequest): string {
    let prompt = '请基于以下画布上下文推荐AI交互选项：\n\n';

    if (request.canvasContext.nearbyContent.length > 0) {
      prompt += '附近内容：\n';
      request.canvasContext.nearbyContent.forEach((content, index) => {
        prompt += `${index + 1}. ${content}\n`;
      });
      prompt += '\n';
    }

    if (request.canvasContext.userHistory && request.canvasContext.userHistory.length > 0) {
      prompt += '用户历史主题：\n';
      request.canvasContext.userHistory.forEach((topic, index) => {
        prompt += `${index + 1}. ${topic}\n`;
      });
      prompt += '\n';
    }

    if (request.canvasContext.currentTheme) {
      prompt += `当前主题风格：${request.canvasContext.currentTheme}\n\n`;
    }

    prompt += '请推荐3-4个最适合的AI交互选项，确保选项多样化且实用。';

    return prompt;
  }
}