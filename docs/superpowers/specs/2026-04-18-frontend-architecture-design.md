# Cognitive Lab Frontend Architecture Redesign Spec

**Date**: 2026-04-18
**Author**: GPT-5.4
**Status**: Draft for review
**Target Document**: `docs/frontend-architecture.md`

## 1. Goal

Rewrite `docs/frontend-architecture.md` into a front-end architecture and boundary spec that:

- preserves the current product direction of immersive canvas + iPad PWA
- aligns front-end interaction flow with `docs/api-reference.md`
- clarifies front-end responsibilities without changing backend behavior
- promotes product-defining UX from `main.md` into the architecture narrative

## 2. Non-Goals

This work does not:

- change backend APIs or backend implementation
- define AI model strategy, prompt logic, or ranking logic
- commit to a production-ready component library implementation
- fully specify later-phase features such as Douyin MCP integration

## 3. Product Context

The MVP is not a generic canvas app. Its core experience is:

- an immersive, paper-like infinite canvas for iPad and desktop web
- minimal chrome, with canvas-first interaction
- AI entry through lightweight contextual anchors rather than a traditional chat-first UI
- generated content that can appear as text, controlled cards, or hybrid learning blocks
- redo behavior that feels like a meaningful "collapse and reconstruct" interaction

The rewritten front-end architecture must reflect these product priorities instead of reading as a generic stack inventory.

## 4. Front-End Responsibility Boundaries

The front end is divided into five domains.

### 4.1 Canvas Surface

Responsible for:

- rendering the tldraw canvas
- handling viewport, drawing, selection, and Apple Pencil input
- collecting nearby canvas context for downstream AI requests
- presenting the immersive visual shell

Not responsible for:

- deciding AI recommendations
- owning AI session lifecycle
- directly rendering backend HTML payloads without a renderer boundary

### 4.2 AI Interaction Flow

Responsible for:

- driving the user-facing AI state machine
- calling `POST /recommend-options`
- calling `POST /generate-content`
- coordinating anchor reveal, option presentation, direct input, and redo/morphing transitions

Not responsible for:

- raw canvas persistence
- rendering strategy for generated payload internals
- backend-specific inference policy

### 4.3 Generated Content Renderer

Responsible for:

- rendering returned `text`, `html`, and `hybrid` content safely
- mapping returned content into front-end presentation containers
- separating plain text blocks from controlled interactive cards

Not responsible for:

- initiating AI requests
- deciding recommendation flow
- storing authentication or session state

### 4.4 Session and Persistence

Responsible for:

- front-end session state such as `sessionId`, option popup visibility, and last AI interaction context
- local recovery and draft protection
- debounced canvas save orchestration

Not responsible for:

- replacing backend persistence as the system of record
- embedding business meaning into storage keys or cache behavior

### 4.5 API Integration Boundary

Responsible for:

- mapping front-end view models to backend request/response contracts
- centralizing auth header and error translation rules
- protecting the UI from leaking transport details everywhere

Not responsible for:

- inventing new backend fields
- coupling all front-end logic into one global API client abstraction

## 5. Canonical User Flow

The canonical MVP AI flow is:

`idle -> sensing -> options-ready -> generating -> rendered -> morphing-redo`

Detailed behavior:

1. User draws or focuses within the canvas.
2. A contextual AI anchor becomes available.
3. Front end extracts `canvasContext` and calls `POST /recommend-options`.
4. Backend returns `sessionId` and recommendation options.
5. User either selects a recommended option or enters direct input.
6. Front end calls `POST /generate-content` with the same `sessionId`.
7. Response is handed to the generated content renderer.
8. Rendered content is persisted into the canvas document via the canvas save flow.

No front-end design section should describe a legacy single-step `/generate` flow as the primary interaction path.

## 6. API Alignment Rules

The rewritten front-end document must align with `docs/api-reference.md` using the following rules:

- the primary AI entrypoint is `POST /recommend-options`
- the primary content generation endpoint is `POST /generate-content`
- `sessionId` is treated as an AI interaction artifact, not a canvas identity
- generated content types are limited to the documented contract: `text`, `html`, `hybrid`
- front end may define local adapters, but may not describe undocumented request or response fields as required

The architecture doc may mention legacy generation hooks only as deprecated background, not as the recommended design.

## 7. Rendering Boundary Rules

Generated payloads must be described through controlled rendering levels:

- `Inline Text Block`
  - for markdown-like explanation, notes, or summaries
- `Structured Card`
  - for bounded formatted output with layout and visual hierarchy
- `Interactive Card`
  - for controlled HTML or hybrid payloads with declared interactivity

The document must explicitly avoid "render any backend HTML directly into the page" as a default pattern.

Required constraints for `html` and `hybrid` rendering:

- no script execution
- no uncontrolled global style injection
- no implicit event handler execution from raw payload content
- interactivity must be wrapped in front-end controlled containers

## 8. Persistence Boundary Rules

The document must distinguish three storage concerns.

### 8.1 Canvas Persistence

- stores canvas elements, card placement, and user-visible final artifacts
- synchronizes with backend canvas APIs
- acts as the persistent document layer

### 8.2 AI Session State

- stores `sessionId`, current options, and redo-related ephemeral context
- remains separate from canvas entity persistence
- may be reset without destroying the canvas document

### 8.3 Local Recovery Cache

- provides crash recovery and offline resilience
- does not replace backend persistence as the source of truth
- may use `tldraw` local persistence as an implementation aid, but not as the architecture's final persistence story

## 9. Technology Guidance

The architecture rewrite should keep the current direction unless a change clearly improves boundary clarity.

Recommended stack position:

- keep `Next.js`, `React`, `TypeScript`, `tldraw`, `Tailwind CSS`, and PWA support
- keep `Zustand` only for focused shared state, not as the entire architecture
- split API logic into:
  - transport layer
  - domain-facing API modules such as `authApi`, `canvasApi`, and `aiApi`

The document should recommend stable boundaries over premature stack replacement.

## 10. Required Document Restructure

`docs/frontend-architecture.md` should be rewritten around product capability and domain boundaries, not around a generic technology tour.

Recommended section order:

1. overview and product goals
2. front-end scope and non-goals
3. core user experience principles
4. domain boundaries
5. canonical AI interaction flow
6. API integration boundary
7. rendering boundary
8. persistence and offline strategy
9. technology guidance
10. phased implementation priorities

The rewritten document should keep examples concise and architecture-oriented.

## 11. Error Handling Expectations

The front-end architecture should define errors at the boundary level:

- auth expiration handled in the auth/domain layer, not scattered across UI components
- rate-limit and retryable AI failures surfaced as user-facing transient states
- invalid generated payloads handled by renderer fallback, not raw runtime crashes
- persistence failures surfaced separately from generation failures

## 12. Testing Guidance

The document should recommend testing at the boundary level:

- unit tests for API adapters and renderer guards
- interaction tests for the AI state flow
- focused E2E tests for anchor -> recommend -> generate -> render

It should avoid broad, low-value examples that only restate implementation details.

## 13. Acceptance Criteria

The redesign is successful when:

- `docs/frontend-architecture.md` no longer presents the front end as a generic stack overview
- the primary AI flow matches the current backend API contract
- rendering, persistence, and session boundaries are explicitly separated
- the MVP's immersive and anchor-driven interaction model is visible in the document structure
- the document remains implementable without requiring backend changes
