'use client';

import { useRef, useState, useCallback } from 'react';
import { Tldraw } from '@tldraw/tldraw';
import { useCanvasStore } from '../store/canvasStore';
import AIAnchorManager from './AIAnchorManager';
import RecommendationPanel from './RecommendationPanel';
import ContentBlockManager from './ContentBlockManager';

export default function CanvasContainer() {
  const editorRef = useRef<any>(null);
  const { setEditor } = useCanvasStore();
  const [camera, setCamera] = useState({ x: 0, y: 0, z: 1 });

  const handleMount = useCallback((editor: any) => {
    editorRef.current = editor;
    setEditor(editor);
    editor.setCurrentTool('select');

    const updateCamera = () => {
      const cam = editor.getCamera();
      setCamera({ x: cam.x, y: cam.y, z: cam.z });
    };
    editor.on('change', updateCamera);
  }, [setEditor]);

  return (
    <div className="w-full h-screen relative">
      <Tldraw
        onMount={handleMount}
        persistenceKey="morphic-canvas"
      >
        <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-gray-200 pointer-events-none">
          <h3 className="text-sm font-semibold text-gray-900">Morphic</h3>
          <p className="text-xs text-gray-600">Double-click canvas to add AI content</p>
        </div>

        <AIAnchorManager editor={editorRef.current} />
        <ContentBlockManager editor={editorRef.current} camera={camera} />
      </Tldraw>

      {/* Panel rendered outside tldraw canvas clipping area */}
      <RecommendationPanel />
    </div>
  );
}
