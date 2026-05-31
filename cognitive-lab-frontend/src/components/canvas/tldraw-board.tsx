'use client'

import { useEffect, useState, useRef, useCallback, memo } from 'react'
import { Tldraw, useEditor, track, type Editor } from '@tldraw/tldraw'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import '@tldraw/tldraw/tldraw.css'
import { AIAnchor } from '@/components/ai/ai-anchor'
import { RecommendationPanel } from '@/components/ai/recommendation-panel'
import { CardLayer } from '@/components/cards/card-layer'
import { loadCards } from '@/domains/persistence/card-storage'
import { getRealRecommendations, generateRealCardSet } from '@/lib/real/ai-provider'
import { createCardStore } from '@/stores/card-store'
import { useUiStore } from '@/stores/ui-store'
import type { Recommendation } from '@/types/ai'

const cardStore = createCardStore()

// Only updates anchor when selection changes — no continuous pan/zoom tracking
const AnchorTracker = track(function AnchorTracker() {
  const editor = useEditor()
  const setAnchor = useUiStore((state) => state.setAnchor)
  const selectedShapeIds = editor.getSelectedShapeIds()
  const selectionKey = selectedShapeIds.join(',')

  useEffect(() => {
    if (selectedShapeIds.length > 0) {
      const pageBounds = editor.getSelectionPageBounds()
      if (pageBounds) {
        const screenPoint = editor.pageToScreen({
          x: pageBounds.maxX + 20,
          y: pageBounds.minY + pageBounds.height / 2 - 16,
        })
        setAnchor({ x: screenPoint.x, y: screenPoint.y })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, selectionKey, setAnchor])

  return null
})

export function TldrawBoard() {
  const cards = useStore(cardStore, useShallow((state) => state.cards))
  const {
    anchor,
    panelOpen,
    prompt,
    generating,
    loadingRecommendations,
    setAnchor,
    setPanelOpen,
    setPrompt,
    setGenerating,
    setLoadingRecommendations
  } = useUiStore(useShallow((s) => ({
    anchor: s.anchor,
    panelOpen: s.panelOpen,
    prompt: s.prompt,
    generating: s.generating,
    loadingRecommendations: s.loadingRecommendations,
    setAnchor: s.setAnchor,
    setPanelOpen: s.setPanelOpen,
    setPrompt: s.setPrompt,
    setGenerating: s.setGenerating,
    setLoadingRecommendations: s.setLoadingRecommendations,
  })))
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const selectedVariant = useRef<string>('explain')
  const visibleAnchor = anchor ?? { x: 56, y: 56 }
  const editorRef = useRef<Editor | null>(null)

  useEffect(() => {
    const stored = loadCards()
    if (stored.length) {
      cardStore.getState().hydrateCards(stored)
    }
  }, [])

  useEffect(() => {
    if (panelOpen && editorRef.current) {
      setLoadingRecommendations(true)
      const timer = setTimeout(() => {
        getRealRecommendations(editorRef.current!, prompt)
          .then(setRecommendations)
          .finally(() => setLoadingRecommendations(false))
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [prompt, panelOpen, setLoadingRecommendations])

  const generate = useCallback(async (overridePrompt?: string) => {
    if (!editorRef.current) return
    const targetAnchor = anchor ?? { x: 56, y: 56 }
    const finalPrompt = overridePrompt ?? prompt ?? '请解释当前想法'
    setGenerating(true)
    try {
      const result = await generateRealCardSet(editorRef.current, {
        prompt: finalPrompt,
        x: targetAnchor.x + 40,
        y: targetAnchor.y + 40,
        initialVariant: selectedVariant.current,
      })
      cardStore.getState().addCards(result.cards)
      setPanelOpen(false)
      setPrompt('')
    } finally {
      setGenerating(false)
    }
  }, [anchor, prompt, setGenerating, setPanelOpen, setPrompt])

  const handleRedo = useCallback((id: string) => {
    console.log('Redo requested for card:', id)
  }, [])

  const handleMove = useCallback((id: string, x: number, y: number) => {
    cardStore.getState().moveCard(id, x, y)
  }, [])

  const handleClose = useCallback((id: string) => {
    cardStore.getState().removeCard(id)
  }, [])

  const handleSelect = useCallback((id: string) => {
    selectedVariant.current = id
    const label = id // Use the recommendation id as-is; generate will use selectedVariant
    generate(label)
  }, [generate])

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Canvas interaction layer"
      className="relative h-[calc(100vh-110px)]"
      onDoubleClick={(event) => {
        setAnchor({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY })
        setPanelOpen(false)
      }}
    >
      <Tldraw persistenceKey="cognitive-lab-mvp" onMount={(editor) => { editorRef.current = editor }}>
        <AnchorTracker />
      </Tldraw>
      <CardLayer
        cards={cards}
        onRedo={handleRedo}
        onMove={handleMove}
        onClose={handleClose}
      />
      <AIAnchor
        x={visibleAnchor.x}
        y={visibleAnchor.y}
        loading={loadingRecommendations}
        onClick={() => {
          setAnchor(visibleAnchor)
          setPanelOpen(!panelOpen)
        }}
      />
      {panelOpen ? (
        <div className="absolute" style={{ left: visibleAnchor.x + 20, top: visibleAnchor.y + 20 }}>
          <RecommendationPanel
            recommendations={recommendations}
            prompt={prompt}
            loadingRecommendations={loadingRecommendations}
            generating={generating}
            onPromptChange={setPrompt}
            onSelect={handleSelect}
            onSubmit={() => generate()}
          />
        </div>
      ) : null}
    </div>
  )
}
