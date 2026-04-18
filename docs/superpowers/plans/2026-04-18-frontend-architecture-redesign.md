# Frontend Architecture Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `docs/frontend-architecture.md` into a front-end architecture document that reflects the product-defining UX, clearly separates front-end boundaries, and aligns the AI interaction path with the current backend API contract.

**Architecture:** The rewrite keeps the existing overall front-end direction while replacing the generic stack-tour structure with a domain-boundary structure. The document centers on five front-end domains, a canonical AI state flow, explicit rendering and persistence rules, and implementation priorities that do not require backend changes.

**Tech Stack:** Markdown documentation, existing product spec in `docs/superpowers/specs/2026-04-18-frontend-architecture-design.md`, existing API reference in `docs/api-reference.md`, existing product requirements in `main.md`

---

### Task 1: Restructure The Document Skeleton

**Files:**
- Modify: `docs/frontend-architecture.md`
- Reference: `docs/superpowers/specs/2026-04-18-frontend-architecture-design.md`
- Reference: `main.md`

- [ ] **Step 1: Read the target files and confirm the new section order**

Read:

```text
docs/frontend-architecture.md
docs/superpowers/specs/2026-04-18-frontend-architecture-design.md
main.md
```

Confirm the rewritten document follows this order:

```markdown
## 1. 总览与产品目标
## 2. 前端范围与非目标
## 3. 核心体验原则
## 4. 前端领域边界
## 5. 标准 AI 交互流程
## 6. API 集成边界
## 7. 渲染边界
## 8. 持久化与离线策略
## 9. 技术建议
## 10. 分阶段实现优先级
```

- [ ] **Step 2: Replace the current generic introduction with a product-first overview**

Write the opening sections in `docs/frontend-architecture.md` using this content shape:

```markdown
# Cognitive Lab 前端架构设计

**项目名称**: Cognitive Lab Frontend
**文档类型**: 前端架构与边界设计
**创建日期**: 2026-04-18
**版本**: 2.0
**状态**: 设计阶段

## 1. 总览与产品目标

Cognitive Lab 前端不是一个通用白板应用，而是一个面向 iPad 和桌面 Web 的沉浸式无限画布学习界面。前端设计的目标不是堆叠功能，而是围绕“纸张感画布、轻量 AI 锚点、结构化生成内容、可持续同步”四类体验建立稳定边界。

首期前端目标：
- 提供沉浸式、低干扰的无限画布体验
- 以锚点驱动 AI 交互，而不是以聊天面板驱动交互
- 以受控内容渲染承接文本、卡片和混合结果
- 与现有后端 API 契约对齐，不要求后端额外改动
```

- [ ] **Step 3: Replace the old broad project structure section with a boundary-oriented section**

Remove or heavily shrink the old generic tree-based structure and replace it with a concise domain map like this:

```markdown
## 4. 前端领域边界

前端按五个领域拆分：

### 4.1 Canvas Surface
- 负责画布、视口、选区、手写输入和沉浸式视觉外壳
- 不负责 AI 推荐逻辑和后端 HTML 直接渲染

### 4.2 AI Interaction Flow
- 负责锚点浮现、推荐请求、生成请求和 redo/morphing 过渡
- 不负责画布持久化与最终内容存储

### 4.3 Generated Content Renderer
- 负责 `text`、`html`、`hybrid` 的受控渲染
- 不负责发起 AI 请求

### 4.4 Session and Persistence
- 负责 `sessionId`、本地恢复、防抖保存编排
- 不负责替代后端成为最终真相来源

### 4.5 API Integration Boundary
- 负责请求与响应契约映射、认证头、错误转译
- 不负责发明新的后端字段
```

- [ ] **Step 4: Verify the document no longer reads like a generic tech-stack tour**

Run:

```bash
grep -n "^## " /Users/akuya/Desktop/Morphic/docs/frontend-architecture.md
```

Expected:

```text
The section list matches the new boundary-oriented structure and no longer starts with a technology-stack-first flow.
```

- [ ] **Step 5: Commit the skeleton rewrite**

Run:

```bash
git add /Users/akuya/Desktop/Morphic/docs/frontend-architecture.md
git commit -m "docs: restructure frontend architecture document"
```

