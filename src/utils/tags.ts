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

export const MAX_TAG_LENGTH = 30;

export const normalizeTag = (raw: string): string =>
    raw.replace(/^[#\s]+/, '').replace(/\s+/g, ' ').slice(0, MAX_TAG_LENGTH).trim();

export const sameTag = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export const addTag = (tags: string[] | undefined, raw: string): string[] | undefined => {
    const tag = normalizeTag(raw);
    if (!tag || tags?.some(existing => sameTag(existing, tag))) return tags;
    return [...(tags ?? []), tag];
};

export const removeTag = (tags: string[] | undefined, tag: string): string[] | undefined => {
    if (!tags?.some(existing => sameTag(existing, tag))) return tags;
    const rest = tags.filter(existing => !sameTag(existing, tag));
    return rest.length > 0 ? rest : undefined;
};

export const allTags = (nodes: MindMapNode[]): string[] => {
    const counts = new Map<string, { tag: string; count: number }>();
    nodes.forEach(node => node.tags?.forEach((tag) => {
        const entry = counts.get(tag.toLowerCase());
        if (entry) entry.count++;
        else counts.set(tag.toLowerCase(), { tag, count: 1 });
    }));
    return [...counts.values()]
        .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
        .map(entry => entry.tag);
};

export const commonTags = (nodes: MindMapNode[]): string[] => {
    const [first, ...rest] = nodes;
    return (first?.tags ?? []).filter(tag => rest.every(node => node.tags?.some(other => sameTag(other, tag))));
};
