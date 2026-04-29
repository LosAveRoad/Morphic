import { v4 as uuid } from 'uuid';
import { deepseekClient } from './deepseek-client';
import { AIError } from '../utils/errors';
import type { GenerateRequest, GenerateResponse } from '../types';

const GENERATE_SYSTEM_PROMPT = `You are a note-taking AI assistant. Generate content based on user requests and canvas context.

You can generate two types of content:
1. text - Markdown format text content (for note cards)
2. html - Interactive HTML component (for embedding in canvas)

Use html type when the user requests visualization, interactive demo, calculator, etc.
Use text type when the user requests explanation, summary, outline, etc.

HTML component requirements:
- Fixed width 400px, use max-width:100%; box-sizing:border-box to prevent overflow
- All CSS must use inline style attributes, no external stylesheets
- Must be self-contained and run independently in an iframe
- Preserve all button clicks, animations, and interactive behaviors
- Use overflow-x:auto for tables/code blocks
- Use relative font sizes (rem/em) or small px values for narrow screens

Return JSON: { "type": "text"|"html", "content": "..." }`;

export const generateService = {
  async generate(input: GenerateRequest): Promise<GenerateResponse> {
    const contextParts = [];
    if (input.context.additionalContext) {
      contextParts.push(`Canvas context:\n${input.context.additionalContext}`);
    }
    if (input.selectedOptionLabel) {
      contextParts.push(`User selected: ${input.selectedOptionLabel}`);
    }
    if (input.userInput) {
      contextParts.push(`User input: ${input.userInput}`);
    }

    const messages = [
      { role: 'system' as const, content: GENERATE_SYSTEM_PROMPT },
      { role: 'user' as const, content: contextParts.join('\n\n') || 'Generate content' },
    ];

    const raw = await deepseekClient.chat(messages, {
      responseFormat: 'json_object',
      timeout: 30000,
      retries: 2,
    });

    const parsed = JSON.parse(raw);
    if (!parsed.type || !parsed.content) {
      throw new AIError('AI_RESPONSE_ERROR', 'Invalid generate response format');
    }

    const result: GenerateResponse = {
      messageId: uuid(),
      content: {
        type: parsed.type,
      },
    };

    if (parsed.type === 'html') {
      result.content.html = parsed.content;
    } else {
      result.content.text = parsed.content;
    }

    return result;
  },
};
