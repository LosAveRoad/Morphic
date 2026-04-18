type AIAnchorProps = {
  x: number
  y: number
  onClick: () => void
}

export function AIAnchor({ x, y, onClick }: AIAnchorProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute z-20 flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-lg shadow-[0_8px_24px_rgba(15,23,42,0.12)] transition hover:scale-105"
      style={{ left: x, top: y }}
    >
      +
    </button>
  )
}
