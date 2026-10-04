/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { Eraser, Pencil } from 'lucide-react';

import { DrawingMode, PEN_COLORS, PEN_WIDTHS, PenSettings } from '@/hooks/useDrawingTool';
import { cn } from '@/lib/utils';

interface DrawingToolsProps {
    drawingMode: DrawingMode;
    onModeChange: (mode: DrawingMode) => void;
    pen: PenSettings;
    onPenChange: (changes: Partial<PenSettings>) => void;
}

const toolButtonClass = (active: boolean, activeClass: string) => cn(
    'p-2 rounded-lg transition-all',
    active ? activeClass : 'text-foreground hover:bg-muted hover:scale-105'
);

export const DrawingTools = ({ drawingMode, onModeChange, pen, onPenChange }: DrawingToolsProps) => (
    <div className="relative flex items-center gap-1">
        {drawingMode === 'pen' && (
            <div
                role="group"
                aria-label="Pencil options"
                className="absolute bottom-full right-0 mb-3 flex items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-xl"
            >
                <div className="flex items-center gap-1.5">
                    {PEN_COLORS.map(option => (
                        <button
                            key={option.color}
                            type="button"
                            onClick={() => onPenChange({ color: option.color })}
                            title={option.label}
                            aria-label={`${option.label} pencil`}
                            aria-pressed={pen.color === option.color}
                            className={cn(
                                'w-5 h-5 rounded-full border transition-transform hover:scale-110',
                                pen.color === option.color ? 'border-primary ring-2 ring-primary/30 ring-offset-1 ring-offset-card' : 'border-transparent'
                            )}
                            style={{ backgroundColor: option.color }}
                        />
                    ))}
                </div>
                <div className="w-px h-5 bg-border" />
                <div className="flex items-center gap-1">
                    {PEN_WIDTHS.map(option => (
                        <button
                            key={option.width}
                            type="button"
                            onClick={() => onPenChange({ width: option.width })}
                            title={`${option.label} line`}
                            aria-label={`${option.label} line`}
                            aria-pressed={pen.width === option.width}
                            className={cn(
                                'w-7 h-7 rounded-md flex items-center justify-center transition-colors',
                                pen.width === option.width ? 'bg-muted' : 'hover:bg-muted/60'
                            )}
                        >
                            <span className="block w-4 rounded-full" style={{ height: option.width, backgroundColor: pen.color }} />
                        </button>
                    ))}
                </div>
            </div>
        )}
        <button
            type="button"
            onClick={() => onModeChange(drawingMode === 'pen' ? 'none' : 'pen')}
            className={toolButtonClass(drawingMode === 'pen', 'bg-muted')}
            style={drawingMode === 'pen' ? { color: pen.color } : undefined}
            title="Pencil"
            aria-pressed={drawingMode === 'pen'}
        >
            <Pencil className="w-4 h-4" />
        </button>
        <button
            type="button"
            onClick={() => onModeChange(drawingMode === 'eraser' ? 'none' : 'eraser')}
            className={toolButtonClass(drawingMode === 'eraser', 'bg-blue-50 dark:bg-blue-950/40 text-blue-500')}
            title="Eraser"
            aria-pressed={drawingMode === 'eraser'}
        >
            <Eraser className="w-4 h-4" />
        </button>
    </div>
);
