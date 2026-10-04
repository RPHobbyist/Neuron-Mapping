/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { CSSProperties } from 'react';
import { Ban, CircleCheck, CircleDashed, ClipboardList, Contrast, Eye, MessageCircle, type LucideIcon } from 'lucide-react';
import { MindMapNode, NodePriority, NodeStatus } from '@/types/mindmap';
import { clampTextSize, getFontStack } from '@/utils/richText';

export const statusOptions: { value: NonNullable<NodeStatus>; label: string; icon: LucideIcon; color: string }[] = [
    { value: 'backlog', label: 'Backlog', icon: CircleDashed, color: 'text-slate-500' },
    { value: 'planning', label: 'Planning', icon: ClipboardList, color: 'text-blue-600' },
    { value: 'discussion', label: 'Discussion', icon: MessageCircle, color: 'text-purple-600' },
    { value: 'in-progress', label: 'In Progress', icon: Contrast, color: 'text-amber-600' },
    { value: 'review', label: 'Review', icon: Eye, color: 'text-cyan-600' },
    { value: 'blocked', label: 'Blocked', icon: Ban, color: 'text-red-600' },
    { value: 'done', label: 'Done', icon: CircleCheck, color: 'text-green-600' },
];

export const priorityStyles: Record<NonNullable<NodePriority>, { label: string; color: string }> = {
    high: { label: 'High', color: 'text-red-600' },
    medium: { label: 'Medium', color: 'text-amber-500' },
    low: { label: 'Low', color: 'text-green-600' },
};

export const colorStyles: Record<string, { bg: string; text: string; border: string }> = {
    root: {
        bg: 'bg-[hsl(var(--node-black-bg))]',
        text: 'text-[hsl(var(--node-black-text))]',
        border: 'border-transparent'
    },
    orange: {
        bg: 'bg-[hsl(var(--node-orange-bg))]',
        text: 'text-[hsl(var(--node-orange-text))]',
        border: 'border-[hsl(var(--node-orange-border))]'
    },
    amber: {
        bg: 'bg-[hsl(var(--node-orange-bg))]',
        text: 'text-[hsl(var(--node-orange-text))]',
        border: 'border-[hsl(var(--node-orange-border))]'
    },
    blue: {
        bg: 'bg-[hsl(var(--node-blue-bg))]',
        text: 'text-[hsl(var(--node-blue-text))]',
        border: 'border-[hsl(var(--node-blue-border))]'
    },
    sky: {
        bg: 'bg-[hsl(var(--node-blue-bg))]',
        text: 'text-[hsl(var(--node-blue-text))]',
        border: 'border-[hsl(var(--node-blue-border))]'
    },
    cyan: {
        bg: 'bg-[hsl(var(--node-cyan-bg))]',
        text: 'text-[hsl(var(--node-cyan-text))]',
        border: 'border-[hsl(var(--node-cyan-border))]'
    },
    teal: {
        bg: 'bg-[hsl(var(--node-teal-bg))]',
        text: 'text-[hsl(var(--node-teal-text))]',
        border: 'border-[hsl(var(--node-teal-border))]'
    },
    violet: {
        bg: 'bg-[hsl(var(--node-purple-bg))]',
        text: 'text-[hsl(var(--node-purple-text))]',
        border: 'border-[hsl(var(--node-purple-border))]'
    },
    purple: {
        bg: 'bg-[hsl(var(--node-purple-bg))]',
        text: 'text-[hsl(var(--node-purple-text))]',
        border: 'border-[hsl(var(--node-purple-border))]'
    },
    yellow: {
        bg: 'bg-[hsl(var(--node-yellow-bg))]',
        text: 'text-[hsl(var(--node-yellow-text))]',
        border: 'border-[hsl(var(--node-yellow-border))]'
    },
    rose: {
        bg: 'bg-[hsl(var(--node-yellow-bg))]',
        text: 'text-[hsl(var(--node-yellow-text))]',
        border: 'border-[hsl(var(--node-yellow-border))]'
    },
    grey: {
        bg: 'bg-[hsl(var(--node-grey-bg))]',
        text: 'text-[hsl(var(--node-grey-text))]',
        border: 'border-[hsl(var(--node-grey-border))]'
    },
    emerald: {
        bg: 'bg-[hsl(var(--node-cyan-bg))]',
        text: 'text-[hsl(var(--node-cyan-text))]',
        border: 'border-[hsl(var(--node-cyan-border))]'
    },
    green: {
        bg: 'bg-[hsl(var(--node-green-bg))]',
        text: 'text-[hsl(var(--node-green-text))]',
        border: 'border-[hsl(var(--node-green-border))]'
    },
    red: {
        bg: 'bg-[hsl(var(--node-red-bg))]',
        text: 'text-[hsl(var(--node-red-text))]',
        border: 'border-[hsl(var(--node-red-border))]'
    },
    pink: {
        bg: 'bg-[hsl(var(--node-pink-bg))]',
        text: 'text-[hsl(var(--node-pink-text))]',
        border: 'border-[hsl(var(--node-pink-border))]'
    },
    lime: {
        bg: 'bg-[hsl(var(--node-lime-bg))]',
        text: 'text-[hsl(var(--node-lime-text))]',
        border: 'border-[hsl(var(--node-lime-border))]'
    },
    indigo: {
        bg: 'bg-[hsl(var(--node-indigo-bg))]',
        text: 'text-[hsl(var(--node-indigo-text))]',
        border: 'border-[hsl(var(--node-indigo-border))]'
    },
};

