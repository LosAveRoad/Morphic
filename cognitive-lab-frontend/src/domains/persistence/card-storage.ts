import type { CanvasCard } from '@/types/cards'

const STORAGE_KEY = 'cognitive-lab-cards'

export const loadCards = (): CanvasCard[] => {
  if (typeof window === 'undefined') return []

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  try {
    return JSON.parse(raw) as CanvasCard[]
  } catch {
    return []
  }
}

export const saveCards = (cards: CanvasCard[]) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
}
