import { create } from 'zustand';
import { Editor } from '@tldraw/tldraw';
import { ContentBlock, AnchorPoint, Position, Recommendation } from '../types';

interface CanvasState {
  // 画布编辑器
  editor: Editor | null;

  // 锚点状态
  activeAnchor: AnchorPoint | null;
  showRecommendationPanel: boolean;

  // 推荐和选择
  recommendations: Recommendation[];
  selectedRecommendation: Recommendation | null;

  // 内容块
  contentBlocks: ContentBlock[];
  selectedBlockId: string | null;

  // UI状态
  sidebarOpen: boolean;

  // Actions
  setEditor: (editor: Editor) => void;
  createAnchor: (position: Position) => void;
  removeAnchor: () => void;
  showPanel: (recommendations: Recommendation[]) => void;
  hidePanel: () => void;
  selectRecommendation: (recommendation: Recommendation) => void;
  addContentBlock: (block: ContentBlock) => void;
  updateContentBlock: (id: string, updates: Partial<ContentBlock>) => void;
  removeContentBlock: (id: string) => void;
  selectBlock: (id: string | null) => void;
  toggleSidebar: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  editor: null,
  activeAnchor: null,
  showRecommendationPanel: false,
  recommendations: [],
  selectedRecommendation: null,
  contentBlocks: [],
  selectedBlockId: null,
  sidebarOpen: false,

  setEditor: (editor) => set({ editor }),

  createAnchor: (position) => {
    const anchor: AnchorPoint = {
      id: `anchor-${Date.now()}`,
      position,
      createdAt: Date.now(),
    };
    set({ activeAnchor: anchor });
  },

  removeAnchor: () => set({ activeAnchor: null, showRecommendationPanel: false }),

  showPanel: (recommendations) => set({
    recommendations,
    showRecommendationPanel: true,
  }),

  hidePanel: () => set({
    showRecommendationPanel: false,
    recommendations: [],
    selectedRecommendation: null,
  }),

  selectRecommendation: (recommendation) => set({ selectedRecommendation: recommendation }),

  addContentBlock: (block) => set((state) => ({
    contentBlocks: [...state.contentBlocks, block],
  })),

  updateContentBlock: (id, updates) => set((state) => ({
    contentBlocks: state.contentBlocks.map((block) =>
      block.id === id ? { ...block, ...updates } : block
    ),
  })),

  removeContentBlock: (id) => set((state) => ({
    contentBlocks: state.contentBlocks.filter((block) => block.id !== id),
  })),

  selectBlock: (id) => set({ selectedBlockId: id }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));