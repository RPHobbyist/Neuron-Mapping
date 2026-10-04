/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { describe, expect, it } from 'vitest';

import { MindMapNode } from '@/types/mindmap';

import { NO_CRITERIA, hasCriteria, searchNodes } from './search';

const node = (id: string, text: string, extra: Partial<MindMapNode> = {}): MindMapNode =>
    ({ id, text, x: 0, y: 0, color: 'blue', parentId: 'root', ...extra });

const map = [
    node('root', 'Product Launch', { parentId: null, color: 'root' }),
    node('ads', 'Social media ads', { tags: ['Marketing', 'q3'], priority: 'high' }),
    node('budget', 'Budget', {
        notes: 'Ask finance for the *spring* figures.\n\nThe marketing budget is still open, and so is everything that depends on it this year.',
        color: 'orange',
    }),
    node('press', 'Press kit', { tags: ['q3'], status: 'done' }),
];

const search = (criteria: Partial<typeof NO_CRITERIA>) => searchNodes(map, { ...NO_CRITERIA, ...criteria });
const ids = (criteria: Partial<typeof NO_CRITERIA>) => search(criteria).map(result => result.node.id);

describe('searchNodes', () => {
    it('finds nothing without criteria', () => {
        expect(hasCriteria(NO_CRITERIA)).toBe(false);
        expect(hasCriteria({ ...NO_CRITERIA, query: '  ' })).toBe(false);
        expect(search({})).toEqual([]);
    });

    it('looks in text, tags and notes, whatever the case', () => {
        expect(ids({ query: 'MARKETING' })).toEqual(['ads', 'budget']);
        expect(ids({ query: 'press' })).toEqual(['press']);
    });

    it('says where the words were found when not in the text', () => {
        const [inText] = search({ query: 'social' });
        expect(inText.found).toBeUndefined();

        const [inTag, inNotes] = search({ query: 'marketing' });
        expect(inTag.found).toEqual({ in: 'tag', text: 'Marketing' });
        expect(inNotes.found).toEqual({
            in: 'notes',
            text: '…*spring* figures. The marketing budget is still open, and so is everything that…',
        });
    });

    it('looks in tags only for a query that starts with #', () => {
        expect(ids({ query: '#market' })).toEqual(['ads']);
        expect(ids({ query: '#press' })).toEqual([]);
        expect(ids({ query: '#' })).toEqual(['ads', 'press']);
    });

    it('filters by tag, color, priority and status, together with the query', () => {
        expect(ids({ tag: 'Q3' })).toEqual(['ads', 'press']);
        expect(ids({ tag: 'q3', query: 'kit' })).toEqual(['press']);
        expect(ids({ color: 'orange' })).toEqual(['budget']);
        expect(ids({ priority: 'high' })).toEqual(['ads']);
        expect(ids({ status: 'done', tag: 'marketing' })).toEqual([]);
    });
});
