import { Editor } from '@tldraw/tldraw';
import Tesseract from 'tesseract.js';
import type { CanvasCard } from '@/types/cards';
import type { GenerateMockInput, GenerateMockResult, Recommendation } from '@/types/ai';

const DEEPSEEK_API_KEY = 'sk-e41bc82f71fd41298f4cbbe16604ba6f';

async function extractTextFromShapes(editor: Editor): Promise<string> {
  const shapes = editor.getCurrentPageShapes();
  
  // Get currently selected shapes. If user has selection, ONLY use selection.
  // If no selection, use ALL shapes on the page.
  const selectedShapeIds = editor.getSelectedShapeIds();
  const targetShapes = selectedShapeIds.length > 0 
    ? shapes.filter(s => selectedShapeIds.includes(s.id))
    : shapes;
    
  console.log(`[Context] Target shapes for extraction: ${targetShapes.length} (Selected: ${selectedShapeIds.length > 0})`);
  let nativeText = '';
  const imageShapeIds: string[] = [];

  // Deep recursive extraction for text in nested structures (like draw/highlight shapes)
  for (const shape of targetShapes) {
    // 1. Direct text prop check
    if ('text' in shape.props) {
      const text = (shape.props as unknown as Record<string, unknown>).text as string;
      if (text) {
        nativeText += text + '\n';
      }
    }
    
    // 2. Geo shapes with text
    if (shape.type === 'geo' && 'text' in shape.props) {
       const text = (shape.props as unknown as Record<string, unknown>).text as string;
       if (text) nativeText += text + '\n';
    }

    // 3. Fallback to raw stringified props if we suspect there's text hidden inside
    const rawProps = JSON.stringify(shape.props || {});
    if (rawProps.includes('"text":"')) {
       // Simple regex to extract basic text fields that might be deeply nested
       const matches = rawProps.match(/"text":"([^"]+)"/g);
       if (matches) {
         matches.forEach(m => {
           const extracted = m.replace(/"text":"/, '').replace(/"$/, '');
           if (extracted && !nativeText.includes(extracted)) {
             nativeText += extracted + '\n';
           }
         });
       }
    }
    
    // Hand drawn shapes and image shapes for OCR fallback
    if (shape.type === 'draw' || shape.type === 'image' || shape.type === 'highlight') {
      imageShapeIds.push(shape.id);
    }
  }

  let ocrText = '';
  if (imageShapeIds.length > 0) {
    try {
      // Create a temporary group or array to properly export multiple shapes
      const result = await editor.toImage(imageShapeIds as unknown as import('@tldraw/tldraw').TLShapeId[], { format: 'png', background: true, padding: 10 });
      if (result && result.blob) {
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(result.blob);
        });

        console.log('[OCR] Running Tesseract in browser...');
        const workerResult = await Tesseract.recognize(base64Data, 'chi_sim+eng', {
          logger: m => {
            if (m.status === 'recognizing text' && m.progress % 0.2 < 0.05) {
              console.log(`[OCR] Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        });
        
        if (workerResult.data && workerResult.data.text) {
          console.log(`[OCR] Extracted text: ${workerResult.data.text.substring(0, 30)}...`);
          ocrText += workerResult.data.text + '\n';
        }
      }
    } catch (e) {
      console.error('[OCR] Extraction failed:', e);
    }
  }

  const finalContext = (nativeText + '\n' + ocrText).trim();
  console.log(`[Context] Final context:\n---START---\n${finalContext}\n---END---`);
  return finalContext;
}

export const getRealRecommendations = async (editor: Editor, prompt: string): Promise<Recommendation[]> => {
  console.log(`[AI] Getting recommendations for prompt: "${prompt}"`);
  try {
    const contextText = await extractTextFromShapes(editor);
    
    const systemPrompt = `你是AI交互选项推荐专家。
基于画布上下文，推荐3个最实用的AI交互选项。
严格按JSON格式回复：
{
  "options": [
    {
      "id": "opt_1",
      "label": "简短标题",
      "description": "一句话描述"
    }
  ]
}
记住：简洁是关键，只输出最核心的信息。`;

    let userPrompt = '请基于以下画布上下文推荐AI交互选项：\n\n';
    if (contextText) userPrompt += `附近内容：\n${contextText}\n\n`;
    if (prompt) userPrompt += `用户输入：\n${prompt}\n\n`;
    userPrompt += '请推荐3个最适合的AI交互选项。';

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        if (parsed.options && Array.isArray(parsed.options)) {
          return parsed.options.map((opt: Record<string, string>) => ({
            id: opt.id || `opt_${Math.random().toString(36).substr(2, 9)}`,
            label: opt.label || '未命名',
            description: opt.description || ''
          }));
        }
      }
    }
  } catch (e) {
    console.error('[AI] Failed to get recommendations', e);
  }

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

    const systemPrompt = `你是精通网页设计的 AI。
请直接生成一段完整的、包含美观内联样式的 HTML 代码。
要求：
1. 只需要输出纯 HTML 代码，不要用 \`\`\`html 块包裹。
2. 内容要直接、清晰，排版要美观（可以使用内联 CSS 或者内部的 <style> 标签）。
3. 文本内容控制在200字以内。
4. 回复必须是一个合法的 JSON，格式为：
{
  "content": "<div style='padding: 10px; font-family: sans-serif;'>...</div>"
}`;

    let userPrompt = `任务：${input.prompt || '解释当前内容'}\n`;
    if (contextText) userPrompt += `\n参考上下文：\n${contextText}`;

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const contentStr = data.choices?.[0]?.message?.content;
      if (contentStr) {
        const parsed = JSON.parse(contentStr);
        const card: CanvasCard = {
          id: `card-${crypto.randomUUID()}`,
          x: input.x,
          y: input.y,
          width: 380,
          height: 260,
          type: 'html',
          title: input.prompt || '生成结果',
          variantKey: input.initialVariant || 'explain',
          redoOptions: ['explain', 'outline', 'question'],
          content: {
            html: parsed.content || '<div>生成内容为空</div>',
            body: '' // Fallback text
          }
        };
        return { cards: [card] };
      }
    }
  } catch (e) {
    console.error('Failed to generate content', e);
  }

  return { 
    cards: [{
      id: `card-${crypto.randomUUID()}`,
      x: input.x,
      y: input.y,
      width: 340,
      height: 220,
      type: 'text',
      title: '生成失败',
      variantKey: 'error',
      redoOptions: [],
      content: { body: '无法连接到 AI 接口，请重试。' }
    }] 
  };
};
