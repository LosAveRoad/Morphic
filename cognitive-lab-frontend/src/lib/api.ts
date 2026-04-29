const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

import { CanvasContext } from '../types/canvas';
import { GenerationInput } from '../types/api';
import { Recommendation, ContentBlock } from '../types/content';

interface User {
  id: string;
  email: string;
  name?: string | null;
}

interface AuthResponse {
  user: User;
  token: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}

class APIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('morphic_token');
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('morphic_token', token);
      } else {
        localStorage.removeItem('morphic_token');
      }
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.error?.message || 'Registration failed');
    this.setToken(json.data.token);
    return json.data;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.error?.message || 'Login failed');
    this.setToken(json.data.token);
    return json.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${this.baseURL}/api/auth/me`, {
      headers: this.getHeaders(),
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.error?.message || 'Not authenticated');
    return json.data;
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }

  async getRecommendations(context: CanvasContext): Promise<Recommendation[]> {
    const response = await fetch(`${this.baseURL}/api/recommendations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ canvasContext: { nearbyContent: context.nearbyContent || [] } }),
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to get recommendations');
    return json.data.recommendations.map((r: { id: string; label: string; description: string }) => ({
      id: r.id,
      text: r.label,
      type: 'text' as const,
      icon: '💡',
    }));
  }

  async generateContent(input: GenerationInput): Promise<ContentBlock> {
    const response = await fetch(`${this.baseURL}/api/content/generate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        sessionId: input.sessionId,
        userInput: input.userInput,
        selectedOptionId: input.selectedOptionId,
        context: { additionalContext: input.context?.additionalContext },
      }),
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to generate content');

    const data = json.data;
    return {
      id: `block-${Date.now()}`,
      type: data.content?.type === 'html' ? 'concept' : 'text',
      position: { x: 0, y: 0 },
      content: data.content?.html ? { html: data.content.html } : (data.content?.text || ''),
      metadata: {
        createdAt: new Date().toISOString(),
        sessionId: data.sessionId || input.sessionId,
        variants: [],
        currentVariant: 0,
      },
    };
  }
}

export const apiClient = new APIClient(API_URL);
export type { User, AuthResponse, LoginCredentials, RegisterCredentials };
