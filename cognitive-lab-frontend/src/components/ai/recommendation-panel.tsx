import type { Recommendation } from '@/types/ai'

type RecommendationPanelProps = {
  recommendations: Recommendation[]
  prompt: string
  onPromptChange: (prompt: string) => void
  onSelect: (id: string) => void
  onSubmit: () => void
}

export function RecommendationPanel({
  recommendations,
  prompt,
  onPromptChange,
  onSelect,
  onSubmit,
}: RecommendationPanelProps) {
  return (
    <div className="absolute z-30 w-[360px] rounded-2xl border border-black/5 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-black/35">Suggestions</p>
      <div className="space-y-2">
        {recommendations.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className="flex w-full flex-col rounded-xl border border-black/5 px-3 py-2 text-left transition hover:bg-black/[0.03]"
          >
            <span className="text-sm font-medium">{item.label}</span>
            <span className="text-xs text-black/45">{item.description}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        <input
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          placeholder="输入一句话，让 AI 帮你整理"
          className="w-full rounded-xl border border-black/10 bg-[#fafaf8] px-3 py-2 text-sm outline-none placeholder:text-black/30"
        />
        <button
          type="button"
          onClick={onSubmit}
          className="w-full rounded-xl bg-[#191919] px-3 py-2 text-sm font-medium text-white"
        >
          生成卡片
        </button>
      </div>
    </div>
  )
}
