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

import { patchItems } from './useMindMapNodes';

const node = (id: string, extra: Partial<MindMapNode> = {}): MindMapNode =>
    ({ id, text: id, x: 0, y: 0, color: 'blue', parentId: null, ...extra });

describe('patchItems', () => {
    it('returns the same array when the update changes nothing', () => {
        const nodes = [node('a', { color: 'orange' }), node('b')];
        expect(patchItems(nodes, (n) => n.id === 'a', { color: 'orange' })).toBe(nodes);
    });

    it('compares relation lists by content, so a commit that repeats a live edit is a no-op', () => {
        const nodes = [node('a', { relations: [{ targetId: 'b', color: '#fff' }] }), node('b')];
        const sameContent = [{ targetId: 'b', color: '#fff' }];
        expect(patchItems(nodes, (n) => n.id === 'a', { relations: sameContent })).toBe(nodes);
    });

    it('treats clearing an absent field as no change', () => {
        const nodes = [node('a')];
        expect(patchItems(nodes, (n) => n.id === 'a', { lineParentSide: undefined, textRuns: undefined })).toBe(nodes);
    });

    it('returns a new array with only the changed items replaced', () => {
        const nodes = [node('a'), node('b')];
        const next = patchItems(nodes, (n) => n.id === 'a', { color: 'red' });
        expect(next).not.toBe(nodes);
        expect(next[0].color).toBe('red');
        expect(next[1]).toBe(nodes[1]);
    });
});
