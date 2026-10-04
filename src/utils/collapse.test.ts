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
import { MindMapNode } from '@/types/mindmap';

import {
    carryHiddenBranches, collapseToLevel, expandAll, expandAncestorsOf, hiddenCounts, hiddenNodeIds, nodeDepths, toggleCollapsed,
} from './collapse';

const node = (id: string, parentId: string | null, extra: Partial<MindMapNode> = {}): MindMapNode =>
    ({ id, text: id, x: 0, y: 0, color: 'blue', parentId, ...extra });

const map = (collapsed: string[] = []): MindMapNode[] => [
    node('root', null),
    node('a', 'root'),
    node('a1', 'a'),
    node('a1x', 'a1'),
    node('a2', 'a'),
    node('b', 'root'),
    node('b1', 'b'),
    node('loose', DETACHED_PARENT_ID),
    node('loose1', 'loose'),
].map(n => (collapsed.includes(n.id) ? { ...n, collapsed: true } : n));

const collapsedIds = (nodes: MindMapNode[]) => nodes.filter(n => n.collapsed).map(n => n.id);

describe('hiddenNodeIds', () => {
    it('hides everything below a collapsed node, but not the node', () => {
        expect([...hiddenNodeIds(map(['a']))].sort()).toEqual(['a1', 'a1x', 'a2']);
        expect([...hiddenNodeIds(map(['a1', 'loose']))].sort()).toEqual(['a1x', 'loose1']);
        expect(hiddenNodeIds(map()).size).toBe(0);
    });

    it('counts a node hidden once when nodes above and below it are both collapsed', () => {
        expect([...hiddenNodeIds(map(['a', 'a1']))].sort()).toEqual(['a1', 'a1x', 'a2']);
    });

    it('ends on a map whose parents loop', () => {
        const loop = [node('x', 'y', { collapsed: true }), node('y', 'x')];
        expect([...hiddenNodeIds(loop)]).toEqual(['y']);
    });
});

describe('hiddenCounts', () => {
    it('gives each node with children the number it hides', () => {
        const counts = hiddenCounts(map(['a']));
        expect(counts.get('a')).toBe(3);
        expect(counts.get('root')).toBe(0);
        expect(counts.get('b')).toBe(0);
        expect(counts.has('a2')).toBe(false);
        expect(counts.has('b1')).toBe(false);
    });
});

describe('toggleCollapsed', () => {
    it('collapses the nodes, and expands them when they are all collapsed', () => {
        const collapsed = toggleCollapsed(map(), ['a', 'b']);
        expect(collapsedIds(collapsed)).toEqual(['a', 'b']);
        expect(collapsedIds(toggleCollapsed(collapsed, ['a', 'b']))).toEqual([]);
        expect(collapsedIds(toggleCollapsed(map(['a']), ['a', 'b']))).toEqual(['a', 'b']);
    });

    it('leaves a node without children alone, returning the same list', () => {
        const nodes = map();
        expect(toggleCollapsed(nodes, ['a2', 'missing'])).toBe(nodes);
        expect(collapsedIds(toggleCollapsed(nodes, ['a2', 'b']))).toEqual(['b']);
    });
});

describe('collapseToLevel and expandAll', () => {
    it('shows the map down to a level', () => {
        expect(nodeDepths(map()).get('a1x')).toBe(3);
        expect(nodeDepths(map()).get('loose1')).toBe(1);
        expect(collapsedIds(collapseToLevel(map(), 1))).toEqual(['a', 'a1', 'b']);
        expect(collapsedIds(collapseToLevel(map(), 2))).toEqual(['a1']);
        expect(collapsedIds(collapseToLevel(map(), 0))).toEqual(['root', 'a', 'a1', 'b', 'loose']);
        expect(collapsedIds(collapseToLevel(map(['a', 'b']), 2))).toEqual(['a1']);
    });

    it('expands everything, returning the same list when nothing is collapsed', () => {
        expect(collapsedIds(expandAll(map(['a', 'a1', 'loose'])))).toEqual([]);
        const open = map();
        expect(expandAll(open)).toBe(open);
    });
});

describe('expandAncestorsOf', () => {
    it('opens every collapsed node above the given ones, and only those', () => {
        const nodes = map(['a', 'a1', 'b']);
        expect(collapsedIds(expandAncestorsOf(nodes, ['a1x']))).toEqual(['b']);
        expect(collapsedIds(expandAncestorsOf(nodes, ['a1']))).toEqual(['a1', 'b']);
        expect(expandAncestorsOf(nodes, ['b', 'root', 'missing'])).toBe(nodes);
    });
});

describe('carryHiddenBranches', () => {
    it('moves what a collapsed node hides along with it', () => {
        const before = map(['a']);
        const after = before.map(n => (n.id === 'a' ? { ...n, x: 100, y: -40 } : n.id === 'b' ? { ...n, x: 7 } : n));
        const carried = carryHiddenBranches(before, after);
        const at = (id: string) => [carried.find(n => n.id === id)!.x, carried.find(n => n.id === id)!.y];
        expect(at('a1')).toEqual([100, -40]);
        expect(at('a1x')).toEqual([100, -40]);
        expect(at('a2')).toEqual([100, -40]);
        expect(at('b1')).toEqual([0, 0]);
    });

    it('returns the same list when nothing hidden needs to move', () => {
        const open = map();
        expect(carryHiddenBranches(open, open.map(n => ({ ...n, x: 5 })))).not.toBe(open);
        const collapsed = map(['a']);
        const moved = collapsed.map(n => (n.id === 'b' ? { ...n, x: 5 } : n));
        expect(carryHiddenBranches(collapsed, moved)).toBe(moved);
    });
});
