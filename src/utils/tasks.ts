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

export interface TaskProgress {
    done: number;
    total: number;
}

const childrenByParent = (nodes: MindMapNode[]) => {
    const children = new Map<string, MindMapNode[]>();
    nodes.forEach((node) => {
        if (!node.parentId) return;
        const siblings = children.get(node.parentId);
        if (siblings) siblings.push(node);
        else children.set(node.parentId, [node]);
    });
    return children;
};

export const computeTaskProgress = (nodes: MindMapNode[]): Map<string, TaskProgress> => {
    const children = childrenByParent(nodes);
    const progress = new Map<string, TaskProgress>();
    const visiting = new Set<string>();

    const below = (node: MindMapNode): TaskProgress => {
        if (progress.has(node.id)) return progress.get(node.id)!;
        if (visiting.has(node.id)) return { done: 0, total: 0 };
        visiting.add(node.id);
        const sum = { done: 0, total: 0 };
        (children.get(node.id) ?? []).forEach((child) => {
            const inChild = below(child);
            sum.done += inChild.done + (child.task === 'done' ? 1 : 0);
            sum.total += inChild.total + (child.task ? 1 : 0);
        });
        if (sum.total > 0) progress.set(node.id, sum);
        return sum;
    };
    nodes.forEach(below);
    return progress;
};

export const taskSummary = (nodes: MindMapNode[]): TaskProgress => ({
    done: nodes.filter(n => n.task === 'done').length,
    total: nodes.filter(n => n.task).length,
});

export const todayAsDay = (now = new Date()): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const formatDay = (day: string, now = new Date()): string => {
    const [year, month, date] = day.split('-').map(Number);
    const value = new Date(year, month - 1, date);
    return value.toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', ...(year !== now.getFullYear() ? { year: 'numeric' } : {}),
    });
};

export const isOverdue = (node: Pick<MindMapNode, 'dueDate' | 'task'>, today: string): boolean =>
    !!node.dueDate && node.task !== 'done' && node.dueDate < today;

export const completedBranchIds = (nodes: MindMapNode[]): Set<string> => {
    const children = childrenByParent(nodes);
    const hidden = new Set<string>();
    const hide = (id: string) => {
        if (hidden.has(id)) return;
        hidden.add(id);
        (children.get(id) ?? []).forEach(child => hide(child.id));
    };
    nodes.forEach((node) => { if (node.task === 'done') hide(node.id); });
    return hidden;
};
