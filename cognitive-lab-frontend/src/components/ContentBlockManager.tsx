'use client';

import React, { useCallback, useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { ContentBlock, ContentType } from '../types/content';
import { Position } from '../types/canvas';
import TextCard from './blocks/TextCard';
import PomodoroTimer from './blocks/PomodoroTimer';
import MathModel from './blocks/MathModel';
import AlgorithmVisualizer from './blocks/AlgorithmVisualizer';
import ConceptCard from './blocks/ConceptCard';

interface ContentBlockManagerProps {
  editor: any;
  camera?: { x: number; y: number; z: number };
}

const renderContentByType = (block: ContentBlock, isSelected: boolean, onSelect: () => void, onDeselect: () => void, onDelete: () => void, onRegenerate: () => void, onUpdatePosition: (position: { x: number; y: number }) => void, isDragging: boolean) => {
  const { type } = block;

  switch (type) {
    case 'text':
      return (
        <TextCard
          block={block}
          isSelected={isSelected}
          onSelect={onSelect}
          onDeselect={onDeselect}
          onDelete={onDelete}
          onRegenerate={onRegenerate}
          onUpdatePosition={onUpdatePosition}
          isDragging={isDragging}
        />
      );

    case 'pomodoro':
      return (
        <PomodoroTimer
          block={block}
          isSelected={isSelected}
          onSelect={onSelect}
          onDeselect={onDeselect}
          onDelete={onDelete}
          onRegenerate={onRegenerate}
          onUpdatePosition={onUpdatePosition}
          isDragging={isDragging}
        />
      );

    case 'math':
      return (
        <MathModel
          block={block}
          isSelected={isSelected}
          onSelect={onSelect}
          onDeselect={onDeselect}
          onDelete={onDelete}
          onRegenerate={onRegenerate}
          onUpdatePosition={onUpdatePosition}
          isDragging={isDragging}
        />
      );

    case 'algorithm':
      return (
        <AlgorithmVisualizer
          block={block}
          isSelected={isSelected}
          onSelect={onSelect}
          onDeselect={onDeselect}
          onDelete={onDelete}
          onRegenerate={onRegenerate}
          onUpdatePosition={onUpdatePosition}
          isDragging={isDragging}
        />
      );

    case 'concept':
      return (
        <ConceptCard
          block={block}
          isSelected={isSelected}
          onSelect={onSelect}
          onDeselect={onDeselect}
          onDelete={onDelete}
          onRegenerate={onRegenerate}
          onUpdatePosition={onUpdatePosition}
          isDragging={isDragging}
        />
      );

    default:
      return (
        <div className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
          <div className="text-gray-600">Unknown content type</div>
        </div>
      );
  }
};

export default function ContentBlockManager({ editor, camera }: ContentBlockManagerProps) {
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

  const { x: camX = 0, y: camY = 0, z: camZ = 1 } = camera ?? {};

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

    const deltaX = (e.clientX - dragStartPos.x) / camZ;
    const deltaY = (e.clientY - dragStartPos.y) / camZ;

    const block = contentBlocks.find(b => b.id === selectedBlockId);
    if (block) {
      const newPosition = {
        x: block.position.x + deltaX,
        y: block.position.y + deltaY,
      };

      updateContentBlock(selectedBlockId, { position: newPosition });
      setDragStartPos({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, dragStartPos, selectedBlockId, contentBlocks, updateContentBlock, camZ]);

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

  const handleUpdatePosition = useCallback((blockId: string, position: { x: number; y: number }) => {
    updateContentBlock(blockId, { position });
  }, [updateContentBlock]);

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
      {contentBlocks.map((block) => {
        const isSelected = selectedBlockId === block.id;

        return (
          <div
            key={block.id}
            className={`absolute transition-all duration-200 ${
              isSelected ? 'z-50 ring-2 ring-indigo-500' : 'z-40'
            } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
              left: block.position.x * camZ + camX,
              top: block.position.y * camZ + camY,
              transform: `scale(${camZ})`,
              transformOrigin: 'top left',
              transition: isDragging ? 'none' : 'all 0.2s ease',
            }}
            onClick={(e) => handleBlockClick(e, block.id)}
            onMouseDown={(e) => handleBlockMouseDown(e, block.id)}
          >
            <div className="group relative">
              {renderContentByType(
                block,
                isSelected,
                () => selectBlock(block.id),
                () => selectBlock(null),
                () => handleDeleteBlock({ stopPropagation: () => {} } as React.MouseEvent, block.id),
                () => handleRegenerateBlock({ stopPropagation: () => {} } as React.MouseEvent, block.id),
                (position) => handleUpdatePosition(block.id, position),
                isDragging
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
