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
