# Morphic Notes 重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从零重建 Morphic 后端（Express + TypeScript + Prisma + DeepSeek），修复前端关键问题（camera同步、iframe自适应、动画重写）

**Architecture:** 单体 Express API 服务，6 个端点（auth x3, recommend, generate, redo），DeepSeek 多模态 API 处理文字和手写识别，前端基于现有 tldraw + React 代码做最小修改

**Tech Stack:** Node.js + Express + TypeScript, Prisma + SQLite, DeepSeek API, Next.js 16 + React 19 + tldraw 4

---

## 文件结构预览

```
Morphic/
├── morphic-backend/                    # 新建后端
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js                  # 实际用 vitest
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── app.ts                      # Express 入口
│       ├── config/index.ts
│       ├── types/index.ts
│       ├── utils/
│       │   ├── errors.ts              # 错误类体系
│       │   ├── jwt.ts                 # JWT 工具
│       │   └── password.ts            # bcrypt 工具
│       ├── services/
│       │   ├── auth-service.ts
│       │   ├── deepseek-client.ts
│       │   ├── recommend-service.ts
│       │   ├── generate-service.ts
│       │   └── redo-service.ts
│       └── api/
│           ├── routes/
│           │   ├── auth.ts
│           │   ├── recommend.ts
│           │   ├── generate.ts
│           │   └── redo.ts
│           └── middleware/
│               ├── auth.ts
│               ├── error-handler.ts
│               └── rate-limit.ts
│
├── cognitive-lab-frontend/             # 修改现有前端
│   └── src/
│       ├── lib/mock/ai-provider.ts     # 新建 mock provider
│       ├── components/canvas/          # 修改 camera 同步
│       ├── components/cards/           # 修改 iframe 自适应
│       └── components/ai/              # 修改动画
```

---

## 阶段零：清理 & 项目初始化

### Task 0: 清理旧代码并初始化后端项目

**Files:**
- Create: `morphic-backend/package.json`
- Create: `morphic-backend/tsconfig.json`
- Create: `morphic-backend/prisma/schema.prisma`
- Create: `morphic-backend/src/config/index.ts`
- Create: `morphic-backend/src/types/index.ts`

- [ ] **Step 1: 清理旧 backend 文件**

```bash
cd /Users/akuya/Desktop/Morphic
# 旧 backend 文件已在 git 中标记为删除，清理 git 状态
git status --short | grep '^ D.*cognitive-lab-backend' | awk '{print $2}' | xargs -r git rm
```

- [ ] **Step 2: 创建 morphic-backend/package.json**

```json
{
  "name": "morphic-backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:push": "prisma db push",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "express": "^4.21.0",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/node": "^20.11.0",
    "prisma": "^5.22.0",
    "supertest": "^6.3.4",
    "@types/supertest": "^6.0.2",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "vitest": "^1.2.0"
  }
}
```

- [ ] **Step 3: 创建 morphic-backend/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 4: 创建 Prisma Schema**

```prisma
// morphic-backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String?
  createdAt DateTime @default(now())
  sessions  Session[]
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  title     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  messages  Message[]
}

model Message {
  id               String   @id @default(uuid())
  sessionId        String
  session          Session  @relation(fields: [sessionId], references: [id])
  role             String
  inputText        String?
  canvasContext    String?
  recommendations  String?
  selectedOption   String?
  generatedType    String?
  generatedContent String?
  createdAt        DateTime @default(now())
}
```

- [ ] **Step 5: 创建 config/index.ts**

```typescript
// morphic-backend/src/config/index.ts
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'morphic-dev-secret-change-in-prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    maxTokens: 4096,
  },
  rateLimit: {
    windowMs: 60 * 1000,  // 1 minute
    max: 10,               // 10 requests per minute per user
  },
};
```

- [ ] **Step 6: 创建 types/index.ts**

```typescript
// morphic-backend/src/types/index.ts

// ===== API 请求类型 =====
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

// ===== API 响应类型 =====
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
    text?: string;    // markdown text
    html?: string;    // html code
  };
}

export type RedoResponse = GenerateResponse;

// ===== DeepSeek 类型 =====
export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | DeepSeekContentPart[];
}

export interface DeepSeekContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;  // data:image/png;base64,xxx
  };
}

export interface DeepSeekOptions {
  responseFormat?: 'text' | 'json_object';
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retries?: number;
}
```

- [ ] **Step 7: 安装依赖 + 初始化 Prisma**

```bash
cd /Users/akuya/Desktop/Morphic/morphic-backend
npm install
npx prisma db push
```

- [ ] **Step 8: 创建 .env 文件**

```
# morphic-backend/.env
PORT=3001
JWT_SECRET=morphic-dev-secret-change-in-prod
DEEPSEEK_API_KEY=sk-your-deepseek-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

- [ ] **Step 9: Commit**

```bash
git add morphic-backend/
git commit -m "feat: initialize morphic backend project with prisma schema"
```

---

## 阶段一：后端基础设施

### Task 1: 实现错误类和工具函数

**Files:**
- Create: `morphic-backend/src/utils/errors.ts`
- Create: `morphic-backend/src/utils/password.ts`
- Create: `morphic-backend/src/utils/jwt.ts`
- Create: `morphic-backend/tests/utils/errors.test.ts`

- [ ] **Step 1: 创建错误类**

```typescript
// morphic-backend/src/utils/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, 'VALIDATION_ERROR', message);
    this.name = 'ValidationError';
  }
}

