/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { ConnectionStyle, LinePattern, LineShape, LineThickness, NodeColor, NodeShape, NodePriority, NodeStatus, NodeTask, NodeAnimation, TextAlign, TextHeading, TextList, TextFont } from '@/types/mindmap';
import { Spline, Minus, Equal, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, Pilcrow, Heading1, Heading2, Heading3, List, ListOrdered, Palette, Type, GripHorizontal, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ArrowLeftRight, ArrowUpDown, MoveHorizontal, MoveVertical, Activity, Shapes, AlertCircle, ListChecks, SquareCheck, CalendarDays, Eye, EyeOff, Tag, Trash2, Paintbrush, PaintRoller, Plus, X, AArrowDown, AArrowUp, ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ArrowPointing } from '@/utils/common';
import { statusOptions } from '@/utils/nodeStyles';
import {
    InlineFormatCommand, TEXT_FONTS, TEXT_SIZES, DEFAULT_TEXT_SIZE, HEADING_SIZES,
    applyInlineFormat, applySelectionFont, applySelectionHeading, applySelectionSize,
    getFontStack, isSelectionInEditor, stepTextSize,
} from '@/utils/richText';
import { useEditorSelectionFormat } from '@/hooks/useEditorSelectionFormat';
import { getCustomColors, saveCustomColors, withCustomColor } from '@/utils/customColors';
import { getOpenSections, saveOpenSections, toggleSection, SHORT_SCREEN_HEIGHT } from '@/utils/panelSections';
import { ColorPicker } from './ColorPicker';
import { lineShapeOf, linePatternOf, parseConnectionStyle } from '@/utils/lineStyle';
import { TagEditor } from './TagEditor';

export interface LineSettings {
    type?: ConnectionStyle;
    pattern?: LinePattern;
    thickness?: LineThickness;
    color?: string;
    label?: string;
    animated?: boolean;
    gradient?: boolean;
    tension?: number;
    animationDirection?: 'forward' | 'reverse';
    animationType?: 'dash' | 'arrow' | 'cross';
    arrowDirection?: 'none' | 'forward' | 'reverse' | 'both';
}

export interface LineArrowPointing {
    start: ArrowPointing;
    end: ArrowPointing;
}

export interface NodeSettings {
    color?: NodeColor;
    shape?: NodeShape;
    priority?: NodePriority;
    status?: NodeStatus;
    task?: NodeTask;
    dueDate?: string;
    lineType?: ConnectionStyle;
    linePattern?: LinePattern;
    lineArrowDirection?: 'none' | 'forward' | 'reverse' | 'both';
    nodeAnimation?: NodeAnimation;
    icon?: string;
    iconStyle?: 'plain' | 'boxed';
    textBold?: boolean;
    textItalic?: boolean;
    textUnderline?: boolean;
    textStrike?: boolean;
    textAlign?: TextAlign;
    textHeading?: TextHeading;
    textList?: TextList;
    textSize?: number;
    textFont?: TextFont;
}

interface PropertiesPanelProps {
    mode: 'line' | 'node';
    position?: { x: number; y: number };
    anchorWidth?: number;
    topInset?: number;
    selectionCount?: number;
    mixed?: ReadonlySet<keyof NodeSettings>;

    lineValues?: LineSettings;
    lineArrowPointing?: LineArrowPointing;
    onLineUpdate?: (updates: Partial<LineSettings>) => void;
    onLineUpdateLive?: (updates: Partial<LineSettings>) => void;

    nodeValues?: NodeSettings;
    onNodeUpdate?: (updates: Partial<NodeSettings>) => void;
    onNodeUpdateLive?: (updates: Partial<NodeSettings>) => void;
    tags?: string[];
    tagSuggestions?: string[];
    onAddTag?: (tag: string) => void;
    onRemoveTag?: (tag: string) => void;
    onDelete?: () => void;
    onCopyStyle?: () => void;
    onPasteStyle?: () => void;
    taskTotals?: { done: number; total: number };
    hideDoneTasks?: boolean;
    onToggleHideDoneTasks?: () => void;

    onLiveEditStart?: () => void;

    onClose: () => void;
    is3DMode?: boolean;
}

const lineShapes: { value: LineShape; label: string }[] = [
    { value: 'curved', label: 'Curve' },
    { value: 'orthogonal', label: 'Step' },
    { value: 'straight', label: 'Straight' },
];

const linePatterns: { value: LinePattern; label: string }[] = [
    { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'dotted', label: 'Dotted' },
];

const PatternSwatch = ({ pattern }: { pattern: LinePattern }) => (
    <svg width="16" height="4" viewBox="0 0 16 4" className="flex-shrink-0" aria-hidden="true">
        <line
            x1="2" y1="2" x2="14" y2="2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={pattern === 'dashed' ? '4 3' : pattern === 'dotted' ? '0 4' : undefined}
        />
    </svg>
);

const arrowheadOptions: { value: NonNullable<LineSettings['arrowDirection']>; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'forward', label: 'End' },
    { value: 'reverse', label: 'Start' },
    { value: 'both', label: 'Both' },
];

const POINTING_ICONS: Record<ArrowPointing, LucideIcon> = { right: ArrowRight, left: ArrowLeft, down: ArrowDown, up: ArrowUp };

const DEFAULT_ARROW_POINTING: LineArrowPointing = { start: 'left', end: 'right' };

function getArrowheadIcon(value: NonNullable<LineSettings['arrowDirection']>, pointing: LineArrowPointing): React.ReactNode {
    const vertical = pointing.end === 'up' || pointing.end === 'down';
    const Icon = value === 'forward' ? POINTING_ICONS[pointing.end]
        : value === 'reverse' ? POINTING_ICONS[pointing.start]
        : value === 'both' ? (vertical ? ArrowUpDown : ArrowLeftRight)
        : (vertical ? MoveVertical : MoveHorizontal);
    return <Icon className="w-3.5 h-3.5" />;
}

const thicknessOptions: { value: LineThickness; label: string; icon: React.ReactNode }[] = [
    { value: 'thin', label: 'Thin', icon: <Minus className="w-4 h-4" /> },
    { value: 'medium', label: 'Medium', icon: <Equal className="w-4 h-4" /> },
    { value: 'thick', label: 'Thick', icon: <Bold className="w-4 h-4" /> },
];

