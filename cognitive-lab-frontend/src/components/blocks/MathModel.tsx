'use client';

import React from 'react';
import { ContentBlock } from '../../types/content';

interface MathModelProps {
  block: ContentBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onDelete: () => void;
  onRegenerate: () => void;
  onUpdatePosition: (position: { x: number; y: number }) => void;
  isDragging: boolean;
}

export default function MathModel({
  block,
  isSelected,
  onSelect,
  onDeselect,
  onDelete,
  onRegenerate,
  onUpdatePosition,
  isDragging,
}: MathModelProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle math problem submission
    console.log('Math solution submitted');
  };

  return (
    <div
      className={`p-4 bg-purple-50 rounded-lg border transition-colors ${
        isSelected ? 'border-purple-400 ring-2 ring-purple-300' : 'border-purple-200'
      } ${isDragging ? 'opacity-80 shadow-lg' : 'shadow-sm'}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-purple-600 font-medium">🧮 Math Problem</span>
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRegenerate();
            }}
            className="text-xs text-purple-500 hover:text-purple-700"
            title="Regenerate"
          >
            ↻
          </button>
        )}
      </div>
      <div className="bg-white rounded p-3 text-sm">
        <div className="text-gray-900 mb-2">
          {block.content?.problem || 'Solve for x: 2x + 5 = 13'}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Your answer..."
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}