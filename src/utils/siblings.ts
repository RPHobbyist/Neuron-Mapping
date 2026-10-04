/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { DETACHED_PARENT_ID } from '@/lib/constants';
import { MindMapNode } from '@/types/mindmap';
import { hiddenNodeIds } from '@/utils/collapse';
import { getAutoConnectionSides, getDescendantIds, getNodeDimensions } from '@/utils/common';
import { visualOrder } from '@/utils/exporters/outline';

type Axis = 'x' | 'y';

const sizeAlong = (node: MindMapNode, axis: Axis) => (axis === 'x' ? getNodeDimensions(node).w : getNodeDimensions(node).h);

const spread = (list: MindMapNode[], axis: Axis) =>
    Math.max(...list.map(n => n[axis])) - Math.min(...list.map(n => n[axis]));

export const siblingsOf = (node: MindMapNode, nodes: MindMapNode[]): MindMapNode[] => {
    if (!node.parentId || node.parentId === DETACHED_PARENT_ID) return [];
    return visualOrder(nodes.filter(n => n.parentId === node.parentId));
};

export interface SiblingLine {
    axis: Axis;
    siblings: MindMapNode[];
}

export const siblingLine = (node: MindMapNode, nodes: MindMapNode[]): SiblingLine | null => {
    const parent = node.parentId && node.parentId !== DETACHED_PARENT_ID
        ? nodes.find(n => n.id === node.parentId)
        : undefined;
    if (!parent) return null;
    const all = nodes.filter(n => n.parentId === parent.id);

    const onSameSide = (across: Axis): MindMapNode[] => {
        const isClear = (n: MindMapNode) =>
            Math.abs(n[across] - parent[across]) * 2 > sizeAlong(n, across) + sizeAlong(parent, across);
        const side = Math.sign(node[across] - parent[across]);
        return isClear(node) ? all.filter(n => isClear(n) && Math.sign(n[across] - parent[across]) === side) : [node];
    };
    const inOrder = (siblings: MindMapNode[], axis: Axis): SiblingLine => {
        const cross = axis === 'x' ? 'y' : 'x';
        return { axis, siblings: [...siblings].sort((a, b) => a[axis] - b[axis] || a[cross] - b[cross]) };
    };

    const column = onSameSide('x');
    if (column.length > 1 && spread(column, 'y') >= spread(column, 'x')) return inOrder(column, 'y');
    const row = onSameSide('y');
    if (row.length > 1 && spread(row, 'x') > spread(row, 'y')) return inOrder(row, 'x');

    const { from } = getAutoConnectionSides(parent, node);
    return { axis: from === 'left' || from === 'right' ? 'y' : 'x', siblings: [node] };
};

const extentOf = (ids: Set<string>, nodes: MindMapNode[], hidden: Set<string>, axis: Axis) => {
    const branch = nodes.filter(n => ids.has(n.id) && !hidden.has(n.id));
    return {
        start: Math.min(...branch.map(n => n[axis] - sizeAlong(n, axis) / 2)),
        end: Math.max(...branch.map(n => n[axis] + sizeAlong(n, axis) / 2)),
    };
};

export const swapWithSibling = (nodes: MindMapNode[], id: string, direction: -1 | 1): MindMapNode[] => {
    const node = nodes.find(n => n.id === id);
    const line = node && siblingLine(node, nodes);
    if (!node || !line) return nodes;
    const neighbour = line.siblings[line.siblings.findIndex(n => n.id === id) + direction];
    if (!neighbour) return nodes;

    const { axis } = line;
    const [first, second] = direction === 1 ? [node, neighbour] : [neighbour, node];
    const firstIds = getDescendantIds(first.id, nodes);
    const secondIds = getDescendantIds(second.id, nodes);
    const hidden = hiddenNodeIds(nodes);
    const a = extentOf(firstIds, nodes, hidden, axis);
    const b = extentOf(secondIds, nodes, hidden, axis);

    let firstShift = b.end - a.end;
    let secondShift = a.start - b.start;
    const apart = a.start <= b.start && a.end <= b.end;
    if (!apart || second[axis] + secondShift >= first[axis] + firstShift) {
        firstShift = second[axis] - first[axis];
        secondShift = -firstShift;
    }
    if (firstShift === 0 && secondShift === 0) return nodes;

    return nodes.map((n) => {
        if (firstIds.has(n.id)) return { ...n, [axis]: n[axis] + firstShift };
        if (secondIds.has(n.id)) return { ...n, [axis]: n[axis] + secondShift };
        return n;
    });
};