const lineColorOptions: { color: string; label: string }[] = [
    { color: '#ef4444', label: 'Red' },
    { color: '#f97316', label: 'Orange' },
    { color: '#f59e0b', label: 'Amber' },
    { color: '#eab308', label: 'Yellow' },
    { color: '#84cc16', label: 'Lime' },
    { color: '#22c55e', label: 'Green' },
    { color: '#14b8a6', label: 'Teal' },
    { color: '#06b6d4', label: 'Cyan' },
    { color: '#0ea5e9', label: 'Sky' },
    { color: '#3b82f6', label: 'Blue' },
    { color: '#6366f1', label: 'Indigo' },
    { color: '#a855f7', label: 'Purple' },
    { color: '#d946ef', label: 'Fuchsia' },
    { color: '#ec4899', label: 'Pink' },
    { color: '#92400e', label: 'Brown' },
    { color: '#9ca3af', label: 'Light Grey' },
    { color: '#6b7280', label: 'Grey' },
    { color: '#1a1a1a', label: 'Black' },
];

const nodeColorOptions: { color: NodeColor; label: string }[] = [
    { color: 'red', label: 'Red' },
    { color: 'orange', label: 'Orange' },
    { color: 'yellow', label: 'Yellow' },
    { color: 'lime', label: 'Lime' },
    { color: 'green', label: 'Green' },
    { color: 'teal', label: 'Teal' },
    { color: 'cyan', label: 'Cyan' },
    { color: 'blue', label: 'Blue' },
    { color: 'indigo', label: 'Indigo' },
    { color: 'purple', label: 'Purple' },
    { color: 'pink', label: 'Pink' },
    { color: 'grey', label: 'Grey' },
];

const shapes: { value: NodeShape; label: string; icon: React.ReactNode }[] = [
    { value: 'rounded', label: 'Rounded', icon: <div className="w-4 h-3 rounded border-2 border-current" /> },
    { value: 'rectangle', label: 'Rectangle', icon: <div className="w-4 h-3 border-2 border-current" /> },
    { value: 'pill', label: 'Pill', icon: <div className="w-4 h-4 rounded-full border-2 border-current" /> },
    { value: 'circle', label: 'Circle', icon: <div className="w-5 h-3 rounded-full border-2 border-current" /> },
    { value: 'diamond', label: 'Diamond', icon: <div className="w-3 h-3 border-2 border-current rotate-45" /> },
    { value: 'hexagon', label: 'Hexagon', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" /></svg> },
    { value: 'parallelogram', label: 'Parallelogram', icon: <div className="w-4 h-3 border-2 border-current" style={{ transform: 'skewX(-10deg)' }} /> },
    { value: 'cloud', label: 'Cloud', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.132 20.177 10.244 17.819 10.041C17.433 6.643 14.535 4 11 4C7.027 4 3.737 6.913 3.111 10.822C1.332 11.458 0.003 13.113 0 15C0 17.618 2.003 19.78 4.606 19.996L17.5 19Z" /></svg> },
];

type TextStyleKey = 'textBold' | 'textItalic' | 'textUnderline' | 'textStrike';

const textStyleOptions: { key: TextStyleKey; selectionKey: 'bold' | 'italic' | 'underline' | 'strike'; command: InlineFormatCommand; label: string; icon: React.ReactNode }[] = [
    { key: 'textBold', selectionKey: 'bold', command: 'bold', label: 'Bold', icon: <Bold className="w-3.5 h-3.5" /> },
    { key: 'textItalic', selectionKey: 'italic', command: 'italic', label: 'Italic', icon: <Italic className="w-3.5 h-3.5" /> },
    { key: 'textUnderline', selectionKey: 'underline', command: 'underline', label: 'Underline', icon: <Underline className="w-3.5 h-3.5" /> },
    { key: 'textStrike', selectionKey: 'strike', command: 'strikeThrough', label: 'Strikethrough', icon: <Strikethrough className="w-3.5 h-3.5" /> },
];

const textAlignOptions: { value: TextAlign; label: string; icon: React.ReactNode }[] = [
    { value: 'left', label: 'Align left', icon: <AlignLeft className="w-3.5 h-3.5" /> },
    { value: 'center', label: 'Align center', icon: <AlignCenter className="w-3.5 h-3.5" /> },
    { value: 'right', label: 'Align right', icon: <AlignRight className="w-3.5 h-3.5" /> },
];

const textHeadingOptions: { value: TextHeading | undefined; label: string; icon: React.ReactNode }[] = [
    { value: undefined, label: 'Normal text', icon: <Pilcrow className="w-3.5 h-3.5" /> },
    { value: 'h1', label: 'Heading 1', icon: <Heading1 className="w-4 h-4" /> },
    { value: 'h2', label: 'Heading 2', icon: <Heading2 className="w-4 h-4" /> },
    { value: 'h3', label: 'Heading 3', icon: <Heading3 className="w-4 h-4" /> },
];

const textListOptions: { value: TextList; label: string; icon: React.ReactNode }[] = [
    { value: 'bullet', label: 'Bulleted list', icon: <List className="w-3.5 h-3.5" /> },
    { value: 'numbered', label: 'Numbered list', icon: <ListOrdered className="w-3.5 h-3.5" /> },
];

const textButtonClass = (active: boolean) => cn(
    "flex-1 h-7 rounded flex items-center justify-center transition-all border",
    active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
);

const dropdownItemClass = (active: boolean) => cn(
    "w-full text-left px-2 py-1 text-xs transition-colors",
    active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
);

const TextDropdown = ({ label, title, className, children }: {
    label: React.ReactNode;
    title: string;
    className?: string;
    children: (close: () => void) => React.ReactNode;
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handleMouseDown = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleMouseDown);
        return () => document.removeEventListener('mousedown', handleMouseDown);
    }, [open]);

    return (
        <div ref={ref} className={cn('relative', className)}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                title={title}
                className="w-full h-7 px-2 rounded border bg-background hover:bg-muted text-xs flex items-center justify-between gap-1"
            >
                <span className="truncate">{label}</span>
                <ChevronDown className="w-3 h-3 flex-shrink-0 opacity-60" />
            </button>
            {open && (
                <div className="absolute left-0 top-full mt-1 z-20 min-w-full bg-card border rounded-md shadow-lg py-1 max-h-56 overflow-y-auto">
                    {children(() => setOpen(false))}
                </div>
            )}
        </div>
    );
};

