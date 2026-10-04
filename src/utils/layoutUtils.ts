/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { MindMapNode, BoxArea } from '@/types/mindmap';
import { carryHiddenBranches, hiddenNodeIds } from '@/utils/collapse';
import { boxContainsPoint } from '@/utils/common';


const CONFIG = {
    HORIZONTAL: {
        PARENT_CHILD_GAP: 200,
        SIBLING_GAP: 60,
    },
    VERTICAL: {
        LEVEL_GAP: 150,
        SIBLING_GAP: 40,
    },
    RADIAL: {
        RING_GAP: 300,
        NODE_GAP: 40,
    },
    FISHBONE: {
        OFFSET: 120,
        STEP: 70,
        GAP: 60,
        MIN_STEP: 160,
        HEAD_GAP: 120,
    },
    TREE_GAP: {
        horizontal: 120,
        logic: 120,
        vertical: 150,
        timeline: 150,
        radial: 300,
        fishbone: 150,
    },
    TIMELINE: {
        COLUMN_GAP: 80,
        LEVEL_GAP: 110,
    },
} as const;


interface TreeNode {
    id: string;
    node: MindMapNode;
    children: TreeNode[];
    width: number;
    height: number;
    x: number;
    y: number;
    subtreeHeight?: number;
    subtreeWidth?: number;
    weight?: number;
    angle?: number;
    rx?: number;
    ry?: number;
}

export type LayoutDirection = 'horizontal' | 'logic' | 'vertical' | 'timeline' | 'radial' | 'fishbone';

export const LAYOUTS: { type: LayoutDirection; label: string }[] = [
    { type: 'horizontal', label: 'Horizontal Map' },
    { type: 'logic', label: 'Logic Chart' },
    { type: 'vertical', label: 'Tree Chart' },
    { type: 'timeline', label: 'Timeline' },
    { type: 'radial', label: 'Radial Map' },
    { type: 'fishbone', label: 'Fishbone' },
];


export const autoLayoutNodes = (
    nodes: MindMapNode[],
    direction: LayoutDirection = 'horizontal'
): MindMapNode[] => {
    const hidden = hiddenNodeIds(nodes);
    if (hidden.size === 0) return layoutTrees(nodes, direction);

    const opened = layoutTrees(nodes, direction);
    const shown = new Map(layoutTrees(opened.filter(node => !hidden.has(node.id)), direction).map(node => [node.id, node]));
    return carryHiddenBranches(opened, opened.map(node => shown.get(node.id) ?? node));
};

const layoutTrees = (nodes: MindMapNode[], direction: LayoutDirection): MindMapNode[] => {
    if (nodes.length === 0) return [];

    const { nodeMap, rootNodes } = buildTree(nodes);
    if (rootNodes.length === 0) return nodes;

    let previousEdge: number | null = null;
    rootNodes.forEach(root => {
        switch (direction) {
            case 'horizontal':
                layoutHorizontal(root);
                applyRelativePositions(root, 0, 0);
                break;
            case 'logic':
                layoutHorizontalBranch(root, 'right');
                applyRelativePositions(root, 0, 0);
                break;
            case 'timeline':
                layoutTimeline(root);
                applyRelativePositions(root, 0, 0);
                break;
            case 'vertical':
                layoutVertical(root);
                applyRelativePositions(root, 0, 0);
                break;
            case 'radial':
                layoutRadial(root);
                break;
            case 'fishbone':
                layoutFishbone(root);
                applyRelativePositions(root, 0, 0);
                break;
        }

        const bounds = getTreeBounds(root);
        const gap = CONFIG.TREE_GAP[direction];
        if (direction === 'radial') {
            const dx = previousEdge === null ? 0 : previousEdge + gap - bounds.minX;
            offsetTree(root, dx, 0);
            previousEdge = bounds.maxX + dx;
        } else {
            const dy = previousEdge === null ? 0 : previousEdge + gap - bounds.minY;
            offsetTree(root, 0, dy);
            previousEdge = bounds.maxY + dy;
        }
    });

    return Array.from(nodeMap.values()).map(tn => ({
        ...tn.node,
        x: tn.x,
        y: tn.y
    }));
};


export const layoutSubtree = (nodes: MindMapNode[], topId: string, direction: LayoutDirection): MindMapNode[] => {
    const top = nodes.find(n => n.id === topId);
    if (!top) return nodes;
    const ids = new Set([topId]);
    for (let grew = true; grew;) {
        grew = false;
        nodes.forEach((n) => {
            if (n.parentId && ids.has(n.parentId) && !ids.has(n.id)) {
                ids.add(n.id);
                grew = true;
            }
        });
    }
    if (ids.size < 2) return nodes;
    const branch = nodes.filter(n => ids.has(n.id)).map(n => (n.id === topId ? { ...n, parentId: null } : n));
    const laidOut = new Map(autoLayoutNodes(branch, direction).map(n => [n.id, n]));
    const placedTop = laidOut.get(topId)!;
    const dx = top.x - placedTop.x;
    const dy = top.y - placedTop.y;
    return nodes.map((n) => {
        const placed = laidOut.get(n.id);
        return placed ? { ...n, x: placed.x + dx, y: placed.y + dy } : n;
    });
};

