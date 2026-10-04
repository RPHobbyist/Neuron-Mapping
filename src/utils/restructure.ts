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
import { MindMapNode, Side } from '@/types/mindmap';
import { getAutoConnectionSides, getDescendantIds, isRootNode } from '@/utils/common';
import {
    DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH, NODE_PLACEMENT_GAP, findClearPosition, findClearPositionAlong, getNodeSize, isClearAt,
} from '@/utils/placement';
import { siblingLine } from '@/utils/siblings';

const CHILD_GAP_X = 50;
const CHILD_GAP_Y = 60;
const BRANCH_PLACEMENT_STEPS = 200;

const parentOf = (node: MindMapNode, nodes: MindMapNode[]): MindMapNode | undefined =>
    node.parentId && node.parentId !== DETACHED_PARENT_ID ? nodes.find(n => n.id === node.parentId) : undefined;

const childStart = (top: MindMapNode, parent: MindMapNode, others: MindMapNode[], after?: MindMapNode) => {
    const size = getNodeSize(top);
    const anchor = after ?? others.find(n => n.parentId === parent.id);
    const line = anchor && siblingLine(anchor, others);

    if (line) {
        const last = after ?? line.siblings[line.siblings.length - 1];
        const lastSize = getNodeSize(last);
        const past = NODE_PLACEMENT_GAP + (line.axis === 'y'
            ? (lastSize.height + size.height) / 2
            : (lastSize.width + size.width) / 2);
        return {
            x: last.x + (line.axis === 'x' ? past : 0),
            y: last.y + (line.axis === 'y' ? past : 0),
            axis: line.axis,
            origin: last,
        };
    }

    const grandparent = parentOf(parent, others);
    const side: Side = grandparent ? getAutoConnectionSides(grandparent, parent).from : (top.x >= parent.x ? 'right' : 'left');
    const parentSize = getNodeSize(parent);
    const awayX = (parentSize.width + size.width) / 2 + CHILD_GAP_X;
    const awayY = (parentSize.height + size.height) / 2 + CHILD_GAP_Y;
    return {
        x: parent.x + (side === 'right' ? awayX : side === 'left' ? -awayX : 0),
        y: parent.y + (side === 'bottom' ? awayY : side === 'top' ? -awayY : 0),
        axis: (side === 'left' || side === 'right' ? 'y' : 'x') as 'x' | 'y',
        origin: parent,
    };
};

const branchSpot = (top: MindMapNode, branch: MindMapNode[], parent: MindMapNode, others: MindMapNode[], after?: MindMapNode) => {
    const start = childStart(top, parent, others, after);
    const fits = (x: number, y: number) => branch.every((n) => {
        const size = getNodeSize(n);
        return isClearAt(n.x + x - top.x, n.y + y - top.y, size.width, size.height, others);
    });
    for (let step = 0; step < BRANCH_PLACEMENT_STEPS; step++) {
        const x = start.x + (start.axis === 'x' ? step * NODE_PLACEMENT_GAP : 0);
        const y = start.y + (start.axis === 'y' ? step * NODE_PLACEMENT_GAP : 0);
        if (fits(x, y)) return { x, y };
    }
    const size = getNodeSize(top);
    return findClearPositionAlong(start.x, start.y, start.axis, size.width, size.height, others)
        ?? findClearPosition(start.x, start.y, start.origin.x, start.origin.y, size.width, size.height, others);
};

export const canMoveBranchTo = (nodes: MindMapNode[], id: string, targetId: string): boolean => {
    const node = nodes.find(n => n.id === id);
    if (!node || isRootNode(node) || !nodes.some(n => n.id === targetId)) return false;
    return !getDescendantIds(id, nodes).has(targetId);
};

export const moveBranchTo = (nodes: MindMapNode[], id: string, targetId: string, afterId?: string): MindMapNode[] => {
    if (!canMoveBranchTo(nodes, id, targetId)) return nodes;
    const node = nodes.find(n => n.id === id)!;
    if (node.parentId === targetId && !afterId) return nodes;

    const branch = getDescendantIds(id, nodes);
    const others = nodes.filter(n => !branch.has(n.id));
    const target = others.find(n => n.id === targetId)!;
    const after = afterId ? others.find(n => n.id === afterId) : undefined;
    const spot = branchSpot(node, nodes.filter(n => branch.has(n.id)), target, others, after);
    const dx = spot.x - node.x;
    const dy = spot.y - node.y;

    return nodes.map((n) => {
        if (n.id === id) {
            return { ...n, parentId: targetId, x: n.x + dx, y: n.y + dy, lineParentSide: undefined, lineChildSide: undefined };
        }
        if (branch.has(n.id)) return { ...n, x: n.x + dx, y: n.y + dy };
        if (n.id === targetId && n.collapsed) return { ...n, collapsed: undefined };
        return n;
    });
};

export const outdentBranch = (nodes: MindMapNode[], id: string): MindMapNode[] => {
    const node = nodes.find(n => n.id === id);
    const parent = node && parentOf(node, nodes);
    const grandparent = parent && parentOf(parent, nodes);
    if (!parent || !grandparent) return nodes;
    return moveBranchTo(nodes, id, grandparent.id, parent.id);
};

export const insertParentNode = (
    nodes: MindMapNode[],
    id: string,
    newNode: Pick<MindMapNode, 'id' | 'text'>
): MindMapNode[] | null => {
    const node = nodes.find(n => n.id === id);
    if (!node || isRootNode(node)) return null;
    const parent = parentOf(node, nodes);

    const side: Side = parent ? getAutoConnectionSides(parent, node).from : 'right';
    const shiftX = side === 'right' ? DEFAULT_NODE_WIDTH + CHILD_GAP_X : side === 'left' ? -(DEFAULT_NODE_WIDTH + CHILD_GAP_X) : 0;
    const shiftY = side === 'bottom' ? DEFAULT_NODE_HEIGHT + CHILD_GAP_Y : side === 'top' ? -(DEFAULT_NODE_HEIGHT + CHILD_GAP_Y) : 0;
    const branch = getDescendantIds(id, nodes);

    const inserted: MindMapNode = {
        id: newNode.id,
        text: newNode.text,
        x: node.x,
        y: node.y,
        color: node.color,
        parentId: parent ? parent.id : DETACHED_PARENT_ID,
        lineParentSide: node.lineParentSide,
    };
    const moved = nodes.map((n) => {
        if (n.id === id) {
            return { ...n, parentId: newNode.id, x: n.x + shiftX, y: n.y + shiftY, lineParentSide: undefined, lineChildSide: undefined };
        }
        return branch.has(n.id) ? { ...n, x: n.x + shiftX, y: n.y + shiftY } : n;
    });
    return [...moved, inserted];
};