const PanelSection = ({ icon: Icon, label, summary, open, onToggle, keepEditorFocus, children }: {
    icon: LucideIcon;
    label: string;
    summary?: React.ReactNode;
    open: boolean;
    onToggle: () => void;
    keepEditorFocus?: boolean;
    children: React.ReactNode;
}) => (
    <div>
        <button
            type="button"
            onClick={onToggle}
            onMouseDown={(e) => e.preventDefault()}
            aria-expanded={open}
            data-section={label}
            className="group w-[calc(100%+0.75rem)] -mx-1.5 px-1.5 py-1 flex items-center gap-1.5 rounded-md text-left hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <span className="flex items-center gap-1.5 flex-shrink-0 text-xs font-medium text-foreground/80 group-hover:text-foreground">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" /> {label}
            </span>
            <span
                className={cn(
                    "ml-auto min-w-0 max-w-[60%] h-6 pl-2 pr-1 flex items-center gap-1 rounded-md border text-[11px] transition-colors",
                    open
                        ? "bg-muted border-foreground/20 text-foreground"
                        : "bg-background text-muted-foreground group-hover:border-foreground/25 group-hover:text-foreground"
                )}
            >
                <span className="min-w-0 truncate flex items-center">{summary}</span>
                <ChevronDown className={cn("w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200", open && "rotate-180")} />
            </span>
        </button>
        {open && (
            <div
                className="pt-1.5 pb-2 animate-in fade-in slide-in-from-top-1 duration-200"
                onMouseDown={keepEditorFocus ? (e) => e.preventDefault() : undefined}
            >
                {children}
            </div>
        )}
    </div>
);

const ColorSummary = ({ color }: { color: string }) => (
    <span className="inline-block w-3 h-3 rounded-full ring-1 ring-border" style={{ backgroundColor: color }} />
);

const NODE_SECTIONS = ['text', 'color', 'shape', 'priority', 'status', 'task', 'tags', 'effect', 'line'] as const;
const LINE_SECTIONS = ['line-type', 'line-arrows', 'line-thickness', 'line-color', 'line-label', 'line-effect'] as const;

const nodeAnimationOptions: { value: NonNullable<NodeAnimation>; label: string }[] = [
    { value: 'ring', label: 'Ring' },
    { value: 'snake', label: 'Snake' },
    { value: 'blink', label: 'Blink' },
];

const taskOptions: { value: NodeTask | undefined; label: string }[] = [
    { value: undefined, label: 'Not a task' },
    { value: 'open', label: 'To do' },
    { value: 'done', label: 'Done' },
];

const priorities: { value: NodePriority; label: string }[] = [
    { value: 'high', label: '🔴 High' },
    { value: 'medium', label: '🟡 Medium' },
    { value: 'low', label: '🟢 Low' },
];

