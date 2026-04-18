import { Editor } from '@tldraw/tldraw';
import type { CanvasCard } from '@/types/cards';
import type { GenerateMockInput, GenerateMockResult, Recommendation } from '@/types/ai';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

async function extractTextFromShapes(editor: Editor): Promise<string> {
  const shapes = editor.getCurrentPageShapes();
  let nativeText = '';
  const imageShapeIds: string[] = [];

  for (const shape of shapes) {
    if (shape.type === 'text' || shape.type === 'note') {
      nativeText += (shape.props as Record<string, unknown>).text + '\n';
    } else if (shape.type === 'geo' && (shape.props as Record<string, unknown>).text) {
      nativeText += (shape.props as Record<string, unknown>).text + '\n';
    } else if (shape.type === 'draw' || shape.type === 'image') {
      imageShapeIds.push(shape.id);
    }
  }

  // If there are hand-drawn or image shapes, export them and run OCR
  let ocrText = '';
  if (imageShapeIds.length > 0) {
    try {
      const result = await editor.toImage(imageShapeIds, { format: 'png', background: true });
      if (result && result.blob) {
        // Read blob as base64
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(result.blob);
        });

        // Call OCR API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const response = await fetch(`${BACKEND_URL}/api/ocr/recognize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Data }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.text) {
            ocrText += data.data.text + '\n';
          }
        }
      }
    } catch (e) {
      console.error('OCR Extraction failed:', e);
    }
  }

  return (nativeText + '\n' + ocrText).trim();
}

export const getRealRecommendations = async (editor: Editor, prompt: string): Promise<Recommendation[]> => {
  try {
    const contextText = await extractTextFromShapes(editor);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${BACKEND_URL}/api/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        canvasContext: {
          nearbyContent: [contextText, prompt].filter(Boolean)
        }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data?.options) {
        return data.data.options.map((opt: Record<string, string>) => ({
          id: opt.id,
          label: opt.label,
          description: opt.description
        }));
      }
    }
  } catch (e) {
    console.error('Failed to get recommendations', e);
  }

  // Fallback
  return [
    { id: 'explain', label: '解释这个概念', description: '生成一张简洁说明卡片' },
    { id: 'outline', label: '整理成提纲', description: '提取关键信息并按层级整理' },
  ];
};

export const generateRealCardSet = async (
  editor: Editor, 
  input: GenerateMockInput
): Promise<GenerateMockResult> => {
  try {
    const contextText = await extractTextFromShapes(editor);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(`${BACKEND_URL}/api/content/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'mvp-session',
        userInput: input.prompt,
        selectedOptionId: input.initialVariant,
        context: {
          additionalContext: contextText
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data?.content) {
        const contentStr = data.data.content;
        
        // Build card
        const card: CanvasCard = {
          id: `card-${crypto.randomUUID()}`,
          x: input.x,
          y: input.y,
          width: 340,
          height: 220,
          type: 'text',
          title: input.prompt || '生成结果',
          variantKey: input.initialVariant || 'explain',
          redoOptions: ['explain', 'outline', 'question'],
          content: {
            body: contentStr
          }
        };

        return { cards: [card] };
      }
    }
  } catch (e) {
    console.error('Failed to generate content', e);
  }

  // Fallback if failed
  const fallbackCard: CanvasCard = {
    id: `card-${crypto.randomUUID()}`,
    x: input.x,
    y: input.y,
    width: 340,
    height: 220,
    type: 'text',
    title: '生成失败',
    variantKey: 'error',
    redoOptions: [],
    content: { body: '无法连接到后端 API，请重试。' }
  };
  return { cards: [fallbackCard] };
};