### Task 2: Align The AI Flow With The Current API Contract

**Files:**
- Modify: `docs/frontend-architecture.md`
- Reference: `docs/api-reference.md`
- Reference: `docs/superpowers/specs/2026-04-18-frontend-architecture-design.md`

- [ ] **Step 1: Replace all legacy single-step generation descriptions**

Search for old references and rewrite them around the current API path. Replace content shaped like this:

```markdown
- 调用 `/generate`
- `useGenerate()`
- 单步生成结果并直接渲染
```

With content shaped like this:

```markdown
## 5. 标准 AI 交互流程

MVP 的标准 AI 流程定义为：

`idle -> sensing -> options-ready -> generating -> rendered -> morphing-redo`

流程说明：
1. 用户在画布中停留、书写或触发上下文锚点。
2. 前端提取 `canvasContext`。
3. 前端调用 `POST /recommend-options` 获取 `sessionId` 与推荐选项。
4. 用户选择推荐项，或直接输入自己的需求。
5. 前端使用同一个 `sessionId` 调用 `POST /generate-content`。
6. 返回结果交由受控渲染层处理。
7. 渲染后的结果进入画布保存链路。
```

- [ ] **Step 2: Add a dedicated API boundary section that mirrors the backend contract**

Write this section in `docs/frontend-architecture.md`:

```markdown
## 6. API 集成边界

前端以 `docs/api-reference.md` 为唯一后端契约参考，遵循以下规则：

- AI 推荐入口为 `POST /recommend-options`
- 内容生成入口为 `POST /generate-content`
- `sessionId` 仅表示 AI 交互会话，不等同于画布 ID
- 生成内容类型以 `text`、`html`、`hybrid` 为准
- 前端可以定义本地适配层，但不能要求后端提供未文档化字段

建议将 API 层拆分为：
- 传输层：负责请求、认证头和错误转译
- 领域 API 层：例如 `authApi`、`canvasApi`、`aiApi`
```

- [ ] **Step 3: Remove outdated code examples that conflict with the backend contract**

Delete or rewrite examples built around these outdated shapes:

```typescript
export function useGenerate() { ... }
await api.post('/generate', ...)
renderAIResult(result.primary)
```

Replace them with concise interface-level examples like this:

```typescript
const options = await aiApi.recommendOptions(canvasContext)
const content = await aiApi.generateContent({
  sessionId: options.sessionId,
  selectedOptionId,
})
```

- [ ] **Step 4: Verify there are no remaining primary references to `/generate` or `useGenerate`**

Run:

```bash
grep -n "/generate\\|useGenerate" /Users/akuya/Desktop/Morphic/docs/frontend-architecture.md
```

Expected:

```text
No matches, or only explicitly marked legacy/background notes.
```

- [ ] **Step 5: Commit the API alignment changes**

Run:

```bash
git add /Users/akuya/Desktop/Morphic/docs/frontend-architecture.md
git commit -m "docs: align frontend architecture with agent APIs"
```

### Task 3: Add Rendering, Persistence, And Experience Boundaries

**Files:**
- Modify: `docs/frontend-architecture.md`
- Reference: `main.md`
- Reference: `docs/superpowers/specs/2026-04-18-frontend-architecture-design.md`

- [ ] **Step 1: Add the core experience principles section**

Write this section to ensure the document reflects the product character:

```markdown
## 3. 核心体验原则

首期前端体验遵循以下原则：

- 画布优先：默认隐藏高干扰工具元素，保留沉浸式纸张感
- 锚点驱动：AI 通过上下文锚点进入，而不是抢占主界面
- 结果受控：所有 AI 生成内容必须进入受控渲染容器
- 重构可感：redo 不只是重试，而应呈现“坍缩并重构”的状态过渡
- iPad 优先：所有关键交互都以 iPad PWA 的触控与手写体验为基线
```

- [ ] **Step 2: Add the rendering boundary section**

Write this section:

