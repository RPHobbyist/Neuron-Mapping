/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { ConnectionStyle, LinePattern, LineShape } from '@/types/mindmap';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spline } from 'lucide-react';
import { composeConnectionStyle, parseConnectionStyle, type LineStylePart } from '@/utils/lineStyle';

export interface LineTypeSelectorProps {
    currentStyle: ConnectionStyle;
    onStyleChange: (style: ConnectionStyle, part: LineStylePart) => void;
    label?: string;
    showSubtext?: boolean;
}

const lineShapes: { value: LineShape; label: string; path: string }[] = [
    { value: 'curved', label: 'Curve', path: 'M4 20 Q 12 4, 20 20' },
    { value: 'orthogonal', label: 'Step', path: 'M4 20 L 4 4 L 20 4' },
    { value: 'straight', label: 'Straight', path: 'M4 20 L 20 4' },
];

const linePatterns: { value: LinePattern; label: string; dash?: string }[] = [
    { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed', dash: '4 3' },
    { value: 'dotted', label: 'Dotted', dash: '0.5 3.5' },
];

const LineIcon = ({ path, dash }: { path: string; dash?: string }) => (
    <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray={dash} aria-hidden="true">
        <path d={path} />
    </svg>
);

const keepOpen = (e: Event) => e.preventDefault();

export const LineTypeSelector = ({
    currentStyle,
    onStyleChange,
    label = 'Canvas Line Type',
    showSubtext = true
}: LineTypeSelectorProps) => {
    const current = parseConnectionStyle(currentStyle);
    const change = (part: LineStylePart, next: Partial<typeof current>) =>
        onStyleChange(composeConnectionStyle({ ...current, ...next }), part);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                    title="Change line type"
                >
                    <Spline className="w-4 h-4" />
                    <span className="hidden xl:inline whitespace-nowrap">{label}</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
                {showSubtext && (
                    <div className="px-2 py-1.5 text-[10px] text-muted-foreground border-b mb-1">
                        Changes every line on the canvas
                    </div>
                )}
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground py-1">Shape</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={current.shape} onValueChange={(value) => change('shape', { shape: value as LineShape })}>
                    {lineShapes.map((shape) => (
                        <DropdownMenuRadioItem key={shape.value} value={shape.value} onSelect={keepOpen} className="cursor-pointer gap-3">
                            <LineIcon path={shape.path} />
                            {shape.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground py-1">Pattern</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={current.pattern} onValueChange={(value) => change('pattern', { pattern: value as LinePattern })}>
                    {linePatterns.map((pattern) => (
                        <DropdownMenuRadioItem key={pattern.value} value={pattern.value} onSelect={keepOpen} className="cursor-pointer gap-3">
                            <LineIcon path="M4 12 L 20 12" dash={pattern.dash} />
                            {pattern.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                    checked={current.arrow}
                    onCheckedChange={(checked) => change('arrow', { arrow: checked === true })}
                    onSelect={keepOpen}
                    className="cursor-pointer gap-3"
                >
                    <LineIcon path="M4 12 L 19 12 M 14 7 L 19 12 L 14 17" />
                    Arrowhead at the end
                </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
