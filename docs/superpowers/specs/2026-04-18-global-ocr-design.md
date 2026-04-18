# Global OCR & AI API Integration Design

## 1. Architecture Overview
采用**混合识别模式**：
- **前端 (Next.js + tldraw)**：遍历画布元素。原生提取 `text`、`note` 等文本类型元素的字符串；针对 `draw`（手写）和 `image`（图片）元素，利用 tldraw 的导出功能将其转为 Base64 图片，并发送给后端进行 OCR 识别。
- **后端 (Node.js + Python/PaddleOCR)**：新增 `/api/ocr/recognize` 接口。接收前端上传的 Base64 图片，通过 Node.js 的 `child_process` 唤起 Python 脚本运行 PaddleOCR，返回识别出的文本。
- **API 联动**：将原生文本和 OCR 提取的手写/图片文本合并，作为 `additionalContext` 或 `canvasContext` 传入后端的 AI API（`/api/recommendations` 与 `/api/content/generate`），最终生成智能卡片。

## 2. Components
### Backend (Node.js)
- **`src/services/ocr-service.ts`**: 封装对 Python 脚本的调用，将传入的 base64 图片存为临时文件并执行 OCR，最后清理临时文件。
- **`src/api/routes/ocr.ts`**: 暴露 `/api/ocr/recognize` HTTP 接口。
- **`ocr_worker.py`**: 基于 `paddleocr` 库的 Python 脚本，读取图片并输出识别的字符串。

### Frontend (React / tldraw)
- **`src/lib/real/ai-provider.ts`** (替换原来的 mock provider):
  1. `getCanvasContext(editor)`: 获取当前画布所有元素。如果是手写或图片，调用 `editor.getSvg` 或类似方法导出图片，请求 `/api/ocr/recognize`。
  2. `getRecommendations(editor, prompt)`: 结合上下文调用后端 `/api/recommendations`。
  3. `generateCardSet(editor, prompt)`: 结合上下文调用后端 `/api/content/generate`。
- **`src/components/canvas/tldraw-board.tsx`**: 接入真实的 `ai-provider` 逻辑，处理 API 的异步加载状态。

## 3. Data Flow
1. 用户在画布上进行手写（Draw）、贴图（Image）或打字（Text）。
2. 用户点击 `+` 锚点，前端扫描周边或全局元素。
3. 发现非文本的视觉元素 -> 导出图像 -> `POST /api/ocr/recognize` -> 获取文本。
4. 拼接所有文本 -> `POST /api/recommendations` -> 返回建议列表。
5. 用户选择建议或手动输入 -> `POST /api/content/generate` -> 后端调用 DeepSeek/大模型 -> 返回卡片数据。
6. 前端渲染真实生成的卡片。

## 4. Error Handling
- Python 进程失败或未安装 PaddleOCR 时，返回空文本但不阻断主流程，并记录日志。
- AI API 超时或失败时，前端弹出提示并回退状态，允许用户重试。