export class AuthError extends AppError {
  constructor(message: string) {
    super(401, 'AUTH_ERROR', message);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, 'NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

export class AIError extends AppError {
  constructor(code: string, message: string) {
    super(502, code, message);
    this.name = 'AIError';
  }
}
```

- [ ] **Step 2: 创建密码工具**

```typescript
// morphic-backend/src/utils/password.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

- [ ] **Step 3: 创建 JWT 工具**

```typescript
// morphic-backend/src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayload {
  userId: string;
  email: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}
```

- [ ] **Step 4: 编写错误类测试**

```typescript
// morphic-backend/tests/utils/errors.test.ts
import { describe, it, expect } from 'vitest';
import { AppError, ValidationError, AuthError, NotFoundError, AIError } from '../../src/utils/errors';

describe('Error classes', () => {
  it('ValidationError has status 400', () => {
    const err = new ValidationError('bad input');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('AuthError has status 401', () => {
    const err = new AuthError('unauthorized');
    expect(err.statusCode).toBe(401);
  });

  it('NotFoundError has status 404', () => {
    const err = new NotFoundError('not found');
    expect(err.statusCode).toBe(404);
  });

  it('AIError has status 502', () => {
    const err = new AIError('AI_TIMEOUT', 'timeout');
    expect(err.statusCode).toBe(502);
    expect(err.code).toBe('AI_TIMEOUT');
  });

  it('all extend AppError', () => {
    expect(new ValidationError('x')).toBeInstanceOf(AppError);
    expect(new AuthError('x')).toBeInstanceOf(AppError);
    expect(new NotFoundError('x')).toBeInstanceOf(AppError);
    expect(new AIError('x', 'x')).toBeInstanceOf(AppError);
  });
});
```

- [ ] **Step 5: 运行测试**

```bash
cd /Users/akuya/Desktop/Morphic/morphic-backend
npx vitest run
```

预期：1个测试套件，5个测试通过

- [ ] **Step 6: Commit**

```bash
git add morphic-backend/src/utils/ morphic-backend/tests/
git commit -m "feat: add error classes, password and jwt utilities with tests"
```

### Task 2: 实现中间件

**Files:**
- Create: `morphic-backend/src/api/middleware/error-handler.ts`
- Create: `morphic-backend/src/api/middleware/auth.ts`
- Create: `morphic-backend/src/api/middleware/rate-limit.ts`
- Create: `morphic-backend/tests/api/middleware.test.ts`

- [ ] **Step 1: 创建错误处理中间件**

```typescript
// morphic-backend/src/api/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/errors';
import type { ApiResponse } from '../../types';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    const body: ApiResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // Unexpected error
  console.error('Unexpected error:', err);
  const body: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  };
  res.status(500).json(body);
}
```

- [ ] **Step 2: 创建 JWT 认证中间件**

```typescript
// morphic-backend/src/api/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../../utils/jwt';
import { AuthError } from '../../utils/errors';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new AuthError('Missing or invalid authorization header'));
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    next(new AuthError('Invalid or expired token'));
  }
}
```

- [ ] **Step 3: 创建限流中间件**

```typescript
// morphic-backend/src/api/middleware/rate-limit.ts
import { Request, Response, NextFunction } from 'express';
import { config } from '../../config';
import { AppError } from '../../utils/errors';

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimitMiddleware(req: Request, _res: Response, next: NextFunction) {
  const key = req.user?.userId ?? req.ip ?? 'anonymous';
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + config.rateLimit.windowMs });
    next();
    return;
  }

  if (bucket.count >= config.rateLimit.max) {
    next(new AppError(429, 'RATE_LIMITED', 'Too many requests, please slow down'));
    return;
  }

  bucket.count++;
  next();
}

// Clean up expired buckets every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) {
      buckets.delete(key);
    }
  }
}, 10 * 60 * 1000);
```

- [ ] **Step 4: 编写中间件测试**

```typescript
// morphic-backend/tests/api/middleware.test.ts
import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../src/api/middleware/error-handler';
import { ValidationError, AppError } from '../../src/utils/errors';

describe('errorHandler middleware', () => {
  it('returns structured error for AppError', () => {
    const err = new ValidationError('email is required');
    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'email is required' },
    });
  });

  it('returns 500 for unknown errors', () => {
    const err = new Error('something broke');
    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  });
});
```

- [ ] **Step 5: 运行测试**

```bash
cd /Users/akuya/Desktop/Morphic/morphic-backend
npx vitest run
```

- [ ] **Step 6: Commit**

```bash
git add morphic-backend/src/api/middleware/ morphic-backend/tests/api/
git commit -m "feat: add error handler, auth, and rate-limit middleware with tests"
```

### Task 3: 实现 DeepSeek Client

**Files:**
- Create: `morphic-backend/src/services/deepseek-client.ts`
- Create: `morphic-backend/tests/services/deepseek-client.test.ts`

- [ ] **Step 1: 编写测试**

```typescript
// morphic-backend/tests/services/deepseek-client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deepseekClient } from '../../src/services/deepseek-client';

describe('deepseekClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends messages and returns content on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: '{"result": "ok"}' } }],
      }),
    });

    const result = await deepseekClient.chat(
      [{ role: 'user', content: 'hello' }],
      { responseFormat: 'json_object', timeout: 5000 },
    );

    expect(result).toBe('{"result": "ok"}');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('throws on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: { message: 'Rate limited' } }),
    });

    await expect(
      deepseekClient.chat([{ role: 'user', content: 'hello' }]),
    ).rejects.toThrow();
  });

  it('retries on failure', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'retry works' } }],
        }),
      });

    const result = await deepseekClient.chat(
      [{ role: 'user', content: 'hello' }],
      { retries: 2 },
    );

    expect(result).toBe('retry works');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

```bash
cd /Users/akuya/Desktop/Morphic/morphic-backend
npx vitest run tests/services/deepseek-client.test.ts
```
预期：FAIL（文件不存在）

- [ ] **Step 3: 实现 DeepSeek Client**

```typescript
// morphic-backend/src/services/deepseek-client.ts
import { config } from '../config';
import { AIError } from '../utils/errors';
import type { DeepSeekMessage, DeepSeekOptions } from '../types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callDeepSeek(messages: DeepSeekMessage[], options: DeepSeekOptions = {}): Promise<string> {
  const {
    responseFormat = 'text',
    temperature = 0.7,
    maxTokens = config.deepseek.maxTokens,
    timeout = 30000,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const body: Record<string, unknown> = {
      model: config.deepseek.model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    if (responseFormat === 'json_object') {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch(`${config.deepseek.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.deepseek.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        throw new AIError('AI_RATE_LIMITED', 'DeepSeek rate limited, please retry later');
      }
      const errorBody = await response.json().catch(() => ({}));
      throw new AIError('AI_API_ERROR', `DeepSeek API error (${response.status}): ${(errorBody as Record<string,unknown>).error || 'unknown'}`);
    }

    const data = await response.json() as {
      choices: { message: { content: string } }[];
    };

    return data.choices[0]?.message?.content ?? '';
  } catch (err) {
    clearTimeout(timeoutId);
    if (controller.signal.aborted) {
      throw new AIError('AI_TIMEOUT', `DeepSeek request timeout after ${timeout}ms`);
    }
    if (err instanceof AIError) throw err;
    throw new AIError('AI_NETWORK_ERROR', `DeepSeek network error: ${(err as Error).message}`);
  }
}

export const deepseekClient = {
  async chat(messages: DeepSeekMessage[], options: DeepSeekOptions = {}): Promise<string> {
    const retries = options.retries ?? 1;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await callDeepSeek(messages, { ...options, retries: undefined });
      } catch (err) {
        lastError = err as Error;
        if (attempt < retries - 1) {
          await delay(Math.pow(2, attempt) * 1000);  // 1s, 2s backoff
        }
      }
    }

    throw lastError ?? new AIError('AI_UNKNOWN', 'DeepSeek request failed with all retries');
  },
};
```

- [ ] **Step 4: 运行测试验证通过**

```bash
npx vitest run tests/services/deepseek-client.test.ts
```
预期：3个测试通过

- [ ] **Step 5: Commit**

```bash
git add morphic-backend/src/services/deepseek-client.ts morphic-backend/tests/services/
git commit -m "feat: add deepseek client with retry and timeout support"
```

---

## 阶段二：业务服务

### Task 4: 实现 Auth Service

**Files:**
- Create: `morphic-backend/src/services/auth-service.ts`
- Create: `morphic-backend/tests/services/auth-service.test.ts`

- [ ] **Step 1: 编写测试**

```typescript
// morphic-backend/tests/services/auth-service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { authService } from '../../src/services/auth-service';

const prisma = new PrismaClient();

describe('authService', () => {
  beforeEach(async () => {
    await prisma.message.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  it('registers a new user and returns token', async () => {
    const result = await authService.register({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test',
    });

    expect(result.token).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.name).toBe('Test');
    expect(result.user).not.toHaveProperty('password');
  });

  it('throws on duplicate email', async () => {
    await authService.register({ email: 'dup@example.com', password: 'pw1' });
    await expect(
      authService.register({ email: 'dup@example.com', password: 'pw2' }),
    ).rejects.toThrow();
  });

  it('logs in with correct credentials', async () => {
    await authService.register({ email: 'login@example.com', password: 'pw' });
    const result = await authService.login({
      email: 'login@example.com',
      password: 'pw',
    });

    expect(result.token).toBeDefined();
    expect(result.user.email).toBe('login@example.com');
  });

  it('throws on wrong password', async () => {
    await authService.register({ email: 'x@x.com', password: 'correct' });
    await expect(
      authService.login({ email: 'x@x.com', password: 'wrong' }),
    ).rejects.toThrow();
  });

  it('gets user by id', async () => {
    const { user: created } = await authService.register({
      email: 'me@example.com',
      password: 'pw',
    });
    const user = await authService.getUserById(created.id);
    expect(user).toBeDefined();
    expect(user!.email).toBe('me@example.com');
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

```bash
cd /Users/akuya/Desktop/Morphic/morphic-backend
npx vitest run tests/services/auth-service.test.ts
```

- [ ] **Step 3: 实现 Auth Service**

```typescript
// morphic-backend/src/services/auth-service.ts
import { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { ValidationError, AuthError, NotFoundError } from '../utils/errors';
import type { RegisterRequest, LoginRequest, AuthResponse } from '../types';

const prisma = new PrismaClient();

function sanitizeUser(user: { id: string; email: string; name: string | null }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export const authService = {
  async register(input: RegisterRequest): Promise<AuthResponse> {
    if (!input.email || !input.password) {
      throw new ValidationError('Email and password are required');
    }

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ValidationError('Email already registered');
    }

    const hashed = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashed,
        name: input.name ?? null,
      },
    });

    const token = signToken({ userId: user.id, email: user.email });
    return { token, user: sanitizeUser(user) };
  },

  async login(input: LoginRequest): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new AuthError('Invalid email or password');
    }

    const valid = await verifyPassword(input.password, user.password);
    if (!valid) {
      throw new AuthError('Invalid email or password');
    }

    const token = signToken({ userId: user.id, email: user.email });
    return { token, user: sanitizeUser(user) };
  },

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return sanitizeUser(user);
  },
};
```

- [ ] **Step 4: 运行测试验证通过**

```bash
npx vitest run tests/services/auth-service.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add morphic-backend/src/services/auth-service.ts morphic-backend/tests/services/
git commit -m "feat: add auth service with register/login and tests"
```

### Task 5: 实现 AI 业务服务

**Files:**
- Create: `morphic-backend/src/services/recommend-service.ts`
- Create: `morphic-backend/src/services/generate-service.ts`
- Create: `morphic-backend/src/services/redo-service.ts`
- Create: `morphic-backend/tests/services/ai-services.test.ts`

- [ ] **Step 1: 编写测试**

```typescript
// morphic-backend/tests/services/ai-services.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock deepseek-client
vi.mock('../../src/services/deepseek-client', () => ({
  deepseekClient: {
    chat: vi.fn(),
  },
}));

import { deepseekClient } from '../../src/services/deepseek-client';
import { recommendService } from '../../src/services/recommend-service';
import { generateService } from '../../src/services/generate-service';
import { redoService } from '../../src/services/redo-service';

describe('recommendService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns parsed recommendations', async () => {
    const mockChat = vi.mocked(deepseekClient.chat);
    mockChat.mockResolvedValue(JSON.stringify({
      recommendations: [
        { id: '1', label: '解释概念', description: '生成说明卡片' },
        { id: '2', label: '整理提纲', description: '提取关键信息' },
      ],
    }));

    const result = await recommendService.getRecommendations({
      canvasContext: { nearbyContent: ['谱定理'] },
    });

    expect(result.recommendations).toHaveLength(2);
    expect(result.sessionId).toBeDefined();
  });

