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

export const DEFAULT_NODE_WIDTH = 150;
export const DEFAULT_NODE_HEIGHT = 60;
export const NODE_PLACEMENT_GAP = 30;
const SIBLING_PLACEMENT_STEPS = 60;

export const getNodeSize = (node: MindMapNode) => ({
    width: node.measuredWidth || node.width || DEFAULT_NODE_WIDTH,
    height: node.measuredHeight || node.height || DEFAULT_NODE_HEIGHT,
});

export const rectsOverlap = (
    x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number
) => (
    Math.abs(x1 - x2) * 2 < w1 + w2 + NODE_PLACEMENT_GAP &&
    Math.abs(y1 - y2) * 2 < h1 + h2 + NODE_PLACEMENT_GAP
);

export const isClearAt = (x: number, y: number, width: number, height: number, others: MindMapNode[]) => others.every((n) => {
    const size = getNodeSize(n);
    return !rectsOverlap(x, y, width, height, n.x, n.y, size.width, size.height);
});

export const findClearPositionAlong = (
    startX: number,
    startY: number,
    axis: 'x' | 'y',
    width: number,
    height: number,
    others: MindMapNode[]
) => {
    for (let step = 0; step < SIBLING_PLACEMENT_STEPS; step++) {
        const x = startX + (axis === 'x' ? step * NODE_PLACEMENT_GAP : 0);
        const y = startY + (axis === 'y' ? step * NODE_PLACEMENT_GAP : 0);
        if (isClearAt(x, y, width, height, others)) return { x, y };
    }
    return null;
};

export const findClearPosition = (
    startX: number,
    startY: number,
    originX: number,
    originY: number,
    width: number,
    height: number,
    others: MindMapNode[]
) => {
    const isClear = (x: number, y: number) => isClearAt(x, y, width, height, others);

    if (isClear(startX, startY)) return { x: startX, y: startY };

    const baseRadius = Math.max(Math.hypot(startX - originX, startY - originY), width, height);
    const ringGap = Math.max(width, height) + NODE_PLACEMENT_GAP;

    for (let ring = 1; ring <= 24; ring++) {
        const radius = baseRadius + ring * ringGap;
        const steps = 10 + ring * 4;
        for (let i = 0; i < steps; i++) {
            const angle = (i / steps) * Math.PI * 2;
            const x = originX + Math.cos(angle) * radius;
            const y = originY + Math.sin(angle) * radius;
            if (isClear(x, y)) return { x, y };
        }
    }

    return { x: startX, y: startY };
};
