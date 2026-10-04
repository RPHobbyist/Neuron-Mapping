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
import { MindMapNodeSchema, tolerantArray } from '@/lib/schemas';
import { repairNodeLinks } from '@/utils/mapIntegrity';
import { remapNodeIds } from './parserUtils';

const looksLikeNode = (value: unknown): boolean =>
    typeof value === 'object' && value !== null
    && typeof (value as { id?: unknown }).id === 'string'
    && typeof (value as { text?: unknown }).text === 'string';

const NodesSchema = tolerantArray(MindMapNodeSchema);

export function parseNMM(content: string): MindMapNode[] {
    let parsed: unknown;
    try {
        parsed = JSON.parse(content);
    } catch (error) {
        console.error('NMM Parse Error:', error);
        return [];
    }
    const entries = Array.isArray(parsed) ? parsed : (parsed as { nodes?: unknown } | null)?.nodes;
    if (!Array.isArray(entries) || entries.length === 0 || !entries.every(looksLikeNode)) return [];
    return remapNodeIds(repairNodeLinks(NodesSchema.parse(entries) as MindMapNode[]).nodes);
}
