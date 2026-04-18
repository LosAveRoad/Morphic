'use client';

import React, { useCallback, useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { ContentBlock, ContentType } from '../types/content';
import { Position } from '../types';

interface ContentBlockManagerProps {
  editor: any;
}

const renderContentByType = (block: ContentBlock) => {
  const { type, content } = block;

  switch (type) {
    case 'text':
      return (
        <div className="p-4 min-h-[100px] bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-gray-900 leading-relaxed">{content}</div>
        </div>
      );

    case 'pomodoro':
      return (
        <div className="p-4 bg-red-50 rounded-lg shadow-sm border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-600 font-medium">🍅 Pomodoro Timer</span>
          </div>
          <div className="bg-white rounded p-2 text-center">
            <div className="text-sm text-gray-600">25:00</div>
            <button className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors">
              Start
            </button>
          </div>
        </div>
      );

    case 'math':
      return (
        <div className="p-4 bg-purple-50 rounded-lg shadow-sm border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-600 font-medium">🧮 Math Problem</span>
          </div>
          <div className="bg-white rounded p-3 text-sm">
            <div className="text-gray-900 mb-2">Solve for x: 2x + 5 = 13</div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Your answer..."
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <button className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors">
                Submit
              </button>
            </div>
          </div>
        </div>
      );

    case 'algorithm':
      return (
        <div className="p-4 bg-green-50 rounded-lg shadow-sm border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600 font-medium">⚙️ Algorithm</span>
          </div>
          <div className="bg-white rounded p-3 text-sm">
            <div className="text-gray-900 mb-2">Bubble Sort</div>
            <pre className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
              {`for i = 0 to n-1
  for j = 0 to n-i-2
    if arr[j] > arr[j+1]
      swap(arr[j], arr[j+1])`}
            </pre>
            <button className="mt-2 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors">
              Run
            </button>
          </div>
        </div>
      );

    case 'concept':
      return (
        <div className="p-4 bg-yellow-50 rounded-lg shadow-sm border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-600 font-medium">💡 Concept</span>
          </div>
          <div className="bg-white rounded p-3 text-sm">
            <div className="text-gray-900 mb-2">Machine Learning</div>
            <div className="text-gray-700 text-xs leading-relaxed">
              A subset of AI that enables systems to learn and improve from experience without being explicitly programmed.
            </div>
            <button className="mt-2 px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      );

    default:
      return (
        <div className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
          <div className="text-gray-600">Unknown content type</div>
        </div>
      );
  }
};

export default function ContentBlockManager({ editor }: ContentBlockManagerProps) {
  const {
    contentBlocks,
    selectedBlockId,
    selectedRecommendation,
    selectBlock,
    removeContentBlock,
    updateContentBlock,
  } = useCanvasStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<Position | null>(null);

  const handleBlockClick = useCallback((e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    selectBlock(blockId);
  }, [selectBlock]);

  const handleBlockMouseDown = useCallback((e: React.MouseEvent, blockId: string) => {
    e.preventDefault();
    const block = contentBlocks.find(b => b.id === blockId);
    if (block) {
      setIsDragging(true);
      setDragStartPos({ x: e.clientX, y: e.clientY });
      selectBlock(blockId);
    }
  }, [contentBlocks, selectBlock]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStartPos || !selectedBlockId) return;

    const deltaX = e.clientX - dragStartPos.x;
    const deltaY = e.clientY - dragStartPos.y;

    const block = contentBlocks.find(b => b.id === selectedBlockId);
    if (block) {
      const newPosition = {
        x: block.position.x + deltaX,
        y: block.position.y + deltaY,
      };

      updateContentBlock(selectedBlockId, { position: newPosition });
      setDragStartPos({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, dragStartPos, selectedBlockId, contentBlocks, updateContentBlock]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStartPos(null);
  }, []);

  const handleDeleteBlock = useCallback((e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    removeContentBlock(blockId);
    if (selectedBlockId === blockId) {
      selectBlock(null);
    }
  }, [selectedBlockId, removeContentBlock, selectBlock]);

  const handleRegenerateBlock = useCallback(async (e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    try {
      // This would call the API to regenerate content
      // For now, just rotate to next variant
      const block = contentBlocks.find(b => b.id === blockId);
      if (block) {
        const nextVariant = (block.metadata.currentVariant + 1) % block.metadata.variants.length;
        const newContent = block.metadata.variants[nextVariant];

        updateContentBlock(blockId, {
          content: newContent,
          metadata: {
            ...block.metadata,
            currentVariant: nextVariant,
          }
        });
      }
    } catch (error) {
      console.error('Failed to regenerate content:', error);
    }
  }, [contentBlocks, updateContentBlock]);

  // Event listeners for drag and drop
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!editor) return null;

  return (
    <>
      {contentBlocks.map((block) => (
        <div
          key={block.id}
          className={`absolute transition-transform duration-200 ${
            selectedBlockId === block.id ? 'z-50 ring-2 ring-indigo-500' : 'z-40'
          }`}
          style={{
            left: block.position.x,
            top: block.position.y,
            transform: selectedBlockId === block.id ? 'scale(1.02)' : 'scale(1)',
          }}
          onClick={(e) => handleBlockClick(e, block.id)}
          onMouseDown={(e) => handleBlockMouseDown(e, block.id)}
        >
          <div className="group relative">
            {renderContentByType(block)}

            {/* Action buttons */}
            {selectedBlockId === block.id && (
              <div className="absolute -top-2 -right-2 flex gap-1">
                <button
                  onClick={(e) => handleRegenerateBlock(e, block.id)}
                  className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-indigo-600 transition-colors shadow-md"
                  title="Regenerate"
                >
                  ↻
                </button>
                <button
                  onClick={(e) => handleDeleteBlock(e, block.id)}
                  className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-md"
                  title="Delete"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}