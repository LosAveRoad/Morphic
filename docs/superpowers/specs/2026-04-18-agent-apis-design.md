# Cognitive Lab Agent APIs 设计文档

**项目**: Cognitive Lab
**文档类型**: Agent APIs 设计规范
**创建日期**: 2026-04-18
**版本**: 1.0
**状态**: 已批准

---

## 1. 概述

### 1.1 设计目标

为Cognitive Lab设计两个独立的Agent API，实现顺序的AI交互流程：

1. **推荐选项API** - 用户点击+号后，AI根据上下文推荐3-4个交互选项
2. **生成内容API** - 用户选择选项或输入文字后，AI生成具体内容

### 1.2 核心设计原则

- **顺序流程**: 推荐→生成的两步Pipeline
- **职责分离**: 两个Agent各司其职，便于优化和维护
- **结构化输出**: 强制JSON格式，确保前端能正确解析
- **会话管理**: 通过sessionId关联两次API调用
- **成本优化**: 基于DeepSeek，后续可切换其他模型

---

## 2. 系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                   Sequential Agent Pipeline                  │
│                                                              │
│   Stage 1                    Stage 2                        │
│  ┌──────────────┐          ┌──────────────┐                │
│  │OptionsAgent  │  ─────→  │ContentAgent  │                │
│  │              │          │              │                │
│  │推荐选项      │          │  生成内容    │                │
│  └──────────────┘          └──────────────┘                │
│        │                        │                          │
│        └────────────────────────┘                          │
│                    ▼                                        │
│          ┌──────────────────┐                              │
│          │  Shared Services │                              │
│          │  - DeepSeek      │                              │
│          │  - Redis (可选)  │                              │
│          │  - Logger        │                              │
│          └──────────────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈

- **后端框架**: Node.js + Express + TypeScript
- **AI模型**: DeepSeek API
- **缓存**: Redis (可选)
- **测试**: Jest + Supertest
- **开发方式**: 测试驱动开发 (TDD)

---

## 3. API端点设计

### 3.1 推荐选项API

**端点**: `POST /api/recommend-options`
**用途**: 用户点击+号时，AI根据上下文推荐交互选项

**请求结构**:
```typescript
interface RecommendOptionsRequest {
  canvasContext: {
    nearbyContent: string[]          // 附近的内容片段
    userHistory?: string[]           // 用户历史记录
    currentTheme?: string            // 当前主题风格
  }
  sessionId?: string                 // 会话ID（续对话时）
}
```

**响应结构**:
```typescript
interface RecommendOptionsResponse {
  sessionId: string                  // 会话ID
  options: RecommendedOption[]       // 推荐选项列表
  metadata: {
    timestamp: string
    processingTime: number
    model: string
  }
}

interface RecommendedOption {
  optionId: string                   // 选项ID
  title: string                      // 标题
  description: string                // 描述
  icon: string                       // 图标
  category: 'learning' | 'creative' | 'analysis'
  estimatedTime: number              // 预计时间（秒）
  confidence: number                 // 置信度（0-1）
  previewHint?: string              // 预览提示
}
```

### 3.2 生成内容API

**端点**: `POST /api/generate-content`
**用途**: 用户选择选项或输入文字后，AI生成具体内容

**请求结构**:
```typescript
interface GenerateContentRequest {
  sessionId: string                  // 从API 1获取的会话ID
  selectedOptionId?: string          // 选择的选项ID
  userInput?: string                 // 直接输入
  context?: {
    userPreferences?: {
      style?: 'academic' | 'casual' | 'minimal'
      language?: 'zh-CN' | 'en-US'
      outputFormat?: ('text' | 'html' | 'image')[]
    }
    additionalContext?: string
  }
}
```

**响应结构**:
```typescript
interface GenerateContentResponse {
  content: GeneratedContent
  metadata: ContentMetadata
  relatedOptions?: RecommendedOption[]
}

interface GeneratedContent {
  contentType: 'text' | 'html' | 'hybrid'

  text?: {
    markdown: string
    plainText: string
    sections?: TextSection[]
  }

  html?: {
    code: string
    styles?: string
    interactive: boolean
    components?: HTMLComponent[]
  }

  hybrid?: {
    textContent: string
    htmlComponents: string
    layout: 'vertical' | 'horizontal' | 'grid'
  }
}
```

---

## 4. Agent设计模式

### 4.1 OptionsAgent

**职责**: 分析画布上下文，推荐最佳交互选项

**核心逻辑**:
```typescript
class OptionsAgent {
  async recommend(request: RecommendOptionsRequest): Promise<RecommendOptionsResponse> {
    // 1. 构建prompt
    const prompt = this.buildPrompt(request.canvasContext)

    // 2. 调用DeepSeek
    const aiResponse = await deepSeekClient.chat({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: this.getSystemPrompt() },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    })

    // 3. 解析和验证
    const structuredResponse = this.parseAndValidate(aiResponse)

    return {
      sessionId: request.sessionId || generateSessionId(),
      options: structuredResponse.options,
      metadata: { /* ... */ }
    }
  }
}
```

