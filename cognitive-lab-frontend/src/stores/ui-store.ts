import { create } from 'zustand'

type AnchorPoint = {
  x: number
  y: number
}

type UiState = {
  anchor: AnchorPoint | null
  panelOpen: boolean
  prompt: string
  generating: boolean
  setAnchor: (anchor: AnchorPoint | null) => void
  setPanelOpen: (panelOpen: boolean) => void
  setPrompt: (prompt: string) => void
  setGenerating: (generating: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  anchor: null,
  panelOpen: false,
  prompt: '',
  generating: false,
  setAnchor: (anchor) => set({ anchor }),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  setPrompt: (prompt) => set({ prompt }),
  setGenerating: (generating) => set({ generating }),
}))
