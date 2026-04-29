# Morphic Notes 重构设计

**日期**: 2026-04-29
**状态**: 待审阅
**目标**: 彻底重构 Morphic 笔记应用，聚焦强大后端 + 轻量前端，解决AI意图猜测、HTML嵌入、画布融合三大技术痛点

## 1. 项目定位

Morphic 是一个基于无限画布的 AI 驱动笔记工具。用户在画布上选中区域，AI 弹出意图猜测，用户选择或输入指令后，AI 以文本卡片或交互式 HTML 组件的形式回复内容。

### 1.1 核心痛点

| 痛点 | 描述 | 解决方案 |
|---|---|---|
| AI 猜测太慢 | 推荐API响应时间长，无法识别手写 | 轻量 prompt + DeepSeek 多模态识别手写 |
| 动画效果丑陋 | 锚点呼吸动画粗糙 | 简洁 CSS 动画，重写 |
| HTML 嵌入兼容性 | 尺寸不合适，内容溢出 | Prompt 约束 400px + iframe 自适应高度 |
| HTML 不跟随画布 | 平移缩放时位置不同步 | 订阅 tldraw camera 状态实时变换 |

### 1.2 技术栈

- **前端**: Next.js 16 + React 19 + @tldraw/tldraw 4 + Zustand 5 + Tailwind CSS 4
- **后端**: Node.js + Express + TypeScript + Prisma + SQLite
- **AI**: DeepSeek API（deepseek-chat，所有 service 共用）
- **测试**: Vitest + Supertest + Testing Library

## 2. 架构设计

### 2.1 整体架构

```
浏览器 (tldraw Canvas + React)
    │
    ▼
Express API Server (Node.js/TypeScript)
    ├── POST /api/auth/register
    ├── POST /api/auth/login
    ├── GET  /api/auth/me
    ├── POST /api/recommendations    (意图猜测，8s超时)
    ├── POST /api/content/generate   (内容生成，30s超时)
    └── POST /api/content/redo       (坍缩重构，30s超时)
    │
    ├── DeepSeek API (多模态：文字+图片→意图/内容)
    └── SQLite (Prisma ORM)
```

### 2.2 后端文件结构

```
morphic-backend/
├── src/
│   ├── app.ts                    # Express 入口
│   ├── config/index.ts           # 环境变量、DeepSeek配置
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.ts           # POST /api/auth/register, login, GET /me
│   │   │   ├── recommend.ts      # POST /api/recommendations
│   │   │   ├── generate.ts       # POST /api/content/generate
│   │   │   └── redo.ts           # POST /api/content/redo
│   │   └── middleware/
│   │       ├── auth.ts           # JWT 验证中间件
│   │       ├── error-handler.ts  # 全局错误处理
│   │       └── rate-limit.ts     # 限流中间件
│   ├── services/
│   │   ├── auth-service.ts       # 注册/登录/密码/JWT
│   │   ├── deepseek-client.ts    # DeepSeek API 封装（通用，支持JSON模式）
│   │   ├── recommend-service.ts  # 意图猜测
│   │   ├── generate-service.ts   # 内容生成
│   │   └── redo-service.ts       # 坍缩重构
│   ├── db/
│   │   └── schema.prisma         # User + Session + Message
│   └── types/index.ts            # 共享类型定义
├── tests/
│   ├── services/                 # 单元测试（mock DeepSeek）
│   └── api/                      # API 集成测试
└── package.json
```

### 2.3 前端文件结构（保持现有，最小修改）

