// src/agents/content-agent.ts
import { BaseAgent } from './base-agent';
import {
  GenerateContentRequest,
  GenerateContentResponse,
  GeneratedContent,
  ContentMetadata,
  RecommendedOption,
} from '../types/agent.types';
import { SessionManager } from '../services/session-manager';
import { logger } from '../utils/logger';

export class ContentAgent extends BaseAgent {
  private sessionManager: SessionManager;

  private readonly SYSTEM_PROMPT = `你是简洁的内容生成助手。

核心原则：少而精，言简意赅。

严格按JSON格式回复：
{
  "contentType": "text",
  "text": {
    "markdown": "简洁的Markdown内容",
    "plainText": "纯文本内容"
  },
  "metadata": {
    "wordCount": 100
  }
}

内容要求：
1. 文本内容控制在200字以内
2. 直击要点，避免冗余解释
3. 结构清晰，分段合理
4. 确保JSON完整有效

特殊情况：
- 如需代码：用简单的 \`\`\`language 代码 \`\`\`
- 如需列表：用简洁的 - 列表项
- 避免过长的数学公式或详细推导

记住：用户需要的是快速、精准的答案，不是长篇大论的教程。`;

  constructor(sessionManager?: SessionManager) {
    super();
    this.sessionManager = sessionManager || new SessionManager();
  }

  async execute(request: GenerateContentRequest): Promise<GenerateContentResponse> {
    const startTime = Date.now();

    try {
      logger.info('ContentAgent executing', {
        sessionId: request.sessionId,
        hasSelectedOption: !!request.selectedOptionId,
        hasUserInput: !!request.userInput,
      });

      // Validate request
      this.validateRequest(request);

      // Get session data
      const session = this.sessionManager.getSession(request.sessionId);
      if (!session) {
        throw new Error('Session not found or expired');
      }

      // Build user prompt
      const userPrompt = await this.buildUserPrompt(request, session);

      // Call DeepSeek
      const aiResponse = await this.deepseekClient.chat({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: this.SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1000, // Reduced for shorter content
        response_format: { type: 'json_object' },
      });

      // Parse response
      const content = aiResponse.choices[0].message.content;
      const parsedResponse = this.parseJSONResponse<{
        contentType: 'text' | 'html' | 'hybrid';
        text?: any;
        html?: any;
        hybrid?: any;
        metadata: {
          wordCount: number;
          confidence: number;
          tags: string[];
          difficulty?: 'beginner' | 'intermediate' | 'advanced';
        };
        relatedOptions?: RecommendedOption[];
      }>(content, 'generate-content');

      // Validate and build content
      const generatedContent = this.buildGeneratedContent(parsedResponse);

      // Build metadata
      const metadata = this.buildMetadata(parsedResponse.metadata, startTime);

      // Validate related options if present
      let relatedOptions: RecommendedOption[] | undefined;
      if (parsedResponse.relatedOptions && Array.isArray(parsedResponse.relatedOptions)) {
        relatedOptions = parsedResponse.relatedOptions;
        // Validate each related option
        relatedOptions.forEach((option, index) => {
          if (!option.optionId || !option.title || !option.description ||
              !option.icon || !option.category || !option.estimatedTime) {
            throw new Error(`Invalid related option at index ${index}: missing required fields`);
          }
        });
      }

      // Build response
      const response: GenerateContentResponse = {
        content: generatedContent,
        metadata,
        relatedOptions,
      };

      logger.info('ContentAgent completed', {
        sessionId: request.sessionId,
        contentType: response.content.contentType,
        processingTime: metadata.processingTime,
        wordCount: metadata.wordCount,
      });

      return response;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('ContentAgent error', {
        error: error instanceof Error ? error.message : String(error),
        sessionId: request.sessionId,
        processingTime,
      });
      throw error;
    }
  }

  private validateRequest(request: GenerateContentRequest): void {
    if (!request.selectedOptionId && !request.userInput) {
      throw new Error('Either selectedOptionId or userInput must be provided');
    }

    if (request.selectedOptionId && request.userInput) {
      logger.warn('Both optionId and userInput provided, prioritizing optionId');
    }
  }

  private async buildUserPrompt(
    request: GenerateContentRequest,
    session: any
  ): Promise<string> {
    let prompt = '任务：';

    // Direct user input (preferred, simplest)
    if (request.userInput) {
      prompt += request.userInput;
    }
    // Or use selected option
    else if (request.selectedOptionId) {
      const selectedOption = session.recommendedOptions.find(
        (opt: RecommendedOption) => opt.optionId === request.selectedOptionId
      );

      if (!selectedOption) {
        throw new Error('Selected option not found');
      }

      prompt += `${selectedOption.title} - ${selectedOption.description}`;
    }

    // Add style preference (simplified)
    const style = request.context?.userPreferences?.style;
    if (style) {
      prompt += `\n风格：${style === 'minimal' ? '极简' : style === 'casual' ? '轻松' : '学术'}`;
    }

    return prompt;
  }

  private buildGeneratedContent(response: any): GeneratedContent {
    const contentType = response.contentType;

    if (!['text', 'html', 'hybrid'].includes(contentType)) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    const content: GeneratedContent = {
      contentType,
    };

    // Build text content
    if (contentType === 'text' || contentType === 'hybrid') {
      if (response.text) {
        content.text = {
          markdown: response.text.markdown || '',
          plainText: response.text.plainText || '',
          sections: response.text.sections || [],
        };
      }
    }

    // Build HTML content
    if (contentType === 'html' || contentType === 'hybrid') {
      if (response.html) {
        content.html = {
          code: response.html.code || '',
          styles: response.html.styles || '',
          interactive: response.html.interactive || false,
          components: response.html.components || [],
        };
      }
    }

    // Build hybrid content
    if (contentType === 'hybrid' && response.hybrid) {
      content.hybrid = {
        textContent: response.hybrid.textContent || '',
        htmlComponents: response.hybrid.htmlComponents || '',
        layout: response.hybrid.layout || 'vertical',
      };
    }

    return content;
  }

  private buildMetadata(aiMetadata: any, startTime: number): ContentMetadata {
    // Handle case where AI doesn't return metadata
    if (!aiMetadata) {
      aiMetadata = {};
    }

    return {
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      model: 'deepseek-chat',
      wordCount: aiMetadata.wordCount || 0,
      confidence: aiMetadata.confidence || 0.8,
      tags: aiMetadata.tags || [],
      difficulty: aiMetadata.difficulty,
    };
  }
}