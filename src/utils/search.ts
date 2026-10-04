/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { MindMapNode, NodeColor, NodePriority, NodeStatus } from '@/types/mindmap';

import { sameTag } from './tags';

export interface SearchCriteria {
    query: string;
    color: NodeColor | 'all';
    priority: NodePriority | 'all';
    status: NodeStatus | 'all';
    tag: string | 'all';
}

export const NO_CRITERIA: SearchCriteria = { query: '', color: 'all', priority: 'all', status: 'all', tag: 'all' };

export interface SearchResult {
    node: MindMapNode;
    found?: { in: 'tag' | 'notes'; text: string };
}

export const hasCriteria = ({ query, color, priority, status, tag }: SearchCriteria): boolean =>
    !!query.trim() || color !== 'all' || priority !== 'all' || status !== 'all' || tag !== 'all';

const SNIPPET_BEFORE = 24;
const SNIPPET_AFTER = 48;

const snippet = (notes: string, query: string): string | null => {
    const flat = notes.replace(/\s+/g, ' ').trim();
    const index = flat.toLowerCase().indexOf(query);
    if (index < 0) return null;
    const matchEnd = index + query.length;

    let start = Math.max(0, index - SNIPPET_BEFORE);
    const spaceAfterStart = flat.indexOf(' ', start);
    if (start > 0 && spaceAfterStart !== -1 && spaceAfterStart < index) start = spaceAfterStart + 1;

    let end = Math.min(flat.length, matchEnd + SNIPPET_AFTER);
    const spaceBeforeEnd = flat.lastIndexOf(' ', end);
    if (end < flat.length && spaceBeforeEnd > matchEnd) end = spaceBeforeEnd;

    return `${start > 0 ? '…' : ''}${flat.slice(start, end)}${end < flat.length ? '…' : ''}`;
};

const matchQuery = (node: MindMapNode, query: string): SearchResult | null => {
    const tagsOnly = query.startsWith('#');
    const words = tagsOnly ? query.slice(1).trim() : query;
    if (!words) return tagsOnly && !node.tags?.length ? null : { node };

    if (!tagsOnly && node.text.toLowerCase().includes(words)) return { node };
    const tag = node.tags?.find(candidate => candidate.toLowerCase().includes(words));
    if (tag) return { node, found: { in: 'tag', text: tag } };
    const inNotes = !tagsOnly && node.notes ? snippet(node.notes, words) : null;
    return inNotes ? { node, found: { in: 'notes', text: inNotes } } : null;
};

export const searchNodes = (nodes: MindMapNode[], criteria: SearchCriteria): SearchResult[] => {
    if (!hasCriteria(criteria)) return [];
    const query = criteria.query.trim().toLowerCase();

    return nodes.flatMap((node) => {
        if (criteria.color !== 'all' && node.color !== criteria.color) return [];
        if (criteria.priority !== 'all' && node.priority !== criteria.priority) return [];
        if (criteria.status !== 'all' && node.status !== criteria.status) return [];
        if (criteria.tag !== 'all' && !node.tags?.some(tag => sameTag(tag, criteria.tag))) return [];
        const result = query ? matchQuery(node, query) : { node };
        return result ? [result] : [];
    });
};
