'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ContentBlock } from '../../types/content';

interface PomodoroTimerProps {
  block: ContentBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onDelete: () => void;
  onRegenerate: () => void;
  onUpdatePosition: (position: { x: number; y: number }) => void;
  isDragging: boolean;
}

const POMODORO_DURATION = 25 * 60; // 25 minutes in seconds
const BREAK_DURATION = 5 * 60; // 5 minutes in seconds

export default function PomodoroTimer({
  block,
  isSelected,
  onSelect,
  onDeselect,
  onDelete,
  onRegenerate,
  onUpdatePosition,
  isDragging,
}: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(POMODORO_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  // Format time for display (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Timer completed
      if (isBreak) {
        // Break finished, start next pomodoro
        setIsBreak(false);
        setTimeLeft(POMODORO_DURATION);
        playNotification();
      } else {
        // Pomodoro finished, start break
        setIsBreak(true);
        setTimeLeft(BREAK_DURATION);
        setSessionCount((prev) => prev + 1);
        playNotification();
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, isBreak]);

  const playNotification = () => {
    // Create a simple notification sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Failed to play notification:', error);
    }
  };

  const handleStartPause = useCallback(() => {
    setIsActive(!isActive);
  }, [isActive]);

  const handleReset = useCallback(() => {
    setIsActive(false);
    setTimeLeft(isBreak ? BREAK_DURATION : POMODORO_DURATION);
  }, [isBreak]);

  const handleSkip = useCallback(() => {
    if (isBreak) {
      setIsBreak(false);
      setTimeLeft(POMODORO_DURATION);
    } else {
      setIsBreak(true);
      setTimeLeft(BREAK_DURATION);
    }
    setIsActive(false);
  }, [isBreak]);

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

  const getTimeLabel = () => {
    if (isBreak) return 'Break Time';
    if (sessionCount === 0) return 'Pomodoro #1';
    return `Pomodoro #${sessionCount + 1}`;
  };

  const getCircularProgress = () => {
    const totalTime = isBreak ? BREAK_DURATION : POMODORO_DURATION;
    const progress = ((totalTime - timeLeft) / totalTime) * 283; // 283 is the circumference
    return progress;
  };

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
        {/* Pomodoro Timer */}
        <div className={`p-4 rounded-lg border ${
          isSelected ? 'border-red-300 bg-red-50' : 'border-red-200 bg-red-50'
        } ${isDragging ? 'shadow-lg' : 'shadow-sm'}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-red-600 font-medium">🍅 Pomodoro Timer</span>
            <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-full">
              {getTimeLabel()}
            </span>
          </div>

          {/* Circular Progress */}
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#fee2e2"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#ef4444"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="283"
                strokeDashoffset={283 - getCircularProgress()}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {isBreak ? 'Break' : 'Focus'}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-2">
            <button
              onClick={handleStartPause}
              className={`w-full py-2 rounded-lg font-medium text-sm transition-colors ${
                isActive
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isActive ? '⏸ Pause' : '▶ Start'}
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleSkip}
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                ⏭ Skip
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
              >
                🔄 Reset
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {isSelected && (
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