```
cognitive-lab-frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── canvas/
│   │   │   └── tldraw-board.tsx     # tldraw + camera 订阅
│   │   ├── ai/
│   │   │   ├── ai-anchor.tsx         # 锚点按钮
│   │   │   └── recommendation-panel.tsx  # 推荐面板
│   │   ├── cards/
│   │   │   ├── card-layer.tsx        # 卡片层（camera变换）
│   │   │   └── generated-card.tsx    # iframe 渲染卡片
│   │   └── shell/
│   │       ├── workspace-shell.tsx
│   │       └── workspace-app.tsx
│   ├── stores/
│   │   ├── card-store.ts
│   │   └── ui-store.ts
│   ├── lib/
│   │   ├── real/ai-provider.ts       # 真实 API 调用
│   │   └── mock/ai-provider.ts       # Mock 数据（开发降级）
│   └── types/
│       ├── cards.ts
│       └── ai.ts
```

## 3. 数据模型

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String                    // bcrypt hash
  name      String?
  createdAt DateTime @default(now())
  sessions  Session[]
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  title     String?                    // 会话标题
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  messages  Message[]
}

model Message {
  id               String   @id @default(uuid())
  sessionId        String
  session          Session  @relation(fields: [sessionId], references: [id])
  role             String                    // "user" | "ai"
  inputText        String?                   // 用户输入的文字
  canvasContext    String?                   // JSON: 画布上下文快照
  recommendations  String?                   // JSON: AI猜测列表
  selectedOption   String?                   // 用户选择的猜测id
  generatedType    String?                   // "text" | "html"
  generatedContent String?                   // AI生成的内容
  createdAt        DateTime @default(now())
}
```

**设计要点：**
- Session 对应一次连续对话，画布卡片位置等状态存前端 localStorage
- Message 记录完整交互链路：上下文 → 猜测列表 → 用户选择 → 生成结果
- JSON 字段存字符串（SQLite 不支持原生 JSON 类型）

## 4. AI 服务设计

### 4.1 DeepSeek Client 通用封装

```
deepseekClient.chat(messages, options) → response
  options:
    - responseFormat: 'text' | 'json_object'
    - jsonSchema?: object              // 可选 schema 约束
    - timeout: number
    - retries: number                  // 最多2次，指数退避
```

- 自动重试（指数退避 1s → 2s）
- 超时控制
- 错误标准化（网络错误/API错误/超时 → 统一 Error 类型）

### 4.2 三个 Service 的 Prompt 策略

#### recommend-service（意图猜测）

- **目标**: 快，8秒内返回
- **模型**: deepseek-chat
- **输入**: 用户选中区域附近的文字（最多1000字）+ 画布截图 base64（手写识别）
- **响应格式**: `json_object`
- **Schema**: `{ recommendations: [{ id: string, label: string, description: string }] }`
- **Prompt 核心**: 「基于以下笔记内容和画布截图，推测用户接下来最想做什么，给出3-5个具体建议。」

#### generate-service（内容生成）

- **目标**: 高质量文本或可交互 HTML
- **模型**: deepseek-chat
- **输入**: 完整上下文 + 用户选择 + 用户额外输入
- **响应格式**: `json_object`
- **Schema**: `{ type: 'text' | 'html', content: string }`
- **HTML Prompt 约束**: 「生成宽度不超过400px的HTML组件。使用内联style，保证在iframe中独立运行。使用max-width:100%; box-sizing:border-box; 确保不溢出。」

#### redo-service（坍缩重构）

- **目标**: 分析上次失败，生成不同方向的内容
- **模型**: deepseek-chat
- **输入**: 原始上下文 + 上次猜测列表 + 用户实际选择 + 已生成内容
- **响应格式**: `json_object`
- **Schema**: 同 generate-service
- **Prompt 核心**: 「用户拒绝了上一次的AI建议，转而选择了其他方向。请分析用户可能的真实意图，生成全新的内容，不要重复之前的输出风格。」

### 4.3 手写识别方案

使用 DeepSeek 多模态 API（vision），将 tldraw 导出的手写/图片 shapes 转为 base64 图片传入。不需要额外部署 OCR 服务。

## 5. 前端关键问题解决

### 5.1 HTML iframe 尺寸和溢出

**后端**: Prompt 约定生成 400px 宽度的 HTML，使用 `max-width:100%; box-sizing:border-box`

**前端**: iframe 加载后自动调整高度
```tsx
const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
  const doc = e.currentTarget.contentDocument
  if (doc) {
    const height = doc.documentElement.scrollHeight
    setIframeHeight(Math.min(height, 600)) // 最大高度600px，超出滚动
  }
}

