import { v4 as uuid } from 'uuid';
import { deepseekClient } from './deepseek-client';
import { AIError } from '../utils/errors';
import type { RedoRequest, RedoResponse } from '../types';

const REDO_SYSTEM_PROMPT = `You are a note-taking AI assistant. The user rejected the previous AI suggestion and now wants something different.

Analyze the previous failure:
- What suggestions did the user see?
- What did the user actually choose?
- What might the user really want?

Generate brand new content. Do NOT repeat the previous output style or direction.

You can generate two types:
1. text - Markdown format text
2. html - Interactive HTML component (400px width, inline styles, self-contained)

Return JSON: { "type": "text"|"html", "content": "..." }`;

export const redoService = {
  async redo(input: RedoRequest): Promise<RedoResponse> {
    const prevLabels = input.previousRecommendations?.map(r => r.label).join(', ') || 'unknown';

    const userMessage = [
      `Previous AI suggestions: ${prevLabels}`,
      input.selectedOptionId ? `User chose: ${input.selectedOptionId}` : '',
      `Canvas context: ${input.context.additionalContext || 'none'}`,
      'Analyze why the previous attempt failed and generate something in a completely different direction.',
    ].join('\n');

    const messages = [
      { role: 'system' as const, content: REDO_SYSTEM_PROMPT },
      { role: 'user' as const, content: userMessage },
    ];

    const raw = await deepseekClient.chat(messages, {
      responseFormat: 'json_object',
      timeout: 30000,
      retries: 2,
    });

    const parsed = JSON.parse(raw);
    if (!parsed.type || !parsed.content) {
      throw new AIError('AI_RESPONSE_ERROR', 'Invalid redo response format');
    }

    const result: RedoResponse = {
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
