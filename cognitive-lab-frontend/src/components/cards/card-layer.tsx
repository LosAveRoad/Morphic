'use client'

import { GeneratedCard } from './generated-card'
import type { CanvasCard } from '@/types/cards'

export interface CardLayerProps {
  cards: CanvasCard[]
  onRedo: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
  onClose: (id: string) => void
}

export function CardLayer({ cards, onRedo, onMove, onClose }: CardLayerProps) {
  return (
    <>
      {cards.map((card) => (
        <GeneratedCard
          key={card.id}
          card={card}
          onRedo={onRedo}
          onMove={onMove}
          onClose={onClose}
        />
      ))}
    </>
  )
}