<iframe
  srcDoc={htmlCode}
  sandbox="allow-scripts allow-same-origin"
  style={{ width: 400, height: iframeHeight, border: 'none' }}
  onLoad={handleIframeLoad}
/>
```

### 5.2 HTML 块跟随画布移动

订阅 tldraw camera 状态，实时将卡片世界坐标转换为屏幕坐标：
```tsx
// CardLayer 组件
const camera = useEditorCamera(editor) // 自定义 hook

// 每张卡片：
<div style={{
  position: 'absolute',
  left: card.x * camera.z + camera.x,
  top: card.y * camera.z + camera.y,
  transform: `scale(${camera.z})`,
  transformOrigin: 'top left',
}}>
  <GeneratedCard card={card} />
</div>
```

### 5.3 交互流程

```
用户在画布上点击/选区域
  → AIAnchor 出现在点击位置
  → RecommendationPanel 弹出推荐列表（加载态骨架屏）
  → 用户点击某个推荐 OR 在底部输入框打字
  → API 调用中，面板显示生成中状态
  → 卡片插入到画布，面板关闭
  → 卡片可拖拽、可 Redo（坍缩重构）、可关闭
```

## 6. 错误处理

### 6.1 后端错误体系

```
AppError (基类)
├── ValidationError (400)     // 输入校验失败
├── AuthError (401/403)       // 未认证/无权限
├── NotFoundError (404)       // 资源不存在
└── AIError (502)             // DeepSeek API调用失败
    ├── AITimeoutError        // 超时
    ├── AIRateLimitError      // 限流
    └── AIResponseError       // 返回格式异常
```

### 6.2 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "AI_TIMEOUT",
    "message": "AI服务响应超时，请重试"
  }
}
```

### 6.3 保护机制

- **限流**: 每用户每分钟最多 10 次 AI 请求
- **超时**: recommend 8s, generate/redo 30s
- **重试**: 最多 2 次，指数退避
- **降级**: AI 全部失败时返回预设的 3 个通用推荐

### 6.4 前端降级

- API 不可用时，切换 mock provider 保证 UI 可测试
- 保留现有 mock/ai-provider.ts 用于开发

## 7. 测试策略

| 层 | 内容 | 工具 |
|---|---|---|
| 单元测试 | auth-service, deepseek-client, 各 service | Vitest + mock DeepSeek |
| API 测试 | 路由 + 中间件 + 错误响应 | Supertest |
| 集成测试 | 真实 DeepSeek 调用（标记 skip，手动运行） | Supertest |
| 前端测试 | 组件渲染、store 逻辑 | Vitest + Testing Library |

## 8. API 端点详表

| 方法 | 路径 | 认证 | 超时 | 说明 |
|---|---|---|---|---|
| POST | /api/auth/register | 否 | 3s | 注册 |
| POST | /api/auth/login | 否 | 3s | 登录，返回JWT |
| GET | /api/auth/me | 是 | 1s | 当前用户信息 |
| POST | /api/recommendations | 是 | 8s | 意图猜测 |
| POST | /api/content/generate | 是 | 30s | 生成内容 |
| POST | /api/content/redo | 是 | 30s | 坍缩重构 |

## 9. 实施顺序

1. **清理 + 重命名**: 删除旧代码，创建 morphic-backend 目录
2. **后端骨架**: Express + Prisma + 配置 + 中间件
3. **Auth 服务**: 注册/登录/JWT
4. **DeepSeek Client**: API 封装 + 测试
5. **Recommend + Generate + Redo 服务**
6. **API 路由**: 所有端点
7. **前端修改**: camera 订阅 + iframe 自适应 + 动画重写
8. **联调测试**: 端到端验证
