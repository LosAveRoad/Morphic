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
        type: 'text' as const,
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
