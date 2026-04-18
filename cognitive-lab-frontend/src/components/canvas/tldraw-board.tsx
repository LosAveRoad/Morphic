'use client'

import { useEffect, useState, useRef } from 'react'
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

// This inner component runs inside the Tldraw context, so we can access the editor instance
const AnchorTracker = track(function AnchorTracker() {
  const editor = useEditor()
  const setAnchor = useUiStore((state) => state.setAnchor)

  // Use track from tldraw to reactively re-render when these values change
  const selectedShapeIds = editor.getSelectedShapeIds()

  useEffect(() => {
    if (selectedShapeIds.length > 0) {
      const pageBounds = editor.getSelectionPageBounds()
      if (pageBounds) {
        // Position on the right side of the bounding box, centered vertically
        const targetPagePoint = {
          x: pageBounds.maxX + 20,
          y: pageBounds.minY + pageBounds.height / 2 - 16,
        }
        const screenPoint = editor.pageToScreen(targetPagePoint)
        setAnchor({ x: screenPoint.x, y: screenPoint.y })
      }
    }
  }, [editor, selectedShapeIds, setAnchor])

  // Also need to update when camera (pan/zoom) changes while something is selected
  useEffect(() => {
    const handleCameraChange = () => {
      const currentSelected = editor.getSelectedShapeIds()
      if (currentSelected.length > 0) {
        const pageBounds = editor.getSelectionPageBounds()
        if (pageBounds) {
          const targetPagePoint = {
            x: pageBounds.maxX + 20,
            y: pageBounds.minY + pageBounds.height / 2 - 16,
          }
          const screenPoint = editor.pageToScreen(targetPagePoint)
          setAnchor({ x: screenPoint.x, y: screenPoint.y })
        }
      }
    }
    
    editor.on('change', handleCameraChange)
    return () => {
      editor.off('change', handleCameraChange)
    }
  }, [editor, setAnchor])

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
  } = useUiStore()
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
      }, 500) // Debounce 500ms
      return () => clearTimeout(timer)
    }
  }, [prompt, panelOpen, setLoadingRecommendations])

  const generate = async () => {
    if (!editorRef.current) return
    const targetAnchor = anchor ?? visibleAnchor
    setGenerating(true)
    try {
      const result = await generateRealCardSet(editorRef.current, {
        prompt: prompt || '请解释当前想法',
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
  }

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
        onRedo={(id) => {
          const card = cards.find((item) => item.id === id)
          if (!card) return
          // TODO: Implement real redo logic here using generateRealCardSet
          console.log('Redo requested for card:', card.id)
        }}
        onMove={(id, x, y) => {
          cardStore.getState().moveCard(id, x, y)
        }}
        onClose={(id) => cardStore.getState().removeCard(id)}
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
            onSelect={(id) => {
              selectedVariant.current = id
              setPrompt(recommendations.find((item) => item.id === id)?.label ?? prompt)
              generate()
            }}
            onSubmit={generate}
          />
        </div>
      ) : null}
    </div>
  )
}
