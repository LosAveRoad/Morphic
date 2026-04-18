import type { GenerateMockInput, GenerateMockResult, Recommendation } from '@/types/ai'
import type { CanvasCard } from '@/types/cards'

const recommendationTemplates: Recommendation[] = [
  { id: 'explain', label: '解释这个概念', description: '生成一张简洁说明卡片' },
  { id: 'outline', label: '整理成提纲', description: '提取关键信息并按层级整理' },
  { id: 'question', label: '生成练习题', description: '给出一个小问题帮助思考' },
  { id: 'rewrite', label: '换一种表达', description: '以另一种说法重新组织内容' },
]

const makeCard = (input: GenerateMockInput, variantKey: string): CanvasCard => {
  const prompt = input.prompt.trim() || '当前想法'
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
        items: [`${prompt} 的核心定义`, `${prompt} 的关键性质`, `${prompt} 的一个直觉解释`],
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
        body: `如果你要向别人解释「${prompt}」，你会先强调哪一部分？`,
        items: ['定义是什么', '为什么重要', '能用在哪'],
      },
    }
  }

  return {
    ...common,
    type: 'text',
    title: '概念解释',
    variantKey,
    content: {
      body: `这是关于「${prompt}」的一段本地 mock 解释内容，用于演示 AI 生成卡片。`,
    },
  }
}

export const getMockRecommendations = (_context: string) => recommendationTemplates

export const generateMockCardSet = (input: GenerateMockInput): GenerateMockResult => ({
  cards: [makeCard(input, input.initialVariant ?? 'explain')],
})

export const redoMockCard = (card: CanvasCard): CanvasCard => {
  const nextVariant = card.redoOptions.find((option) => option !== card.variantKey) ?? 'outline'
  return {
    ...makeCard(
      {
        prompt: typeof card.title === 'string' ? card.title : '当前想法',
        x: card.x,
        y: card.y,
      },
      nextVariant,
    ),
    id: card.id,
    x: card.x,
    y: card.y,
  }
}
