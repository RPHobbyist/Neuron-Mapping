/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { MindMapNode, Side, Drawing, BoxArea } from '@/types/mindmap';
import { DETACHED_PARENT_ID } from '@/lib/constants';

export const generateId = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
};

const DATA_IMAGE_URI_RE = /^data:image\/(png|jpe?g|gif|webp|bmp|x-icon|vnd\.microsoft\.icon);base64,[A-Za-z0-9+/]+=*$/;
const BARE_HOSTNAME_RE = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}(:\d+)?([/?#][^\s]*)?$/;

export const getContrastTextColor = (hexColor: string): string => {
    const hex = hexColor.replace('#', '');
    const normalized = hex.length === 3
        ? hex.split('').map((c) => c + c).join('')
        : hex;
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return '#ffffff';

    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.6 ? '#000000' : '#ffffff';
};

const resolvedColors = new Map<string, [number, number, number] | null>();

const resolveColor = (color: string): [number, number, number] | null => {
    const cacheKey = `${document.documentElement.className}|${color}`;
    const cached = resolvedColors.get(cacheKey);
    if (cached !== undefined) return cached;
    const probe = document.createElement('span');
    probe.style.color = color;
    probe.style.display = 'none';
    document.body.appendChild(probe);
    const match = getComputedStyle(probe).color.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
    probe.remove();
    const rgb = match ? [Number(match[1]), Number(match[2]), Number(match[3])] as [number, number, number] : null;
    resolvedColors.set(cacheKey, rgb);
    return rgb;
};

const relativeLuminance = ([r, g, b]: [number, number, number]) => {
    const channel = (value: number) => {
        const c = value / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

export const DARK_TEXT = '#111827';
export const LIGHT_TEXT = '#ffffff';

export const readableTextOn = (color: string): string => {
    const rgb = resolveColor(color);
    if (!rgb) return DARK_TEXT;
    const luminance = relativeLuminance(rgb);
    const darkContrast = (luminance + 0.05) / (relativeLuminance([17, 24, 39]) + 0.05);
    const lightContrast = 1.05 / (luminance + 0.05);
    return darkContrast >= lightContrast ? DARK_TEXT : LIGHT_TEXT;
};

export const sanitizeImageUrl =(url: string | undefined): string | undefined => {
    if (!url) return undefined;
    const trimmed = url.trim();
    if (DATA_IMAGE_URI_RE.test(trimmed)) {
        return trimmed;
    }
    return sanitizeUrl(trimmed);
};

export const sanitizeUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;

    const trimmed = url.trim();

    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
        return trimmed;
    }

    try {
        const parsed = new URL(trimmed);
        const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
        if (allowedProtocols.includes(parsed.protocol)) {
            return trimmed;
        }
    } catch (e) {
        if (BARE_HOSTNAME_RE.test(trimmed)) {
            return `https://${trimmed}`;
        }
        if (/^[a-zA-Z0-9.\-_~+/?#&%=]+$/.test(trimmed) && !trimmed.includes(':')) {
            return trimmed;
        }
    }

    return undefined;
};

export const isRootNode = (node: Pick<MindMapNode, 'parentId'>): boolean => node.parentId === null;


export const getDescendantIds = (nodeId: string, nodes: MindMapNode[]): Set<string> => {
    const childrenByParent = new Map<string, string[]>();
    nodes.forEach(n => {
        if (!n.parentId) return;
        const siblings = childrenByParent.get(n.parentId);
        if (siblings) siblings.push(n.id); else childrenByParent.set(n.parentId, [n.id]);
    });
    const descendants = new Set<string>([nodeId]);
    const queue = [nodeId];
    while (queue.length > 0) {
        (childrenByParent.get(queue.shift()!) ?? []).forEach(childId => {
            if (descendants.has(childId)) return;
            descendants.add(childId);
            queue.push(childId);
        });
    }
    return descendants;
};

export const detachParentCycles = (nodes: MindMapNode[]): MindMapNode[] => {
    const byId = new Map(nodes.map(n => [n.id, n]));
    const toDetach = new Set<string>();
    const settled = new Set<string>();

    nodes.forEach(start => {
        const path: string[] = [];
        const onPath = new Set<string>();
        let current: MindMapNode | undefined = start;
        while (current && !settled.has(current.id)) {
            if (onPath.has(current.id)) {
                toDetach.add(current.id);
                break;
            }
            path.push(current.id);
            onPath.add(current.id);
            current = current.parentId && !toDetach.has(current.id) ? byId.get(current.parentId) : undefined;
        }
        path.forEach(id => settled.add(id));
    });

    if (toDetach.size === 0) return nodes;
    return nodes.map(n => (toDetach.has(n.id)
        ? { ...n, parentId: DETACHED_PARENT_ID, lineParentSide: undefined, lineChildSide: undefined }
        : n));
};

export const findRootNode = (nodes: MindMapNode[]): MindMapNode | undefined => {
    return nodes.find(n => n.parentId === null || n.parentId === undefined);
};

export const getAncestorIds = (nodeId: string, nodes: MindMapNode[]): Set<string> => {
    const byId = new Map(nodes.map(n => [n.id, n]));
    const ancestors = new Set<string>();
    let current = byId.get(nodeId);
    while (current?.parentId && !ancestors.has(current.parentId)) {
        ancestors.add(current.parentId);
        current = byId.get(current.parentId);
    }
    return ancestors;
};

export const areNodesConnected = (
    a: MindMapNode,
    b: MindMapNode,
    ignoreRelation?: { sourceId: string; targetId: string }
): boolean => {
    const hasRelation = (from: MindMapNode, to: MindMapNode) => !!from.relations?.some(r => r.targetId === to.id
        && !(ignoreRelation && ignoreRelation.sourceId === from.id && ignoreRelation.targetId === to.id));
    return a.parentId === b.id || b.parentId === a.id || hasRelation(a, b) || hasRelation(b, a);
};

export const boxContainsPoint = (box: BoxArea, x: number, y: number): boolean =>
    x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;

export const releaseTextFocus = (): void => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) return;
    if (active.isContentEditable || active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT') {
        active.blur();
    }
};

export const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
};

