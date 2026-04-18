'use client';

import React, { useState } from 'react';
import { ContentBlock } from '../../types/content';

interface ConceptCardProps {
  block: ContentBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onDelete: () => void;
  onRegenerate: () => void;
  onUpdatePosition: (position: { x: number; y: number }) => void;
  isDragging: boolean;
}

export default function ConceptCard({
  block,
  isSelected,
  onSelect,
  onDeselect,
  onDelete,
  onRegenerate,
  onUpdatePosition,
  isDragging,
}: ConceptCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const conceptName = block.content?.name || 'Machine Learning';
  const conceptDescription = block.content?.description || 'A subset of AI that enables systems to learn and improve from experience without being explicitly programmed.';
  const conceptExamples = block.content?.examples || [
    'Supervised learning (training with labeled data)',
    'Unsupervised learning (finding patterns in unlabeled data)',
    'Reinforcement learning (learning through rewards)'
  ];
  const keyPoints = block.content?.keyPoints || [
    'Learning from data',
    'Improving performance over time',
    'Making predictions or decisions'
  ];

  const handleLearnMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`p-4 bg-yellow-50 rounded-lg border transition-colors ${
        isSelected ? 'border-yellow-400 ring-2 ring-yellow-300' : 'border-yellow-200'
      } ${isDragging ? 'opacity-80 shadow-lg' : 'shadow-sm'}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-yellow-600 font-medium">💡 Concept</span>
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRegenerate();
            }}
            className="text-xs text-yellow-500 hover:text-yellow-700"
            title="Regenerate"
          >
            ↻
          </button>
        )}
      </div>
      <div className="bg-white rounded p-3 text-sm">
        <div className="text-gray-900 mb-2 font-medium">{conceptName}</div>
        <div className="text-gray-700 text-xs leading-relaxed mb-3">
          {conceptDescription}
        </div>

        {/* Basic info always visible */}
        <div className="mb-3 p-2 bg-yellow-50 rounded border border-yellow-200">
          <div className="text-xs font-medium text-yellow-800 mb-1">Key Points:</div>
          <ul className="text-xs text-yellow-700 space-y-1">
            {keyPoints.map((point: string, index: number) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-yellow-500">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Expandable details */}
        <button
          onClick={handleLearnMore}
          className="w-full px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          {isExpanded ? 'Show Less' : 'Learn More'}
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
            <div className="text-xs font-medium text-gray-800 mb-2">Examples:</div>
            <ul className="text-xs text-gray-700 space-y-1">
              {conceptExamples.map((example: string, index: number) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-gray-500">•</span>
                  <span>{example}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
              <div className="text-xs font-medium text-blue-800 mb-1">Related Concepts:</div>
              <div className="text-xs text-blue-700">
                • Neural Networks • Deep Learning • Data Science
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}