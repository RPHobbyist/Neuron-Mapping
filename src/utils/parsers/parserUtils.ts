/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { detachParentCycles, generateId } from '@/utils/common';
import { MindMapNode, NodeColor } from '@/types/mindmap';

const colors: NodeColor[] = ['orange', 'blue', 'cyan', 'yellow', 'green', 'purple', 'pink', 'red', 'teal', 'grey'];

export const getColorByDepth = (depth: number): NodeColor => colors[depth % colors.length];

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B-\u001F\u007F]/g;

export const sanitizeText = (text: string): string => {
    if (!text) return '';
    return text.replace(CONTROL_CHARS, '');
};

export const createRootNode = (text: string): MindMapNode => ({
    id: generateId(),
    text: sanitizeText(text),
    x: 0,
    y: 0,
    color: 'root',
    parentId: null
});

export const createChildNode = (text: string, parentId: string, depth: number): MindMapNode => ({
    id: generateId(),
    text: sanitizeText(text),
    x: 0,
    y: 0,
    color: getColorByDepth(depth),
    parentId
});

export function remapNodeIds(nodes: MindMapNode[]): MindMapNode[] {
    const idMap = new Map<string, string>();
    nodes.forEach(n => idMap.set(n.id, generateId()));

    return detachParentCycles(nodes).map(n => ({
        ...n,
        id: idMap.get(n.id)!,
        parentId: n.parentId ? (idMap.get(n.parentId) ?? n.parentId) : n.parentId,
        relations: n.relations?.map(r => ({
            ...r,
            targetId: idMap.get(r.targetId) ?? r.targetId,
            sourceId: r.sourceId ? (idMap.get(r.sourceId) ?? r.sourceId) : r.sourceId,
        })),
    }));
}

export { generateId };
 