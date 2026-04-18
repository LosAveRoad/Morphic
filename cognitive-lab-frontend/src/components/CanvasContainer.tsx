'use client';

import { useRef, useEffect } from 'react';
import { Tldraw } from '@tldraw/tldraw';
import { useCanvasStore } from '../store/canvasStore';
import AIAnchorManager from './AIAnchorManager';
import RecommendationPanel from './RecommendationPanel';
import ContentBlockManager from './ContentBlockManager';

export default function CanvasContainer() {
  const editorRef = useRef<any>(null);
  const { setEditor } = useCanvasStore();

  const handleMount = (editor: any) => {
    editorRef.current = editor;
    setEditor(editor);

    // 设置默认工具
    editor.setCurrentTool('select');

    // 添加欢迎提示
    editor.setToast({
      id: 'welcome',
      title: 'Welcome to Cognitive Lab',
      description: 'Click anywhere to create AI content',
      duration: 3000,
    });
  };

  return (
    <div className="w-full h-screen">
      <Tldraw
        onMount={handleMount}
        persistenceKey="cognitive-lab-canvas"
      >
        {/* 顶部工具栏 */}
        <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Cognitive Lab</h3>
          <p className="text-xs text-gray-600">Click canvas to add AI content</p>
        </div>

        {/* AI Anchor Manager */}
        <AIAnchorManager editor={editorRef.current} />

        {/* Recommendation Panel */}
        <RecommendationPanel />

        {/* Content Block Manager */}
        <ContentBlockManager editor={editorRef.current} />
      </Tldraw>
    </div>
  );
}