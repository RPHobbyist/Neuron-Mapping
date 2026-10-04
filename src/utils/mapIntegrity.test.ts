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

import { DETACHED_PARENT_ID } from '@/lib/constants';
import { autoLayoutNodes } from '@/utils/layoutUtils';

import { normalizeMapNodes, repairNodeLinks } from './mapIntegrity';

const node = (id: string, parentId: string | null, extra: Record<string, unknown> = {}) =>
    ({ id, text: id, x: 0, y: 0, color: 'blue', parentId, ...extra });

describe('normalizeMapNodes', () => {
    it('leaves a valid map unchanged', () => {
        const { nodes, dropped, repaired } = normalizeMapNodes([node('r', null), node('a', 'r'), node('b', 'a', { relations: [{ targetId: 'r' }] })]);
        expect(nodes.map(n => [n.id, n.parentId])).toEqual([['r', null], ['a', 'r'], ['b', 'a']]);
        expect(nodes[2].relations).toEqual([{ targetId: 'r', sourceId: undefined }]);
        expect(dropped).toBe(0);
        expect(repaired).toBe(0);
    });

    it('skips entries that are not nodes, and keeps a partial node as a detached one', () => {
        const { nodes, dropped } = normalizeMapNodes([node('r', null), { id: 'bad' }, 'junk', node('a', 'r')]);
        expect(nodes.map(n => n.id)).toEqual(['r', 'bad', 'a']);
        expect(nodes[1].parentId).toBe(DETACHED_PARENT_ID);
        expect(dropped).toBe(1);
    });

    it('gives duplicate ids fresh ones, so auto-layout keeps every node', () => {
        const { nodes, repaired } = normalizeMapNodes([node('r', null), node('a', 'r'), node('a', 'r')]);
        expect(new Set(nodes.map(n => n.id)).size).toBe(3);
        expect(nodes.every(n => n.parentId === null || n.parentId === 'r')).toBe(true);
        expect(repaired).toBe(1);
        expect(autoLayoutNodes(nodes, 'horizontal')).toHaveLength(3);
    });

    it('replaces ids the editor cannot use and keeps references to them', () => {
        const { nodes } = normalizeMapNodes([node('r::x', null), node(DETACHED_PARENT_ID, 'r::x'), node('', 'r::x', { relations: [{ targetId: DETACHED_PARENT_ID }] })]);
        const [root, second, third] = nodes;
        expect(nodes.some(n => n.id.includes('::') || n.id === DETACHED_PARENT_ID || n.id === '')).toBe(false);
        expect(second.parentId).toBe(root.id);
        expect(third.parentId).toBe(root.id);
        expect(third.relations?.[0].targetId).toBe(second.id);
    });

    it('detaches nodes whose parent is missing and drops relations to missing, self or repeated targets', () => {
        const { nodes } = normalizeMapNodes([
            node('r', null),
            node('orphan', 'ghost', { lineParentSide: 'left' }),
            node('a', 'r', { relations: [{ targetId: 'ghost' }, { targetId: 'a' }, { targetId: 'r' }, { targetId: 'r' }] }),
        ]);
        expect(nodes[1]).toMatchObject({ parentId: DETACHED_PARENT_ID, lineParentSide: undefined });
        expect(nodes[2].relations?.map(r => r.targetId)).toEqual(['r']);
    });

    it('keeps one root and detaches the other parentless nodes', () => {
        const { nodes } = normalizeMapNodes([node('r1', null), node('r2', null), node('c', 'r2')]);
        expect(nodes.map(n => n.parentId)).toEqual([null, DETACHED_PARENT_ID, 'r2']);
    });

    it('breaks parent loops', () => {
        const { nodes } = normalizeMapNodes([node('r', null), node('a', 'b'), node('b', 'a')]);
        expect(nodes.filter(n => n.parentId === DETACHED_PARENT_ID)).toHaveLength(1);
    });

    it('reads non-finite coordinates as 0 and null optional fields as absent', () => {
        const { nodes, dropped } = normalizeMapNodes([node('r', null, { x: Infinity, y: 'far', notes: null, width: Infinity })]);
        expect(dropped).toBe(0);
        expect(nodes[0]).toMatchObject({ x: 0, y: 0, notes: undefined, width: undefined });
    });
});

describe('repairNodeLinks', () => {
    it('returns the same array, with no copies, for a sound map', () => {
        const parsed = normalizeMapNodes([node('r', null), node('a', 'r', { relations: [{ targetId: 'r' }] })]).nodes;
        const result = repairNodeLinks(parsed);
        expect(result.nodes).toBe(parsed);
        expect(result.repaired).toBe(0);
    });

    it('copies only the nodes it repairs', () => {
        const parsed = normalizeMapNodes([node('r', null), node('a', 'r'), node('b', 'r')]).nodes;
        const broken = [...parsed, { ...parsed[2] }];
        const { nodes } = repairNodeLinks(broken);
        expect(nodes[0]).toBe(parsed[0]);
        expect(nodes[1]).toBe(parsed[1]);
        expect(new Set(nodes.map(n => n.id)).size).toBe(4);
    });
});
