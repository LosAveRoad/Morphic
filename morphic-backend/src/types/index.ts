// ===== API Request Types =====
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RecommendRequest {
  sessionId?: string;
  canvasContext: {
    nearbyContent: string[];
    imageBase64?: string;
  };
}

export interface GenerateRequest {
  sessionId: string;
  userInput?: string;
  selectedOptionId?: string;
  selectedOptionLabel?: string;
  context: {
    additionalContext?: string;
    imageBase64?: string;
  };
}

export interface RedoRequest {
  sessionId: string;
  messageId: string;
  previousRecommendations?: { id: string; label: string; description: string }[];
  selectedOptionId?: string;
  context: {
    additionalContext?: string;
  };
}

// ===== API Response Types =====
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface RecommendResponse {
  sessionId: string;
  recommendations: {
    id: string;
    label: string;
    description: string;
  }[];
}

export interface GenerateResponse {
  messageId: string;
  content: {
    type: 'text' | 'html';
    text?: string;
    html?: string;
  };
}

export type RedoResponse = GenerateResponse;

// ===== DeepSeek Types =====
export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | DeepSeekContentPart[];
}

export interface DeepSeekContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface DeepSeekOptions {
  responseFormat?: 'text' | 'json_object';
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retries?: number;
}
