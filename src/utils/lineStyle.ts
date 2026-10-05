/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import type { ConnectionStyle, LinePattern, LineShape, MindMapNode } from '@/types/mindmap';

export type LineStylePart = 'shape' | 'pattern' | 'arrow';

export interface LineStyleParts {
    shape: LineShape;
    pattern: LinePattern;
    arrow: boolean;
}

const SHAPES: readonly LineShape[] = ['curved', 'orthogonal', 'straight'];
const PATTERNS: readonly LinePattern[] = ['solid', 'dashed', 'dotted'];

export function parseConnectionStyle(style: string | undefined): LineStyleParts {
    if (style === 'dashed' || style === 'dotted') return { shape: 'curved', pattern: style, arrow: false };
    if (style === 'arrow') return { shape: 'curved', pattern: 'solid', arrow: true };
    const [shape, ...rest] = (style ?? 'curved').split('-');
    return {
        shape: shape === 'orthogonal' || shape === 'straight' ? shape : 'curved',
        pattern: rest.includes('dashed') ? 'dashed' : rest.includes('dotted') ? 'dotted' : 'solid',
        arrow: rest.includes('arrow'),
    };
}

export function composeConnectionStyle({ shape, pattern, arrow }: LineStyleParts): ConnectionStyle {
    if (shape === 'curved') {
        if (pattern === 'solid') return arrow ? 'arrow' : 'curved';
        if (!arrow) return pattern;
    }
    return [shape, ...(pattern === 'solid' ? [] : [pattern]), ...(arrow ? ['arrow'] : [])].join('-') as ConnectionStyle;
}

const KNOWN_STYLES = new Set<string>(['dashed', 'dotted', 'arrow', ...SHAPES.flatMap(shape => PATTERNS.flatMap(pattern =>
    [false, true].map(arrow => [shape, ...(pattern === 'solid' ? [] : [pattern]), ...(arrow ? ['arrow'] : [])].join('-'))))]);

export function isConnectionStyle(value: unknown): value is ConnectionStyle {
    return typeof value === 'string' && KNOWN_STYLES.has(value);
}

export function withGlobalLinePart(node: MindMapNode, part: LineStylePart): MindMapNode {
    const { lineType, linePattern, lineArrowDirection, ...rest } = node;
    if (!lineType && !linePattern && !lineArrowDirection) return node;
    const own = lineType ? parseConnectionStyle(lineType) : undefined;
    const next: MindMapNode = rest;
    if (part !== 'shape' && own) next.lineType = own.shape;
    const keptPattern = linePattern ?? (own && own.pattern !== 'solid' ? own.pattern : undefined);
    if (part !== 'pattern' && keptPattern) next.linePattern = keptPattern;
    const keptArrow = lineArrowDirection ?? (own?.arrow ? 'forward' : undefined);
    if (part !== 'arrow' && keptArrow) next.lineArrowDirection = keptArrow;
    return next;
}

export function lineShapeOf(type: ConnectionStyle | undefined): LineShape {
    return parseConnectionStyle(type).shape;
}

export function linePatternOf(type: ConnectionStyle | undefined, pattern?: LinePattern): LinePattern {
    return pattern ?? parseConnectionStyle(type).pattern;
}
