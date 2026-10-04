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

export interface OutlineItem {
    node: MindMapNode;
    children: OutlineItem[];
}

export const visualOrder = (siblings: MindMapNode[]): MindMapNode[] => {
    if (siblings.length < 2) return siblings;
    const spread = (axis: 'x' | 'y') => {
        let min = Infinity, max = -Infinity;
        siblings.forEach((n) => {
            min = Math.min(min, n[axis]);
            max = Math.max(max, n[axis]);
        });
        return max - min;
    };
    const [main, cross] = spread('x') > spread('y') ? (['x', 'y'] as const) : (['y', 'x'] as const);
    return [...siblings].sort((a, b) => a[main] - b[main] || a[cross] - b[cross]);
};

export const buildOutline = (nodes: MindMapNode[]): OutlineItem[] => {
    const ids = new Set(nodes.map(n => n.id));
    const childrenByParent = new Map<string, MindMapNode[]>();
    const roots: MindMapNode[] = [];
    const detached: MindMapNode[] = [];
    nodes.forEach((node) => {
        if (node.parentId === null) roots.push(node);
        else if (!ids.has(node.parentId) || node.parentId === node.id) detached.push(node);
        else {
            const siblings = childrenByParent.get(node.parentId);
            if (siblings) siblings.push(node);
            else childrenByParent.set(node.parentId, [node]);
        }
    });

    const visited = new Set<string>();
    const tops = [...roots, ...visualOrder(detached)].map((node): OutlineItem => ({ node, children: [] }));
    const stack = [...tops].reverse();
    while (stack.length > 0) {
        const item = stack.pop()!;
        visited.add(item.node.id);
        item.children = visualOrder(childrenByParent.get(item.node.id) ?? [])
            .filter(child => !visited.has(child.id))
            .map(child => ({ node: child, children: [] }));
        item.children.forEach(child => visited.add(child.node.id));
        for (let i = item.children.length - 1; i >= 0; i--) stack.push(item.children[i]);
    }
    return tops;
};

export const walkOutline = (
    items: OutlineItem[],
    visit: (item: OutlineItem, depth: number) => void,
    depth = 0,
    leave?: (item: OutlineItem, depth: number) => void,
): void => {
    type Step = { item: OutlineItem; depth: number; leaving: boolean };
    const stack: Step[] = [];
    for (let i = items.length - 1; i >= 0; i--) stack.push({ item: items[i], depth, leaving: false });
    while (stack.length > 0) {
        const step = stack.pop()!;
        if (step.leaving) {
            leave?.(step.item, step.depth);
            continue;
        }
        visit(step.item, step.depth);
        if (leave) stack.push({ ...step, leaving: true });
        const { children } = step.item;
        for (let i = children.length - 1; i >= 0; i--) stack.push({ item: children[i], depth: step.depth + 1, leaving: false });
    }
};
