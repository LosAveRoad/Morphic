import { createStore } from 'zustand/vanilla'
import debounce from 'lodash.debounce'
import { saveCards } from '@/domains/persistence/card-storage'
import type { CanvasCard } from '@/types/cards'

export type CardState = {
  cards: CanvasCard[]
  addCards: (cards: CanvasCard[]) => void
  hydrateCards: (cards: CanvasCard[]) => void
  moveCard: (id: string, x: number, y: number) => void
  replaceCard: (id: string, card: CanvasCard) => void
  removeCard: (id: string) => void
  clearCards: () => void
}

export const createCardStore = () => {
  const store = createStore<CardState>((set) => ({
    cards: [],
    addCards: (cards) => set((state) => ({ cards: [...state.cards, ...cards] })),
    hydrateCards: (cards) => set({ cards }),
    moveCard: (id, x, y) =>
      set((state) => ({
        cards: state.cards.map((card) => (card.id === id ? { ...card, x, y } : card)),
      })),
    replaceCard: (id, card) =>
      set((state) => ({
        cards: state.cards.map((item) => (item.id === id ? card : item)),
      })),
    removeCard: (id) =>
      set((state) => ({
        cards: state.cards.filter((card) => card.id !== id),
      })),
    clearCards: () => set({ cards: [] }),
  }))

  const debouncedSave = debounce((cards) => saveCards(cards), 500)

  store.subscribe((state) => {
    debouncedSave(state.cards)
  })

  return store
}
