import { Position } from './canvas';

export type ContentType = 'text' | 'pomodoro' | 'math' | 'algorithm' | 'concept';

export interface ContentBlock {
  id: string;
  type: ContentType;
  position: Position;
  content: any;
  metadata: {
    createdAt: string;
    sessionId: string;
    variants: any[];
    currentVariant: number;
  };
}

export interface Recommendation {
  id: string;
  text: string;
  type: ContentType;
  icon?: string;
}