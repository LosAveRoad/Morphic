'use client'

import { useState } from 'react'
import type { CanvasCard } from '@/types/cards'

export type GeneratedCardProps = {
  card: CanvasCard
  onRedo: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
  onClose: (id: string) => void
}

export function GeneratedCard({ card, onRedo, onMove, onClose }: GeneratedCardProps) {
  const [isDragging, setIsDragging] = useState(false)

  const body =
      typeof card.content.body === 'string'
        ? card.content.body
        : Array.isArray(card.content.items)
          ? (card.content.items as string[]).join(' · ')
          : 'Mock card content'

  return (
      <article
        className="group absolute z-10 rounded-2xl border border-black/10 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.10)] transition-shadow hover:shadow-[0_20px_40px_rgba(15,23,42,0.15)] flex flex-col pointer-events-auto"
        style={{ left: card.x, top: card.y, width: card.width, minHeight: card.height }}
        onPointerDown={(e) => e.stopPropagation()} // Prevent tldraw from stealing clicks
      >
      <button
        onClick={() => onClose(card.id)}
        className="absolute -right-3 -top-3 hidden h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-gray-500 shadow-sm transition-transform hover:scale-105 hover:text-red-500 group-hover:flex z-20"
        aria-label="Close card"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {/* Drag handle header */}
      <div 
        onPointerDown={(e) => {
          // Only start dragging if left mouse button is pressed
          if (e.button !== 0) return;
          const startX = e.clientX;
          const startY = e.clientY;
          const initialCardX = card.x;
          const initialCardY = card.y;
          
          setIsDragging(true);
          
          const handlePointerMove = (moveEvent: PointerEvent) => {
            // Update position in real-time during drag
            onMove(card.id, initialCardX + (moveEvent.clientX - startX), initialCardY + (moveEvent.clientY - startY));
          };
          
          const handlePointerUp = () => {
            setIsDragging(false);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
          };
          
          window.addEventListener('pointermove', handlePointerMove);
          window.addEventListener('pointerup', handlePointerUp);
        }}
        className="mb-3 flex shrink-0 items-start justify-between gap-3 cursor-move hover:bg-gray-50 p-1 -m-1 rounded-lg transition-colors touch-none"
      >
        <div>
          <h3 className="text-sm font-semibold pointer-events-none">{card.title}</h3>
          <p className="text-xs text-black/35 pointer-events-none">{card.variantKey}</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRedo(card.id);
          }}
          className="rounded-lg border border-black/10 px-2 py-1 text-xs text-black/60 bg-white hover:bg-gray-100 cursor-pointer"
        >
          Redo
        </button>
      </div>
      
      {card.type === 'html' ? (
        <div className="h-full w-full bg-white rounded-md overflow-hidden relative flex-1">
          {/* We use a blob URL or srcDoc to isolate the HTML widget */}
          <iframe
            title={card.title}
            srcDoc={card.content.html as string}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
            className="w-full h-full border-none pointer-events-auto"
          />
          {/* Cover overlay ONLY when actually dragging so iframe doesn't steal pointer events */}
          {isDragging && <div className="absolute inset-0 z-10 cursor-grabbing" />}
        </div>
      ) : (
        <p className="text-sm leading-6 text-black/75 flex-1">{body}</p>
      )}
    </article>
  )
}
