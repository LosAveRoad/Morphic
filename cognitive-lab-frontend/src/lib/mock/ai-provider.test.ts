import { generateMockCardSet, getMockRecommendations, redoMockCard } from './ai-provider'

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