export const layoutBranch = (nodes: MindMapNode[], topId: string, side: 'left' | 'right'): MindMapNode[] => {
    const { nodeMap } = buildTree(nodes);
    const top = nodeMap.get(topId);
    if (!top) return nodes;

    layoutHorizontalBranch(top, side);
    top.rx = 0;
    top.ry = 0;
    applyRelativePositions(top, 0, 0);

    const moved = new Map(subtree(top).map(node => [node.id, node]));
    return nodes.map((node) => {
        const laidOut = moved.get(node.id);
        return laidOut ? { ...node, x: laidOut.x, y: laidOut.y } : node;
    });
};


function subtree(top: TreeNode): TreeNode[] {
    const order: TreeNode[] = [];
    const seen = new Set<TreeNode>();
    const stack = [top];
    while (stack.length > 0) {
        const node = stack.pop()!;
        if (seen.has(node)) continue;
        seen.add(node);
        order.push(node);
        for (let i = node.children.length - 1; i >= 0; i--) stack.push(node.children[i]);
    }
    return order;
}

function buildTree(nodes: MindMapNode[]): { nodeMap: Map<string, TreeNode>; rootNodes: TreeNode[] } {
    const nodeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    nodes.forEach(node => {
        nodeMap.set(node.id, {
            id: node.id,
            node: { ...node },
            children: [],
            width: node.measuredWidth || node.width || 150,
            height: node.measuredHeight || node.height || 60,
            x: 0,
            y: 0
        });
    });

    nodes.forEach(node => {
        const treeNode = nodeMap.get(node.id)!;
        if (node.parentId) {
            const parent = nodeMap.get(node.parentId);
            if (parent) {
                parent.children.push(treeNode);
            } else {
                rootNodes.push(treeNode);
            }
        } else {
            rootNodes.push(treeNode);
        }
    });

    return { nodeMap, rootNodes };
}


function layoutHorizontal(root: TreeNode): void {
    if (root.children.length === 0) {
        root.subtreeHeight = root.height;
        return;
    }

    root.children.forEach(child => calculateSubtreeWeight(child));

    const { left, right } = balanceChildrenByWeight(root.children);

    left.forEach(child => layoutHorizontalBranch(child, 'left'));
    right.forEach(child => layoutHorizontalBranch(child, 'right'));

    positionHorizontalChildren(root, left, 'left');
    positionHorizontalChildren(root, right, 'right');

    const leftHeight = calculateGroupHeight(left);
    const rightHeight = calculateGroupHeight(right);
    root.subtreeHeight = Math.max(root.height, leftHeight, rightHeight);
}

function layoutHorizontalBranch(top: TreeNode, direction: 'left' | 'right'): void {
    subtree(top).reverse().forEach(node => placeHorizontalChildren(node, direction));
}

function placeHorizontalChildren(node: TreeNode, direction: 'left' | 'right'): void {
    if (node.children.length === 0) {
        node.subtreeHeight = node.height;
        return;
    }

    const childrenHeight = node.children.reduce((sum, c) => sum + (c.subtreeHeight || c.height), 0)
        + (node.children.length - 1) * CONFIG.HORIZONTAL.SIBLING_GAP;
    node.subtreeHeight = Math.max(node.height, childrenHeight);

    let currentY = -childrenHeight / 2;
    node.children.forEach(child => {
        const dx = node.width / 2 + CONFIG.HORIZONTAL.PARENT_CHILD_GAP + child.width / 2;
        child.rx = direction === 'right' ? dx : -dx;
        child.ry = currentY + (child.subtreeHeight || child.height) / 2;
        currentY += (child.subtreeHeight || child.height) + CONFIG.HORIZONTAL.SIBLING_GAP;
    });
}

function positionHorizontalChildren(parent: TreeNode, children: TreeNode[], direction: 'left' | 'right'): void {
    if (children.length === 0) return;

    const totalHeight = calculateGroupHeight(children);
    let currentY = -totalHeight / 2;

    children.forEach(child => {
        const dx = parent.width / 2 + CONFIG.HORIZONTAL.PARENT_CHILD_GAP + child.width / 2;
        child.rx = direction === 'right' ? dx : -dx;
        child.ry = currentY + (child.subtreeHeight || child.height) / 2;
        currentY += (child.subtreeHeight || child.height) + CONFIG.HORIZONTAL.SIBLING_GAP;
    });
}

