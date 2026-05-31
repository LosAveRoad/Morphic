# Pure Frontend Restore + Memory Bug Fix

**Date:** 2026-05-13
**Status:** Approved
**Baseline commit:** 8454266 (standalone frontend with local OCR and direct DeepSeek API)

## Problem

The standalone frontend causes abnormal memory usage that can crash the computer. The primary cause is Tesseract.js loading WASM workers (50-100MB+ for chi_sim+eng models) on every AI interaction without proper cleanup. A secondary cause is the AnchorTracker subscribing to every editor change event without debouncing.

## Design

### 1. Remove morphic-backend directory

Delete the `morphic-backend/` directory from git tracking. Update `.gitignore` to prevent re-addition.

### 2. Remove Tesseract.js (primary fix)

- Remove `tesseract.js` import from `ai-provider.ts`
- Remove all OCR logic from `extractTextFromShapes` (image export, base64 conversion, Tesseract.recognize calls)
- Keep only native text extraction from shape props (geo, text, arrow shapes)
- Remove `draw`/`highlight`/`image` shape image export fallback
- Remove `tesseract.js` from `package.json` dependencies
- Run `npm install` to update lockfile

### 3. Fix AnchorTracker reactive loop (secondary fix)

- Debounce the `editor.on('change')` handler in `AnchorTracker` to prevent firing `setAnchor` on every single editor event
- Skip `setAnchor` calls when coordinates haven't actually changed

### 4. Preserve current uncommitted changes

The current diff only changes the API key and model name (`deepseek-v4-flash`) — keep these.

## Scope

- Files modified: `ai-provider.ts`, `tldraw-board.tsx`, `package.json`, `.gitignore`
- Files deleted: entire `morphic-backend/` directory
- No new files created
- No API contract changes
