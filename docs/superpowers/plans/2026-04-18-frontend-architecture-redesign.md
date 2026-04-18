# Frontend Architecture Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重写 `docs/frontend-architecture.md`，使其体现产品核心体验、明确前端职责边界，并让 AI 交互路径与当前后端 API 契约保持一致。

**Architecture:** 本次重写保留现有前端总体方向，但将原先“技术栈导览式”结构改为“产品能力与领域边界式”结构。文档核心围绕五个前端领域、标准 AI 状态流、显式渲染与持久化规则，以及不依赖后端改动的实现优先级展开。

**Tech Stack:** Markdown 文档、现有规格 `docs/superpowers/specs/2026-04-18-frontend-architecture-design.md`、现有 API 参考 `docs/api-reference.md`、现有产品需求 `main.md`

---

### Task 1: 重构文档骨架

**Files:**
- Modify: `docs/frontend-architecture.md`
- Reference: `docs/superpowers/specs/2026-04-18-frontend-architecture-design.md`
- Reference: `main.md`

- [ ] **Step 1: 阅读目标文件并确认新章节顺序**

阅读：

```text
docs/frontend-architecture.md
docs/superpowers/specs/2026-04-18-frontend-architecture-design.md
main.md
```

确认重写后的文档采用以下顺序：

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

- [ ] **Step 2: 用产品优先的总览替换当前泛化导言**

按以下内容形态重写 `docs/frontend-architecture.md` 开头部分：

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

- [ ] **Step 3: 用边界导向章节替换旧的大而全项目结构段落**

删除或大幅缩减旧的目录树式结构说明，改为下面这种简洁领域图：

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

- [ ] **Step 4: 验证文档不再像一份泛技术栈导览**

运行：

```bash
grep -n "^## " /Users/akuya/Desktop/Morphic/docs/frontend-architecture.md
```

预期：

```text
章节列表与新的边界导向结构一致，不再以技术栈优先的顺序展开。
```

- [ ] **Step 5: 提交文档骨架重构**

运行：

```bash
git add /Users/akuya/Desktop/Morphic/docs/frontend-architecture.md
git commit -m "docs: restructure frontend architecture document"
```

### Task 2: 让 AI 流程与当前 API 契约对齐

**Files:**
- Modify: `docs/frontend-architecture.md`
- Reference: `docs/api-reference.md`
- Reference: `docs/superpowers/specs/2026-04-18-frontend-architecture-design.md`

- [ ] **Step 1: 替换所有旧的单步生成描述**

搜索旧引用，并按当前 API 路径改写。将下面这种内容：

```markdown
- 调用 `/generate`
- `useGenerate()`
- 单步生成结果并直接渲染
```

替换为下面这种内容：

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

- [ ] **Step 2: 增加与后端契约一致的 API 边界章节**

将以下章节写入 `docs/frontend-architecture.md`：

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

- [ ] **Step 3: 删除与后端契约冲突的过时代码示例**

删除或改写以下过时形态的示例：

```typescript
export function useGenerate() { ... }
await api.post('/generate', ...)
renderAIResult(result.primary)
```

替换为下面这种简洁的接口层示例：

```typescript
const options = await aiApi.recommendOptions(canvasContext)
const content = await aiApi.generateContent({
  sessionId: options.sessionId,
  selectedOptionId,
})
```

- [ ] **Step 4: 验证不再保留 `/generate` 或 `useGenerate` 的主路径引用**

运行：

```bash
grep -n "/generate\\|useGenerate" /Users/akuya/Desktop/Morphic/docs/frontend-architecture.md
```

预期：

```text
没有匹配结果，或只保留明确标注为历史背景的说明。
```

- [ ] **Step 5: 提交 API 对齐修改**

运行：

```bash
git add /Users/akuya/Desktop/Morphic/docs/frontend-architecture.md
git commit -m "docs: align frontend architecture with agent APIs"
```

### Task 3: 增加体验、渲染和持久化边界