const paletteByColor: Record<string, string> = {
    root: 'black', orange: 'orange', amber: 'orange', blue: 'blue', sky: 'blue', cyan: 'cyan',
    teal: 'teal', violet: 'purple', purple: 'purple', yellow: 'yellow', rose: 'yellow', grey: 'grey',
    emerald: 'cyan', green: 'green', red: 'red', pink: 'pink', lime: 'lime', indigo: 'indigo',
};

export const getPaletteName = (color: string | undefined, isRoot: boolean): string =>
    (color && paletteByColor[color]) || (isRoot ? 'black' : 'orange');

export const getBranchLineColor = (node: MindMapNode): string => {
    if (node.color?.startsWith('#')) return node.color;
    const palette = getPaletteName(node.color, node.parentId === null);
    return `hsl(var(--node-${palette === 'black' ? 'grey' : palette}-border))`;
};

export const NODE_SHADOW = 'shadow-[0_1px_2px_rgba(68,52,40,0.06),0_2px_6px_-1px_rgba(68,52,40,0.08)]';
export const NODE_SHADOW_HOVER = 'hover:shadow-[0_2px_4px_rgba(68,52,40,0.07),0_8px_18px_-6px_rgba(68,52,40,0.18)]';
const ROOT_SHADOW = 'shadow-[0_2px_4px_rgba(20,24,40,0.10),0_12px_28px_-10px_rgba(20,24,40,0.45)]';

export const getShapeStyles = (shape?: string, isRoot?: boolean): { className: string; style?: CSSProperties } => {
    const effectiveShape = shape || (isRoot ? 'circle' : 'rounded');

    const rootClass = isRoot ? ROOT_SHADOW : '';

    switch (effectiveShape) {
        case 'rectangle':
            return { className: `rounded-none ${rootClass}`.trim() };
        case 'pill':
            return { className: `rounded-full px-6 ${rootClass}`.trim() };
        case 'diamond':
            return {
                className: `px-10 py-6 border-0 ${rootClass}`.trim(),
                style: {
                    minWidth: '100px',
                    minHeight: '100px'
                }
            };
        case 'hexagon':
            return {
                className: `px-10 py-6 border-0 ${rootClass}`.trim(),
                style: {
                    minWidth: '120px',
                    minHeight: '80px'
                }
            };
        case 'circle':
            return {
                className: isRoot
                    ? `rounded-full aspect-square flex items-center justify-center px-4 py-4 w-32 ${ROOT_SHADOW}`
                    : `rounded-full aspect-square flex items-center justify-center min-w-[60px] min-h-[60px] ${rootClass}`.trim()
            };
        case 'parallelogram':
            return {
                className: `px-6 ${rootClass}`.trim(),
                style: { transform: 'skewX(-10deg)' }
            };
        case 'iso-cube':
        case 'isometric':
            return {
                className: 'px-8 py-4 shadow-xl',
                style: {
                    transform: 'rotateX(55deg) rotateZ(-45deg)',
                    boxShadow: '-4px 4px 0px rgba(0,0,0,0.2), -8px 8px 10px rgba(0,0,0,0.1)',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.4)',
                }
            };
        case 'cloud':
            return {
                className: `px-10 py-6 border-0 ${rootClass}`.trim(),
                style: {
                    minWidth: '120px',
                    minHeight: '80px'
                }
            };
        case 'rounded':
        default:
            return { className: `rounded-xl ${rootClass}`.trim() };
    }
};

const headingClasses: Record<string, string> = {
    h1: 'text-2xl leading-tight',
    h2: 'text-xl leading-tight',
    h3: 'text-lg leading-snug',
};

export const getTextFormatStyles = (node: MindMapNode, isRoot: boolean): { className: string; style: CSSProperties } => {
    const isBold = node.textBold ?? isRoot;
    const weight = isBold
        ? 'font-bold'
        : node.textHeading ? 'font-semibold' : 'font-medium';

    const align = node.textAlign === 'left'
        ? 'text-left'
        : node.textAlign === 'right' ? 'text-right' : 'text-center';

    const decorations = [
        node.textUnderline && 'underline',
        node.textStrike && 'line-through',
    ].filter(Boolean).join(' ');

    const fontStack = getFontStack(node.textFont);

    return {
        className: [
            weight,
            node.textItalic && 'italic',
            node.textHeading && headingClasses[node.textHeading],
            align,
        ].filter(Boolean).join(' '),
        style: {
            ...(decorations ? { textDecorationLine: decorations } : {}),
            ...(typeof node.textSize === 'number' ? { fontSize: `${clampTextSize(node.textSize)}px` } : {}),
            ...(fontStack ? { fontFamily: fontStack } : {}),
        },
    };
};
 