  it('throws on invalid JSON response', async () => {
    const mockChat = vi.mocked(deepseekClient.chat);
    mockChat.mockResolvedValue('not json');

    await expect(
      recommendService.getRecommendations({
        canvasContext: { nearbyContent: ['test'] },
      }),
    ).rejects.toThrow();
  });
});

describe('generateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns text content', async () => {
    const mockChat = vi.mocked(deepseekClient.chat);
    mockChat.mockResolvedValue(JSON.stringify({
      type: 'text',
      content: '# Hello\n\nThis is markdown content.',
    }));

    const result = await generateService.generate({
      sessionId: 'session-1',
      userInput: '解释谱定理',
      selectedOptionId: 'explain',
      context: { additionalContext: '谱定理相关笔记' },
    });

    expect(result.content.type).toBe('text');
    expect(result.content.text).toBe('# Hello\n\nThis is markdown content.');
  });

  it('returns html content', async () => {
    const mockChat = vi.mocked(deepseekClient.chat);
    mockChat.mockResolvedValue(JSON.stringify({
      type: 'html',
      content: '<div style="width:400px"><h1>Demo</h1></div>',
    }));

    const result = await generateService.generate({
      sessionId: 'session-1',
      userInput: '做个演示',
      context: {},
    });

    expect(result.content.type).toBe('html');
    expect(result.content.html).toContain('400px');
  });
});