export const lerp = (start: number, end: number, t: number): number => {
    return start + (end - start) * t;
};

export const getNodeDimensions = (node: MindMapNode): { w: number; h: number } => {
    if (node.measuredWidth && node.measuredHeight) {
        return { w: node.measuredWidth, h: node.measuredHeight };
    }
    if (node.width && node.height) {
        return { w: node.width, h: node.height };
    }
    if (node.shape === 'circle' || (!node.shape && isRootNode(node))) {
        return { w: 128, h: 128 };
    }
    return { w: Math.max(100, node.text.length * 8 + 48), h: 50 };
};

export interface ContentBounds { minX: number; minY: number; maxX: number; maxY: number }

export const getContentBounds = (nodes: MindMapNode[], drawings: Drawing[] = [], boxAreas: BoxArea[] = []): ContentBounds | null => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(n => {
        const { w, h } = getNodeDimensions(n);
        minX = Math.min(minX, n.x - w / 2);
        maxX = Math.max(maxX, n.x + w / 2);
        minY = Math.min(minY, n.y - h / 2);
        maxY = Math.max(maxY, n.y + h / 2);
    });
    drawings.forEach(d => d.points.forEach(p => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
    }));
    boxAreas.forEach(b => {
        minX = Math.min(minX, b.x);
        maxX = Math.max(maxX, b.x + b.width);
        minY = Math.min(minY, b.y);
        maxY = Math.max(maxY, b.y + b.height);
    });
    return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : null;
};

export const getAutoConnectionSides = (from: MindMapNode, to: MindMapNode): { from: Side; to: Side } => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    const fromSize = getNodeDimensions(from);
    const toSize = getNodeDimensions(to);
    const gapX = Math.abs(dx) - (fromSize.w / 2 + toSize.w / 2);
    const gapY = Math.abs(dy) - (fromSize.h / 2 + toSize.h / 2);

    if (gapX >= gapY) {
        return dx > 0 ? { from: 'right', to: 'left' } : { from: 'left', to: 'right' };
    }
    return dy > 0 ? { from: 'bottom', to: 'top' } : { from: 'top', to: 'bottom' };
};

export type ArrowPointing = 'left' | 'right' | 'up' | 'down';

const POINTING_INTO: Record<Side, ArrowPointing> = { left: 'right', right: 'left', top: 'down', bottom: 'up' };

export const getArrowheadPointing = (
    from: MindMapNode,
    to: MindMapNode,
    fromOverride?: Side,
    toOverride?: Side,
): { start: ArrowPointing; end: ArrowPointing } => {
    const auto = getAutoConnectionSides(from, to);
    return {
        start: (fromOverride && POINTING_INTO[fromOverride]) || POINTING_INTO[auto.from],
        end: (toOverride && POINTING_INTO[toOverride]) || POINTING_INTO[auto.to],
    };
};

 