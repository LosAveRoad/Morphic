import { ContentBlock, Recommendation, ContentType } from '../../types/content';
import { Position } from '../../types/canvas';

export interface GenerateMockInput {
  prompt: string;
  x: number;
  y: number;
  initialVariant?: string;
}

export interface GenerateMockResult {
  blocks: ContentBlock[];
}

export function getMockRecommendations(prompt: string): Recommendation[] {
  const base: Recommendation[] = [
    { id: 'explain', text: '解释这个概念', type: 'text', icon: '💡' },
    { id: 'outline', text: '整理成提纲', type: 'text', icon: '📋' },
    { id: 'summarize', text: '总结要点', type: 'text', icon: '📝' },
    { id: 'question', text: '出几道题', type: 'text', icon: '❓' },
  ];

  if (prompt.includes('谱') || prompt.includes('定理')) {
    return [
      { id: 'explain_spectral', text: '解释谱定理', type: 'text', icon: '📖' },
      { id: 'visualize', text: '可视化演示', type: 'concept', icon: '🎨' },
      { id: 'applications', text: '应用场景', type: 'concept', icon: '🔬' },
      { id: 'compare', text: '对比分析', type: 'concept', icon: '⚖️' },
    ];
  }

  return base;
}

export function generateMockCardSet(input: GenerateMockInput): GenerateMockResult {
  const variants: Record<string, { type: ContentType; title: string; body: string; html?: string }> = {
    explain: {
      type: 'text',
      title: '概念解释',
      body: `<h3>${input.prompt}</h3><p>这是一个关于"${input.prompt}"的详细解释。</p>`,
    },
    outline: {
      type: 'text',
      title: '内容提纲',
      body: `<h3>提纲</h3><ul><li>要点一：核心概念定义</li><li>要点二：关键性质</li><li>要点三：应用与扩展</li></ul>`,
    },
    summarize: {
      type: 'text',
      title: '要点总结',
      body: `<h3>核心要点</h3><ol><li>定义与基本概念</li><li>重要性质与推论</li><li>常见误解与边界</li></ol>`,
    },
    question: {
      type: 'text',
      title: '练习题',
      body: `<h3>练习题</h3><p><strong>Q1:</strong> 解释基本概念</p><p><strong>Q2:</strong> 举例说明应用</p><p><strong>Q3:</strong> 分析异同</p>`,
    },
    visualize: {
      type: 'concept',
      title: '交互式演示',
      body: 'Interactive demonstration',
      html: `<div style="padding:16px;font-family:system-ui,sans-serif;max-width:100%;box-sizing:border-box;">
  <h3 style="margin:0 0 12px;font-size:16px;">Counter</h3>
  <div id="counter" style="font-size:32px;font-weight:bold;margin-bottom:12px;">0</div>
  <button onclick="document.getElementById('counter').textContent=parseInt(document.getElementById('counter').textContent)+1"
    style="padding:8px 16px;background:#4F46E5;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;">
    +1
  </button>
  <button onclick="document.getElementById('counter').textContent='0'"
    style="padding:8px 16px;background:#E5E7EB;color:#333;border:none;border-radius:6px;cursor:pointer;font-size:14px;margin-left:8px;">
    Reset
  </button>
</div>`,
    },
  };

  const variant = input.initialVariant && variants[input.initialVariant]
    ? variants[input.initialVariant]
    : variants.explain;

  const block: ContentBlock = {
    id: `block-${globalThis.crypto?.randomUUID() ?? Date.now()}`,
    type: variant.type,
    position: { x: input.x, y: input.y },
    content: variant.html ? { html: variant.html, body: variant.body } : variant.body,
    metadata: {
      createdAt: new Date().toISOString(),
      sessionId: `session-${Date.now()}`,
      variants: Object.values(variants).map(v => v.body),
      currentVariant: 0,
    },
  };

  return { blocks: [block] };
}

export function redoMockCard(block: ContentBlock): ContentBlock {
  const variantKeys = ['outline', 'question', 'visualize', 'explain'];
  // Determine current variant key from content
  const currentKey = block.metadata.currentVariant ?? 0;
  const nextKey = (currentKey + 1) % variantKeys.length;

  const result = generateMockCardSet({
    prompt: 'redo',
    x: block.position.x,
    y: block.position.y,
    initialVariant: variantKeys[nextKey],
  });

  return { ...result.blocks[0], id: block.id, metadata: { ...result.blocks[0].metadata, currentVariant: nextKey } };
}
