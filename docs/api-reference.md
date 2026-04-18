# Cognitive Lab API Reference

**API 版本**: 1.0.0
**基础 URL**: `https://api.cognitivelab.com/api`
**认证方式**: Bearer Token (JWT)

---

## 目录

1. [快速开始](#快速开始)
2. [认证](#认证)
3. [API 端点](#api-端点)
   - 3.1 [推荐交互选项](#31-推荐交互选项)
   - 3.2 [生成内容](#32-生成内容)
4. [数据模型](#数据模型)
5. [错误处理](#错误处理)
6. [速率限制](#速率限制)
7. [前端集成示例](#前端集成示例)
   - 7.1 [AI 交互 Hooks](#ai-交互-hooks)
   - 7.2 [完整组件示例](#完整组件示例---ai交互流程)
8. [版本历史](#版本历史)

---

## 快速开始

### 安装依赖

```bash
# 前端依赖
npm install axios

# 或者使用 fetch (内置，无需安装)
```

### 基础配置

```typescript
// src/config/api.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cognitivelab.com/api'

// 获取存储的 token
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

// 设置 token
export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token)
  }
}

// 清除 token
export const clearToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
  }
}
```

### 创建 API 客户端

```typescript
// src/utils/api.ts
import { API_BASE_URL, getToken } from '@/config/api'

class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = getToken()

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'API request failed')
    }

    return response.json()
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const api = new ApiClient()
```

---

## 认证

### 获取 Token

所有需要认证的 API 都需要在请求头中包含 JWT token：

```http
Authorization: Bearer {token}
```

### Token 有效期

- **有效期**: 7 天
- **过期后**: 需要重新登录获取新 token

---

## API 端点

### 1. 认证 API

#### 1.1 注册用户

```http
POST /api/auth/register
```

**请求体**:

```typescript
interface RegisterRequest {
  email: string          // 用户邮箱，必须符合邮箱格式
  password: string       // 密码，最少 8 个字符
  username?: string      // 用户名，3-50 个字符（可选）
}
```

**响应**:

```typescript
interface RegisterResponse {
  user: {
    id: string           // 用户 UUID
    email: string        // 用户邮箱
    username?: string    // 用户名
  }
  token: string          // JWT token
}
```

**错误响应**:

```typescript
// 400 Bad Request
{
  error: "Email already exists"
}

// 400 Bad Request
{
  error: "Invalid input",
  details: [
    {
      field: "email",
      message: "Invalid email format"
    }
  ]
}
```

**示例**:

```typescript
const result = await api.post<RegisterResponse>('/auth/register', {
  email: 'user@example.com',
  password: 'securepassword123',
  username: 'student123'
})

// 存储 token
setToken(result.token)
```

---

#### 1.2 用户登录

```http
POST /api/auth/login
```

**请求体**:

```typescript
interface LoginRequest {
  email: string          // 用户邮箱
  password: string       // 密码
}
```

**响应**:

```typescript
interface LoginResponse {
  user: {
    id: string           // 用户 UUID
    email: string        // 用户邮箱
    username?: string    // 用户名
    preferences: {       // 用户偏好设置
      style?: 'academic' | 'casual' | 'minimal'
      language?: 'zh-CN' | 'en-US'
      outputFormat?: ('text' | 'html' | 'image')[]
    }
  }
  token: string          // JWT token
}
```

**错误响应**:

```typescript
// 401 Unauthorized
{
  error: "Invalid credentials"
}
```

**示例**:

```typescript
const result = await api.post<LoginResponse>('/auth/login', {
  email: 'user@example.com',
  password: 'securepassword123'
})

// 存储 token
setToken(result.token)
```

---

#### 1.3 用户登出

```http
POST /api/auth/logout
Authorization: Bearer {token}
```

**响应**:

```typescript
interface LogoutResponse {
  success: boolean
}
```

**示例**:

```typescript
await api.post<LogoutResponse>('/auth/logout', {})

// 清除本地 token
clearToken()
```

---

#### 1.4 获取当前用户信息

```http
GET /api/auth/me
Authorization: Bearer {token}
```

**响应**:

```typescript
interface User {
  id: string
  email: string
  username?: string
  preferences: {
    style?: 'academic' | 'casual' | 'minimal'
    language?: 'zh-CN' | 'en-US'
    outputFormat?: ('text' | 'html' | 'image')[]
  }
}

interface MeResponse {
  user: User
}
```

**错误响应**:

```typescript
// 401 Unauthorized
{
  error: "Invalid token"
}
```

**示例**:

```typescript
const { user } = await api.get<MeResponse>('/auth/me')

console.log(user.preferences.style)  // 'academic'
```

---

### 2. 画布 API

#### 2.1 创建或更新画布

```http
POST /api/canvas
Authorization: Bearer {token}
```

**请求体**:

```typescript
interface CanvasRequest {
  canvasId?: string                    // 画布 ID（更新时提供，创建时为空）
  elements: CanvasElement[]            // tldraw 元素数组
  metadata?: {
    name?: string                      // 画布名称
    tags?: string[]                    // 画布标签
  }
}

interface CanvasElement {
  id: string                           // 元素 ID
  type: string                         // 元素类型
  x: number                            // X 坐标
  y: number                            // Y 坐标
  [key: string]: any                   // 其他 tldraw 属性
}
```

**响应**:

```typescript
interface CanvasResponse {
  canvasId: string                     // 画布 UUID
  savedAt: string                      // 保存时间（ISO 8601）
  isNew: boolean                       // 是否为新创建的画布
}
```

**示例**:

```typescript
// 创建新画布
const newCanvas = await api.post<CanvasResponse>('/canvas', {
  elements: [
    {
      id: 'shape:abc',
      type: 'rectangle',
      x: 100,
      y: 200,
      width: 300,
      height: 200,
      opacity: 1
    }
  ],
  metadata: {
    name: '数学笔记',
    tags: ['数学', '微积分']
  }
})

// 更新已有画布
const updatedCanvas = await api.post<CanvasResponse>('/canvas', {
  canvasId: 'canvas-uuid',
  elements: [...],
  metadata: {
    name: '更新后的名称'
  }
})
```

---

#### 2.2 获取画布

```http
GET /api/canvas/{canvasId}
Authorization: Bearer {token}
```

**路径参数**:

- `canvasId` (string): 画布 UUID

**响应**:

```typescript
interface GetCanvasResponse {
  canvasId: string
  elements: CanvasElement[]
  metadata: {
    name?: string
    tags?: string[]
    createdAt: string
    updatedAt: string
  }
}
```

**错误响应**:

```typescript
// 404 Not Found
{
  error: "Canvas not found"
}

// 403 Forbidden
{
  error: "Access denied"
}
```

**示例**:

```typescript
const canvas = await api.get<GetCanvasResponse>(`/canvas/${canvasId}`)

console.log(canvas.metadata.name)  // '数学笔记'
```

---

#### 2.3 列出用户的画布

```http
GET /api/canvases?limit=10&offset=0
Authorization: Bearer {token}
```

**查询参数**:

- `limit` (number, 可选): 每页数量，默认 10
- `offset` (number, 可选): 偏移量，默认 0

**响应**:

```typescript
interface CanvasMetadata {
  id: string
  metadata: {
    name?: string
    tags?: string[]
    updatedAt: string
  }
}

interface CanvasesResponse {
  canvases: CanvasMetadata[]
  total: number                      // 总数量
}
```

**示例**:

```typescript
// 获取前 10 个画布
const { canvases, total } = await api.get<CanvasesResponse>('/canvases?limit=10&offset=0')

// 获取第 2 页（每页 10 个）
const page2 = await api.get<CanvasesResponse>('/canvases?limit=10&offset=10')
```

---

#### 2.4 删除画布

```http
DELETE /api/canvas/{canvasId}
Authorization: Bearer {token}
```

**路径参数**:

- `canvasId` (string): 画布 UUID

**响应**:

```typescript
interface DeleteCanvasResponse {
  success: boolean
}
```

**错误响应**:

```typescript
// 404 Not Found
{
  error: "Canvas not found"
}
```

**示例**:

```typescript
await api.delete<DeleteCanvasResponse>(`/canvas/${canvasId}`)
```

---

### 3. AI 智能交互 API

#### 3.1 推荐交互选项

**用途**：用户点击画布上的 + 号时，AI 根据上下文推荐 3-4 个交互选项

```http
POST /api/recommend-options
Authorization: Bearer {token}
```

**请求体**:

```typescript
interface RecommendOptionsRequest {
  canvasContext: {
    nearbyContent: string[]          // 附近的内容片段
    userHistory?: string[]           // 用户历史记录（可选）
    currentTheme?: string            // 当前主题风格（可选）
  }
  sessionId?: string                 // 会话ID（如果是继续对话）
}
```

**响应**:

```typescript
interface RecommendOptionsResponse {
  sessionId: string                  // 会话ID，用于后续API调用
  options: RecommendedOption[]       // 推荐的选项列表
  metadata: {
    timestamp: string
    processingTime: number           // 处理时间（毫秒）
    model: string                    // 使用的AI模型
  }
}

interface RecommendedOption {
  optionId: string                   // 选项ID（如"opt_math_problem_001"）
  title: string                      // 选项标题（如"创建数学题"）
  description: string                // 选项描述（如"生成一道微积分练习题"）
  icon: string                       // 图标emoji或图标名
  category: string                   // 分类：learning | creative | analysis
  estimatedTime: number              // 预计生成时间（秒）
  confidence: number                 // AI推荐置信度（0-1）
  previewHint?: string              // 预览提示（如"包含公式和解答"）
}
```

**错误响应**:

```typescript
// 400 Bad Request
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "画布上下文不能为空",
    "retryable": false
  }
}

// 429 Too Many Requests
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "请求过于频繁，请稍后再试",
    "retryable": true,
    "retryAfter": 60
  }
}
```

**使用示例**:

```typescript
const result = await api.post<RecommendOptionsResponse>('/recommend-options', {
  canvasContext: {
    nearbyContent: ["微积分", "函数极限", "连续性"],
    userHistory: ["数学分析", "线性代数"],
    currentTheme: "academic"
  }
})

console.log(`推荐了 ${result.options.length} 个选项`)
result.options.forEach(option => {
  console.log(`${option.icon} ${option.title}: ${option.description}`)
})
```

---

#### 3.2 生成内容

**用途**：用户选择推荐的选项或直接输入文字后，AI 生成具体内容

```http
POST /api/generate-content
Authorization: Bearer {token}
```

**请求体**:

```typescript
interface GenerateContentRequest {
  sessionId: string                  // 从推荐选项API获取的会话ID
  selectedOptionId?: string          // 用户选择的选项ID
  userInput?: string                 // 用户的直接输入（二选一）
  context?: {
    userPreferences?: {
      style?: 'academic' | 'casual' | 'minimal'
      language?: 'zh-CN' | 'en-US'
      outputFormat?: ('text' | 'html' | 'image')[]
    }
    additionalContext?: string       // 额外上下文信息
  }
}
```

**响应**:

```typescript
interface GenerateContentResponse {
  content: GeneratedContent          // 生成的内容
  metadata: ContentMetadata
  relatedOptions?: RecommendedOption[] // 相关的其他推荐
}

interface GeneratedContent {
  contentType: 'text' | 'html' | 'hybrid'

  // 文本内容
  text?: {
    markdown: string                 // Markdown格式的文本
    plainText: string                // 纯文本版本
    sections?: TextSection[]         // 结构化的文本段落
  }

  // HTML内容
  html?: {
    code: string                     // HTML代码
    styles?: string                  // 内联CSS样式
    interactive: boolean             // 是否包含交互元素
    components?: HTMLComponent[]     // 组件列表
  }

  // 混合内容
  hybrid?: {
    textContent: string              // 文字部分
    htmlComponents: string           // HTML组件部分
    layout: 'vertical' | 'horizontal' | 'grid'
  }
}

interface HTMLComponent {
  type: 'slider' | 'button' | 'chart' | 'quiz' | 'formula'
  props: Record<string, any>         // 组件属性
  interactions?: {
    triggers: string[]               // 触发器
    actions: InteractionAction[]     // 交互动作
  }
}

interface TextSection {
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'formula'
  content: string
  level?: number                     // 标题级别
  format?: string                    // 格式信息（如LaTeX）
}

interface ContentMetadata {
  timestamp: string
  processingTime: number
  model: string
  wordCount: number
  confidence: number
  tags: string[]
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
}
```

**错误响应**:

```typescript
// 400 Bad Request
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "必须提供选项ID或用户输入",
    "retryable": false
  }
}

// 404 Not Found
{
  "success": false,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "会话不存在或已过期",
    "retryable": false
  }
}

// 500 AI Model Error
{
  "success": false,
  "error": {
    "code": "AI_MODEL_ERROR",
    "message": "AI服务暂时不可用，请稍后重试",
    "retryable": true,
    "retryAfter": 30
  }
}
```

**使用示例**:

```typescript
// 示例1: 基于推荐选项生成内容
const result = await api.post<GenerateContentResponse>('/generate-content', {
  sessionId: 'session-abc123',
  selectedOptionId: 'opt_math_problem_001',
  context: {
    userPreferences: {
      style: 'academic',
      language: 'zh-CN',
      outputFormat: ['html', 'text']
    }
  }
})

// 渲染生成的内容
if (result.content.contentType === 'hybrid') {
  renderText(result.content.hybrid.textContent)
  renderHTML(result.content.hybrid.htmlComponents)
}

// 示例2: 基于用户直接输入生成内容
const directResult = await api.post<GenerateContentResponse>('/generate-content', {
  sessionId: 'session-abc123',
  userInput: '请解释一下傅里叶变换的原理',
  context: {
    userPreferences: {
      style: 'casual',
      language: 'zh-CN'
    }
  }
})

console.log(`生成了 ${directResult.metadata.wordCount} 字的内容`)
console.log(`难度级别: ${directResult.metadata.difficulty}`)
```

---

## 数据模型

### CanvasElement

tldraw 画布元素的基础结构：

```typescript
interface CanvasElement {
  id: string                           // 唯一标识符
  type: string                         // 元素类型
  x: number                            // X 坐标
  y: number                            // Y 坐标
  width?: number                       // 宽度（可选）
  height?: number                      // 高度（可选）
  opacity?: number                     // 不透明度 (0-1)
  rotation?: number                    // 旋转角度
  [key: string]: any                   // 其他属性
}
```

### User

用户信息模型：

```typescript
interface User {
  id: string
  email: string
  username?: string
  preferences: {
    style?: 'academic' | 'casual' | 'minimal'
    language?: 'zh-CN' | 'en-US'
    outputFormat?: ('text' | 'html' | 'image')[]
  }
}
```

### RecommendedOption

AI 推荐的交互选项：

```typescript
interface RecommendedOption {
  optionId: string                   // 选项ID
  title: string                      // 选项标题
  description: string                // 选项描述
  icon: string                       // 图标emoji或图标名
  category: string                   // 分类：learning | creative | analysis
  estimatedTime: number              // 预计生成时间（秒）
  confidence: number                 // AI推荐置信度（0-1）
  previewHint?: string              // 预览提示
}
```

### GeneratedContent

AI 生成的内容结构：

```typescript
interface GeneratedContent {
  contentType: 'text' | 'html' | 'hybrid'

  // 文本内容
  text?: {
    markdown: string                 // Markdown格式的文本
    plainText: string                // 纯文本版本
    sections?: TextSection[]         // 结构化的文本段落
  }

  // HTML内容
  html?: {
    code: string                     // HTML代码
    styles?: string                  // 内联CSS样式
    interactive: boolean             // 是否包含交互元素
    components?: HTMLComponent[]     // 组件列表
  }

  // 混合内容
  hybrid?: {
    textContent: string              // 文字部分
    htmlComponents: string           // HTML组件部分
    layout: 'vertical' | 'horizontal' | 'grid'
  }
}

interface HTMLComponent {
  type: 'slider' | 'button' | 'chart' | 'quiz' | 'formula'
  props: Record<string, any>         // 组件属性
  interactions?: {
    triggers: string[]               // 触发器
    actions: InteractionAction[]     // 交互动作
  }
}

interface TextSection {
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'formula'
  content: string
  level?: number                     // 标题级别
  format?: string                    // 格式信息（如LaTeX）
}
```

### ContentMetadata

内容生成的元数据：

```typescript
interface ContentMetadata {
  timestamp: string
  processingTime: number
  model: string
  wordCount: number
  confidence: number
  tags: string[]
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
}
```

### APIErrorResponse

统一的API错误响应格式：

```typescript
interface APIErrorResponse {
  success: false
  error: {
    code: string                     // 错误代码
    message: string                  // 用户友好的错误消息
    technical?: string               // 技术详情（开发调试用）
    retryable: boolean               // 是否可重试
    retryAfter?: number              // 重试等待时间（秒）
  }
}
```

---

## 错误处理

### 错误响应格式

所有错误响应都遵循以下格式：

```typescript
interface ErrorResponse {
  error: string                        // 错误代码
  message?: string                     // 错误消息
  details?: any                        // 额外详情
}
```

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未认证（无效或过期 token） |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁（速率限制） |
| 500 | 服务器内部错误 |

### 错误代码

| 错误代码 | HTTP 状态码 | 说明 |
|----------|-------------|------|
| UNAUTHORIZED | 401 | Token 无效或过期 |
| INVALID_INPUT | 400 | 输入参数验证失败 |
| INVALID_REQUEST | 400 | 请求格式错误 |
| NOT_FOUND | 404 | 资源不存在 |
| SESSION_NOT_FOUND | 404 | 会话不存在或已过期 |
| SESSION_EXPIRED | 401 | 会话已过期 |
| INVALID_OPTION_ID | 400 | 无效的选项ID |
| FORBIDDEN | 403 | 无权限访问 |
| RATE_LIMITED | 429 | 超过速率限制 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| AI_MODEL_ERROR | 500 | AI 模型调用失败 |
| AI_TIMEOUT | 504 | AI 模型响应超时 |
| AI_CONTENT_FILTERED | 451 | AI 内容被过滤 |

### 前端错误处理示例

```typescript
// src/utils/errorHandler.ts
interface ApiError {
  error: string
  message?: string
  details?: any
}

export const handleApiError = (error: ApiError): string => {
  switch (error.error) {
    case 'UNAUTHORIZED':
      // 清除过期 token
      clearToken()
      // 跳转到登录页
      window.location.href = '/login'
      return '登录已过期，请重新登录'

    case 'INVALID_INPUT':
      return error.details?.[0]?.message || '输入参数错误'

    case 'NOT_FOUND':
      return '请求的资源不存在'

    case 'RATE_LIMITED':
      const retryAfter = error.details?.retryAfter || 60
      return `请求过于频繁，请在 ${retryAfter} 秒后重试`

    case 'AI_ERROR':
      return 'AI 处理失败，请稍后重试'

    case 'INTERNAL_ERROR':
      return '服务器错误，请联系管理员'

    default:
      return error.message || '未知错误'
  }
}

// 使用示例
try {
  const result = await api.post('/generate', { text: '...' })
} catch (error: any) {
  const errorMessage = handleApiError(error)
  console.error(errorMessage)
  // 显示错误提示给用户
  alert(errorMessage)
}
```

---

## 速率限制

### 默认限制

- **普通 API**: 每个 IP 每分钟最多 100 个请求
- **AI 生成 API**: 每个用户每分钟最多 10 个请求

### 速率限制响应头

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1713441600
```

### 处理速率限制

```typescript
// 检查速率限制状态
const checkRateLimit = async (endpoint: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    })

    const remaining = response.headers.get('X-RateLimit-Remaining')
    return parseInt(remaining || '0') > 0
  } catch {
    return false
  }
}

// 使用示例
const canGenerate = await checkRateLimit('/generate')

if (!canGenerate) {
  alert('AI 生成次数已达上限，请稍后重试')
}
```

---

## 前端集成示例

### React Hooks

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react'
import { api } from '@/utils/api'
import { getToken, setToken, clearToken } from '@/config/api'

interface User {
  id: string
  email: string
  username?: string
  preferences: any
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken()
      if (token) {
        try {
          const { user } = await api.get<{ user: User }>('/auth/me')
          setUser(user)
        } catch {
          clearToken()
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const result = await api.post<{ user: User; token: string }>('/auth/login', {
      email,
      password
    })
    setToken(result.token)
    setUser(result.user)
    return result.user
  }

  const register = async (email: string, password: string, username?: string) => {
    const result = await api.post<{ user: User; token: string }>('/auth/register', {
      email,
      password,
      username
    })
    setToken(result.token)
    setUser(result.user)
    return result.user
  }

  const logout = async () => {
    await api.post('/auth/logout', {})
    clearToken()
    setUser(null)
  }

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  }
}
```

### 画布管理 Hook

```typescript
// src/hooks/useCanvas.ts
import { useState, useCallback } from 'react'
import { api } from '@/utils/api'

export const useCanvas = (canvasId?: string) => {
  const [canvas, setCanvas] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)

  const loadCanvas = useCallback(async (id: string) => {
    const result = await api.get<{ canvasId: string; elements: any[]; metadata: any }>(`/canvas/${id}`)
    setCanvas(result)
    return result
  }, [])

  const saveCanvas = useCallback(async (elements: any[], metadata?: any) => {
    setSaving(true)
    try {
      const result = await api.post<{ canvasId: string; savedAt: string; isNew: boolean }>('/canvas', {
        canvasId,
        elements,
        metadata
      })
      setCanvas(prev => ({ ...prev, ...result }))
      return result
    } finally {
      setSaving(false)
    }
  }, [canvasId])

  const deleteCanvas = useCallback(async (id: string) => {
    await api.delete(`/canvas/${id}`)
    setCanvas(null)
  }, [])

  return {
    canvas,
    saving,
    loadCanvas,
    saveCanvas,
    deleteCanvas
  }
}
```

### AI 交互 Hooks

```typescript
// src/hooks/useRecommendOptions.ts
import { useState } from 'react'
import { api } from '@/utils/api'

export const useRecommendOptions = () => {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<RecommendOptionsResponse | null>(null)

  const recommendOptions = async (canvasContext: CanvasContext) => {
    setLoading(true)
    try {
      const result = await api.post<RecommendOptionsResponse>('/recommend-options', {
        canvasContext
      })
      setResponse(result)
      return result
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    response,
    recommendOptions
  }
}

// src/hooks/useGenerateContent.ts
import { useState } from 'react'
import { api } from '@/utils/api'

export const useGenerateContent = () => {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<GenerateContentResponse | null>(null)

  const generateContent = async (sessionId: string, userInput: UserInput) => {
    setLoading(true)
    try {
      const result = await api.post<GenerateContentResponse>('/generate-content', {
        sessionId,
        ...userInput
      })
      setResponse(result)
      return result
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    response,
    generateContent
  }
}

// 联合Hook - 完整的交互流程
// src/hooks/useAIInteraction.ts
export const useAIInteraction = () => {
  const { recommendOptions, loading: recommending, response: optionsResponse } = useRecommendOptions()
  const { generateContent, loading: generating, response: contentResponse } = useGenerateContent()

  const startInteraction = async (canvasContext: CanvasContext) => {
    // 步骤1: 获取推荐选项
    const options = await recommendOptions(canvasContext)
    return options
  }

  const executeSelection = async (sessionId: string, selection: UserInput) => {
    // 步骤2: 根据选择生成内容
    const content = await generateContent(sessionId, selection)
    return content
  }

  return {
    // 状态
    recommending,
    generating,
    optionsResponse,
    contentResponse,

    // 方法
    startInteraction,
    executeSelection,

    // 计算属性
    isBusy: recommending || generating
  }
}
```

### 完整组件示例 - AI交互流程

```typescript
// src/components/AIPlusButton.tsx
import { useState } from 'react'
import { useAIInteraction } from '@/hooks/useAIInteraction'

export const AIPlusButton = ({ canvasContext }: { canvasContext: CanvasContext }) => {
  const { startInteraction, executeSelection, isBusy, optionsResponse, contentResponse } = useAIInteraction()
  const [showOptions, setShowOptions] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // 步骤1: 用户点击+号
  const handlePlusClick = async () => {
    const options = await startInteraction(canvasContext)
    setSessionId(options.sessionId)
    setShowOptions(true)
  }

  // 步骤2: 用户选择选项
  const handleOptionClick = async (optionId: string) => {
    if (!sessionId) return

    const content = await executeSelection(sessionId, {
      selectedOptionId: optionId
    })

    // 渲染生成的内容
    renderGeneratedContent(content.content)
    setShowOptions(false)
  }

  // 步骤2: 用户直接输入
  const handleDirectInput = async (userInput: string) => {
    if (!sessionId) return

    const content = await executeSelection(sessionId, {
      userInput
    })

    renderGeneratedContent(content.content)
    setShowOptions(false)
  }

  if (isBusy) {
    return <div>AI思考中...</div>
  }

  return (
    <div>
      {/* +号按钮 */}
      <button onClick={handlePlusClick} disabled={isBusy}>
        +
      </button>

      {/* 推荐选项 */}
      {showOptions && optionsResponse && (
        <div className="ai-options-popup">
          <h3>AI推荐选项</h3>
          {optionsResponse.options.map(option => (
            <div
              key={option.optionId}
              className="option-card"
              onClick={() => handleOptionClick(option.optionId)}
            >
              <span className="icon">{option.icon}</span>
              <div className="content">
                <h4>{option.title}</h4>
                <p>{option.description}</p>
                <span className="meta">
                  {option.category} • 约{option.estimatedTime}秒
                </span>
              </div>
              <span className="confidence">
                {Math.round(option.confidence * 100)}%匹配
              </span>
            </div>
          ))}

          {/* 直接输入选项 */}
          <div className="direct-input">
            <input
              type="text"
              placeholder="或者直接输入你的需求..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleDirectInput((e.target as HTMLInputElement).value)
                }
              }}
            />
          </div>
        </div>
      )}

      {/* 生成的内容展示 */}
      {contentResponse && (
        <div className="generated-content">
          {contentResponse.content.contentType === 'hybrid' && (
            <>
              <div className="text-part">
                {contentResponse.content.text?.markdown}
              </div>
              <div
                className="html-part"
                dangerouslySetInnerHTML={{
                  __html: contentResponse.content.html?.code || ''
                }}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}
```
```

---

## TypeScript 类型定义

```typescript
// src/types/api.ts

// ============ 认证 ============
export interface RegisterRequest {
  email: string
  password: string
  username?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface User {
  id: string
  email: string
  username?: string
  preferences: UserPreferences
}

export interface UserPreferences {
  style?: 'academic' | 'casual' | 'minimal'
  language?: 'zh-CN' | 'en-US'
  outputFormat?: Array<'text' | 'html' | 'image'>
}

// ============ 画布 ============
export interface CanvasRequest {
  canvasId?: string
  elements: CanvasElement[]
  metadata?: CanvasMetadata
}

export interface CanvasResponse {
  canvasId: string
  savedAt: string
  isNew: boolean
}

export interface GetCanvasResponse {
  canvasId: string
  elements: CanvasElement[]
  metadata: CanvasMetadata & {
    createdAt: string
    updatedAt: string
  }
}

export interface CanvasElement {
  id: string
  type: string
  x: number
  y: number
  width?: number
  height?: number
  opacity?: number
  rotation?: number
  [key: string]: any
}

export interface CanvasMetadata {
  name?: string
  tags?: string[]
}

export interface CanvasesResponse {
  canvases: Array<{
    id: string
    metadata: CanvasMetadata & {
      updatedAt: string
    }
  }>
  total: number
}

// ============ AI 生成 ============
export interface GenerateRequest {
  text: string
  context?: {
    nearbyContent?: string[]
    userHistory?: string[]
  }
  preferences?: {
    style?: 'academic' | 'casual' | 'minimal'
    language?: 'zh-CN' | 'en-US'
    outputFormat?: Array<'text' | 'html' | 'image'>
  }
}

export interface GenerateResponse {
  primary: ContentOption
  alternative_1: ContentOption
  alternative_2: ContentOption
  metadata: GenerateMetadata
}

export interface ContentOption {
  id: string
  title: string
  description: string
  type: string
  confidence: number
  estimatedTime: number
  content: {
    markdown: string
    html?: string
    images?: string[]
    latex?: string
  }
  interactions?: {
    sliders?: Array<{
      name: string
      min: number
      max: number
      step: number
      default: number
    }>
    buttons?: Array<{
      label: string
      action: string
    }>
    steps?: Array<{
      title: string
      content: string
    }>
  }
}

export interface GenerateMetadata {
  intent: string
  allConfidences: number[]
  processingTime: number
  model: string
}

// ============ 错误 ============
export interface ErrorResponse {
  error: string
  message?: string
  details?: any
}

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'INVALID_INPUT'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'AI_ERROR'
```

---

## 版本历史

### v2.0.0 (2026-04-18) - 🎉 Agent架构升级

- ✅ **新增 AI 智能交互 API** - 分离式Agent架构
  - ✅ `POST /api/recommend-options` - AI推荐交互选项
  - ✅ `POST /api/generate-content` - 根据选择生成内容
- ✅ **结构化JSON输出** - 完整的TypeScript类型定义
- ✅ **顺序Pipeline流程** - 推荐→生成的两步交互
- ✅ **会话状态管理** - 支持上下文关联
- ✅ **增强的错误处理** - 详细的错误代码和重试机制
- 🔄 **重大变更**: 原`POST /api/generate`已拆分为两个独立端点
- 🔄 **重大变更**: 更新了数据模型以支持新的Agent架构

### v1.0.0 (2026-04-18)

- ✅ 认证 API（注册、登录、登出、获取用户信息）
- ✅ 画布 API（创建、获取、列出、删除）
- ✅ AI 生成 API（内容生成，支持多个选项）
- ✅ JWT 认证
- ✅ 速率限制
- ✅ 错误处理

---

## 支持

如有问题或建议，请联系：

- **Email**: support@cognitivelab.com
- **GitHub Issues**: https://github.com/cognitivelab/api/issues
- **文档**: https://docs.cognitivelab.com