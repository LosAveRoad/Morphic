'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { getMockRecommendations } from '../lib/mock/ai-provider';
import { Position } from '../types/canvas';

interface AIAnchorManagerProps {
  editor: any;
}

export default function AIAnchorManager({ editor }: AIAnchorManagerProps) {
  const {
    activeAnchor,
    createAnchor,
    removeAnchor,
  } = useCanvasStore();

  const editorRef = useRef(editor);
  editorRef.current = editor;

  useEffect(() => {
    if (!editor) return;

    // Listen for dblclick on the tldraw canvas
    const handleDblClick = (info: { currentPagePoint: { x: number; y: number } }) => {
      const position: Position = { x: info.currentPagePoint.x, y: info.currentPagePoint.y };
      createAnchor(position);
    };

    editor.on('double-click', handleDblClick);
    return () => {
      editor.off('double-click', handleDblClick);
    };
  }, [editor, createAnchor]);

  // Also create an initial anchor if none exists
  useEffect(() => {
    if (!activeAnchor && editor) {
      // Place anchor at a default position
      const defaultPos = editor.getViewportScreenCenter
        ? editor.getViewportScreenCenter()
        : { x: 400, y: 300 };
      createAnchor(defaultPos);
    }
  }, [activeAnchor, editor, createAnchor]);

  if (!activeAnchor) return null;

  return (
    <div
      className="absolute z-20"
      style={{
        left: activeAnchor.position.x,
        top: activeAnchor.position.y,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'auto',
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          const store = useCanvasStore.getState();
          const recs = getMockRecommendations('');
          store.showPanel(recs);
        }}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-2xl font-light text-gray-700 shadow-[0_8px_24px_rgba(15,23,42,0.12)] transition hover:scale-110 hover:shadow-[0_12px_32px_rgba(15,23,42,0.18)]"
        title="AI Assistant"
      >
        +
      </button>
    </div>
  );
}
