'use client';

import React, { useState } from 'react';
import { ContentBlock } from '../../types/content';

interface AlgorithmVisualizerProps {
  block: ContentBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onDelete: () => void;
  onRegenerate: () => void;
  onUpdatePosition: (position: { x: number; y: number }) => void;
  isDragging: boolean;
}

export default function AlgorithmVisualizer({
  block,
  isSelected,
  onSelect,
  onDeselect,
  onDelete,
  onRegenerate,
  onUpdatePosition,
  isDragging,
}: AlgorithmVisualizerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const algorithmCode = block.content?.code || `for i = 0 to n-1
  for j = 0 to n-i-2
    if arr[j] > arr[j+1]
      swap(arr[j], arr[j+1])`;

  const algorithmName = block.content?.name || 'Bubble Sort';
  const algorithmDescription = block.content?.description || 'A simple sorting algorithm that repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.';

  const handleRun = () => {
    setIsRunning(true);
    setCurrentStep(0);

    // Simulate algorithm execution
    const steps = algorithmCode.split('\n').length;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      setCurrentStep(step);
      if (step >= steps) {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, 500);
  };

  return (
    <div
      className={`p-4 bg-green-50 rounded-lg border transition-colors ${
        isSelected ? 'border-green-400 ring-2 ring-green-300' : 'border-green-200'
      } ${isDragging ? 'opacity-80 shadow-lg' : 'shadow-sm'}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-green-600 font-medium">⚙️ Algorithm</span>
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRegenerate();
            }}
            className="text-xs text-green-500 hover:text-green-700"
            title="Regenerate"
          >
            ↻
          </button>
        )}
      </div>
      <div className="bg-white rounded p-3 text-sm">
        <div className="text-gray-900 mb-2 font-medium">{algorithmName}</div>
        <div className="text-gray-700 text-xs mb-3 leading-relaxed">
          {algorithmDescription}
        </div>
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-600">Code:</span>
            {isRunning && (
              <span className="text-xs text-green-600">
                Step {currentStep} of {algorithmCode.split('\n').length}
              </span>
            )}
          </div>
          <pre className={`text-xs text-gray-700 bg-gray-50 p-2 rounded border overflow-x-auto ${
            isRunning ? 'border-green-300' : 'border-gray-200'
          }`}>
            {algorithmCode.split('\n').map((line: string, index: number) => (
              <div
                key={index}
                className={`${
                  isRunning && index < currentStep ? 'text-green-600' :
                  isRunning && index === currentStep ? 'text-blue-600 font-medium' :
                  'text-gray-700'
                }`}
              >
                {line}
              </div>
            ))}
          </pre>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRun();
          }}
          disabled={isRunning}
          className={`w-full px-3 py-1 rounded text-sm transition-colors focus:outline-none focus:ring-2 ${
            isRunning
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500'
          }`}
        >
          {isRunning ? 'Running...' : 'Run Algorithm'}
        </button>
      </div>
    </div>
  );
}