export const PropertiesPanel = ({
    mode,
    lineValues,
    lineArrowPointing = DEFAULT_ARROW_POINTING,
    onLineUpdate,
    onLineUpdateLive,
    nodeValues,
    onNodeUpdate,
    onNodeUpdateLive,
    tags,
    tagSuggestions,
    onAddTag,
    onRemoveTag,
    onDelete,
    onCopyStyle,
    onPasteStyle,
    taskTotals,
    hideDoneTasks = false,
    onToggleHideDoneTasks,
    onLiveEditStart,
    onClose,
    is3DMode = false,
    position,
    anchorWidth,
    topInset = 0,
    selectionCount = 1,
    mixed,
}: PropertiesPanelProps) => {
    const isMixed = (key: keyof NodeSettings) => !!mixed?.has(key);
    const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [panelSize, setPanelSize] = useState({ width: 300, height: 0 });
    const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });

    const selectionFormat = useEditorSelectionFormat();

    const liveEditActiveRef = useRef(false);
    const beginLiveEdit = () => {
        if (!liveEditActiveRef.current) {
            liveEditActiveRef.current = true;
            onLiveEditStart?.();
        }
    };
    const endLiveEdit = () => { liveEditActiveRef.current = false; };

    const [customColors, setCustomColors] = useState(getCustomColors);
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    useEffect(() => {
        saveCustomColors(customColors);
    }, [customColors]);

    const [openSections, setOpenSections] = useState(getOpenSections);

    useEffect(() => {
        saveOpenSections(openSections);
    }, [openSections]);

    const sectionProps = (id: string, siblings: readonly string[]) => ({
        open: !!openSections[id],
        onToggle: () => setOpenSections(prev =>
            toggleSection(prev, id, viewport.height < SHORT_SCREEN_HEIGHT ? siblings : undefined)),
    });

    const closePicker = () => {
        setIsPickerOpen(false);
        endLiveEdit();
    };

    useLayoutEffect(() => {
        const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startPosX: dragPosition.x,
            startPosY: dragPosition.y,
        };
        setIsDragging(true);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragRef.current) return;
        const deltaX = e.clientX - dragRef.current.startX;
        const deltaY = e.clientY - dragRef.current.startY;
        setDragPosition({
            x: dragRef.current.startPosX + deltaX,
            y: dragRef.current.startPosY + deltaY,
        });
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        dragRef.current = null;
        setIsDragging(false);
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
    };

    useLayoutEffect(() => {
        const el = panelRef.current;
        if (!el) return;
        const update = () => setPanelSize({ width: el.offsetWidth, height: el.offsetHeight });
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, [mode]);

    const renderCustomColors = (
        current: string | undefined,
        pickerValue: string,
        onLive: (color: string) => void,
        onPick: (color: string) => void,
    ) => {
        const currentHex = current?.startsWith('#') ? current.toLowerCase() : undefined;
        const isUnsavedCustom = !!currentHex
            && !customColors.includes(currentHex)
            && !(mode === 'line' && lineColorOptions.some(o => o.color === currentHex));

        return (
            <>
                <button
                    onClick={() => (isPickerOpen ? closePicker() : setIsPickerOpen(true))}
                    className={cn(
                        "w-6 h-6 rounded-full bg-gradient-to-br from-red-500 via-green-500 to-blue-500 border flex items-center justify-center transition-transform hover:scale-110",
                        isPickerOpen || isUnsavedCustom ? 'border-primary ring-2 ring-primary/30 ring-offset-1' : 'border-border'
                    )}
                    title="Custom color"
                    aria-expanded={isPickerOpen}
                >
                    <Plus className="w-3.5 h-3.5 text-white drop-shadow-sm" strokeWidth={3} />
                </button>
                {customColors.map((color) => (
                    <div key={color} className="relative group">
                        <button
                            onClick={() => onPick(color)}
                            className={cn(
                                "w-6 h-6 rounded-full border transition-transform hover:scale-110",
                                currentHex === color ? 'border-primary ring-2 ring-primary/30 ring-offset-1' : 'border-transparent ring-1 ring-border'
                            )}
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                        <button
                            onClick={() => setCustomColors(prev => prev.filter(c => c !== color))}
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-background border shadow-sm flex items-center justify-center text-muted-foreground hover:text-destructive transition-opacity opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto"
                            title="Remove saved color"
                            aria-label={`Remove saved color ${color}`}
                        >
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </div>
                ))}
                {isPickerOpen && (
                    <ColorPicker
                        id={`${mode}-color-custom`}
                        value={pickerValue}
                        onChange={(color) => {
                            beginLiveEdit();
                            onLive(color);
                        }}
                        onAdd={(color) => {
                            if (currentHex !== color) onPick(color);
                            setCustomColors(prev => withCustomColor(prev, color));
                            closePicker();
                        }}
                        onClose={closePicker}
                    />
                )}
            </>
        );
    };

    const renderLineContent = () => {
        if (!lineValues || !onLineUpdate) return null;

        const arrowDirection = lineValues.arrowDirection || 'none';
        const thickness = lineValues.thickness || 'medium';
        const shape = lineShapeOf(lineValues.type);
        const pattern = linePatternOf(lineValues.type, lineValues.pattern);
        const setLineStyle = (next: { type?: LineShape; pattern?: LinePattern }) => onLineUpdate({
            type: next.type ?? shape,
            pattern: next.pattern ?? pattern,
            ...(parseConnectionStyle(lineValues.type).arrow ? { arrowDirection } : {}),
        });

        return (
            <div className="space-y-0.5">
                <PanelSection
                    icon={Spline}
                    label="Type"
                    summary={`${lineShapes.find(s => s.value === shape)?.label} · ${linePatterns.find(p => p.value === pattern)?.label}`}
                    {...sectionProps('line-type', LINE_SECTIONS)}
                >
                    <div className="grid grid-cols-3 gap-1">
                        {lineShapes.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setLineStyle({ type: option.value })}
                                aria-pressed={shape === option.value}
                                className={cn(
                                    "px-2 py-1.5 text-xs rounded transition-all border",
                                    shape === option.value
                                        ? "bg-primary text-primary-foreground border-primary font-medium"
                                        : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-1">
                        {linePatterns.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setLineStyle({ pattern: option.value })}
                                aria-pressed={pattern === option.value}
                                className={cn(
                                    "px-2 py-1.5 text-xs rounded flex items-center justify-center gap-1.5 transition-all border",
                                    pattern === option.value
                                        ? "bg-primary text-primary-foreground border-primary font-medium"
                                        : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                                )}
                            >
                                <PatternSwatch pattern={option.value} /> {option.label}
                            </button>
                        ))}
                    </div>

                    {lineValues.tension !== undefined && shape !== 'straight' && (
                        <div className="mt-2">
                            <label htmlFor="line-tension-input" className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                    <Spline className="w-3 h-3" /> {shape === 'orthogonal' ? 'Bend' : 'Tension'}
                                </span>
                                <span className="tabular-nums normal-case tracking-normal">{Math.round(lineValues.tension * 100)}%</span>
                            </label>
                            <input
                                id="line-tension-input"
                                name="line-tension"
                                type="range"
                                min={0}
                                max={1}
                                step={0.05}
                                value={lineValues.tension}
                                onChange={(e) => {
                                    beginLiveEdit();
                                    (onLineUpdateLive || onLineUpdate)({ tension: Number(e.target.value) });
                                }}
                                onPointerDown={() => window.addEventListener('pointerup', endLiveEdit, { once: true })}
                                onKeyUp={endLiveEdit}
                                onBlur={endLiveEdit}
                                className="w-full h-4 accent-primary cursor-pointer"
                            />
                        </div>
                    )}
                </PanelSection>

                <PanelSection
                    icon={ArrowLeftRight}
                    label="Arrowheads"
                    summary={arrowheadOptions.find(o => o.value === arrowDirection)?.label}
                    {...sectionProps('line-arrows', LINE_SECTIONS)}
                >
                    <div className="grid grid-cols-4 gap-1">
                        {arrowheadOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => onLineUpdate({ arrowDirection: opt.value })}
                                title={opt.label}
                                className={cn(
                                    "px-2 py-1.5 text-[10px] rounded flex flex-col items-center justify-center gap-0.5 transition-all border",
                                    arrowDirection === opt.value
                                        ? "bg-primary text-primary-foreground border-primary font-medium"
                                        : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                                )}
                            >
                                {getArrowheadIcon(opt.value, lineArrowPointing)}
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </PanelSection>

                <PanelSection
                    icon={Bold}
                    label="Thickness"
                    summary={thicknessOptions.find(o => o.value === thickness)?.label}
                    {...sectionProps('line-thickness', LINE_SECTIONS)}
                >
                    <div className="grid grid-cols-3 gap-1">
                        {thicknessOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => onLineUpdate({ thickness: opt.value })}
                                className={cn(
                                    "px-2 py-1.5 text-xs rounded flex items-center justify-center gap-1.5 transition-all border",
                                    thickness === opt.value
                                        ? "bg-primary text-primary-foreground border-primary font-medium"
                                        : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                                )}
                            >
                                {opt.icon} {opt.label}
                            </button>
                        ))}
                    </div>
                </PanelSection>

                <PanelSection
                    icon={Palette}
                    label="Color"
                    summary={lineValues.color ? <ColorSummary color={lineValues.color} /> : 'Default'}
                    {...sectionProps('line-color', LINE_SECTIONS)}
                >
                    <div className="flex gap-1.5 flex-wrap">
                        {lineColorOptions.map((opt) => (
                            <button
                                key={opt.color}
                                onClick={() => onLineUpdate({ color: opt.color })}
                                className={cn(
                                    "w-6 h-6 rounded-full border transition-transform hover:scale-110",
                                    lineValues.color?.toLowerCase() === opt.color ? 'border-primary ring-2 ring-primary/30 ring-offset-1' : 'border-transparent ring-1 ring-border'
                                )}
                                style={{ backgroundColor: opt.color }}
                                title={opt.label}
                            />
                        ))}
                        {renderCustomColors(
                            lineValues.color,
                            lineValues.color || '#f97316',
                            (color) => (onLineUpdateLive || onLineUpdate)({ color }),
                            (color) => onLineUpdate({ color }),
                        )}
                    </div>
                    {lineValues.gradient !== undefined && (
                        <label className="flex items-center gap-2 text-xs cursor-pointer select-none mt-2">
                            <input
                                id="line-gradient-checkbox"
                                name="line-gradient"
                                type="checkbox"
                                checked={lineValues.gradient}
                                onChange={(e) => onLineUpdate({ gradient: e.target.checked })}
                                className="rounded border-muted w-3.5 h-3.5 text-primary focus:ring-primary"
                            />
                            <span className={lineValues.gradient ? "text-foreground" : "text-muted-foreground"}>
                                Blend from the parent block's color
                            </span>
                        </label>
                    )}
                </PanelSection>

                <PanelSection
                    icon={Type}
                    label="Label"
                    summary={lineValues.label || 'None'}
                    {...sectionProps('line-label', LINE_SECTIONS)}
                >
                    <input
                        id="line-label-input"
                        name="line-label"
                        type="text"
                        value={lineValues.label || ''}
                        onFocus={beginLiveEdit}
                        onBlur={endLiveEdit}
                        onChange={(e) => (onLineUpdateLive || onLineUpdate)({ label: e.target.value })}
                        placeholder="Label..."
                        className="w-full px-2 py-1.5 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </PanelSection>

                <PanelSection
                    icon={Activity}
                    label="Effect"
                    summary={lineValues.animated ? 'Animated' : 'Off'}
                    {...sectionProps('line-effect', LINE_SECTIONS)}
                >
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                                <input
                                    id="line-animated-checkbox"
                                    name="line-animated"
                                    type="checkbox"
                                    checked={lineValues.animated || false}
                                    onChange={(e) => onLineUpdate({ animated: e.target.checked })}
                                    className="rounded border-muted w-3.5 h-3.5 text-primary focus:ring-primary"
                                />
                                <span className={lineValues.animated ? "text-foreground" : "text-muted-foreground"}>Animated</span>
                            </label>
                        </div>

                        {lineValues.animated && (
                            <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="flex gap-1 bg-muted/50 p-1 rounded-md border border-border/50">
                                    <button
                                        onClick={() => onLineUpdate({ animationType: 'dash' })}
                                        className={cn(
                                            "flex-1 flex items-center justify-center py-1 rounded text-[10px] transition-all",
                                            !lineValues.animationType || lineValues.animationType === 'dash'
                                                ? "bg-card shadow-sm text-primary font-medium"
                                                : "text-muted-foreground hover:bg-card/50"
                                        )}
                                        title="Flowing Dash"
                                    >
                                        <Activity className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => onLineUpdate({ animationType: 'arrow' })}
                                        className={cn(
                                            "flex-1 flex items-center justify-center py-1 rounded text-[10px] transition-all",
                                            lineValues.animationType === 'arrow'
                                                ? "bg-card shadow-sm text-primary font-medium"
                                                : "text-muted-foreground hover:bg-card/50"
                                        )}
                                        title="Moving Arrow"
                                    >
                                        <ArrowRight className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => onLineUpdate({ animationType: 'cross' })}
                                        className={cn(
                                            "flex-1 flex items-center justify-center py-1 rounded text-[10px] transition-all",
                                            lineValues.animationType === 'cross'
                                                ? "bg-card shadow-sm text-primary font-medium"
                                                : "text-muted-foreground hover:bg-card/50"
                                        )}
                                        title="Moving Cross"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="flex gap-1 bg-muted/50 p-1 rounded-md border border-border/50">
                                    <button
                                        onClick={() => onLineUpdate({ animationDirection: 'forward' })}
                                        className={cn(
                                            "flex-1 flex items-center justify-center py-0.5 px-1 rounded text-[10px] transition-all",
                                            !lineValues.animationDirection || lineValues.animationDirection === 'forward'
                                                ? "bg-card shadow-sm text-primary font-medium"
                                                : "text-muted-foreground hover:bg-card/50"
                                        )}
                                        title="Forward"
                                    >
                                        <ArrowRight className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => onLineUpdate({ animationDirection: 'reverse' })}
                                        className={cn(
                                            "flex-1 flex items-center justify-center py-0.5 px-1 rounded text-[10px] transition-all",
                                            lineValues.animationDirection === 'reverse'
                                                ? "bg-card shadow-sm text-primary font-medium"
                                                : "text-muted-foreground hover:bg-card/50"
                                        )}
                                        title="Reverse"
                                    >
                                        <ArrowLeft className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </PanelSection>

                {onDelete && (
                    <div className="pt-2">
                        <button
                            onClick={onDelete}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-transparent hover:border-destructive/20"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Delete Line
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderNodeContent = () => {
        if (!nodeValues || !onNodeUpdate) return null;

        const sel = selectionFormat;
        const blockSize = nodeValues.textSize ?? (nodeValues.textHeading ? HEADING_SIZES[nodeValues.textHeading] : DEFAULT_TEXT_SIZE);
        const currentSize = sel ? sel.size : blockSize;
        const currentFont = sel?.font ?? nodeValues.textFont ?? 'default';
        const selectionHeading = sel
            ? (Object.keys(HEADING_SIZES) as TextHeading[]).find(h => HEADING_SIZES[h] === sel.size)
            : undefined;

        const setSize = (size: number) => {
            if (isSelectionInEditor()) applySelectionSize(size);
            else onNodeUpdate({ textSize: size === DEFAULT_TEXT_SIZE ? undefined : size, textHeading: undefined });
        };
        const setFont = (font: TextFont) => {
            if (isSelectionInEditor()) applySelectionFont(font);
            else onNodeUpdate({ textFont: font === 'default' ? undefined : font });
        };

        const mixedSummary = (key: keyof NodeSettings, summary: React.ReactNode) => isMixed(key) ? 'Mixed' : summary;
        const nodeColor = nodeValues.color;
        const nodeColorSummary = mixedSummary('color', !nodeColor || nodeColor === 'root'
            ? 'Default'
            : <ColorSummary color={nodeColor.startsWith('#') ? nodeColor : `hsl(var(--node-${nodeColor}-border))`} />);
        const textSizeSummary = !sel && (isMixed('textSize') || isMixed('textHeading')) ? '–' : currentSize;
        const textFontSummary = !sel && isMixed('textFont') ? 'Mixed' : TEXT_FONTS.find(f => f.value === currentFont)?.label ?? 'Default';
        const taskSummary = mixedSummary('task', taskOptions.find(t => t.value === nodeValues.task)?.label);
        const blockShape = isMixed('lineType') || !nodeValues.lineType ? undefined : lineShapeOf(nodeValues.lineType);
        const blockPattern = isMixed('linePattern') || isMixed('lineType') || !(nodeValues.lineType || nodeValues.linePattern)
            ? undefined
            : linePatternOf(nodeValues.lineType, nodeValues.linePattern);
        const setBlockLineStyle = (next: { lineType?: LineShape; linePattern?: LinePattern }) => {
            const lineType = next.lineType ?? blockShape;
            const linePattern = next.linePattern ?? blockPattern;
            onNodeUpdate({
                ...(lineType ? { lineType } : {}),
                ...(linePattern ? { linePattern } : {}),
                ...(!isMixed('lineType') && parseConnectionStyle(nodeValues.lineType).arrow && !nodeValues.lineArrowDirection ? { lineArrowDirection: 'forward' as const } : {}),
            });
        };
        const tagCount = tags?.length ?? 0;

        return (
            <div className="space-y-0.5">
                {!(nodeValues.icon && nodeValues.iconStyle === 'plain') && (
                    <PanelSection
                        icon={Type}
                        label="Text"
                        summary={`${textSizeSummary} · ${textFontSummary}`}
                        keepEditorFocus
                        {...sectionProps('text', NODE_SECTIONS)}
                    >
                        <p className={cn(
                            "text-[10px] leading-snug mb-1.5",
                            sel ? "text-primary font-medium" : "text-muted-foreground"
                        )}>
                            {sel
                                ? 'Styling the selected text only'
                                : selectionCount > 1
                                    ? `Styling all ${selectionCount} blocks.`
                                    : 'Styling the whole block. To style only some words, double-click the text and select them.'}
                        </p>
                        <div className="space-y-1">
                            <div className="flex gap-1">
                                {textStyleOptions.map((opt) => (
                                    <button
                                        key={opt.key}
                                        onClick={() => {
                                            if (isSelectionInEditor()) applyInlineFormat(opt.command);
                                            else onNodeUpdate({ [opt.key]: !nodeValues[opt.key] } as Partial<NodeSettings>);
                                        }}
                                        title={opt.label}
                                        className={textButtonClass(sel ? sel[opt.selectionKey] : !isMixed(opt.key) && !!nodeValues[opt.key])}
                                    >
                                        {opt.icon}
                                    </button>
                                ))}
                                <div className="w-px bg-border mx-0.5" />
                                {textAlignOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => onNodeUpdate({ textAlign: opt.value })}
                                        title={`${opt.label} (whole block)`}
                                        className={textButtonClass(!isMixed('textAlign') && (nodeValues.textAlign || 'center') === opt.value)}
                                    >
                                        {opt.icon}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-1">
                                {textHeadingOptions.map((opt) => (
                                    <button
                                        key={opt.label}
                                        onClick={() => {
                                            if (isSelectionInEditor()) applySelectionHeading(opt.value ?? null);
                                            else onNodeUpdate({ textHeading: opt.value, textSize: undefined });
                                        }}
                                        title={opt.label}
                                        className={textButtonClass(sel ? selectionHeading === opt.value : !isMixed('textHeading') && nodeValues.textHeading === opt.value)}
                                    >
                                        {opt.icon}
                                    </button>
                                ))}
                                <div className="w-px bg-border mx-0.5" />
                                {textListOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => onNodeUpdate({ textList: nodeValues.textList === opt.value ? undefined : opt.value })}
                                        title={`${opt.label} (whole block)`}
                                        className={textButtonClass(!isMixed('textList') && nodeValues.textList === opt.value)}
                                    >
                                        {opt.icon}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-1">
                                <TextDropdown
                                    className="flex-1 min-w-0"
                                    title="Font"
                                    label={
                                        <span style={{ fontFamily: getFontStack(currentFont) }}>
                                            {!sel && isMixed('textFont') ? 'Mixed' : TEXT_FONTS.find(f => f.value === currentFont)?.label}
                                        </span>
                                    }
                                >
                                    {(close) => TEXT_FONTS.map((f) => (
                                        <button
                                            key={f.value}
                                            type="button"
                                            onClick={() => { setFont(f.value); close(); }}
                                            className={dropdownItemClass(currentFont === f.value)}
                                            style={{ fontFamily: f.stack }}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </TextDropdown>
                                <button
                                    onClick={() => setSize(stepTextSize(currentSize, -1))}
                                    title="Smaller text"
                                    className={cn(textButtonClass(false), 'flex-none w-7')}
                                >
                                    <AArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <TextDropdown className="w-14 flex-none" title="Text size" label={!sel && (isMixed('textSize') || isMixed('textHeading')) ? '–' : currentSize}>
                                    {(close) => TEXT_SIZES.map((size) => (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => { setSize(size); close(); }}
                                            className={dropdownItemClass(currentSize === size)}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </TextDropdown>
                                <button
                                    onClick={() => setSize(stepTextSize(currentSize, 1))}
                                    title="Larger text"
                                    className={cn(textButtonClass(false), 'flex-none w-7')}
                                >
                                    <AArrowUp className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </PanelSection>
                )}

                <PanelSection
                    icon={Palette}
                    label="Color"
                    summary={nodeColorSummary}
                    {...sectionProps('color', NODE_SECTIONS)}
                >
                    <div className="flex flex-wrap gap-1.5">
                        {nodeColorOptions.map((opt) => (
                            <button
                                key={opt.color}
                                onClick={() => onNodeUpdate({ color: opt.color })}
                                className={cn(
                                    "w-6 h-6 rounded-full border transition-transform hover:scale-110",
                                    nodeValues.color === opt.color ? 'border-primary ring-2 ring-primary/30 ring-offset-1' : 'border-transparent ring-1 ring-border'
                                )}
                                style={{ backgroundColor: `hsl(var(--node-${opt.color}-border))` }}
                                title={opt.label}
                            />
                        ))}
                        {renderCustomColors(
                            nodeValues.color,
                            nodeValues.color?.startsWith('#') ? nodeValues.color : '#6366f1',
                            (color) => (onNodeUpdateLive || onNodeUpdate)({ color: color as unknown as NodeColor }),
                            (color) => onNodeUpdate({ color: color as unknown as NodeColor }),
                        )}
                    </div>
                </PanelSection>

                {!(nodeValues.icon && nodeValues.iconStyle === 'plain') && (
                    <PanelSection
                        icon={Shapes}
                        label="Shape"
                        summary={mixedSummary('shape', shapes.find(s => s.value === nodeValues.shape)?.label ?? 'Rounded')}
                        {...sectionProps('shape', NODE_SECTIONS)}
                    >
                        <div className="grid grid-cols-3 gap-1">
                            {shapes.map((shape) => (
                                <button
                                    key={shape.value}
                                    onClick={() => onNodeUpdate({ shape: shape.value })}
                                    className={cn(
                                        "px-2 py-1.5 text-[10px] rounded flex items-center gap-1.5 transition-all border",
                                        nodeValues.shape === shape.value
                                            ? "bg-primary text-primary-foreground border-primary font-medium"
                                            : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                                    )}
                                >
                                    <span className="w-3 h-3 flex items-center justify-center flex-shrink-0">{shape.icon}</span>
                                    <span className="truncate">{shape.label}</span>
                                </button>
                            ))}
                        </div>
                    </PanelSection>
                )}

                <PanelSection
                    icon={AlertCircle}
                    label="Priority"
                    summary={mixedSummary('priority', priorities.find(p => p.value === nodeValues.priority)?.label.split(' ')[1] ?? 'None')}
                    {...sectionProps('priority', NODE_SECTIONS)}
                >
                    <div className="grid grid-cols-4 gap-1">
                        {priorities.map((p) => (
                            <button
                                key={p.value}
                                onClick={() => onNodeUpdate({ priority: p.value })}
                                className={cn(
                                    "px-2 py-1.5 text-[10px] rounded transition-all border",
                                    nodeValues.priority === p.value
                                        ? "bg-primary text-primary-foreground border-primary font-medium"
                                        : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                                )}
                            >
                                {p.label.split(' ')[1]}
                            </button>
                        ))}
                        <button
                            onClick={() => onNodeUpdate({ priority: undefined })}
                            className={cn(
                                "px-2 py-1.5 text-[10px] rounded transition-all border",
                                !isMixed('priority') && !nodeValues.priority
                                    ? "bg-muted text-foreground border-muted-foreground/20 font-medium"
                                    : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                            )}
                        >
                            None
                        </button>
                    </div>
                </PanelSection>

                <PanelSection
                    icon={ListChecks}
                    label="Status"
                    summary={mixedSummary('status', statusOptions.find(s => s.value === nodeValues.status)?.label ?? 'None')}
                    {...sectionProps('status', NODE_SECTIONS)}
                >
                    <div className="grid grid-cols-3 gap-1">
                        {statusOptions.map((s) => (
                            <button
                                key={s.value}
                                onClick={() => onNodeUpdate({ status: s.value })}
                                className={cn(
                                    "px-2 py-1.5 text-[10px] rounded flex items-center gap-1 transition-all border",
                                    nodeValues.status === s.value
                                        ? "bg-primary text-primary-foreground border-primary font-medium"
                                        : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                                )}
                            >
                                <s.icon className={cn("w-3 h-3 flex-shrink-0", nodeValues.status !== s.value && s.color)} />
                                <span className="truncate">{s.label}</span>
                            </button>
                        ))}
                        <button
                            onClick={() => onNodeUpdate({ status: undefined })}
                            className={cn(
                                "px-2 py-1.5 text-[10px] rounded transition-all border",
                                !isMixed('status') && !nodeValues.status
                                    ? "bg-muted text-foreground border-muted-foreground/20 font-medium"
                                    : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                            )}
                        >
                            None
                        </button>
                    </div>
                </PanelSection>

                <PanelSection
                    icon={SquareCheck}
                    label="Task"
                    summary={taskSummary}
                    {...sectionProps('task', NODE_SECTIONS)}
                >
                    <div className="grid grid-cols-3 gap-1">
                        {taskOptions.map((t) => {
                            const isChosen = !isMixed('task') && nodeValues.task === t.value;
                            return (
                                <button
                                    key={t.label}
                                    onClick={() => onNodeUpdate({ task: t.value })}
                                    aria-pressed={isChosen}
                                    className={cn(
                                        "px-2 py-1.5 text-[10px] rounded transition-all border",
                                        isChosen && t.value
                                            ? "bg-primary text-primary-foreground border-primary font-medium"
                                            : isChosen
                                                ? "bg-muted text-foreground border-muted-foreground/20 font-medium"
                                                : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                                    )}
                                >
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <input
                            type="date"
                            aria-label="Due date"
                            value={isMixed('dueDate') ? '' : (nodeValues.dueDate ?? '')}
                            onChange={(e) => onNodeUpdate({ dueDate: e.target.value || undefined })}
                            className="flex-1 min-w-0 h-7 px-1.5 text-[11px] rounded border bg-background text-foreground"
                        />
                        {(nodeValues.dueDate || isMixed('dueDate')) && (
                            <button
                                onClick={() => onNodeUpdate({ dueDate: undefined })}
                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                title="Remove the due date"
                                aria-label="Remove the due date"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    {taskTotals && taskTotals.total > 0 && (
                        <div
                            className="flex items-center justify-between gap-2 mt-2 pt-2 border-t text-[11px] text-foreground"
                            data-testid="task-summary"
                        >
                            <span className="flex items-center gap-1.5 min-w-0">
                                <SquareCheck className={cn('w-3.5 h-3.5 flex-shrink-0', taskTotals.done === taskTotals.total ? 'text-green-600' : 'text-blue-600')} />
                                <span className="truncate">
                                    {taskTotals.done} of {taskTotals.total} {taskTotals.total === 1 ? 'task' : 'tasks'} done in this map
                                </span>
                            </span>
                            {onToggleHideDoneTasks && (
                                <button
                                    onClick={onToggleHideDoneTasks}
                                    aria-pressed={hideDoneTasks}
                                    title={hideDoneTasks ? 'Show the tasks that are done' : 'Hide the tasks that are done, with what is below them'}
                                    className="flex-shrink-0 flex items-center gap-1 rounded px-1.5 py-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                >
                                    {hideDoneTasks ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                    {hideDoneTasks ? 'Show done' : 'Hide done'}
                                </button>
                            )}
                        </div>
                    )}
                </PanelSection>

                {onAddTag && onRemoveTag && (
                    <PanelSection
                        icon={Tag}
                        label="Tags"
                        summary={tagCount === 0 ? 'None' : tagCount === 1 ? tags![0] : `${tagCount} tags`}
                        {...sectionProps('tags', NODE_SECTIONS)}
                    >
                        <TagEditor tags={tags ?? []} suggestions={tagSuggestions} onAdd={onAddTag} onRemove={onRemoveTag} />
                        {selectionCount > 1 && (
                            <p className="text-[10px] leading-snug text-muted-foreground mt-1">
                                The tags all {selectionCount} blocks have. A tag added here goes on each of them.
                            </p>
                        )}
                    </PanelSection>
                )}

                <PanelSection
                    icon={Activity}
                    label="Effect"
                    summary={mixedSummary('nodeAnimation', nodeAnimationOptions.find(a => a.value === nodeValues.nodeAnimation)?.label ?? 'None')}
                    {...sectionProps('effect', NODE_SECTIONS)}
                >
                    <div className="grid grid-cols-4 gap-1">
                        <button
                            onClick={() => onNodeUpdate({ nodeAnimation: undefined })}
                            className={cn(
                                "px-2 py-1.5 text-[10px] rounded transition-all border",
                                !isMixed('nodeAnimation') && !nodeValues.nodeAnimation
                                    ? "bg-muted text-foreground border-muted-foreground/20 font-medium"
                                    : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                            )}
                        >
                            None
                        </button>

                        {nodeAnimationOptions.map((anim) => (
                            <button
                                key={anim.value}
                                onClick={() => onNodeUpdate({ nodeAnimation: anim.value })}
                                className={cn(
                                    "px-2 py-1.5 text-[10px] rounded transition-all border",
                                    nodeValues.nodeAnimation === anim.value
                                        ? "bg-primary text-primary-foreground border-primary font-medium"
                                        : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                                )}
                            >
                                {anim.label}
                            </button>
                        ))}
                    </div>
                </PanelSection>

                {!is3DMode && (
                    <PanelSection
                        icon={Spline}
                        label="Line Connection"
                        summary={isMixed('lineType') || isMixed('linePattern') ? 'Mixed' : blockShape
                            ? `${lineShapes.find(s => s.value === blockShape)?.label} · ${linePatterns.find(p => p.value === blockPattern)?.label}`
                            : 'Default'}
                        {...sectionProps('line', NODE_SECTIONS)}
                    >
                        <div className="grid grid-cols-3 gap-1">
                            {lineShapes.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setBlockLineStyle({ lineType: option.value })}
                                    aria-pressed={blockShape === option.value}
                                    className={cn(
                                        "px-2 py-1.5 text-[10px] rounded transition-all border",
                                        blockShape === option.value
                                            ? "bg-primary text-primary-foreground border-primary font-medium"
                                            : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-1 mt-1">
                            {linePatterns.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setBlockLineStyle({ linePattern: option.value })}
                                    aria-pressed={blockPattern === option.value}
                                    className={cn(
                                        "px-2 py-1.5 text-[10px] rounded flex items-center justify-center gap-1.5 transition-all border",
                                        blockPattern === option.value
                                            ? "bg-primary text-primary-foreground border-primary font-medium"
                                            : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                                    )}
                                >
                                    <PatternSwatch pattern={option.value} /> {option.label}
                                </button>
                            ))}
                        </div>
                    </PanelSection>
                )}

                {(onCopyStyle || onPasteStyle) && (
                    <div className="grid grid-cols-2 gap-1 pt-3">
                        <button
                            onClick={onCopyStyle}
                            disabled={!onCopyStyle}
                            title={onCopyStyle ? "Copy this block's look (Ctrl + Alt + C)" : 'Select one block to copy its style'}
                            className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] rounded border bg-background hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
                        >
                            <Paintbrush className="w-3.5 h-3.5" /> Copy Style
                        </button>
                        <button
                            onClick={onPasteStyle}
                            disabled={!onPasteStyle}
                            title={onPasteStyle ? 'Give the selected blocks the copied look (Ctrl + Alt + V)' : "Copy a block's style first"}
                            className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] rounded border bg-background hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
                        >
                            <PaintRoller className="w-3.5 h-3.5" /> Paste Style
                        </button>
                    </div>
                )}

                {onDelete && (
                    <div className="pt-2">
                        <button
                            onClick={onDelete}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-transparent hover:border-destructive/20"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> {selectionCount > 1 ? `Delete ${selectionCount} Blocks` : 'Delete Block'}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const MARGIN = 12;
    const SIDE_GAP = 96;
    const minTop = MARGIN + topInset;
    let left: number | undefined;
    let top: number | undefined;
    if (position) {
        const maxLeft = Math.max(MARGIN, viewport.width - panelSize.width - MARGIN);
        const maxTop = Math.max(minTop, viewport.height - panelSize.height - MARGIN);

        let rawLeft: number;
        let rawTop: number;
        if (anchorWidth !== undefined) {
            const rightLeft = position.x + anchorWidth / 2 + SIDE_GAP;
            rawLeft = rightLeft + panelSize.width + MARGIN <= viewport.width
                ? rightLeft
                : position.x - anchorWidth / 2 - SIDE_GAP - panelSize.width;
            rawTop = position.y - panelSize.height / 2;
        } else {
            rawLeft = position.x - panelSize.width / 2;
            rawTop = position.y - 100;
        }

        left = Math.min(Math.max(rawLeft + dragPosition.x, MARGIN), maxLeft);
        top = Math.min(Math.max(rawTop + dragPosition.y, minTop), maxTop);
    }

    return (
        <div
            ref={panelRef}
            className="fixed bg-card/95 backdrop-blur-sm rounded-xl shadow-xl border p-3 z-50 w-[300px] overflow-y-auto"
            style={{
                maxHeight: `calc(100vh - ${MARGIN * 2 + topInset}px)`,
                left: position ? `${left}px` : `calc(50% + ${dragPosition.x}px)`,
                top: position ? `${top}px` : undefined,
                bottom: position ? undefined : `calc(1rem - ${dragPosition.y}px)`,
                transform: position ? undefined : 'translateX(-50%)',
                cursor: isDragging ? 'grabbing' : 'default',
            }}
        >
            <div
                className="flex items-center justify-between mb-3 cursor-grab active:cursor-grabbing select-none border-b pb-2"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <h3 className="font-semibold text-xs flex items-center gap-2 uppercase tracking-wide text-foreground/80">
                    <GripHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                    {mode === 'line' ? 'Line Properties' : selectionCount > 1 ? `${selectionCount} Blocks` : 'Block Properties'}
                </h3>
                <button
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full w-5 h-5 flex items-center justify-center transition-all hover:rotate-90 duration-300"
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    ×
                </button>
            </div>

            {mode === 'line' ? renderLineContent() : renderNodeContent()}
        </div>
    );
};
 