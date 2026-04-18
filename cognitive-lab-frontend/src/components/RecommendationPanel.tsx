'use client';

import { useState, useCallback } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { Recommendation, ContentType } from '../types/content';
import { Position } from '../types/canvas';

const contentTypeConfig = {
  text: { icon: '📝', label: 'Text', color: 'bg-blue-100 text-blue-800' },
  pomodoro: { icon: '🍅', label: 'Pomodoro', color: 'bg-red-100 text-red-800' },
  math: { icon: '🧮', label: 'Math', color: 'bg-purple-100 text-purple-800' },
  algorithm: { icon: '⚙️', label: 'Algorithm', color: 'bg-green-100 text-green-800' },
  concept: { icon: '💡', label: 'Concept', color: 'bg-yellow-100 text-yellow-800' },
};

export default function RecommendationPanel() {
  const {
    activeAnchor,
    recommendations,
    showRecommendationPanel,
    selectedRecommendation,
    selectRecommendation,
    hidePanel,
    addContentBlock,
  } = useCanvasStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ContentType | 'all'>('all');

  const filteredRecommendations = recommendations.filter(rec => {
    const matchesSearch = rec.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || rec.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleRecommendationClick = useCallback((recommendation: Recommendation) => {
    selectRecommendation(recommendation);

    const newBlock = {
      id: `block-${Date.now()}`,
      type: recommendation.type,
      position: activeAnchor!.position,
      content: recommendation.text,
      metadata: {
        createdAt: new Date().toISOString(),
        sessionId: 'current-session',
        variants: [recommendation.text],
        currentVariant: 0,
      },
    };

    addContentBlock(newBlock);
    hidePanel();
  }, [activeAnchor, selectRecommendation, addContentBlock, hidePanel]);

  if (!showRecommendationPanel || !activeAnchor) return null;

  return (
    <div className="absolute z-50" style={{
      left: activeAnchor.position.x + 20,
      top: activeAnchor.position.y,
      transform: 'translateY(-50%)',
    }}>
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-80 max-h-96 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
            <button
              onClick={hidePanel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search recommendations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filterType === 'all'
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {Object.entries(contentTypeConfig).map(([type, config]) => (
              <button
                key={type}
                onClick={() => setFilterType(type as ContentType)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filterType === type
                    ? `${config.color} border border-gray-300`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {config.icon} {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recommendations List */}
        <div className="overflow-y-auto max-h-64">
          {filteredRecommendations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              {searchQuery || filterType !== 'all'
                ? 'No recommendations match your filters'
                : 'No recommendations available'}
            </div>
          ) : (
            filteredRecommendations.map((recommendation) => {
              const config = contentTypeConfig[recommendation.type];
              return (
                <div
                  key={recommendation.id}
                  onClick={() => handleRecommendationClick(recommendation)}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedRecommendation?.id === recommendation.id
                      ? 'bg-indigo-50 border-l-4 border-l-indigo-500'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${config.color}`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-600 mb-1">
                        {config.label}
                      </div>
                      <p className="text-sm text-gray-900 leading-relaxed break-words">
                        {recommendation.text}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Click any recommendation to add it to your canvas
          </p>
        </div>
      </div>
    </div>
  );
}