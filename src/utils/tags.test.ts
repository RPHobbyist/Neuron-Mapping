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

import { addTag, allTags, commonTags, normalizeTag, removeTag } from './tags';

const node = (id: string, tags?: string[]): MindMapNode =>
    ({ id, text: id, x: 0, y: 0, color: 'blue', parentId: null, tags });

describe('normalizeTag', () => {
    it('drops the #, extra spaces and anything past the length limit', () => {
        expect(normalizeTag('  #urgent ')).toBe('urgent');
        expect(normalizeTag('## next   week')).toBe('next week');
        expect(normalizeTag('x'.repeat(40))).toHaveLength(30);
        expect(normalizeTag(' # ')).toBe('');
    });
});

describe('addTag and removeTag', () => {
    it('add a tag once, whatever its case', () => {
        expect(addTag(undefined, '#Urgent')).toEqual(['Urgent']);
        expect(addTag(['Urgent'], 'later')).toEqual(['Urgent', 'later']);
    });

    it('return the same list when nothing changes', () => {
        const tags = ['Urgent'];
        expect(addTag(tags, 'urgent')).toBe(tags);
        expect(addTag(tags, '  ')).toBe(tags);
        expect(removeTag(tags, 'later')).toBe(tags);
        expect(removeTag(undefined, 'later')).toBeUndefined();
    });

    it('remove a tag, leaving no list behind when it was the last', () => {
        expect(removeTag(['Urgent', 'later'], 'URGENT')).toEqual(['later']);
        expect(removeTag(['Urgent'], 'urgent')).toBeUndefined();
    });
});

describe('allTags', () => {
    it('lists every tag once, the most used first and then by name', () => {
        const nodes = [node('a', ['zeta', 'Plan']), node('b', ['plan', 'alpha']), node('c'), node('d', ['PLAN'])];
        expect(allTags(nodes)).toEqual(['Plan', 'alpha', 'zeta']);
    });
});

describe('commonTags', () => {
    it('keeps the tags every node has', () => {
        expect(commonTags([node('a', ['Plan', 'q3', 'draft']), node('b', ['q3', 'plan'])])).toEqual(['Plan', 'q3']);
        expect(commonTags([node('a', ['Plan']), node('b')])).toEqual([]);
        expect(commonTags([node('a', ['Plan'])])).toEqual(['Plan']);
        expect(commonTags([])).toEqual([]);
    });
});
