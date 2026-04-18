import { clsx } from 'clsx'

type AIAnchorProps = {
  x: number
  y: number
  loading?: boolean
  onClick: () => void
}

export function AIAnchor({ x, y, loading, onClick }: AIAnchorProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "absolute z-20 flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-lg transition-all duration-300",
        loading 
          ? "scale-110 shadow-[0_0_0_4px_rgba(0,0,0,0.05)] animate-pulse" 
          : "hover:scale-110 shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
      )}
      style={{ left: x, top: y }}
    >
      <span className={clsx("transition-opacity", loading ? "opacity-50 animate-ping absolute" : "opacity-100")}>+</span>
      {loading && <span className="absolute text-sm font-medium text-black">✨</span>}
      {!loading && <span>+</span>}
    </button>
  )
}
