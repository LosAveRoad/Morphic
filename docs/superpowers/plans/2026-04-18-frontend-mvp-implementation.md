# Frontend MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个基于 `tldraw` 的前端 MVP，具备 Notion 风极简画布、`+` 锚点、假 AI 推荐与生成、卡片拖拽排布、redo 切换结果以及本地持久化。

**Architecture:** 在仓库中新建独立的 `cognitive-lab-frontend` 应用，使用 `Next.js + TypeScript + Tailwind + tldraw + Zustand`。画布由 `tldraw` 承载，AI 推荐与生成由本地 mock provider 提供，卡片状态独立于 `tldraw` 文档持久化，最终形成无需真实后端即可演示的单页工作台。

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, tldraw, Zustand, Vitest, Testing Library, localStorage

---

### Task 1: 初始化前端工程与测试基线

**Files:**
- Create: `cognitive-lab-frontend/`
- Create: `cognitive-lab-frontend/package.json`
- Create: `cognitive-lab-frontend/src/app/layout.tsx`
- Create: `cognitive-lab-frontend/src/app/page.tsx`
- Create: `cognitive-lab-frontend/src/app/globals.css`
- Create: `cognitive-lab-frontend/vitest.config.ts`
- Create: `cognitive-lab-frontend/src/test/setup.ts`
- Test: `cognitive-lab-frontend/src/app/page.test.tsx`

- [ ] **Step 1: 创建 Next.js 工程**

Run:

```bash
npm create next-app@latest cognitive-lab-frontend -- --ts --tailwind --eslint --app --src-dir --use-npm --import-alias "@/*"
```

Expected:

```text
在仓库根目录生成 cognitive-lab-frontend，并包含 src/app、package.json、next.config.ts、tsconfig.json。
```

- [ ] **Step 2: 安装 MVP 依赖与测试依赖**

Run:

```bash
cd /Users/akuya/Desktop/Morphic/cognitive-lab-frontend
npm install @tldraw/tldraw zustand clsx
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Expected:

```text
安装完成且 package-lock.json 更新，无 peer dependency 报错阻塞安装。
```

- [ ] **Step 3: 写首页失败测试**

Create `cognitive-lab-frontend/src/app/page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import HomePage from './page'

