export type CardType = 'text' | 'outline' | 'hybrid' | 'html'

export type CanvasCard = {
  id: string
  x: number
  y: number
  width: number
  height: number
  type: CardType
  title?: string
  content: Record<string, unknown>
  variantKey: string
  redoOptions: string[]
}
