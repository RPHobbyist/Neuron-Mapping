/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { MindMapNodeSchema } from '@/lib/schemas';
import { DETACHED_PARENT_ID } from '@/lib/constants';
import { detachParentCycles, generateId } from '@/utils/common';
import { MindMapNode, Relation } from '@/types/mindmap';

export interface NormalizedNodes {
    nodes: MindMapNode[];
    dropped: number;
    repaired: number;
}

const isUsableId = (id: string) => id.trim() !== '' && !id.includes('::') && id !== DETACHED_PARENT_ID;

const detach = (node: MindMapNode): MindMapNode =>
    ({ ...node, parentId: DETACHED_PARENT_ID, lineParentSide: undefined, lineChildSide: undefined });

export const repairNodeLinks = (parsed: MindMapNode[]): { nodes: MindMapNode[]; repaired: number } => {
    const repaired = new Set<number>();
    const idMap = new Map<string, string>();
    const withIds = parsed.map((node, index) => {
        const firstOccurrence = !idMap.has(node.id);
        if (firstOccurrence && isUsableId(node.id)) {
            idMap.set(node.id, node.id);
            return node;
        }
        const id = generateId();
        if (firstOccurrence) idMap.set(node.id, id);
        repaired.add(index);
        return { ...node, id };
    });

    let hasRoot = false;
    const linked = withIds.map((node, index) => {
        let next = node;
        if (node.parentId === null) {
            if (hasRoot) {
                next = detach(next);
                repaired.add(index);
            }
            hasRoot = true;
        } else if (node.parentId !== DETACHED_PARENT_ID) {
            const parentId = idMap.get(node.parentId);
            if (!parentId || parentId === node.id) {
                next = detach(next);
                repaired.add(index);
            } else if (parentId !== node.parentId) {
                next = { ...next, parentId };
            }
        }

        if (node.relations) {
            const targets = new Set<string>();
            let changed = false;
            const relations = node.relations.flatMap((r): Relation[] => {
                const targetId = idMap.get(r.targetId);
                if (!targetId || targetId === node.id || targets.has(targetId)) {
                    changed = true;
                    return [];
                }
                targets.add(targetId);
                const sourceId = r.sourceId ? idMap.get(r.sourceId) : undefined;
                if (targetId === r.targetId && sourceId === r.sourceId) return [r];
                changed = true;
                return [{ ...r, targetId, sourceId }];
            });
            if (relations.length !== node.relations.length) repaired.add(index);
            if (changed) next = { ...next, relations: relations.length > 0 ? relations : undefined };
        }
        return next;
    });

    const nodes = detachParentCycles(linked);
    if (nodes !== linked) nodes.forEach((n, i) => { if (n !== linked[i]) repaired.add(i); });

    const unchanged = nodes.every((n, i) => n === parsed[i]);
    return { nodes: unchanged ? parsed : nodes, repaired: repaired.size };
};

export const normalizeMapNodes = (raw: unknown): NormalizedNodes => {
    const entries = Array.isArray(raw) ? raw : [];
    const parsed: MindMapNode[] = [];
    entries.forEach((entry) => {
        const result = MindMapNodeSchema.safeParse(entry);
        if (result.success) parsed.push(result.data as MindMapNode);
    });
    const { nodes, repaired } = repairNodeLinks(parsed);
    return { nodes, dropped: entries.length - parsed.length, repaired };
};
