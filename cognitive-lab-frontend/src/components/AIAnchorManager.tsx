'use client';

import { useEffect } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { apiClient } from '../lib/api';
import { Position } from '../types';

interface AIAnchorManagerProps {
  editor: any;
}

export default function AIAnchorManager({ editor }: AIAnchorManagerProps) {
  const {
    activeAnchor,
    createAnchor,
    showPanel,
    removeAnchor,
  } = useCanvasStore();

  useEffect(() => {
    if (!editor) return;

    const handleCanvasClick = async (e: any) => {
      if (e.button === 0 && !editor.getSelectedShapes().length) {
        const { x, y } = e.pagePoint;
        const position: Position = { x, y };
        createAnchor(position);

        try {
          const context = {
            nearbyContent: [],
            userHistory: [],
            currentTheme: 'minimal',
          };
          const recommendations = await apiClient.getRecommendations(context);
          showPanel(recommendations);
        } catch (error) {
          console.error('Failed to get recommendations:', error);
          removeAnchor();
        }
      }
    };

    editor.addEventListener('click', handleCanvasClick);

    return () => {
      editor.removeEventListener('click', handleCanvasClick);
    };
  }, [editor, createAnchor, showPanel, removeAnchor]);

  if (!activeAnchor) return null;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: activeAnchor.position.x,
        top: activeAnchor.position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold cursor-pointer animate-breathe pointer-events-auto hover:bg-indigo-700 transition-colors">
        +
      </div>
    </div>
  );
}