**系统Prompt示例**:
```
你是一个智能学习助手的选项推荐专家。
你的任务是分析用户的画布上下文，推荐3-4个最有用的AI交互选项。

请严格按照JSON格式回复：
{
  "options": [
    {
      "optionId": "opt_xxx",
      "title": "选项标题",
      "description": "简短描述",
      "icon": "emoji",
      "category": "learning|creative|analysis",
      "estimatedTime": 5,
      "confidence": 0.9
    }
  ]
}
```

### 4.2 ContentAgent

**职责**: 根据用户选择生成高质量内容

**核心逻辑**:
```typescript
class ContentAgent {
  async generate(request: GenerateContentRequest): Promise<GenerateContentResponse> {
    // 1. 获取会话上下文
    const sessionContext = await getSessionContext(request.sessionId)

    // 2. 构建增强prompt
    const enhancedPrompt = this.buildEnhancedPrompt(request, sessionContext)

    // 3. 调用DeepSeek生成
    const aiResponse = await deepSeekClient.chat({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: this.getSystemPrompt() },
        { role: "user", content: enhancedPrompt }
      ],
      response_format: { type: "json_object" }
    })

    // 4. 解析和处理
    const content = this.parseContent(aiResponse)

    return { content, metadata: { /* ... */ } }
  }
}
```

---

## 5. 错误处理策略

### 5.1 错误代码定义

```typescript
enum ErrorCode {
  // 通用错误
  INTERNAL_ERROR = "INTERNAL_ERROR",
  INVALID_REQUEST = "INVALID_REQUEST",
  RATE_LIMITED = "RATE_LIMITED",

  // AI模型错误
  AI_MODEL_ERROR = "AI_MODEL_ERROR",
  AI_TIMEOUT = "AI_TIMEOUT",
  AI_CONTENT_FILTERED = "AI_CONTENT_FILTERED",

  // 上下文错误
  SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  INVALID_OPTION_ID = "INVALID_OPTION_ID"
}
```

### 5.2 错误响应格式

```typescript
interface APIErrorResponse {
  success: false
  error: {
    code: string
    message: string
    technical?: string
    retryable: boolean
    retryAfter?: number
  }
}
```

---

## 6. 性能要求

### 6.1 响应时间目标

- **推荐选项API**: < 3秒
- **生成内容API**: < 5秒
- **整体流程**: < 8秒

### 6.2 优化策略

- 使用Redis缓存常见推荐结果
- 实现请求去重和防抖
- 设置合理的超时时间
- 监控和日志记录

---

## 7. 测试策略

### 7.1 单元测试

每个Agent都需要完整的单元测试：

```typescript
describe('OptionsAgent', () => {
  it('should return valid options for math context')
  it('should handle empty context gracefully')
  it('should cache similar requests')
})

describe('ContentAgent', () => {
  it('should generate math problem with solution')
  it('should handle different content types')
  it('should respect user preferences')
})
```

### 7.2 集成测试

测试完整的API流程：

```typescript
describe('AI Integration Flow', () => {
  it('should complete full recommendation and generation flow')
  it('should handle session timeout')
  it('should recover from AI model errors')
})
```

---

## 8. 部署考虑

### 8.1 环境变量

```bash
DEEPSEEK_API_KEY=sk-xxx
DEEPSEEK_BASE_URL=https://api.deepseek.com
REDIS_URL=redis://localhost:6379
NODE_ENV=production
```

### 8.2 监控指标

- API响应时间
- AI调用成功率
- 错误率统计
- 成本监控

---

## 9. 实施计划

### 9.1 开发优先级

**Phase 1: 基础框架**
- 项目搭建和配置
- DeepSeek客户端实现
- 基础测试框架

**Phase 2: OptionsAgent**
- 推荐选项逻辑实现
- Prompt工程优化
- 单元测试覆盖

**Phase 3: ContentAgent**
- 内容生成逻辑实现
- 支持多种内容类型
- 集成测试

**Phase 4: 优化和部署**
- 性能优化
- 错误处理完善
- 生产部署

### 9.2 成功标准

- ✅ 两个API都能正常工作
- ✅ 通过所有测试用例
- ✅ 满足性能要求
- ✅ API文档完整更新
- ✅ 前端集成验证通过

---

## 10. 风险和缓解措施

### 10.1 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| DeepSeek API不稳定 | 高 | 实现重试机制和降级策略 |
| JSON解析失败 | 中 | 严格的schema验证 |
| 性能不达标 | 中 | 缓存和异步处理 |

### 10.2 业务风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 用户体验不佳 | 高 | 充分的测试和优化 |
| 成本超支 | 中 | 监控和预算控制 |
| 需求变更 | 低 | 模块化设计便于扩展 |

---

## 附录A: 参考资源

- [DeepSeek API文档](https://platform.deepseek.com/docs)
- [Express.js最佳实践](https://expressjs.com/en/guide/best-practices.html)
- [TypeScript测试指南](https://jestjs.io/docs/getting-started)

---

**文档状态**: ✅ 已批准，准备开始实施
**下一步**: 创建详细实施计划

---

*本文档基于用户需求和superpowers brainstorming流程创建*
*参考架构: claw-code agent harness design*