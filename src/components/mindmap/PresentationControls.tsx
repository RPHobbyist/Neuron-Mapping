/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { ChevronLeft, ChevronRight, Maximize, Minimize, Pause, Play, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { PLAY_SPEEDS, PlaySpeed, PlayStep } from '@/hooks/usePlayMode';

interface PresentationControlsProps {
  currentStep: number;
  totalSteps: number;
  isPaused: boolean;
  isFinished: boolean;
  speed: PlaySpeed;
  step: PlayStep;
  onStepChange: (step: PlayStep) => void;
  isFullscreen: boolean;
  onSpeedChange: (speed: PlaySpeed) => void;
  onPrevious: () => void;
  onNext: () => void;
  onTogglePause: () => void;
  onToggleFullscreen: () => void;
  onExit: () => void;
}

const STEPS: { value: PlayStep; label: string; hint: string }[] = [
  { value: 'topic', label: 'Topics', hint: 'One topic at a time' },
  { value: 'branch', label: 'Branches', hint: 'A whole branch at a time, like slides' },
];

const buttonClass = 'p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent transition-colors';

export const PresentationControls = ({
  currentStep,
  totalSteps,
  isPaused,
  isFinished,
  speed,
  step,
  onStepChange,
  isFullscreen,
  onSpeedChange,
  onPrevious,
  onNext,
  onTogglePause,
  onToggleFullscreen,
  onExit,
}: PresentationControlsProps) => {
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  const unit = step === 'topic' ? 'topic' : 'step';
  return (
    <div
      role="toolbar"
      aria-label="Presentation"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-full border bg-card/95 backdrop-blur px-2 py-1.5 shadow-xl"
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <button onClick={onPrevious} disabled={currentStep <= 1} className={buttonClass} title={`Previous ${unit} (←)`} aria-label={`Previous ${unit}`}>
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={onTogglePause}
        disabled={isFinished}
        className={buttonClass}
        title={isPaused ? 'Play (P)' : 'Pause (P)'}
        aria-label={isPaused ? 'Play' : 'Pause'}
      >
        {isPaused || isFinished ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
      </button>
      <button onClick={onNext} disabled={isFinished} className={buttonClass} title={`Next ${unit} (→ or Space)`} aria-label={`Next ${unit}`}>
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="flex flex-col items-center gap-1 px-3 min-w-[7rem]">
        <span className="text-xs font-medium text-foreground tabular-nums" aria-live="polite">
          {isFinished ? `All ${totalSteps} ${unit === 'topic' ? 'topics' : 'steps'}` : `${currentStep} of ${totalSteps}`}
        </span>
        <div className="h-1 w-full rounded-full bg-muted overflow-hidden" aria-hidden="true">
          <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex rounded-full bg-muted p-0.5" role="radiogroup" aria-label="Each step shows">
        {STEPS.map(option => (
          <button
            key={option.value}
            role="radio"
            aria-checked={step === option.value}
            onClick={() => onStepChange(option.value)}
            title={option.hint}
            className={cn(
              'px-2 py-1 text-[11px] rounded-full transition-colors',
              step === option.value ? 'bg-card shadow-sm text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex rounded-full bg-muted p-0.5" role="radiogroup" aria-label="Speed">
        {PLAY_SPEEDS.map(option => (
          <button
            key={option.value}
            role="radio"
            aria-checked={speed === option.value}
            onClick={() => onSpeedChange(option.value)}
            className={cn(
              'px-2 py-1 text-[11px] rounded-full transition-colors',
              speed === option.value ? 'bg-card shadow-sm text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <button
        onClick={onToggleFullscreen}
        className={buttonClass}
        title={isFullscreen ? 'Exit full screen (F)' : 'Full screen (F)'}
        aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
      >
        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
      </button>
      <button onClick={onExit} className={buttonClass} title="End the presentation (Esc)" aria-label="End the presentation">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
