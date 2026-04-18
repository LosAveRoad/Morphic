// src/types/agent.types.ts
export interface RecommendOptionsRequest {
  canvasContext: {
    nearbyContent: string[];
    userHistory?: string[];
    currentTheme?: string;
  };
  sessionId?: string;
}

export interface RecommendedOption {
  optionId: string;
  title: string;
  description: string;
  icon: string;
  category: 'learning' | 'creative' | 'analysis';
  estimatedTime: number;
  confidence: number;
  previewHint?: string;
}

export interface RecommendOptionsResponse {
  sessionId: string;
  options: RecommendedOption[];
  metadata: {
    timestamp: string;
    processingTime: number;
    model: string;
  };
}

export interface GenerateContentRequest {
  sessionId: string;
  selectedOptionId?: string;
  userInput?: string;
  context?: {
    userPreferences?: {
      style?: 'academic' | 'casual' | 'minimal';
      language?: 'zh-CN' | 'en-US';
      outputFormat?: ('text' | 'html' | 'image')[];
    };
    additionalContext?: string;
  };
}

export interface HTMLComponent {
  type: 'slider' | 'button' | 'chart' | 'quiz' | 'formula';
  props: Record<string, any>;
  interactions?: {
    triggers: string[];
    actions: InteractionAction[];
  };
}

export interface InteractionAction {
  trigger: string;
  action: string;
  params?: Record<string, any>;
}

export interface TextSection {
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'formula';
  content: string;
  level?: number;
  format?: string;
}

export interface GeneratedContent {
  contentType: 'text' | 'html' | 'hybrid';

  text?: {
    markdown: string;
    plainText: string;
    sections?: TextSection[];
  };

  html?: {
    code: string;
    styles?: string;
    interactive: boolean;
    components?: HTMLComponent[];
  };

  hybrid?: {
    textContent: string;
    htmlComponents: string;
    layout: 'vertical' | 'horizontal' | 'grid';
  };
}

export interface ContentMetadata {
  timestamp: string;
  processingTime: number;
  model: string;
  wordCount: number;
  confidence: number;
  tags: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface GenerateContentResponse {
  content: GeneratedContent;
  metadata: ContentMetadata;
  relatedOptions?: RecommendedOption[];
}
