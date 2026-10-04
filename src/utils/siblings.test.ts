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

import { siblingLine, siblingsOf, swapWithSibling } from './siblings';

const node = (id: string, parentId: string | null, x: number, y: number): MindMapNode => ({
    id, text: id, x, y, color: 'blue', parentId, width: 150, height: 50,
});

const ids = (nodes: MindMapNode[]) => nodes.map(n => n.id);
const at = (nodes: MindMapNode[], id: string) => {
    const { x, y } = nodes.find(n => n.id === id)!;
    return { x, y };
};

const twoSided = [
    node('root', null, 0, 0),
    node('R1', 'root', 300, -60),
    node('L1', 'root', -300, -60),
    node('R2', 'root', 300, 60),
    node('L2', 'root', -300, 60),
];

const topDown = [
    node('root', null, 0, 0),
    node('A', 'root', -200, 150),
    node('B', 'root', 0, 150),
    node('C', 'root', 200, 150),
];

describe('siblingsOf', () => {
    it('lists all siblings in the order they appear on the canvas', () => {
        expect(ids(siblingsOf(twoSided[2], twoSided))).toEqual(['L1', 'L2', 'R1', 'R2']);
        expect(ids(siblingsOf(topDown[3], topDown))).toEqual(['A', 'B', 'C']);
    });

    it('has none for the root or a detached node', () => {
        const detached = node('loose', DETACHED_PARENT_ID, 50, 400);
        expect(siblingsOf(twoSided[0], twoSided)).toEqual([]);
        expect(siblingsOf(detached, [...twoSided, detached, node('other', DETACHED_PARENT_ID, 90, 500)])).toEqual([]);
    });
});

describe('siblingLine', () => {
    it('is the column on the node\'s side of the parent', () => {
        expect(siblingLine(twoSided[2], twoSided)).toMatchObject({ axis: 'y' });
        expect(ids(siblingLine(twoSided[2], twoSided)!.siblings)).toEqual(['L1', 'L2']);
        expect(ids(siblingLine(twoSided[3], twoSided)!.siblings)).toEqual(['R1', 'R2']);
    });

    it('is the row below the parent in a top-down tree, across the parent\'s middle', () => {
        const line = siblingLine(topDown[2], topDown)!;
        expect(line.axis).toBe('x');
        expect(ids(line.siblings)).toEqual(['A', 'B', 'C']);
    });

    it('starts a column beside the parent, and a row above or below it', () => {
        const beside = [node('root', null, 0, 0), node('only', 'root', 300, 20)];
        const below = [node('root', null, 0, 0), node('only', 'root', 20, 150)];
        expect(siblingLine(beside[1], beside)).toEqual({ axis: 'y', siblings: [beside[1]] });
        expect(siblingLine(below[1], below)).toEqual({ axis: 'x', siblings: [below[1]] });
    });

    it('has none for the root or a detached node', () => {
        expect(siblingLine(twoSided[0], twoSided)).toBeNull();
        expect(siblingLine(node('loose', DETACHED_PARENT_ID, 0, 0), twoSided)).toBeNull();
    });
});

describe('swapWithSibling', () => {
    it('trades places with the next branch on the same side', () => {
        const moved = swapWithSibling(twoSided, 'L1', 1);
        expect(at(moved, 'L1')).toEqual({ x: -300, y: 60 });
        expect(at(moved, 'L2')).toEqual({ x: -300, y: -60 });
        expect(at(moved, 'R1')).toEqual(at(twoSided, 'R1'));
        expect(ids(siblingLine(moved.find(n => n.id === 'L1')!, moved)!.siblings)).toEqual(['L2', 'L1']);
    });

    it('moves left and right along a row', () => {
        const moved = swapWithSibling(topDown, 'B', -1);
        expect(at(moved, 'B')).toEqual({ x: -200, y: 150 });
        expect(at(moved, 'A')).toEqual({ x: 0, y: 150 });
    });

    it('returns the same list at the end of the line, never crossing to the other side', () => {
        expect(swapWithSibling(twoSided, 'L2', 1)).toBe(twoSided);
        expect(swapWithSibling(twoSided, 'L1', -1)).toBe(twoSided);
        expect(swapWithSibling(twoSided, 'root', 1)).toBe(twoSided);
        expect(swapWithSibling(twoSided, 'missing', 1)).toBe(twoSided);
    });

    it('takes a branch along, in the space the two branches had, with the same gap between them', () => {
        const nodes = [
            node('root', null, 0, 0),
            node('A', 'root', 300, 0),
            node('A1', 'A', 600, -55),
            node('A2', 'A', 600, 55),
            node('B', 'root', 300, 170),
        ];
        const moved = swapWithSibling(nodes, 'A', 1);

        expect(at(moved, 'B')).toEqual({ x: 300, y: -55 });
        expect(at(moved, 'A')).toEqual({ x: 300, y: 115 });
        expect(at(moved, 'A1')).toEqual({ x: 600, y: 60 });
        expect(at(moved, 'A2')).toEqual({ x: 600, y: 170 });
        expect(swapWithSibling(moved, 'A', -1).map(n => at([n], n.id))).toEqual(nodes.map(n => at([n], n.id)));
    });

    it('gives a collapsed branch only the room of what shows', () => {
        const nodes = [
            node('root', null, 0, 0),
            { ...node('A', 'root', 300, 0), collapsed: true },
            node('A1', 'A', 600, -400),
            node('B', 'root', 300, 100),
        ];
        const moved = swapWithSibling(nodes, 'A', 1);
        expect(at(moved, 'A')).toEqual({ x: 300, y: 100 });
        expect(at(moved, 'B')).toEqual({ x: 300, y: 0 });
        expect(at(moved, 'A1')).toEqual({ x: 600, y: -300 });
    });

    it('changes the top nodes over when the branches reach past each other', () => {
        const nodes = [
            node('root', null, 0, 0),
            node('A', 'root', 300, 0),
            node('A1', 'A', 600, 400),
            node('B', 'root', 300, 100),
        ];
        const moved = swapWithSibling(nodes, 'A', 1);
        expect(at(moved, 'A')).toEqual({ x: 300, y: 100 });
        expect(at(moved, 'A1')).toEqual({ x: 600, y: 500 });
        expect(at(moved, 'B')).toEqual({ x: 300, y: 0 });
    });
});