```markdown
## 7. 渲染边界

生成结果必须通过受控渲染层落地，按以下三级容器划分：

- `Inline Text Block`：用于解释、总结、笔记等文本输出
- `Structured Card`：用于带排版层次的结构化内容
- `Interactive Card`：用于受控 HTML 或混合内容

对 `html` 和 `hybrid` 内容，前端必须保证：

- 不执行脚本
- 不允许无控制的全局样式注入
- 不允许原始内容直接携带隐式事件处理器
- 所有交互都包裹在前端受控容器中
```

- [ ] **Step 3: Add the persistence and offline strategy section**

Write this section:

```markdown
## 8. 持久化与离线策略

前端需要明确区分三类状态：

### 8.1 画布持久化
- 存储画布元素、卡片位置和用户最终可见结果
- 与后端画布 API 同步

### 8.2 AI 会话状态
- 存储 `sessionId`、推荐选项和 redo 相关临时上下文
- 与画布持久化分离

### 8.3 本地恢复缓存
- 提供崩溃恢复和离线兜底
- 可以利用 `tldraw` 本地持久化
- 不能取代后端成为最终真相来源
```

- [ ] **Step 4: Add a concise technology guidance section instead of a long tool-by-tool tour**

Write this section:

```markdown
## 9. 技术建议

建议保留当前总体技术方向：

- `Next.js` + `React` + `TypeScript`
- `tldraw` 作为无限画布引擎
- `Tailwind CSS` 作为样式基础
- `Zustand` 仅用于聚焦共享状态
- PWA 作为 iPad 安装与离线能力基础

本阶段的重点不是更换技术栈，而是建立清晰边界。
```

- [ ] **Step 5: Verify the document now includes the required experience and safety sections**

Run:

```bash
grep -n "核心体验原则\\|渲染边界\\|持久化与离线策略\\|技术建议" /Users/akuya/Desktop/Morphic/docs/frontend-architecture.md
```

Expected:

```text
The grep output shows all four sections present in the rewritten document.
```

- [ ] **Step 6: Commit the boundary additions**

Run:

```bash
git add /Users/akuya/Desktop/Morphic/docs/frontend-architecture.md
git commit -m "docs: add frontend rendering and persistence boundaries"
```

### Task 4: Final Review And Handoff

**Files:**
- Modify: `docs/frontend-architecture.md`
- Reference: `docs/api-reference.md`
- Reference: `docs/superpowers/specs/2026-04-18-frontend-architecture-design.md`

- [ ] **Step 1: Do a final content pass for contradictions and leftover obsolete sections**

Check that the final document no longer contains these mismatches:

```text
- single-step `/generate` as the main path
- `useGenerate()` as the recommended integration hook
- raw HTML embedding as the default rendering mode
- local persistence described as the final persistence source
- a generic long-form technology tour taking precedence over product boundaries
```

- [ ] **Step 2: Run focused verification searches**

Run:

```bash
grep -n "/generate\\|useGenerate\\|dangerouslySetInnerHTML" /Users/akuya/Desktop/Morphic/docs/frontend-architecture.md
grep -n "recommend-options\\|generate-content\\|sessionId" /Users/akuya/Desktop/Morphic/docs/frontend-architecture.md
```

Expected:

```text
The first command returns no problematic primary-pattern matches.
The second command confirms the current API-aligned flow is documented.
```

- [ ] **Step 3: Read the rewritten file top-to-bottom and tighten wording**

Confirm the final document:

```text
- reads as one cohesive architecture document
- keeps examples concise
- emphasizes product-defining UX and front-end boundaries
- does not require backend changes
```

- [ ] **Step 4: Run git diff to review the final rewrite**

Run:

```bash
git diff -- /Users/akuya/Desktop/Morphic/docs/frontend-architecture.md
```

Expected:

```text
The diff shows a document rewrite centered on product goals, boundaries, API alignment, rendering safety, and persistence rules.
```

- [ ] **Step 5: Commit the final reviewed document**

Run:

```bash
git add /Users/akuya/Desktop/Morphic/docs/frontend-architecture.md
git commit -m "docs: rewrite frontend architecture design"
```

- [ ] **Step 6: Report completion with review links**

In the final handoff, include:

```markdown
- the path to `docs/frontend-architecture.md`
- the path to `docs/superpowers/specs/2026-04-18-frontend-architecture-design.md`
- a short summary of what changed
- a note that backend behavior was not modified
```
