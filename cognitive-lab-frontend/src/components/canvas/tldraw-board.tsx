'use client'

import { useMemo } from 'react'
import { Tldraw } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { AIAnchor } from '@/components/ai/ai-anchor'
import { RecommendationPanel } from '@/components/ai/recommendation-panel'
import { getMockRecommendations } from '@/lib/mock/ai-provider'
import { useUiStore } from '@/stores/ui-store'

export function TldrawBoard() {
  const { anchor, panelOpen, prompt, setAnchor, setPanelOpen, setPrompt } = useUiStore()
  const recommendations = useMemo(() => getMockRecommendations(prompt), [prompt])

  return (
    <div
      className="relative h-[calc(100vh-110px)]"
      onDoubleClick={(event) => {
        setAnchor({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY })
        setPanelOpen(false)
      }}
    >
      <Tldraw persistenceKey="cognitive-lab-mvp" />
      {anchor ? (
        <AIAnchor
          x={anchor.x}
          y={anchor.y}
          onClick={() => {
            setPanelOpen(!panelOpen)
          }}
        />
      ) : null}
      {anchor && panelOpen ? (
        <div className="absolute" style={{ left: anchor.x + 20, top: anchor.y + 20 }}>
          <RecommendationPanel
            recommendations={recommendations}
            prompt={prompt}
            onPromptChange={setPrompt}
            onSelect={(id) => {
              setPrompt(recommendations.find((item) => item.id === id)?.label ?? '')
            }}
            onSubmit={() => {}}
          />
        </div>
      ) : null}
    </div>
  )
}