describe('redoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates redo with previous context', async () => {
    const mockChat = vi.mocked(deepseekClient.chat);
    mockChat.mockResolvedValue(JSON.stringify({
      type: 'text',
      content: 'Redo content',
    }));

    const result = await redoService.redo({
      sessionId: 'session-1',
      messageId: 'msg-1',
      previousRecommendations: [
        { id: 'a', label: '上次猜测A', description: '...' },
      ],
      selectedOptionId: 'b',
      context: { additionalContext: '笔记内容' },
    });

    expect(result.content.text).toBe('Redo content');
    // Verify the prompt mentions the previous failure
    const callArgs = mockChat.mock.calls[0][0] as Array<{ content: string }>;
    const systemPrompt = callArgs.find(m => m.content.includes('用户拒绝了'))?.content ?? '';
    expect(systemPrompt).toContain('上次猜测A');
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

```bash
cd /Users/akuya/Desktop/Morphic/morphic-backend
npx vitest run tests/services/ai-services.test.ts
```

- [ ] **Step 3: 实现 recommend-service**

```typescript
// morphic-backend/src/services/recommend-service.ts
import { v4 as uuid } from 'uuid';
import { deepseekClient } from './deepseek-client';
import { AIError } from '../utils/errors';
import type { RecommendRequest, RecommendResponse } from '../types';

const RECOMMEND_SYSTEM_PROMPT = `你是一个笔记AI助手。基于用户画布上的笔记内容，推测用户接下来最想做什么。

给出3-5个具体、有用的建议，每个建议包含：
- id: 英文标识符（如 explain, outline, summarize, question, demo）
- label: 简短中文标签（6字以内）
- description: 一句话描述（15字以内）

直接返回JSON，格式：{ "recommendations": [{ "id": "...", "label": "...", "description": "..." }] }`;

export const recommendService = {
  async getRecommendations(input: RecommendRequest): Promise<RecommendResponse> {
    const sessionId = input.sessionId || uuid();
    const nearbyText = input.canvasContext.nearbyContent.join('\n').slice(0, 1000);

    const messages = [
      { role: 'system' as const, content: RECOMMEND_SYSTEM_PROMPT },
      { role: 'user' as const, content: nearbyText || '空白画布' },
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

      // Fallback recommendations
      return {
        sessionId,
        recommendations: [
          { id: 'explain', label: '解释这个概念', description: '生成一张简洁说明卡片' },
          { id: 'outline', label: '整理成提纲', description: '提取关键信息并按层级整理' },
          { id: 'summarize', label: '总结要点', description: '提取核心要点' },
        ],
      };
    }
  },
};
```

- [ ] **Step 4: 实现 generate-service**

```typescript
// morphic-backend/src/services/generate-service.ts
import { v4 as uuid } from 'uuid';
import { deepseekClient } from './deepseek-client';
import { AIError } from '../utils/errors';
import type { GenerateRequest, GenerateResponse } from '../types';

const GENERATE_SYSTEM_PROMPT = `你是一个笔记AI助手。根据用户的请求和画布上下文生成内容。

你可以生成两种类型的内容：
1. text - Markdown格式的文本内容（用于笔记卡片）
2. html - 可交互的HTML组件（用于嵌入画布）

当用户请求可视化、交互式演示、计算器等时，生成html类型。
当用户请求解释、总结、整理时，生成text类型。

HTML组件要求：
- 宽度固定400px，使用max-width:100%; box-sizing:border-box确保不溢出
- 所有CSS必须使用内联style属性，不使用外部样式表
- 必须自包含，能在iframe中独立运行
- 保留所有按钮点击、动画等交互行为
- 表格/代码块使用overflow-x:auto包裹防止溢出
- 字体大小使用相对单位（rem/em）或小号px值适配窄屏

返回JSON格式：{ "type": "text"|"html", "content": "..." }`;

export const generateService = {
  async generate(input: GenerateRequest): Promise<GenerateResponse> {
    const contextParts = [];
    if (input.context.additionalContext) {
      contextParts.push(`画布上下文：\n${input.context.additionalContext}`);
    }
    if (input.selectedOptionLabel) {
      contextParts.push(`用户选择：${input.selectedOptionLabel}`);
    }
    if (input.userInput) {
      contextParts.push(`用户输入：${input.userInput}`);
    }

    const messages = [
      { role: 'system' as const, content: GENERATE_SYSTEM_PROMPT },
      { role: 'user' as const, content: contextParts.join('\n\n') || '生成内容' },
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
```

- [ ] **Step 5: 实现 redo-service**

```typescript
// morphic-backend/src/services/redo-service.ts
import { v4 as uuid } from 'uuid';
import { deepseekClient } from './deepseek-client';
import { AIError } from '../utils/errors';
import type { RedoRequest, RedoResponse } from '../types';

const REDO_SYSTEM_PROMPT = `你是一个笔记AI助手。用户拒绝了上一次的AI建议，Now they want something different.

分析上次的失败：
- 用户看到了什么建议？
- 用户实际选择了什么？
- 用户可能真正想要什么？

请生成全新的内容，不要重复之前的输出风格或方向。

你可以生成两种类型：
1. text - Markdown格式文本
2. html - 可交互HTML组件（宽度400px，内联style，自包含）

返回JSON：{ "type": "text"|"html", "content": "..." }`;

export const redoService = {
  async redo(input: RedoRequest): Promise<RedoResponse> {
    const prevLabels = input.previousRecommendations?.map(r => r.label).join('、') || '未知';

    const userMessage = [
      `上次AI给出了这些建议：${prevLabels}`,
      input.selectedOptionId ? `用户这次选择了：${input.selectedOptionId}` : '',
      `画布上下文：${input.context.additionalContext || '无'}`,
      '请分析失败原因，生成一个完全不同方向的新内容。',
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
```

- [ ] **Step 6: 运行测试验证通过**

```bash
npx vitest run tests/services/ai-services.test.ts
```
预期：5个测试通过

- [ ] **Step 7: Commit**

```bash
git add morphic-backend/src/services/recommend-service.ts morphic-backend/src/services/generate-service.ts morphic-backend/src/services/redo-service.ts morphic-backend/tests/services/ai-services.test.ts
git commit -m "feat: add recommend, generate, and redo AI services with tests"
```

---

## 阶段三：API 路由 & App 入口

### Task 6: 实现 API 路由和 App 入口

**Files:**
- Create: `morphic-backend/src/api/routes/auth.ts`
- Create: `morphic-backend/src/api/routes/recommend.ts`
- Create: `morphic-backend/src/api/routes/generate.ts`
- Create: `morphic-backend/src/api/routes/redo.ts`
- Create: `morphic-backend/src/app.ts`
- Create: `morphic-backend/tests/api/routes.test.ts`

- [ ] **Step 1: 创建 auth 路由**

```typescript
// morphic-backend/src/api/routes/auth.ts
import { Router } from 'express';
import { authService } from '../../services/auth-service';
import { authMiddleware } from '../middleware/auth';
import type { ApiResponse, AuthResponse } from '../../types';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    const body: ApiResponse<AuthResponse> = { success: true, data: result };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    const body: ApiResponse<AuthResponse> = { success: true, data: result };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user!.userId);
    const body: ApiResponse<{ id: string; email: string; name: string | null }> = {
      success: true,
      data: user,
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

export default router;
```

- [ ] **Step 2: 创建 recommend 路由**

```typescript
// morphic-backend/src/api/routes/recommend.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rate-limit';
import { recommendService } from '../../services/recommend-service';
import type { ApiResponse, RecommendResponse } from '../../types';

const router = Router();

router.post('/', authMiddleware, rateLimitMiddleware, async (req, res, next) => {
  try {
    const result = await recommendService.getRecommendations(req.body);
    const body: ApiResponse<RecommendResponse> = { success: true, data: result };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

export default router;
```

- [ ] **Step 3: 创建 generate 路由**

```typescript
// morphic-backend/src/api/routes/generate.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rate-limit';
import { generateService } from '../../services/generate-service';
import { PrismaClient } from '@prisma/client';
import type { ApiResponse, GenerateResponse } from '../../types';

const prisma = new PrismaClient();
const router = Router();

router.post('/', authMiddleware, rateLimitMiddleware, async (req, res, next) => {
  try {
    const result = await generateService.generate(req.body);

    // Save to database
    try {
      let session = req.body.sessionId
        ? await prisma.session.findUnique({ where: { id: req.body.sessionId } })
        : null;

      if (!session) {
        session = await prisma.session.create({
          data: {
            userId: req.user!.userId,
            title: req.body.userInput?.slice(0, 50) || 'Untitled',
          },
        });
      }

      await prisma.message.create({
        data: {
          sessionId: session.id,
          role: 'ai',
          inputText: req.body.userInput || null,
          canvasContext: req.body.context?.additionalContext
            ? JSON.stringify(req.body.context.additionalContext)
            : null,
          selectedOption: req.body.selectedOptionId || null,
          generatedType: result.content.type,
          generatedContent: result.content.type === 'html'
            ? result.content.html
            : result.content.text,
        },
      });

      (result as Record<string, unknown>).sessionId = session.id;
    } catch (dbErr) {
      console.error('Failed to save message:', dbErr);
      // Non-fatal, continue to return content
    }

    const body: ApiResponse<GenerateResponse> = { success: true, data: result };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

export default router;
```

- [ ] **Step 4: 创建 redo 路由**

```typescript
// morphic-backend/src/api/routes/redo.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rate-limit';
import { redoService } from '../../services/redo-service';
import { PrismaClient } from '@prisma/client';
import type { ApiResponse, RedoResponse } from '../../types';

const prisma = new PrismaClient();
const router = Router();

router.post('/', authMiddleware, rateLimitMiddleware, async (req, res, next) => {
  try {
    const result = await redoService.redo(req.body);

    // Save redo message
    try {
      await prisma.message.create({
        data: {
          sessionId: req.body.sessionId,
          role: 'ai',
          inputText: 'Redo request',
          canvasContext: req.body.context?.additionalContext
            ? JSON.stringify(req.body.context.additionalContext)
            : null,
          recommendations: req.body.previousRecommendations
            ? JSON.stringify(req.body.previousRecommendations)
            : null,
          selectedOption: req.body.selectedOptionId || null,
          generatedType: result.content.type,
          generatedContent: result.content.type === 'html'
            ? result.content.html
            : result.content.text,
        },
      });
    } catch (dbErr) {
      console.error('Failed to save redo message:', dbErr);
    }

    const body: ApiResponse<RedoResponse> = { success: true, data: result };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

export default router;
```

- [ ] **Step 5: 创建 App 入口**

```typescript
// morphic-backend/src/app.ts
import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './api/middleware/error-handler';
import authRoutes from './api/routes/auth';
import recommendRoutes from './api/routes/recommend';
import generateRoutes from './api/routes/generate';
import redoRoutes from './api/routes/redo';
import type { ApiResponse } from './types';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/recommendations', recommendRoutes);
app.use('/api/content/generate', generateRoutes);
app.use('/api/content/redo', redoRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  const body: ApiResponse = { success: true, data: { status: 'ok' } };
  res.json(body);
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Morphic backend running on port ${config.port}`);
});

