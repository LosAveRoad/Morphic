import type { Recommendation } from '@/types/ai'

type RecommendationPanelProps = {
  recommendations: Recommendation[]
  prompt: string
  loadingRecommendations: boolean
  generating: boolean
  onPromptChange: (prompt: string) => void
  onSelect: (id: string) => void
  onSubmit: () => void
}

export function RecommendationPanel({
  recommendations,
  prompt,
  loadingRecommendations,
  generating,
  onPromptChange,
  onSelect,
  onSubmit,
}: RecommendationPanelProps) {
  // Use a stable key mapping for items missing an id
  const safeRecommendations = recommendations.map((item, index) => ({
    ...item,
    safeId: item.id || `rec-safe-${index}-${item.label}`
  }))

  return (
    <div className="absolute z-30 w-[420px] transition-all duration-300 pointer-events-none">
      <div className="relative min-h-[120px] pointer-events-auto flex flex-col items-start gap-4 p-4">
        {generating ? (
          <div className="flex h-[120px] w-[360px] flex-col items-center justify-center space-y-4 rounded-2xl border border-black/5 bg-white py-4 text-center shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
            <div className="relative h-10 w-10">
              <div className="absolute h-10 w-10 animate-ping rounded-full bg-black/5"></div>
              <div className="absolute flex h-10 w-10 animate-spin items-center justify-center rounded-full border-2 border-black/10 border-t-black"></div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium animate-pulse text-black/70">正在整理你的灵感...</p>
              <p className="text-[10px] text-black/40">通常需要 3-5 秒</p>
            </div>
          </div>
        ) : loadingRecommendations ? (
          <div className="space-y-3 w-[280px]">
            {[1, 2, 3].map((i) => (
              <div 
                key={`loading-${i}`} 
                className="h-[64px] w-full animate-pulse rounded-2xl bg-white/80 border border-black/5 shadow-md backdrop-blur-sm"
                style={{
                  transform: `translateX(${i * 12}px)`,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3 w-[280px]">
            {safeRecommendations.slice(0, 3).map((item, index) => (
              <button
                key={item.safeId}
                type="button"
                onClick={() => onSelect(item.id || item.safeId)}
                className="group flex w-full flex-col rounded-2xl border border-black/5 bg-white/90 px-4 py-3 text-left shadow-md backdrop-blur-sm transition-all hover:bg-white hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]"
                style={{
                  transform: `translateX(${index * 12}px)`,
                  animation: `slideIn 0.3s ease-out ${index * 0.1}s both`
                }}
              >
                <span className="text-sm font-medium flex items-center justify-between">
                  {item.label}
                  <span className="opacity-0 transition-opacity group-hover:opacity-100 text-black/30">→</span>
                </span>
                <span className="text-xs text-black/45 mt-1">{item.description}</span>
              </button>
            ))}
          </div>
        )}

        {!generating && (
          <div className="mt-2 w-[360px] rounded-2xl border border-black/5 bg-white p-3 shadow-lg">
            <input
              value={prompt}
              autoFocus
              onChange={(event) => onPromptChange(event.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
              placeholder="输入一句话，让 AI 帮你整理"
              className="w-full rounded-xl border border-black/10 bg-[#fafaf8] px-3 py-2 text-sm outline-none transition-all focus:border-black/20 focus:bg-white placeholder:text-black/30"
            />
            <button
              type="button"
              onClick={onSubmit}
              disabled={!prompt.trim() || loadingRecommendations}
              className="mt-2 flex w-full items-center justify-center rounded-xl bg-[#191919] px-3 py-2 text-sm font-medium text-white transition-all hover:bg-[#333] active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
            >
              生成卡片
            </button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px) translateY(10px); }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

