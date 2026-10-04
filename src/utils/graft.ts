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
import { MindMapNode, NodeColor } from '@/types/mindmap';
import { getNodeDimensions, isRootNode } from '@/utils/common';
import { layoutBranch } from '@/utils/layoutUtils';
import { remapNodeIds } from '@/utils/parsers/parserUtils';

const PARENT_CHILD_GAP = 200;
const SIBLING_GAP = 60;
const ROOT_CHILD_COLORS: NodeColor[] = ['orange', 'blue', 'cyan', 'yellow', 'grey', 'purple'];

export interface GraftOptions {
    keepColors?: boolean;
}

const descendantsOf = (topId: string, nodes: MindMapNode[]): MindMapNode[] => {
    const childrenOf = new Map<string, MindMapNode[]>();
    nodes.forEach((node) => {
        if (!node.parentId) return;
        const siblings = childrenOf.get(node.parentId);
        if (siblings) siblings.push(node);
        else childrenOf.set(node.parentId, [node]);
    });
    const result: MindMapNode[] = [];
    const seen = new Set<string>();
    const visit = (id: string) => (childrenOf.get(id) ?? []).forEach((child) => {
        if (seen.has(child.id)) return;
        seen.add(child.id);
        result.push(child);
        visit(child.id);
    });
    visit(topId);
    return result;
};

const verticalExtent = (nodes: MindMapNode[]) => nodes.reduce((extent, n) => {
    const half = getNodeDimensions(n).h / 2;
    return { top: Math.min(extent.top, n.y - half), bottom: Math.max(extent.bottom, n.y + half) };
}, { top: Infinity, bottom: -Infinity });

export const graftNodes = (
    imported: MindMapNode[],
    target: MindMapNode,
    existing: MindMapNode[],
    { keepColors = false }: GraftOptions = {}
): { nodes: MindMapNode[]; topIds: string[] } => {
    const fresh = remapNodeIds(imported).map(node => ({ ...node, measuredWidth: undefined, measuredHeight: undefined }));
    const freshIds = new Set(fresh.map(n => n.id));
    const isTop = (node: MindMapNode) =>
        node.parentId === null || node.parentId === DETACHED_PARENT_ID || !freshIds.has(node.parentId);
    const topIds = fresh.filter(isTop).map(n => n.id);
    if (topIds.length === 0) return { nodes: [], topIds: [] };

    const parent = existing.find(n => n.id === target.parentId);
    const side: 'left' | 'right' = parent && target.x < parent.x ? 'left' : 'right';
    const direction = side === 'right' ? 1 : -1;
    const existingChildren = existing.filter(n => n.parentId === target.id);
    const targetIsRoot = isRootNode(target);

    const branchColor = new Map<string, NodeColor>();
    topIds.forEach((id, i) => branchColor.set(id, targetIsRoot
        ? ROOT_CHILD_COLORS[(existingChildren.length + i) % ROOT_CHILD_COLORS.length]
        : target.color));
    let nodes = fresh.map((node): MindMapNode => {
        if (branchColor.has(node.id)) {
            return { ...node, parentId: target.id, color: branchColor.get(node.id)!, lineParentSide: undefined, lineChildSide: undefined };
        }
        return node;
    });
    if (!keepColors) {
        topIds.forEach((topId) => {
            const inBranch = new Set(descendantsOf(topId, nodes).map(n => n.id));
            nodes = nodes.map(node => (inBranch.has(node.id) ? { ...node, color: branchColor.get(topId)! } : node));
        });
    }

    const sameSide = existingChildren.filter(child => (child.x >= target.x) === (side === 'right'));
    let nextTop = sameSide.length > 0
        ? verticalExtent(sameSide.flatMap(child => [child, ...descendantsOf(child.id, existing)])).bottom + SIBLING_GAP
        : null;

    const targetHalfWidth = getNodeDimensions(target).w / 2;
    topIds.forEach((topId) => {
        nodes = layoutBranch(nodes, topId, side);
        const top = nodes.find(n => n.id === topId)!;
        const branch = [top, ...descendantsOf(topId, nodes)];
        const extent = verticalExtent(branch);
        const dx = target.x + direction * (targetHalfWidth + PARENT_CHILD_GAP + getNodeDimensions(top).w / 2);
        const dy = nextTop === null ? target.y : nextTop - extent.top;
        const ids = new Set(branch.map(n => n.id));
        nodes = nodes.map(node => (ids.has(node.id) ? { ...node, x: node.x + dx, y: node.y + dy } : node));
        nextTop = dy + extent.bottom + SIBLING_GAP;
    });

    return { nodes, topIds };
};