export default app;
```

- [ ] **Step 6: 编写 API 集成测试**

```typescript
// morphic-backend/tests/api/routes.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import { errorHandler } from '../../src/api/middleware/error-handler';
import authRoutes from '../../src/api/routes/auth';

const prisma = new PrismaClient();

// Minimal app for testing
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Auth API Routes', () => {
  beforeEach(async () => {
    await prisma.message.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  it('POST /api/auth/register returns 201 with token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'pw123', name: 'Test' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('test@test.com');
  });

  it('POST /api/auth/register returns error for duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: 'pw123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: 'pw456' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/login returns token for valid credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login@test.com', password: 'mypassword' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'mypassword' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('POST /api/auth/login returns 401 for wrong password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@test.com', password: 'correct' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'x@test.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 7: 运行测试**

```bash
cd /Users/akuya/Desktop/Morphic/morphic-backend
npx vitest run tests/api/routes.test.ts
```
预期：5个测试通过

- [ ] **Step 8: 安装 express 依赖并补全 package.json**

```bash
cd /Users/akuya/Desktop/Morphic/morphic-backend
# 需要添加 uuid 和 dotenv 到 dependencies
npm install uuid dotenv
npm install -D @types/uuid
```

- [ ] **Step 9: Commit**

```bash
git add morphic-backend/src/app.ts morphic-backend/src/api/routes/ morphic-backend/tests/api/routes.test.ts
git commit -m "feat: add API routes and Express app entry point with tests"
```

---

## 阶段四：前端修复

### Task 7: 创建 Mock AI Provider + 修复缺失引用

**Files:**
- Create: `cognitive-lab-frontend/src/lib/mock/ai-provider.ts`
- Modify: `cognitive-lab-frontend/src/components/canvas/tldraw-board.tsx`

- [ ] **Step 1: 创建 Mock AI Provider**

```typescript
// cognitive-lab-frontend/src/lib/mock/ai-provider.ts
import type { CanvasCard } from '@/types/cards';
import type { GenerateMockInput, GenerateMockResult, Recommendation } from '@/types/ai';

export function getMockRecommendations(prompt: string): Recommendation[] {
  const base: Recommendation[] = [
    { id: 'explain', label: '解释这个概念', description: '生成一张简洁说明卡片' },
    { id: 'outline', label: '整理成提纲', description: '提取关键信息并按层级整理' },
    { id: 'summarize', label: '总结要点', description: '提取核心要点' },
    { id: 'question', label: '出几道题', description: '根据内容生成测试题' },
  ];

  if (prompt.includes('谱') || prompt.includes('定理')) {
    return [
      { id: 'explain_spectral', label: '解释谱定理', description: '详细说明谱定理的数学含义' },
      { id: 'visualize', label: '可视化演示', description: '生成交互式可视化' },
      { id: 'applications', label: '应用场景', description: '列举实际应用案例' },
      { id: 'compare', label: '对比分析', description: '与相关定理对比' },
    ];
  }

  return base;
}

export function generateMockCardSet(input: GenerateMockInput): GenerateMockResult {
  const variants: Record<string, { type: 'text' | 'html'; title: string; body: string; html?: string }> = {
    explain: {
      type: 'text',
      title: '概念解释',
      body: `<h3>${input.prompt}</h3><p>这是一个关于"${input.prompt}"的详细解释。</p><p>AI将根据画布上的笔记内容，结合相关知识库，生成结构化的解释卡片。</p>`,
    },
    outline: {
      type: 'text',
      title: '内容提纲',
      body: `<h3>提纲</h3><ul><li>要点一：核心概念定义</li><li>要点二：关键性质与定理</li><li>要点三：应用与扩展</li><li>要点四：相关研究方向</li></ul>`,
    },
    summarize: {
      type: 'text',
      title: '要点总结',
      body: `<h3>核心要点</h3><ol><li><strong>定义：</strong>来自画布上下文的核心定义</li><li><strong>关键性质：</strong>重要性质和推论</li><li><strong>注意事项：</strong>常见误解和边界条件</li></ol>`,
    },
    question: {
      type: 'text',
      title: '练习题',
      body: `<h3>练习题</h3><p><strong>Q1:</strong> 请解释以下概念的基本含义。</p><p><strong>Q2:</strong> 举例说明该概念的应用场景。</p><p><strong>Q3:</strong> 分析该概念与其他相关概念的异同。</p>`,
    },
    visualize: {
      type: 'html',
      title: '交互式演示',
      body: '',
      html: `<div style="padding:16px;font-family:system-ui,sans-serif;max-width:100%;box-sizing:border-box;">
  <h3 style="margin:0 0 12px;font-size:16px;">交互式演示</h3>
  <div id="counter" style="font-size:32px;font-weight:bold;margin-bottom:12px;">0</div>
  <button onclick="document.getElementById('counter').textContent=parseInt(document.getElementById('counter').textContent)+1"
    style="padding:8px 16px;background:#4F46E5;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;">
    点击 +1
  </button>
  <button onclick="document.getElementById('counter').textContent='0'"
    style="padding:8px 16px;background:#E5E7EB;color:#333;border:none;border-radius:6px;cursor:pointer;font-size:14px;margin-left:8px;">
    重置
  </button>
</div>`,
    },
  };

  const variant = input.initialVariant && variants[input.initialVariant]
    ? variants[input.initialVariant]
    : variants.explain;

  const card: CanvasCard = {
    id: `card-${crypto.randomUUID()}`,
    x: input.x,
    y: input.y,
    width: variant.type === 'html' ? 400 : 340,
    height: variant.type === 'html' ? 300 : 200,
    type: variant.type === 'html' ? 'html' : 'text',
    title: variant.title,
    variantKey: input.initialVariant || 'explain',
    redoOptions: ['explain', 'outline', 'question', 'visualize'],
    content: {
      body: variant.body,
      html: variant.html,
    },
  };

  return { cards: [card] };
}

export function redoMockCard(card: CanvasCard): CanvasCard {
  const variantKeys = ['outline', 'question', 'visualize', 'explain'];
  const currentIdx = variantKeys.indexOf(card.variantKey);
  const nextKey = variantKeys[(currentIdx + 1) % variantKeys.length];

  const result = generateMockCardSet({
    prompt: card.title || 'redo',
    x: card.x,
    y: card.y,
    initialVariant: nextKey,
  });

  return { ...result.cards[0], id: card.id };
}
```

- [ ] **Step 2: 修复 tldraw-board.tsx 引用 redoMockCard**

在 tldraw-board.tsx 顶部添加 import：
```typescript
import { redoMockCard } from '@/lib/mock/ai-provider'
```

把第124行的 `<CardLayer>` onRedo 从调用 `redoMockCard(card)` 改为连接真实 redo API。暂时保留 mock 作为 fallback：

tldraw-board.tsx 中修改 `onRedo` handler：
```tsx
onRedo={async (id) => {
  const card = cards.find((item) => item.id === id)
  if (!card) return
  try {
    // Try real redo API
    if (editorRef.current) {
      const result = await import('@/lib/real/ai-provider').then(m => m.redoRealCard(
        editorRef.current!,
        card,
        'session-current',
      ))
      cardStore.getState().replaceCard(id, result)
    }
  } catch {
    // Fallback to mock
    cardStore.getState().replaceCard(id, redoMockCard(card))
  }
}}
```

简化处理，先用 mock redo 保持可用：
```tsx
onRedo={(id) => {
  const card = cards.find((item) => item.id === id)
  if (!card) return
  cardStore.getState().replaceCard(id, redoMockCard(card))
}}
```

- [ ] **Step 3: Commit**

```bash
git add cognitive-lab-frontend/src/lib/mock/ai-provider.ts cognitive-lab-frontend/src/components/canvas/tldraw-board.tsx
git commit -m "feat: add mock ai provider and fix redoMockCard reference"
```

### Task 8: 实现 Camera 同步 - 卡片跟随画布移动

**Files:**
- Modify: `cognitive-lab-frontend/src/components/cards/card-layer.tsx`

- [ ] **Step 1: 修改 CardLayer 订阅 camera 状态**

```tsx
// cognitive-lab-frontend/src/components/cards/card-layer.tsx
'use client'

import { useEffect, useState } from 'react'
import { GeneratedCard } from './generated-card'
import type { CanvasCard } from '@/types/cards'

export interface CardLayerProps {
  cards: CanvasCard[]
  onRedo: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
  onClose: (id: string) => void
  camera?: { x: number; y: number; z: number }
}

export function CardLayer({ cards, onRedo, onMove, onClose, camera }: CardLayerProps) {
  const { x = 0, y = 0, z = 1 } = camera ?? {}

  return (
    <>
      {cards.map((card) => (
        <div
          key={card.id}
          style={{
            position: 'absolute',
            left: card.x * z + x,
            top: card.y * z + y,
            transform: `scale(${z})`,
            transformOrigin: 'top left',
            pointerEvents: 'auto',
          }}
        >
          <GeneratedCard
            card={card}
            onRedo={onRedo}
            onMove={onMove}
            onClose={onClose}
          />
        </div>
      ))}
    </>
  )
}
```

- [ ] **Step 2: 修改 tldraw-board.tsx 传递 camera 状态**

在 `tldraw-board.tsx` 中做以下修改：

**修改1**: Line 3, 将 `useEffect, useState` 加入 import：
```typescript
import { useEffect, useState, useRef } from 'react'
```

**修改2**: 在 TldrawBoard 组件内 `const editorRef = useRef<Editor | null>(null)` 之后添加：
```typescript
const [camera, setCamera] = useState({ x: 0, y: 0, z: 1 })

// Subscribe to camera changes
useEffect(() => {
  const editor = editorRef.current
  if (!editor) return

  const updateCamera = () => {
    const cam = editor.getCamera()
    setCamera({ x: cam.x, y: cam.y, z: cam.z })
  }

  editor.on('change', updateCamera)
  return () => {
    editor.off('change', updateCamera)
  }
}, [])
```

**修改3**: 将 CardLayer 调用改为传入 camera：
```tsx
<CardLayer
  cards={cards}
  camera={camera}
  onRedo={(id) => {
    const card = cards.find((item) => item.id === id)
    if (!card) return
    cardStore.getState().replaceCard(id, redoMockCard(card))
  }}
  onMove={(id, x, y) => {
    cardStore.getState().moveCard(id, x, y)
  }}
  onClose={(id) => cardStore.getState().removeCard(id)}
/>
```

**修改4**: 更新 CardLayer import，确保 camera 类型被传入（CardLayer 接口已在 Task 8 Step 1 更新）：
```typescript
import { CardLayer } from '@/components/cards/card-layer'
```

- [ ] **Step 3: Commit**

```bash
git add cognitive-lab-frontend/src/components/cards/card-layer.tsx cognitive-lab-frontend/src/components/canvas/tldraw-board.tsx
git commit -m "feat: sync card layer position with tldraw camera pan/zoom"
```

### Task 9: 修复 iframe 自适应高度

**Files:**
- Modify: `cognitive-lab-frontend/src/components/cards/generated-card.tsx`

- [ ] **Step 1: 修改 GeneratedCard 中 iframe 自适应高度**

当前代码 line 61-76 的 iframe 部分修改为：

```tsx
{card.type === 'html' ? (
  <div className="h-full w-full bg-white rounded-md overflow-hidden relative">
    <iframe
      title={card.title || 'AI Generated'}
      srcDoc={card.content.html as string}
      sandbox="allow-scripts allow-same-origin"
      className="w-full border-none pointer-events-auto"
      style={{ minHeight: '160px', height: iframeHeight }}
      onLoad={(e: React.SyntheticEvent<HTMLIFrameElement>) => {
        const doc = (e.target as HTMLIFrameElement).contentDocument
        if (doc) {
          const height = doc.documentElement.scrollHeight
          setIframeHeight(Math.min(height + 16, 600))
        }
      }}
    />
    <div className="absolute inset-0 z-10 hidden group-active:block cursor-grabbing" />
  </div>
) : (
  <p className="text-sm leading-6 text-black/75">{body}</p>
)}
```

需要在组件顶部添加 state：
```typescript
const [iframeHeight, setIframeHeight] = useState(160)
```

当前 `GeneratedCard` 组件已经有一个 `body` 变量（line 13-18），iframeHeight state 加在它之前。

- [ ] **Step 2: 更新卡片初始高度逻辑**

将 `card.height` 用于非 HTML 类型卡片，HTML 类型卡片高度由 iframe 内容决定。

- [ ] **Step 3: Commit**

```bash
git add cognitive-lab-frontend/src/components/cards/generated-card.tsx
git commit -m "feat: add iframe auto-height adjustment for html cards"
```

---

## 阶段五：端到端验证

### Task 10: 启动后端并验证端到端

- [ ] **Step 1: 启动后端**

```bash
cd /Users/akuya/Desktop/Morphic/morphic-backend
# 确保 .env 中 DEEPSEEK_API_KEY 已配置
npm run dev
```
预期：控制台输出 "Morphic backend running on port 3001"

- [ ] **Step 2: 测试 Health Check**

```bash
curl http://localhost:3001/api/health
```
预期：`{"success":true,"data":{"status":"ok"}}`

- [ ] **Step 3: 测试注册**

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@morphic.app","password":"demo123"}'
```
预期：返回 token 和 user 信息

- [ ] **Step 4: 测试推荐 API**

```bash
TOKEN=<上一步返回的token>
curl -X POST http://localhost:3001/api/recommendations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"canvasContext":{"nearbyContent":["谱定理 线性算子 特征值"]}}'
```
预期：返回 3-5 个推荐项（如果 DeepSeek API key 配置正确）

- [ ] **Step 5: 启动前端测试**

```bash
cd /Users/akuya/Desktop/Morphic/cognitive-lab-frontend
npm run dev
```

在浏览器打开 http://localhost:3000，验证：
1. 画布正常显示
2. 双击画布出现锚点（+号）
3. 点击锚点弹出推荐面板
4. 输入文字并点击"生成卡片"
5. 生成的卡片可以拖拽
6. 点击 Redo 坍缩重构

- [ ] **Step 6: Commit 最终状态**

```bash
git add .
git commit -m "chore: finalize morphic backend and frontend integration"
```

---

## 实施顺序总览

| 阶段 | 任务 | 说明 |
|---|---|---|
| 零 | Task 0 | 清理 + 项目初始化 |
| 一 | Task 1-3 | 基础设施（错误类、中间件、DeepSeek Client） |
| 二 | Task 4-5 | 业务服务（Auth、AI Services） |
| 三 | Task 6 | API 路由 + App 入口 |
| 四 | Task 7-9 | 前端修复（Mock provider、Camera同步、iframe自适应） |
| 五 | Task 10 | 端到端验证 |