function balanceChildrenByWeight(children: TreeNode[]): { left: TreeNode[]; right: TreeNode[] } {
    if (children.length <= 1) {
        return { left: [], right: children };
    }

    const weights = children.map(child => child.weight || 1);
    const total = weights.reduce((sum, w) => sum + w, 0);

    let bestSplit = 1;
    let bestDiff = Infinity;
    let prefix = 0;
    for (let split = 1; split < children.length; split++) {
        prefix += weights[split - 1];
        const diff = Math.abs(2 * prefix - total);
        if (diff < bestDiff) {
            bestDiff = diff;
            bestSplit = split;
        }
    }

    return {
        right: children.slice(0, bestSplit),
        left: children.slice(bestSplit).reverse(),
    };
}

function calculateGroupHeight(nodes: TreeNode[]): number {
    if (nodes.length === 0) return 0;
    return nodes.reduce((sum, n) => sum + (n.subtreeHeight || n.height), 0)
        + (nodes.length - 1) * CONFIG.HORIZONTAL.SIBLING_GAP;
}

function calculateSubtreeWeight(top: TreeNode): number {
    subtree(top).reverse().forEach((node) => {
        node.weight = node.children.length === 0 ? 1 : node.children.reduce((sum, child) => sum + (child.weight || 1), 0);
    });
    return top.weight!;
}


function layoutVertical(root: TreeNode): void {
    layoutVerticalBranch(root);
}

function layoutVerticalBranch(top: TreeNode): void {
    subtree(top).reverse().forEach(placeVerticalChildren);
}

function placeVerticalChildren(node: TreeNode): void {
    if (node.children.length === 0) {
        node.subtreeWidth = node.width;
        node.subtreeHeight = node.height;
        return;
    }

    const childrenWidth = node.children.reduce((sum, c) => sum + (c.subtreeWidth || c.width), 0)
        + (node.children.length - 1) * CONFIG.VERTICAL.SIBLING_GAP;
    node.subtreeWidth = Math.max(node.width, childrenWidth);

    const maxChildHeight = node.children.reduce((max, c) => Math.max(max, c.subtreeHeight || c.height), 0);
    node.subtreeHeight = node.height + CONFIG.VERTICAL.LEVEL_GAP + maxChildHeight;

    let currentX = -childrenWidth / 2;
    node.children.forEach(child => {
        child.rx = currentX + (child.subtreeWidth || child.width) / 2;
        child.ry = node.height / 2 + CONFIG.VERTICAL.LEVEL_GAP + child.height / 2;
        currentX += (child.subtreeWidth || child.width) + CONFIG.VERTICAL.SIBLING_GAP;
    });
}


function layoutTimeline(root: TreeNode): void {
    root.children.forEach(layoutVerticalBranch);
    const widths = root.children.map(child => child.subtreeWidth || child.width);
    let x = root.width / 2 + CONFIG.TIMELINE.COLUMN_GAP;
    root.children.forEach((child, i) => {
        child.rx = x + widths[i] / 2;
        child.ry = 0;
        x += widths[i] + CONFIG.TIMELINE.COLUMN_GAP;
    });
    root.children.forEach(milestone => subtree(milestone).forEach(node => node.children.forEach((child) => {
        child.ry = (child.ry || 0) + CONFIG.TIMELINE.LEVEL_GAP - CONFIG.VERTICAL.LEVEL_GAP;
    })));
}

const diagonal = (node: TreeNode) => Math.hypot(node.width, node.height);

function layoutRadial(root: TreeNode): void {
    root.x = 0;
    root.y = 0;
    if (root.children.length === 0) return;

    const order = subtree(root);
    const largest = order.reduce((max, node) => Math.max(max, diagonal(node)), 0);
    const baseGap = Math.max(CONFIG.RADIAL.RING_GAP, largest + CONFIG.RADIAL.NODE_GAP);

    const levels = new Map<TreeNode, number>([[root, 0]]);
    order.forEach(node => node.children.forEach(child => levels.set(child, levels.get(node)! + 1)));

    const needs = new Map<TreeNode, number>();
    for (let i = order.length - 1; i > 0; i--) {
        const node = order[i];
        const own = (diagonal(node) + CONFIG.RADIAL.NODE_GAP) / (levels.get(node)! * baseGap);
        const below = node.children.reduce((sum, child) => sum + needs.get(child)!, 0);
        needs.set(node, Math.max(own, below));
    }
    const total = root.children.reduce((sum, child) => sum + needs.get(child)!, 0);

    const ringGap = baseGap * Math.max(1, total / (2 * Math.PI));

    const wedges = new Map<TreeNode, { start: number; sweep: number }>([[root, { start: 0, sweep: 2 * Math.PI }]]);
    order.forEach((node) => {
        const needed = node.children.reduce((sum, child) => sum + needs.get(child)!, 0);
        if (needed === 0) return;
        const { start, sweep } = wedges.get(node)!;
        let currentAngle = start;
        node.children.forEach((child) => {
            const childSweep = sweep * (needs.get(child)! / needed);
            const angle = currentAngle + childSweep / 2;
            const radius = levels.get(child)! * ringGap;

            child.x = radius * Math.cos(angle);
            child.y = radius * Math.sin(angle);
            child.angle = angle;

            wedges.set(child, { start: currentAngle, sweep: childSweep });
            currentAngle += childSweep;
        });
    });
}


