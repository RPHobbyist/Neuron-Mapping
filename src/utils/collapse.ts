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

const childrenByParent = (nodes: MindMapNode[]): Map<string, MindMapNode[]> => {
    const children = new Map<string, MindMapNode[]>();
    nodes.forEach((node) => {
        if (!node.parentId) return;
        const siblings = children.get(node.parentId);
        if (siblings) siblings.push(node);
        else children.set(node.parentId, [node]);
    });
    return children;
};

const descendantsOf = (id: string, children: Map<string, MindMapNode[]>): MindMapNode[] => {
    const found: MindMapNode[] = [];
    const seen = new Set([id]);
    const pending = [id];
    while (pending.length > 0) {
        (children.get(pending.pop()!) ?? []).forEach((child) => {
            if (seen.has(child.id)) return;
            seen.add(child.id);
            found.push(child);
            pending.push(child.id);
        });
    }
    return found;
};

export const hiddenNodeIds = (nodes: MindMapNode[]): Set<string> => {
    const hidden = new Set<string>();
    if (!nodes.some(node => node.collapsed)) return hidden;
    const children = childrenByParent(nodes);
    nodes.forEach((node) => {
        if (node.collapsed && !hidden.has(node.id)) descendantsOf(node.id, children).forEach(below => hidden.add(below.id));
    });
    return hidden;
};

export const hiddenCounts = (nodes: MindMapNode[]): Map<string, number> => {
    const children = childrenByParent(nodes);
    const counts = new Map<string, number>();
    nodes.forEach((node) => {
        if (children.has(node.id)) counts.set(node.id, node.collapsed ? descendantsOf(node.id, children).length : 0);
    });
    return counts;
};

const withCollapsed = (node: MindMapNode, collapsed: boolean): MindMapNode => {
    if (!!node.collapsed === collapsed) return node;
    return { ...node, collapsed: collapsed || undefined };
};

const setCollapsed = (nodes: MindMapNode[], collapsedFor: (node: MindMapNode) => boolean): MindMapNode[] => {
    const children = childrenByParent(nodes);
    let changed = false;
    const next = nodes.map((node) => {
        const updated = withCollapsed(node, children.has(node.id) && collapsedFor(node));
        if (updated !== node) changed = true;
        return updated;
    });
    return changed ? next : nodes;
};

export const toggleCollapsed = (nodes: MindMapNode[], ids: Iterable<string>): MindMapNode[] => {
    const targets = new Set(ids);
    const children = childrenByParent(nodes);
    const collapsible = nodes.filter(node => targets.has(node.id) && children.has(node.id));
    if (collapsible.length === 0) return nodes;
    const collapse = collapsible.some(node => !node.collapsed);
    return setCollapsed(nodes, node => (targets.has(node.id) ? collapse : !!node.collapsed));
};

export const expandAll = (nodes: MindMapNode[]): MindMapNode[] => setCollapsed(nodes, () => false);

export const collapseToLevel = (nodes: MindMapNode[], level: number): MindMapNode[] => {
    const depths = nodeDepths(nodes);
    return setCollapsed(nodes, node => (depths.get(node.id) ?? 0) >= level);
};

export const nodeDepths = (nodes: MindMapNode[]): Map<string, number> => {
    const byId = new Map(nodes.map(node => [node.id, node]));
    const depths = new Map<string, number>();
    const depthOf = (node: MindMapNode): number => {
        const known = depths.get(node.id);
        if (known !== undefined) return known;
        depths.set(node.id, 0);
        const parent = node.parentId ? byId.get(node.parentId) : undefined;
        const depth = parent ? depthOf(parent) + 1 : 0;
        depths.set(node.id, depth);
        return depth;
    };
    nodes.forEach(depthOf);
    return depths;
};

export const expandAncestorsOf = (nodes: MindMapNode[], ids: Iterable<string>): MindMapNode[] => {
    const byId = new Map(nodes.map(node => [node.id, node]));
    const toExpand = new Set<string>();
    for (const id of ids) {
        const seen = new Set<string>();
        let parent = byId.get(byId.get(id)?.parentId ?? '');
        while (parent && !seen.has(parent.id)) {
            seen.add(parent.id);
            if (parent.collapsed) toExpand.add(parent.id);
            parent = byId.get(parent.parentId ?? '');
        }
    }
    if (toExpand.size === 0) return nodes;
    return nodes.map(node => (toExpand.has(node.id) ? withCollapsed(node, false) : node));
};

export const carryHiddenBranches = (before: MindMapNode[], after: MindMapNode[]): MindMapNode[] => {
    const hidden = hiddenNodeIds(after);
    if (hidden.size === 0) return after;
    const previous = new Map(before.map(node => [node.id, node]));
    const children = childrenByParent(after);
    const shifts = new Map<string, { dx: number; dy: number }>();
    after.forEach((node) => {
        if (!node.collapsed || hidden.has(node.id)) return;
        const was = previous.get(node.id);
        if (!was) return;
        const dx = node.x - was.x;
        const dy = node.y - was.y;
        if (dx === 0 && dy === 0) return;
        descendantsOf(node.id, children).forEach(below => shifts.set(below.id, { dx, dy }));
    });
    if (shifts.size === 0) return after;
    return after.map((node) => {
        const shift = shifts.get(node.id);
        return shift ? { ...node, x: node.x + shift.dx, y: node.y + shift.dy } : node;
    });
};
