import { v4 as uuid } from 'uuid';
import { deepseekClient } from './deepseek-client';
import { AIError } from '../utils/errors';
import type { RecommendRequest, RecommendResponse } from '../types';

const RECOMMEND_SYSTEM_PROMPT = `You are a note-taking AI assistant. Based on the user's canvas notes, predict what the user most likely wants to do next.

Provide 3-5 specific, useful suggestions. Each suggestion must have:
- id: English identifier (e.g., explain, outline, summarize, question, demo)
- label: Short label (6 words max)
- description: One-sentence description (15 words max)

Respond with JSON: { "recommendations": [{ "id": "...", "label": "...", "description": "..." }] }`;

export const recommendService = {
  async getRecommendations(input: RecommendRequest): Promise<RecommendResponse> {
    const sessionId = input.sessionId || uuid();
    const nearbyText = input.canvasContext.nearbyContent.join('\n').slice(0, 1000);

    const messages = [
      { role: 'system' as const, content: RECOMMEND_SYSTEM_PROMPT },
      { role: 'user' as const, content: nearbyText || 'Blank canvas' },
    ];

    try {
      const raw = await deepseekClient.chat(messages, {
        responseFormat: 'json_object',
        timeout: 8000,
        retries: 2,
      });

      const parsed = JSON.parse(raw);
      if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
        throw new AIError('AI_RESPONSE_ERROR', 'Invalid recommendations format from AI');
      }

      return {
        sessionId,
        recommendations: parsed.recommendations.slice(0, 5),
      };
    } catch (err) {
      if (err instanceof AIError) throw err;

      // Fallback recommendations on non-AI errors
      return {
        sessionId,
        recommendations: [
          { id: 'explain', label: 'Explain this concept', description: 'Generate an explanation card' },
          { id: 'outline', label: 'Create an outline', description: 'Extract key points hierarchically' },
          { id: 'summarize', label: 'Summarize key points', description: 'Extract core insights' },
        ],
      };
    }
  },
};