function branchExtent(top: TreeNode) {
    applyRelativePositions(top, 0, 0);
    return getTreeBounds(top);
}

function placeAlongLine(
    root: TreeNode,
    branches: { node: TreeNode; extent: ReturnType<typeof getTreeBounds> }[],
    along: 1 | -1,
    start: number,
    { OFFSET, STEP, GAP, MIN_STEP }: { OFFSET: number; STEP: number; GAP: number; MIN_STEP: number }
): void {
    const sideOf = (i: number): 1 | -1 => (i % 2 === 0 ? -1 : 1);
    const counts = { 1: 0, [-1]: 0 } as Record<1 | -1, number>;
    branches.forEach((_, i) => { counts[sideOf(i)] += 1; });
    const placed = { 1: 0, [-1]: 0 } as Record<1 | -1, number>;
    const used = { 1: start, [-1]: start } as Record<1 | -1, number>;
    let previous = start - MIN_STEP;
    branches.forEach(({ node, extent }, i) => {
        const side = sideOf(i);
        const near = along === 1 ? -extent.minX : extent.maxX;
        const far = along === 1 ? extent.maxX : -extent.minX;
        const distance = Math.max(previous + MIN_STEP, used[side] + near);
        node.rx = along * distance;
        node.ry = side * (OFFSET + (counts[side] - 1 - placed[side]) * STEP);
        placed[side] += 1;
        used[side] = distance + far + GAP;
        previous = distance;
    });
    root.subtreeHeight = root.height;
}

function layoutFishbone(root: TreeNode): void {
    const branches = root.children.map((child, i) => {
        layoutHorizontalBranch(child, 'left');
        if (child.children.length > 0) {
            child.children.forEach(grandchild => applyRelativePositions(grandchild, 0, 0));
            const ribs = child.children.reduce((bounds, grandchild) => getTreeBounds(grandchild, bounds), {
                minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity,
            });
            const shift = i % 2 === 0 ? child.height / 2 - ribs.maxY : -child.height / 2 - ribs.minY;
            child.children.forEach((grandchild) => { grandchild.ry = (grandchild.ry || 0) + shift; });
        }
        return { node: child, extent: branchExtent(child) };
    });
    placeAlongLine(root, branches, -1, root.width / 2 + CONFIG.FISHBONE.HEAD_GAP, CONFIG.FISHBONE);
}

function applyRelativePositions(top: TreeNode, parentX: number, parentY: number): void {
    top.x = parentX + (top.rx || 0);
    top.y = parentY + (top.ry || 0);
    subtree(top).forEach(node => node.children.forEach((child) => {
        child.x = node.x + (child.rx || 0);
        child.y = node.y + (child.ry || 0);
    }));
}

function getTreeBounds(top: TreeNode, bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }) {
    subtree(top).forEach((node) => {
        bounds.minX = Math.min(bounds.minX, node.x - node.width / 2);
        bounds.maxX = Math.max(bounds.maxX, node.x + node.width / 2);
        bounds.minY = Math.min(bounds.minY, node.y - node.height / 2);
        bounds.maxY = Math.max(bounds.maxY, node.y + node.height / 2);
    });
    return bounds;
}

function offsetTree(top: TreeNode, dx: number, dy: number): void {
    subtree(top).forEach((node) => {
        node.x += dx;
        node.y += dy;
    });
}
 


export const moveBoxAreasWithNodes = (boxAreas: BoxArea[], before: MindMapNode[], after: MindMapNode[]): BoxArea[] => {
    const afterById = new Map(after.map(n => [n.id, n]));
    return boxAreas.map(box => {
        const inside = before.filter(n => boxContainsPoint(box, n.x, n.y) && afterById.has(n.id));
        if (inside.length === 0) return box;
        const dx = inside.reduce((sum, n) => sum + afterById.get(n.id)!.x - n.x, 0) / inside.length;
        const dy = inside.reduce((sum, n) => sum + afterById.get(n.id)!.y - n.y, 0) / inside.length;
        return dx === 0 && dy === 0 ? box : { ...box, x: box.x + dx, y: box.y + dy };
    });
};