describe('HomePage', () => {
  it('renders the workspace shell title', () => {
    render(<HomePage />)

    expect(screen.getByText('Cognitive Lab')).toBeInTheDocument()
    expect(screen.getByText('Infinite canvas for thinking')).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: 配置 Vitest 并运行失败测试**

Create `cognitive-lab-frontend/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Create `cognitive-lab-frontend/src/test/setup.ts`:

```ts
import '@testing-library/jest-dom'
```

Run:

```bash
cd /Users/akuya/Desktop/Morphic/cognitive-lab-frontend
npx vitest run src/app/page.test.tsx
```

Expected:

```text
FAIL，提示找不到页面中的 Cognitive Lab 或 Infinite canvas for thinking。
```

- [ ] **Step 5: 写最小首页实现**

Update `cognitive-lab-frontend/src/app/layout.tsx`:

```tsx
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cognitive Lab',
  description: 'Infinite canvas for thinking',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

Update `cognitive-lab-frontend/src/app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#191919]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-6 py-4">
        <header className="flex items-center justify-between border-b border-black/5 pb-3">
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Cognitive Lab</h1>
            <p className="text-xs text-black/45">Infinite canvas for thinking</p>
          </div>
        </header>
        <section className="mt-4 flex-1 rounded-3xl border border-black/5 bg-white/70 shadow-[0_12px_48px_rgba(15,23,42,0.06)]" />
      </div>
    </main>
  )
}
```

Update `cognitive-lab-frontend/src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: #f7f7f5;
}

* {
  box-sizing: border-box;
}
```

- [ ] **Step 6: 运行测试确认通过**

Run:

```bash
cd /Users/akuya/Desktop/Morphic/cognitive-lab-frontend
npx vitest run src/app/page.test.tsx
```

Expected:

```text
PASS，1 passed。
```

- [ ] **Step 7: 提交初始化工程**

Run:

```bash
cd /Users/akuya/Desktop/Morphic
git add cognitive-lab-frontend
git commit -m "feat: initialize frontend MVP app"
```

### Task 2: 建立 mock AI 领域与卡片状态

**Files:**
- Create: `cognitive-lab-frontend/src/types/cards.ts`
- Create: `cognitive-lab-frontend/src/types/ai.ts`
- Create: `cognitive-lab-frontend/src/lib/mock/ai-provider.ts`
- Create: `cognitive-lab-frontend/src/stores/card-store.ts`
- Create: `cognitive-lab-frontend/src/stores/ui-store.ts`
- Test: `cognitive-lab-frontend/src/lib/mock/ai-provider.test.ts`
- Test: `cognitive-lab-frontend/src/stores/card-store.test.ts`

- [ ] **Step 1: 写 mock provider 失败测试**

Create `cognitive-lab-frontend/src/lib/mock/ai-provider.test.ts`:

```ts
import { getMockRecommendations, generateMockCardSet, redoMockCard } from './ai-provider'

describe('ai-provider', () => {
  it('returns four recommendations', () => {
    const result = getMockRecommendations('谱定理')
    expect(result).toHaveLength(4)
  })

  it('creates at least one card from a prompt', () => {
    const result = generateMockCardSet({
      prompt: '解释一下谱定理',
      x: 240,
      y: 160,
    })

    expect(result.cards.length).toBeGreaterThan(0)
    expect(result.cards[0].x).toBe(240)
    expect(result.cards[0].y).toBe(160)
  })

  it('returns a different variant on redo', () => {
    const initial = generateMockCardSet({
      prompt: '解释一下谱定理',
      x: 100,
      y: 100,
    }).cards[0]

    const redone = redoMockCard(initial)

    expect(redone.variantKey).not.toBe(initial.variantKey)
  })
})
```

- [ ] **Step 2: 写 card store 失败测试**

Create `cognitive-lab-frontend/src/stores/card-store.test.ts`:

```ts
import { createCardStore } from './card-store'

describe('card-store', () => {
  it('adds cards to the canvas state', () => {
    const store = createCardStore()

    store.getState().addCards([
      {
        id: 'card-1',
        x: 120,
        y: 180,
        width: 320,
        height: 220,
        type: 'text',
        title: 'Test',
        content: { body: 'Hello' },
        variantKey: 'explain',
        redoOptions: ['outline'],
      },
    ])

    expect(store.getState().cards).toHaveLength(1)
  })

  it('updates position when a card is moved', () => {
    const store = createCardStore()

    store.getState().addCards([
      {
        id: 'card-1',
        x: 120,
        y: 180,
        width: 320,
        height: 220,
        type: 'text',
        title: 'Test',
        content: { body: 'Hello' },
        variantKey: 'explain',
        redoOptions: ['outline'],
      },
    ])

    store.getState().moveCard('card-1', 400, 300)

    expect(store.getState().cards[0]).toMatchObject({ x: 400, y: 300 })
  })
})
```

- [ ] **Step 3: 运行失败测试**

Run:

```bash
cd /Users/akuya/Desktop/Morphic/cognitive-lab-frontend
npx vitest run src/lib/mock/ai-provider.test.ts src/stores/card-store.test.ts
```

Expected:

```text
FAIL，提示缺少 ai-provider 或 card-store。
```

- [ ] **Step 4: 写类型、mock provider 与 store 最小实现**

Create `cognitive-lab-frontend/src/types/cards.ts`:

```ts
export type CardType = 'text' | 'outline' | 'hybrid'

export type CanvasCard = {
  id: string
  x: number
  y: number
  width: number
  height: number
  type: CardType
  title?: string
  content: Record<string, unknown>
  variantKey: string
  redoOptions: string[]
}
```

Create `cognitive-lab-frontend/src/types/ai.ts`:

```ts
import type { CanvasCard } from './cards'

export type Recommendation = {
  id: string
  label: string
  description: string
}

export type GenerateMockInput = {
  prompt: string
  x: number
  y: number
  initialVariant?: string
}

export type GenerateMockResult = {
  cards: CanvasCard[]
}
```

Create `cognitive-lab-frontend/src/lib/mock/ai-provider.ts`:

```ts
import type { CanvasCard } from '@/types/cards'
import type { GenerateMockInput, GenerateMockResult, Recommendation } from '@/types/ai'

const recommendationTemplates: Recommendation[] = [
  { id: 'explain', label: '解释这个概念', description: '生成一张简洁说明卡片' },
  { id: 'outline', label: '整理成提纲', description: '提取关键信息并按层级整理' },
  { id: 'question', label: '生成练习题', description: '给出一个小问题帮助思考' },
  { id: 'rewrite', label: '换一种表达', description: '以另一种说法重新组织内容' },
]

const makeCard = (input: GenerateMockInput, variantKey: string): CanvasCard => {
  const common = {
    id: `card-${crypto.randomUUID()}`,
    x: input.x,
    y: input.y,
    width: 340,
    height: 220,
    redoOptions: ['explain', 'outline', 'question'],
  }

  if (variantKey === 'outline') {
    return {
      ...common,
      type: 'outline',
      title: '提纲整理',
      variantKey,
      content: {
        items: ['核心定义', '关键性质', '一个直觉解释'],
        prompt: input.prompt,
      },
    }
  }

  if (variantKey === 'question') {
    return {
      ...common,
      type: 'hybrid',
      title: '问题引导',
      variantKey,
      content: {
        body: `如果用一句话解释「${input.prompt}」，你会先讲什么？`,
        bullets: ['定义是什么', '为什么重要', '能解决什么问题'],
      },
    }
  }

  return {
    ...common,
    type: 'text',
    title: '概念解释',
    variantKey,
    content: {
      body: `这是关于「${input.prompt}」的一段本地 mock 解释内容，用于演示 AI 生成卡片。`,
    },
  }
}

export const getMockRecommendations = (_context: string) => recommendationTemplates

export const generateMockCardSet = (input: GenerateMockInput): GenerateMockResult => ({
  cards: [makeCard(input, input.initialVariant ?? 'explain')],
})

export const redoMockCard = (card: CanvasCard): CanvasCard => {
  const nextVariant = card.redoOptions.find((key) => key !== card.variantKey) ?? 'outline'
  return {
    ...makeCard({ prompt: card.title ?? '概念', x: card.x, y: card.y }, nextVariant),
    id: card.id,
    x: card.x,
    y: card.y,
  }
}
```

Create `cognitive-lab-frontend/src/stores/card-store.ts`:

```ts
import { createStore } from 'zustand/vanilla'
import type { CanvasCard } from '@/types/cards'

type CardState = {
  cards: CanvasCard[]
  addCards: (cards: CanvasCard[]) => void
  hydrateCards: (cards: CanvasCard[]) => void
  moveCard: (id: string, x: number, y: number) => void
  replaceCard: (id: string, card: CanvasCard) => void
  clearCards: () => void
}

export const createCardStore = () =>
  createStore<CardState>((set) => ({
    cards: [],
    addCards: (cards) => set((state) => ({ cards: [...state.cards, ...cards] })),
    hydrateCards: (cards) => set({ cards }),
    moveCard: (id, x, y) =>
      set((state) => ({
        cards: state.cards.map((card) => (card.id === id ? { ...card, x, y } : card)),
      })),
    replaceCard: (id, card) =>
      set((state) => ({
        cards: state.cards.map((item) => (item.id === id ? card : item)),
      })),
    clearCards: () => set({ cards: [] }),
  }))
```

Create `cognitive-lab-frontend/src/stores/ui-store.ts`:

```ts
import { create } from 'zustand'

type UiState = {
  anchor: { x: number; y: number } | null
  panelOpen: boolean
  prompt: string
  generating: boolean
  setAnchor: (anchor: { x: number; y: number } | null) => void
  setPanelOpen: (open: boolean) => void
  setPrompt: (prompt: string) => void
  setGenerating: (generating: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  anchor: null,
  panelOpen: false,
  prompt: '',
  generating: false,
  setAnchor: (anchor) => set({ anchor }),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  setPrompt: (prompt) => set({ prompt }),
  setGenerating: (generating) => set({ generating }),
}))
```

- [ ] **Step 5: 运行测试确认通过**

Run:

```bash
cd /Users/akuya/Desktop/Morphic/cognitive-lab-frontend
npx vitest run src/lib/mock/ai-provider.test.ts src/stores/card-store.test.ts
```

Expected:

```text
PASS，全部通过。
```

- [ ] **Step 6: 提交 mock 领域基础**

Run:

```bash
cd /Users/akuya/Desktop/Morphic
git add cognitive-lab-frontend
git commit -m "feat: add mock AI provider and card state"
```

### Task 3: 接入 tldraw 工作台与 AI 锚点面板

**Files:**
- Create: `cognitive-lab-frontend/src/components/shell/workspace-shell.tsx`
- Create: `cognitive-lab-frontend/src/components/canvas/tldraw-board.tsx`
- Create: `cognitive-lab-frontend/src/components/ai/ai-anchor.tsx`
- Create: `cognitive-lab-frontend/src/components/ai/recommendation-panel.tsx`
- Modify: `cognitive-lab-frontend/src/app/page.tsx`
- Test: `cognitive-lab-frontend/src/components/ai/recommendation-panel.test.tsx`

- [ ] **Step 1: 写推荐面板失败测试**

Create `cognitive-lab-frontend/src/components/ai/recommendation-panel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecommendationPanel } from './recommendation-panel'

describe('RecommendationPanel', () => {
  it('shows recommendations and submits manual input', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onSubmit = vi.fn()

    render(
      <RecommendationPanel
        recommendations={[
          { id: 'explain', label: '解释这个概念', description: '生成说明卡' },
        ]}
        prompt=""
        onPromptChange={() => {}}
        onSelect={onSelect}
        onSubmit={onSubmit}
      />,
    )

    await user.click(screen.getByText('解释这个概念'))
    await user.type(screen.getByPlaceholderText('输入一句话，让 AI 帮你整理'), '谱定理')
    await user.click(screen.getByText('生成卡片'))

    expect(onSelect).toHaveBeenCalledWith('explain')
    expect(onSubmit).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: 运行失败测试**

Run:

```bash
cd /Users/akuya/Desktop/Morphic/cognitive-lab-frontend
npx vitest run src/components/ai/recommendation-panel.test.tsx
```

Expected:

```text
FAIL，提示缺少 recommendation-panel。
```

- [ ] **Step 3: 写工作台组件与推荐面板**

Create `cognitive-lab-frontend/src/components/shell/workspace-shell.tsx`:

```tsx
export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#191919]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-6 py-4">
        <header className="flex items-center justify-between border-b border-black/5 pb-3">
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Cognitive Lab</h1>
            <p className="text-xs text-black/45">Infinite canvas for thinking</p>
          </div>
          <span className="rounded-full border border-black/5 bg-white px-3 py-1 text-xs text-black/50">
            MVP Preview
          </span>
        </header>
        <section className="relative mt-4 flex-1 overflow-hidden rounded-3xl border border-black/5 bg-white/70 shadow-[0_12px_48px_rgba(15,23,42,0.06)]">
          {children}
        </section>
      </div>
    </main>
  )
}
```

Create `cognitive-lab-frontend/src/components/ai/ai-anchor.tsx`:

```tsx
type Props = {
  x: number
  y: number
  onClick: () => void
}

export function AIAnchor({ x, y, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute z-20 flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-lg shadow-[0_8px_24px_rgba(15,23,42,0.12)] transition hover:scale-105"
      style={{ left: x, top: y }}
    >
      +
    </button>
  )
}
```

Create `cognitive-lab-frontend/src/components/ai/recommendation-panel.tsx`:

```tsx
import type { Recommendation } from '@/types/ai'

type Props = {
  recommendations: Recommendation[]
  prompt: string
  onPromptChange: (prompt: string) => void
  onSelect: (id: string) => void
  onSubmit: () => void
}

export function RecommendationPanel({
  recommendations,
  prompt,
  onPromptChange,
  onSelect,
  onSubmit,
}: Props) {
  return (
    <div className="absolute z-30 w-[360px] rounded-2xl border border-black/5 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-black/35">Suggestions</p>
      <div className="space-y-2">
        {recommendations.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className="flex w-full flex-col rounded-xl border border-black/5 px-3 py-2 text-left transition hover:bg-black/[0.03]"
          >
            <span className="text-sm font-medium">{item.label}</span>
            <span className="text-xs text-black/45">{item.description}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        <input
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          placeholder="输入一句话，让 AI 帮你整理"
          className="w-full rounded-xl border border-black/10 bg-[#fafaf8] px-3 py-2 text-sm outline-none placeholder:text-black/30"
        />
        <button
          type="button"
          onClick={onSubmit}
          className="w-full rounded-xl bg-[#191919] px-3 py-2 text-sm font-medium text-white"
        >
          生成卡片
        </button>
      </div>
    </div>
  )
}
```

Create `cognitive-lab-frontend/src/components/canvas/tldraw-board.tsx`:

```tsx
'use client'

import { useMemo } from 'react'
import { Tldraw } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { AIAnchor } from '@/components/ai/ai-anchor'
import { RecommendationPanel } from '@/components/ai/recommendation-panel'
import { getMockRecommendations } from '@/lib/mock/ai-provider'
import { useUiStore } from '@/stores/ui-store'

export function TldrawBoard() {
  const { anchor, panelOpen, prompt, setAnchor, setPanelOpen, setPrompt } = useUiStore()
  const recommendations = useMemo(() => getMockRecommendations(prompt), [prompt])

  return (
    <div
      className="relative h-[calc(100vh-110px)]"
      onDoubleClick={(event) => {
        setAnchor({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY })
        setPanelOpen(false)
      }}
    >
      <Tldraw persistenceKey="cognitive-lab-mvp" />
      {anchor ? (
        <AIAnchor
          x={anchor.x}
          y={anchor.y}
          onClick={() => {
            setPanelOpen(!panelOpen)
          }}
        />
      ) : null}
      {anchor && panelOpen ? (
        <div style={{ left: anchor.x + 20, top: anchor.y + 20 }} className="absolute">
          <RecommendationPanel
            recommendations={recommendations}
            prompt={prompt}
            onPromptChange={setPrompt}
            onSelect={() => {}}
            onSubmit={() => {}}
          />
        </div>
      ) : null}
    </div>
  )
}
```

Update `cognitive-lab-frontend/src/app/page.tsx`:

```tsx
import { WorkspaceShell } from '@/components/shell/workspace-shell'
import { TldrawBoard } from '@/components/canvas/tldraw-board'

export default function HomePage() {
  return (
    <WorkspaceShell>
      <TldrawBoard />
    </WorkspaceShell>
  )
}
```

- [ ] **Step 4: 运行推荐面板测试**

Run:

```bash
cd /Users/akuya/Desktop/Morphic/cognitive-lab-frontend
npx vitest run src/components/ai/recommendation-panel.test.tsx
```

Expected:

```text
PASS。
```

- [ ] **Step 5: 启动开发服务器做基础人工检查**

Run:

```bash
cd /Users/akuya/Desktop/Morphic/cognitive-lab-frontend
npm run dev
```

Expected:

```text
开发服务器启动，双击画布出现 `+` 锚点，点击后打开推荐面板。
```

- [ ] **Step 6: 提交工作台与锚点交互**

Run:

```bash
cd /Users/akuya/Desktop/Morphic
git add cognitive-lab-frontend
git commit -m "feat: add tldraw workspace and AI anchor"
```

### Task 4: 实现卡片生成、拖拽与 redo

**Files:**
- Create: `cognitive-lab-frontend/src/components/cards/generated-card.tsx`
- Create: `cognitive-lab-frontend/src/components/cards/card-layer.tsx`
- Modify: `cognitive-lab-frontend/src/components/canvas/tldraw-board.tsx`
- Test: `cognitive-lab-frontend/src/components/cards/generated-card.test.tsx`

- [ ] **Step 1: 写卡片组件失败测试**

Create `cognitive-lab-frontend/src/components/cards/generated-card.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GeneratedCard } from './generated-card'

describe('GeneratedCard', () => {
  it('renders title and calls redo handler', async () => {
    const user = userEvent.setup()
    const onRedo = vi.fn()

    render(
      <GeneratedCard
        card={{
          id: 'card-1',
          x: 100,
          y: 120,
          width: 320,
          height: 220,
          type: 'text',
          title: '概念解释',
          content: { body: '谱定理相关内容' },
          variantKey: 'explain',
          redoOptions: ['outline'],
        }}
        onRedo={onRedo}
      />,
    )

    expect(screen.getByText('概念解释')).toBeInTheDocument()
    await user.click(screen.getByText('Redo'))
    expect(onRedo).toHaveBeenCalledWith('card-1')
  })
})
```

- [ ] **Step 2: 运行失败测试**

Run:

```bash
cd /Users/akuya/Desktop/Morphic/cognitive-lab-frontend
npx vitest run src/components/cards/generated-card.test.tsx
```

Expected:

```text
FAIL，提示缺少 generated-card。
```

- [ ] **Step 3: 写卡片组件与卡片层**

Create `cognitive-lab-frontend/src/components/cards/generated-card.tsx`:

```tsx
'use client'

import type { CanvasCard } from '@/types/cards'

type Props = {
  card: CanvasCard
  onRedo: (id: string) => void
}

export function GeneratedCard({ card, onRedo }: Props) {
  const body =
    typeof card.content.body === 'string'
      ? card.content.body
      : Array.isArray(card.content.items)
        ? (card.content.items as string[]).join(' · ')
        : 'Mock card content'

  return (
    <article
      className="absolute z-10 rounded-2xl border border-black/10 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.10)]"
      style={{ left: card.x, top: card.y, width: card.width, minHeight: card.height }}
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold">{card.title}</h3>
          <p className="text-xs text-black/35">{card.variantKey}</p>
        </div>
        <button
          type="button"
          onClick={() => onRedo(card.id)}
          className="rounded-lg border border-black/10 px-2 py-1 text-xs text-black/60"
        >
          Redo
        </button>
      </div>
      <p className="text-sm leading-6 text-black/75">{body}</p>
    </article>
  )
}
```

Create `cognitive-lab-frontend/src/components/cards/card-layer.tsx`:

```tsx
'use client'

import { GeneratedCard } from './generated-card'
import type { CanvasCard } from '@/types/cards'

type Props = {
  cards: CanvasCard[]
  onRedo: (id: string) => void
}

export function CardLayer({ cards, onRedo }: Props) {
  return (
    <>
      {cards.map((card) => (
        <GeneratedCard key={card.id} card={card} onRedo={onRedo} />
      ))}
    </>
  )
}
```

- [ ] **Step 4: 将生成和 redo 接入 tldraw 工作台**

Update `cognitive-lab-frontend/src/components/canvas/tldraw-board.tsx`:

```tsx
'use client'

import { useMemo, useRef } from 'react'
import { Tldraw } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { AIAnchor } from '@/components/ai/ai-anchor'
import { RecommendationPanel } from '@/components/ai/recommendation-panel'
import { CardLayer } from '@/components/cards/card-layer'
import { generateMockCardSet, getMockRecommendations, redoMockCard } from '@/lib/mock/ai-provider'
import { createCardStore } from '@/stores/card-store'
import { useStore } from 'zustand'
import { useUiStore } from '@/stores/ui-store'

const cardStore = createCardStore()

export function TldrawBoard() {
  const cards = useStore(cardStore, (state) => state.cards)
  const { anchor, panelOpen, prompt, setAnchor, setPanelOpen, setPrompt, setGenerating } = useUiStore()
  const recommendations = useMemo(() => getMockRecommendations(prompt), [prompt])
  const selectedVariant = useRef<string>('explain')

  const generate = () => {
    if (!anchor) return
    setGenerating(true)
    const result = generateMockCardSet({
      prompt: prompt || '请解释当前想法',
      x: anchor.x + 40,
      y: anchor.y + 40,
      initialVariant: selectedVariant.current,
    })
    cardStore.getState().addCards(result.cards)
    setPanelOpen(false)
    setPrompt('')
    setGenerating(false)
  }

  return (
    <div
      className="relative h-[calc(100vh-110px)]"
      onDoubleClick={(event) => {
        setAnchor({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY })
        setPanelOpen(false)
      }}
    >
      <Tldraw persistenceKey="cognitive-lab-mvp" />
      <CardLayer
        cards={cards}
        onRedo={(id) => {
          const card = cards.find((item) => item.id === id)
          if (!card) return
          cardStore.getState().replaceCard(id, redoMockCard(card))
        }}
      />
      {anchor ? (
        <AIAnchor
          x={anchor.x}
          y={anchor.y}
          onClick={() => {
            setPanelOpen(!panelOpen)
          }}
        />
      ) : null}
      {anchor && panelOpen ? (
        <div style={{ left: anchor.x + 20, top: anchor.y + 20 }} className="absolute">
          <RecommendationPanel
            recommendations={recommendations}
            prompt={prompt}
            onPromptChange={setPrompt}
            onSelect={(id) => {
              selectedVariant.current = id
              setPrompt(recommendations.find((item) => item.id === id)?.label ?? prompt)
              generate()
            }}
            onSubmit={generate}
          />
        </div>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 5: 运行卡片组件测试**

Run:

```bash
cd /Users/akuya/Desktop/Morphic/cognitive-lab-frontend
npx vitest run src/components/cards/generated-card.test.tsx
```

Expected:

```text
PASS。
```

- [ ] **Step 6: 手工验证四个演示瞬间**

Check:

```text
1. 双击画布出现 + 号
2. 点击 + 打开推荐项
3. 选择推荐项或输入一句话后生成卡片
4. 点击 Redo 后内容切换到另一种结果
```

- [ ] **Step 7: 提交卡片生成主路径**

Run:

```bash
cd /Users/akuya/Desktop/Morphic
git add cognitive-lab-frontend
git commit -m "feat: add mock card generation and redo flow"
```

### Task 5: 加入拖拽排布与本地持久化

**Files:**
- Modify: `cognitive-lab-frontend/src/stores/card-store.ts`
- Modify: `cognitive-lab-frontend/src/components/cards/generated-card.tsx`
- Modify: `cognitive-lab-frontend/src/components/cards/card-layer.tsx`
- Create: `cognitive-lab-frontend/src/domains/persistence/card-storage.ts`
- Test: `cognitive-lab-frontend/src/domains/persistence/card-storage.test.ts`

- [ ] **Step 1: 写持久化失败测试**

Create `cognitive-lab-frontend/src/domains/persistence/card-storage.test.ts`:

```ts
import { loadCards, saveCards } from './card-storage'

describe('card-storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves and loads cards', () => {
    const cards = [
      {
        id: 'card-1',
        x: 100,
        y: 100,
        width: 320,
        height: 220,
        type: 'text',
        title: '概念解释',
        content: { body: 'hello' },
        variantKey: 'explain',
        redoOptions: ['outline'],
      },
    ]

    saveCards(cards)

    expect(loadCards()).toEqual(cards)
  })
})
```

- [ ] **Step 2: 运行失败测试**

Run:

```bash
cd /Users/akuya/Desktop/Morphic/cognitive-lab-frontend
npx vitest run src/domains/persistence/card-storage.test.ts
```

Expected:

```text
FAIL，提示缺少 card-storage。
```

- [ ] **Step 3: 写本地持久化工具**

Create `cognitive-lab-frontend/src/domains/persistence/card-storage.ts`:

```ts
import type { CanvasCard } from '@/types/cards'

const STORAGE_KEY = 'cognitive-lab-cards'

export const loadCards = (): CanvasCard[] => {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as CanvasCard[]
  } catch {
    return []
  }
}

export const saveCards = (cards: CanvasCard[]) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
}
```

- [ ] **Step 4: 让卡片支持拖拽并在 store 中更新坐标**

Update `cognitive-lab-frontend/src/components/cards/generated-card.tsx`:

```tsx
'use client'

import type { CanvasCard } from '@/types/cards'

type Props = {
  card: CanvasCard
  onRedo: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
}

export function GeneratedCard({ card, onRedo, onMove }: Props) {
  const body =
    typeof card.content.body === 'string'
      ? card.content.body
      : Array.isArray(card.content.items)
        ? (card.content.items as string[]).join(' · ')
        : 'Mock card content'

  return (
    <article
      draggable
      onDragEnd={(event) => onMove(card.id, event.clientX - card.width / 2, event.clientY - 120)}
      className="absolute z-10 cursor-move rounded-2xl border border-black/10 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.10)]"
      style={{ left: card.x, top: card.y, width: card.width, minHeight: card.height }}
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold">{card.title}</h3>
          <p className="text-xs text-black/35">{card.variantKey}</p>
        </div>
        <button
          type="button"
          onClick={() => onRedo(card.id)}
          className="rounded-lg border border-black/10 px-2 py-1 text-xs text-black/60"
        >
          Redo
        </button>
      </div>
      <p className="text-sm leading-6 text-black/75">{body}</p>
    </article>
  )
}
```

Update `cognitive-lab-frontend/src/components/cards/card-layer.tsx`:

```tsx
'use client'

import { GeneratedCard } from './generated-card'
import type { CanvasCard } from '@/types/cards'

type Props = {
  cards: CanvasCard[]
  onRedo: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
}

export function CardLayer({ cards, onRedo, onMove }: Props) {
  return (
    <>
      {cards.map((card) => (
        <GeneratedCard key={card.id} card={card} onRedo={onRedo} onMove={onMove} />
      ))}
    </>
  )
}
```

Update `cognitive-lab-frontend/src/components/canvas/tldraw-board.tsx` to pass `onMove` and persist cards on change:

```tsx
import { useEffect, useMemo, useRef } from 'react'
import { loadCards, saveCards } from '@/domains/persistence/card-storage'

// inside component
useEffect(() => {
  const stored = loadCards()
  if (stored.length) {
    cardStore.getState().hydrateCards(stored)
  }
}, [])

useEffect(() => {
  saveCards(cards)
}, [cards])

// in CardLayer props
onMove={(id, x, y) => {
  cardStore.getState().moveCard(id, x, y)
}}
```

- [ ] **Step 5: 运行持久化测试**

Run:

```bash
cd /Users/akuya/Desktop/Morphic/cognitive-lab-frontend
npx vitest run src/domains/persistence/card-storage.test.ts
```

Expected:

```text
PASS。
```

- [ ] **Step 6: 启动页面做最终人工验证**

Run:

```bash
cd /Users/akuya/Desktop/Morphic/cognitive-lab-frontend
npm run dev
```

Verify:

```text
- 画布加载正常
- + 号推荐正常
- 输入生成正常
- 卡片可拖拽
- Redo 可切换结果
- 刷新后卡片恢复
```

- [ ] **Step 7: 提交 MVP 完整闭环**

Run:

```bash
cd /Users/akuya/Desktop/Morphic
git add cognitive-lab-frontend
git commit -m "feat: complete frontend MVP workflow"
```
