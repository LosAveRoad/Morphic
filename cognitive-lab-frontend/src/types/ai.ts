import type { CanvasCard } from './cards'

export type Recommendation = {
  id: string
  label: string
  description: string
}

export type GenerateMockInput = {
  prompt: string
  x: number
  y: number
  initialVariant?: string
}

export type GenerateMockResult = {
  cards: CanvasCard[]
}
