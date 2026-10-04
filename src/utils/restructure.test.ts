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
import { getNodeSize, rectsOverlap } from '@/utils/placement';

import { canMoveBranchTo, insertParentNode, moveBranchTo, outdentBranch } from './restructure';

const node = (id: string, parentId: string | null, x: number, y: number): MindMapNode => ({
    id, text: id, x, y, color: 'blue', parentId, width: 150, height: 60,
});

const map = (): MindMapNode[] => [
    node('root', null, 0, 0),
    node('A', 'root', 300, -100),
    node('B', 'root', 300, 100),
    node('A1', 'A', 600, -150),
    node('A2', 'A', 600, -50),
    node('A1a', 'A1', 900, -150),
];

const find = (nodes: MindMapNode[], id: string) => nodes.find(n => n.id === id)!;

const overlapsAny = (nodes: MindMapNode[], id: string) => {
    const a = find(nodes, id);
    const sa = getNodeSize(a);
    return nodes.some((b) => {
        if (b.id === id) return false;
        const sb = getNodeSize(b);
        return rectsOverlap(a.x, a.y, sa.width, sa.height, b.x, b.y, sb.width, sb.height);
    });
};

describe('canMoveBranchTo', () => {
    it("refuses the root, and a branch going under itself or below itself", () => {
        const nodes = map();
        expect(canMoveBranchTo(nodes, 'root', 'B')).toBe(false);
        expect(canMoveBranchTo(nodes, 'A', 'A')).toBe(false);
        expect(canMoveBranchTo(nodes, 'A', 'A1a')).toBe(false);
        expect(canMoveBranchTo(nodes, 'A1', 'B')).toBe(true);
        expect(canMoveBranchTo(nodes, 'A1', 'missing')).toBe(false);
    });
});

describe('moveBranchTo', () => {
    it('puts the branch under its new parent, in a free spot beside it, and keeps its shape', () => {
        const nodes = map();
        const moved = moveBranchTo(nodes, 'A1', 'B');
        const a1 = find(moved, 'A1');
        const a1a = find(moved, 'A1a');

        expect(a1.parentId).toBe('B');
        expect(a1.x).toBeGreaterThan(300);
        expect(a1a.x - a1.x).toBe(300);
        expect(a1a.y - a1.y).toBe(0);
        expect(overlapsAny(moved, 'A1')).toBe(false);
    });

    it("goes after the new parent's other children, in their line", () => {
        const nodes = map();
        const moved = moveBranchTo(nodes, 'B', 'A');
        const b = find(moved, 'B');
        expect(b.parentId).toBe('A');
        expect(b.x).toBe(600);
        expect(b.y).toBeGreaterThan(-50);
        expect(overlapsAny(moved, 'B')).toBe(false);
    });

    it("forgets the line's fixed sides, which belonged to the old parent", () => {
        const nodes = map().map(n => (n.id === 'A1' ? { ...n, lineParentSide: 'top' as const, lineChildSide: 'left' as const } : n));
        const a1 = find(moveBranchTo(nodes, 'A1', 'B'), 'A1');
        expect(a1.lineParentSide).toBeUndefined();
        expect(a1.lineChildSide).toBeUndefined();
    });

    it('returns the same list when nothing can or need change', () => {
        const nodes = map();
        expect(moveBranchTo(nodes, 'A', 'A1')).toBe(nodes);
        expect(moveBranchTo(nodes, 'A1', 'A')).toBe(nodes);
        expect(moveBranchTo(nodes, 'root', 'A')).toBe(nodes);
    });

    it('gives a detached branch a parent', () => {
        const nodes = [...map(), node('loose', DETACHED_PARENT_ID, -400, 300)];
        expect(find(moveBranchTo(nodes, 'loose', 'root'), 'loose').parentId).toBe('root');
    });
});

describe('outdentBranch', () => {
    it("makes the branch a sibling of its parent, just after it, with what is below it", () => {
        const nodes = map();
        const moved = outdentBranch(nodes, 'A1');
        const a1 = find(moved, 'A1');
        expect(a1.parentId).toBe('root');
        expect(a1.x).toBe(300);
        expect(a1.y).toBeGreaterThan(-100);
        expect(find(moved, 'A1a').parentId).toBe('A1');
        expect(find(moved, 'A1a').x - a1.x).toBe(300);
        expect(overlapsAny(moved, 'A1')).toBe(false);
        expect(overlapsAny(moved, 'A1a')).toBe(false);
    });

    it("leaves the root's children, the root and detached nodes alone", () => {
        const nodes = [...map(), node('loose', DETACHED_PARENT_ID, -400, 300)];
        expect(outdentBranch(nodes, 'A')).toBe(nodes);
        expect(outdentBranch(nodes, 'root')).toBe(nodes);
        expect(outdentBranch(nodes, 'loose')).toBe(nodes);
    });
});

describe('insertParentNode', () => {
    it('puts a new node in the branch\'s place and moves the branch one step further out', () => {
        const nodes = map();
        const result = insertParentNode(nodes, 'A1', { id: 'P', text: 'Parent' })!;
        const parent = find(result, 'P');

        expect(parent).toMatchObject({ parentId: 'A', x: 600, y: -150, text: 'Parent', color: 'blue' });
        expect(find(result, 'A1')).toMatchObject({ parentId: 'P', x: 800, y: -150 });
        expect(find(result, 'A1a')).toMatchObject({ parentId: 'A1', x: 1100 });
        expect(find(result, 'A2')).toEqual(find(nodes, 'A2'));
    });

    it('moves a branch below its parent further down', () => {
        const nodes = [node('root', null, 0, 0), node('C', 'root', 0, 200)];
        const result = insertParentNode(nodes, 'C', { id: 'P', text: 'P' })!;
        expect(find(result, 'P')).toMatchObject({ x: 0, y: 200 });
        expect(find(result, 'C')).toMatchObject({ x: 0, y: 320, parentId: 'P' });
    });

    it('gives a detached branch a detached parent, and the root none', () => {
        const nodes = [...map(), node('loose', DETACHED_PARENT_ID, -400, 300)];
        const result = insertParentNode(nodes, 'loose', { id: 'P', text: 'P' })!;
        expect(find(result, 'P').parentId).toBe(DETACHED_PARENT_ID);
        expect(find(result, 'loose').parentId).toBe('P');
        expect(insertParentNode(nodes, 'root', { id: 'P', text: 'P' })).toBeNull();
    });
});
