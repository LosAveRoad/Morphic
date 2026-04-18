import { Recommendation } from './content';

export interface GenerationInput {
  sessionId: string;
  selectedOptionId?: string;
  userInput?: string;
  context: {
    userPreferences?: {
      style?: 'academic' | 'casual' | 'minimal';
      language?: 'zh-CN' | 'en-US';
    };
    additionalContext?: string;
  };
}

export interface CanvasStateResponse {
  sessionId: string;
  recommendations: Recommendation[];
  nearbyContent: string[];
}