**Files:**
- Modify: `docs/frontend-architecture.md`
- Reference: `main.md`
- Reference: `docs/superpowers/specs/2026-04-18-frontend-architecture-design.md`

- [ ] **Step 1: 增加核心体验原则章节**

写入以下章节，确保文档体现产品气质：

```markdown
## 3. 核心体验原则

首期前端体验遵循以下原则：

- 画布优先：默认隐藏高干扰工具元素，保留沉浸式纸张感
- 锚点驱动：AI 通过上下文锚点进入，而不是抢占主界面
- 结果受控：所有 AI 生成内容必须进入受控渲染容器
- 重构可感：redo 不只是重试，而应呈现“坍缩并重构”的状态过渡
- iPad 优先：所有关键交互都以 iPad PWA 的触控与手写体验为基线
```

- [ ] **Step 2: 增加渲染边界章节**

写入以下章节：

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

- [ ] **Step 3: 增加持久化与离线策略章节**

写入以下章节：

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

- [ ] **Step 4: 用简洁技术建议替代逐项技术游览**

写入以下章节：

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

- [ ] **Step 5: 验证文档已包含所需的体验与安全边界章节**

运行：

```bash
grep -n "核心体验原则\\|渲染边界\\|持久化与离线策略\\|技术建议" /Users/akuya/Desktop/Morphic/docs/frontend-architecture.md
```

预期：

```text
`grep` 输出包含这四个章节，说明重写后的文档已经覆盖关键体验与安全边界。
```

- [ ] **Step 6: 提交新增边界章节**

运行：

```bash
git add /Users/akuya/Desktop/Morphic/docs/frontend-architecture.md
git commit -m "docs: add frontend rendering and persistence boundaries"
```

### Task 4: 最终复核与交接

**Files:**
- Modify: `docs/frontend-architecture.md`
- Reference: `docs/api-reference.md`
- Reference: `docs/superpowers/specs/2026-04-18-frontend-architecture-design.md`

- [ ] **Step 1: 做最后一轮内容检查，清理冲突和遗留旧段落**

确认最终文档不再包含以下不匹配内容：

```text
- 以单步 `/generate` 作为主路径
- 把 `useGenerate()` 作为推荐接入方式
- 将原始 HTML 直接嵌入作为默认渲染模式
- 将本地持久化写成最终真相来源
- 让泛技术说明压过产品边界叙述
```

- [ ] **Step 2: 运行聚焦验证搜索**

运行：

```bash
grep -n "/generate\\|useGenerate\\|dangerouslySetInnerHTML" /Users/akuya/Desktop/Morphic/docs/frontend-architecture.md
grep -n "recommend-options\\|generate-content\\|sessionId" /Users/akuya/Desktop/Morphic/docs/frontend-architecture.md
```

预期：

```text
第一条命令不返回有问题的主路径模式。
第二条命令确认当前 API 对齐流程已被写入文档。
```

- [ ] **Step 3: 从头到尾通读重写后的文档并收紧措辞**

确认最终文档满足以下要求：

```text
- 作为一份完整的架构文档可以顺畅阅读
- 示例保持简洁
- 突出产品核心体验与前端边界
- 不要求后端发生改动
```

- [ ] **Step 4: 运行 git diff 复核最终重写结果**

运行：

```bash
git diff -- /Users/akuya/Desktop/Morphic/docs/frontend-architecture.md
```

预期：

```text
diff 展示的是一份围绕产品目标、职责边界、API 对齐、渲染安全与持久化规则的文档重写。
```

- [ ] **Step 5: 提交最终复核后的文档**

运行：

```bash
git add /Users/akuya/Desktop/Morphic/docs/frontend-architecture.md
git commit -m "docs: rewrite frontend architecture design"
```

- [ ] **Step 6: 交付结果并附上审阅入口**

最终交付说明中包含：

```markdown
- `docs/frontend-architecture.md` 的路径
- `docs/superpowers/specs/2026-04-18-frontend-architecture-design.md` 的路径
- 一段简短的变更总结
- 一句说明：后端行为未被修改
```
