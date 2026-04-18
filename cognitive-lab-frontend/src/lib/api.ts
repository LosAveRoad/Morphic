const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://68.64.180.252:3000';

interface User {
  id: string;
  email: string;
  username?: string;
  createdAt: string;
  updatedAt?: string;
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
  username?: string;
}

import { CanvasContext } from '../types/canvas';
import { GenerationInput } from '../types/api';
import { Recommendation, ContentBlock } from '../types/content';

class APIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
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

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
        error: 'Error',
      }));

      // Handle validation errors with details
      if (response.status === 400 && error.details) {
        const detailMessages = error.details
          .map((detail: any) => `${detail.field}: ${detail.message}`)
          .join(', ');
        throw new Error(`Validation Error: ${detailMessages}`);
      }

      const errorMessage = error.message || error.error || 'An error occurred';

      // Specific error messages based on status code
      if (response.status === 400) {
        throw new Error(errorMessage);
      } else if (response.status === 401) {
        throw new Error(errorMessage);
      } else if (response.status === 409) {
        throw new Error(errorMessage);
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else if (!response.status) {
        throw new Error('Network error. Please check your connection.');
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/api/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    });

    const data = await this.handleResponse<AuthResponse>(response);
    this.setToken(data.token);
    return data;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    });

    const data = await this.handleResponse<AuthResponse>(response);
    this.setToken(data.token);
    return data;
  }

  async logout(): Promise<void> {
    const response = await fetch(`${this.baseURL}/api/auth/logout`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    await this.handleResponse<{ message: string }>(response);
    this.setToken(null);
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${this.baseURL}/api/auth/me`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await this.handleResponse<{ user: User }>(response);
    return data.user;
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getRecommendations(context: CanvasContext): Promise<Recommendation[]> {
    const response = await fetch(`${this.baseURL}/api/recommendations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(context),
    });

    const data = await this.handleResponse<{ recommendations: Recommendation[] }>(response);
    return data.recommendations;
  }

  async generateContent(input: GenerationInput): Promise<ContentBlock> {
    const response = await fetch(`${this.baseURL}/api/content/generate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(input),
    });

    return this.handleResponse<ContentBlock>(response);
  }

  async regenerateContent(blockId: string): Promise<ContentBlock> {
    const response = await fetch(`${this.baseURL}/api/content/regenerate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ blockId }),
    });

    return this.handleResponse<ContentBlock>(response);
  }
}

export const apiClient = new APIClient(API_URL);
export type { User, AuthResponse, LoginCredentials, RegisterCredentials, Recommendation, ContentBlock, CanvasContext, GenerationInput };