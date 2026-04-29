'use client';

import React, { useState, useCallback } from 'react';
import { ContentBlock } from '../../types/content';

interface TextCardProps {
  block: ContentBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onDelete: () => void;
  onRegenerate: () => void;
  onUpdatePosition: (position: { x: number; y: number }) => void;
  isDragging: boolean;
}

export default function TextCard({
  block,
  isSelected,
  onSelect,
  onDeselect,
  onDelete,
  onRegenerate,
  onUpdatePosition,
  isDragging,
}: TextCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [textContent, setTextContent] = useState(
    typeof block.content === 'string' ? block.content : ''
  );
  const [iframeHeight, setIframeHeight] = useState(200);

  // Detect if content is HTML
  const isHtml = typeof block.content === 'object' && block.content?.html;
  const htmlCode = isHtml ? (block.content as Record<string, unknown>).html as string : '';
  const displayText = typeof block.content === 'string'
    ? block.content
    : isHtml
      ? ''
      : JSON.stringify(block.content);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextContent(e.target.value);
  };

  const handleContentSave = () => {
    const newContent = textContent.trim();
    if (newContent && newContent !== block.content) {
      onRegenerate();
    }
    setIsEditing(false);
    setTextContent(typeof block.content === 'string' ? block.content : '');
  };

  const handleContentCancel = () => {
    setIsEditing(false);
    setTextContent(typeof block.content === 'string' ? block.content : '');
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) {
      onDeselect();
    } else {
      onSelect();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect();
  };

  const handleIframeLoad = useCallback((e: React.SyntheticEvent<HTMLIFrameElement>) => {
    const doc = (e.target as HTMLIFrameElement).contentDocument;
    if (doc) {
      const height = doc.documentElement.scrollHeight;
      setIframeHeight(Math.min(height + 16, 600));
    }
  }, []);

  return (
    <div
      className={`absolute transition-transform duration-200 ${
        isSelected ? 'z-50 ring-2 ring-indigo-500' : 'z-40'
      }`}
      style={{
        left: block.position.x,
        top: block.position.y,
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      <div className="group relative">
        {isHtml ? (
          /* HTML content rendered in iframe */
          <div className={`rounded-lg border ${
            isSelected ? 'border-indigo-300' : 'border-gray-200'
          } overflow-hidden ${isDragging ? 'shadow-lg' : 'shadow-sm'}`}>
            <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Interactive Widget</span>
              <span className="text-xs text-gray-400">{block.metadata?.createdAt ? new Date(block.metadata.createdAt).toLocaleTimeString() : ''}</span>
            </div>
            <div className="bg-white relative" style={{ width: 400 }}>
              <iframe
                title="AI Generated Widget"
                srcDoc={htmlCode}
                sandbox="allow-scripts allow-same-origin"
                className="w-full border-none pointer-events-auto"
                style={{ minHeight: '160px', height: iframeHeight }}
                onLoad={handleIframeLoad}
              />
              {isDragging && (
                <div className="absolute inset-0 z-10 cursor-grabbing" />
              )}
            </div>
          </div>
        ) : (
          /* Text content */
          <div className={`p-4 min-h-[100px] rounded-lg border ${
            isSelected ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-white'
          } ${isDragging ? 'shadow-lg' : 'shadow-sm'}`}>
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={textContent}
                  onChange={handleContentChange}
                  className="w-full h-24 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                  placeholder="Enter your text here..."
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleContentSave}
                    className="flex-1 px-3 py-2 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleContentCancel}
                    className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                {displayText || 'Click to edit text...'}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {isSelected && !isEditing && (
          <div className="absolute -top-2 -right-2 flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRegenerate();
              }}
              className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-indigo-600 transition-colors shadow-md"
              title="Regenerate"
            >
              ↻
            </button>
            {!isHtml && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600 transition-colors shadow-md"
                title="Edit"
              >
                ✏️
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-md"
              title="Delete"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
