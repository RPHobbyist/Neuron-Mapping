/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { MindMapNode } from '@/types/mindmap';
import { useMemo } from 'react';
import { colorThemes } from './previewColorThemes';

interface DynamicTemplatePreviewProps {
    nodes: MindMapNode[];
    animated?: boolean;
}

export const DynamicTemplatePreview = ({ nodes, animated = false }: DynamicTemplatePreviewProps) => {
    const layout = useMemo(() => {
        if (!nodes || nodes.length === 0) return null;

        const xs = nodes.map(n => n.x);
        const ys = nodes.map(n => n.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const rangeX = maxX - minX || 1;
        const rangeY = maxY - minY || 1;

        const width = 320;
        const height = 240;
        const padding = 40;

        const scaleX = (width - padding * 2) / rangeX;
        const scaleY = (height - padding * 2) / rangeY;
        const scale = Math.min(scaleX, scaleY, 0.6);

        const svgCenterX = width / 2;
        const svgCenterY = height / 2;
        const contentCenterX = (minX + maxX) / 2;
        const contentCenterY = (minY + maxY) / 2;

        return {
            width,
            height,
            scale,
            offsetX: svgCenterX - contentCenterX * scale,
            offsetY: svgCenterY - contentCenterY * scale,
            nodeCount: nodes.length
        };
    }, [nodes]);

    if (!layout || !nodes.length) {
        return (
            <div className="w-full h-full bg-muted/50 flex items-center justify-center rounded-lg border border-dashed border-border">
                <span className="text-xs text-muted-foreground">Empty</span>
            </div>
        );
    }

    const { width, height, scale, offsetX, offsetY, nodeCount } = layout;

    const normalizeX = (x: number) => x * scale + offsetX;
    const normalizeY = (y: number) => y * scale + offsetY;
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    const baseNodeWidth = nodeCount > 20 ? 40 : nodeCount > 10 ? 60 : 80;
    const baseNodeHeight = nodeCount > 20 ? 15 : nodeCount > 10 ? 25 : 32;
    const baseFontSize = nodeCount > 20 ? 6 : nodeCount > 10 ? 8 : 10;

    let minGapX = Infinity;
    let minGapY = Infinity;
    nodes.forEach(node => {
        if (!node.parentId) return;
        const parent = nodeMap.get(node.parentId);
        if (!parent) return;
        const dx = Math.abs(node.x - parent.x) * scale;
        const dy = Math.abs(node.y - parent.y) * scale;
        if (dx > 2) minGapX = Math.min(minGapX, dx);
        if (dy > 2) minGapY = Math.min(minGapY, dy);
    });

    const nodeWidth = Math.max(18, Math.min(baseNodeWidth, isFinite(minGapX) ? minGapX * 0.85 : baseNodeWidth));
    const nodeHeight = Math.max(10, Math.min(baseNodeHeight, isFinite(minGapY) ? minGapY * 0.55 : baseNodeHeight));
    const fontSize = Math.max(5, Math.min(baseFontSize, nodeHeight * 0.5));

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full select-none"
            preserveAspectRatio="xMidYMid meet"
        >
            <defs>
                {Object.entries(colorThemes).map(([key, theme]) => (
                    <linearGradient key={key} id={`grad-${key}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={theme.from} />
                        <stop offset="100%" stopColor={theme.to} />
                    </linearGradient>
                ))}

                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.08" />
                </filter>
            </defs>

            <rect width="100%" height="100%" fill="#ffffff" opacity="0" />

            <g className="connections">
                {nodes.map(node => {
                    if (!node.parentId) return null;
                    const parent = nodeMap.get(node.parentId);
                    if (!parent) return null;

                    const x1 = normalizeX(parent.x);
                    const y1 = normalizeY(parent.y);
                    const x2 = normalizeX(node.x);
                    const y2 = normalizeY(node.y);

                    const theme = colorThemes[node.color] || colorThemes.grey;

                    const dx = x2 - x1;
                    const dy = y2 - y1;

                    const cp1x = x1 + dx * 0.5;
                    const cp2x = x2 - dx * 0.5;

                    const isVertical = Math.abs(dy) > Math.abs(dx) * 1.5;

                    let d = `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;
                    if (isVertical) {
                        d = `M ${x1} ${y1} C ${x1} ${y1 + dy * 0.5}, ${x2} ${y2 - dy * 0.5}, ${x2} ${y2}`;
                    }

                    return (
                        <path
                            key={`conn-${node.id}`}
                            d={d}
                            fill="none"
                            stroke={theme.border}
                            strokeWidth={scale < 0.4 ? 1.5 : 2}
                            strokeOpacity={0.4}
                            strokeLinecap="round"
                            className={animated ? "animate-draw" : ""}
                        />
                    );
                })}
            </g>

            <g className="nodes">
                {nodes.map(node => {
                    const x = normalizeX(node.x);
                    const y = normalizeY(node.y);
                    const isRoot = !node.parentId;

                    const themeKey = isRoot ? 'root' : (colorThemes[node.color] ? node.color : 'grey');
                    const theme = colorThemes[themeKey];

                    const w = isRoot ? nodeWidth * 1.2 : nodeWidth;
                    const h = isRoot ? nodeHeight * 1.15 : nodeHeight;
                    const fs = isRoot ? fontSize * 1.15 : fontSize;
                    const r = h / 2;

                    const charWidth = fs * 0.6;
                    const maxChars = Math.floor((w - 10) / charWidth);
                    const label = node.text.length > maxChars
                        ? node.text.substring(0, maxChars - 1) + '…'
                        : node.text;

                    return (
                        <g key={node.id} filter="url(#shadow)">
                            <rect
                                x={x - w / 2}
                                y={y - h / 2}
                                width={w}
                                height={h}
                                rx={r}
                                fill={isRoot ? theme.from : `url(#grad-${themeKey})`}
                                stroke={theme.border}
                                strokeWidth={isRoot ? 0 : 1}
                            />
                            <text
                                x={x}
                                y={y}
                                dy={fs * 0.35}
                                textAnchor="middle"
                                fontSize={fs}
                                fontWeight={isRoot ? 700 : 500}
                                fill={theme.text}
                                style={{ pointerEvents: 'none', fontFamily: 'Inter, sans-serif' }}
                            >
                                {label}
                            </text>
                        </g>
                    );
                })}
            </g>
        </svg>
    );
};
 