import { createStore } from 'zustand/vanilla'
import type { CanvasCard } from '@/types/cards'

type CardState = {
  cards: CanvasCard[]
  addCards: (cards: CanvasCard[]) => void
  hydrateCards: (cards: CanvasCard[]) => void
  moveCard: (id: string, x: number, y: number) => void
  replaceCard: (id: string, card: CanvasCard) => void
  clearCards: () => void
}

export const createCardStore = () =>
  createStore<CardState>((set) => ({
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
    clearCards: () => set({ cards: [] }),
  }))
