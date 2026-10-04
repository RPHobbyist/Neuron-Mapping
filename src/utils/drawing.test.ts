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

import { Drawing } from '@/types/mindmap';
import { nodesInScreenBox } from '@/hooks/useSelectionBox';

import { eraseDrawingsAt, simplifyPath } from './drawing';

const stroke = (id: string, ...points: [number, number][]): Drawing => ({
    id, color: '#000', points: points.map(([x, y]) => ({ x, y })),
});

describe('eraseDrawingsAt', () => {
    const drawings = [stroke('line', [0, 0], [100, 0]), stroke('far', [0, 200], [100, 200]), stroke('dot', [50, 50])];

    it('removes the strokes the eraser touches anywhere along them', () => {
        expect(eraseDrawingsAt(drawings, { x: 50, y: 10 }, 15).map(d => d.id)).toEqual(['far', 'dot']);
        expect(eraseDrawingsAt(drawings, { x: 55, y: 55 }, 15).map(d => d.id)).toEqual(['line', 'far']);
    });

    it('returns the same list when it touches nothing', () => {
        expect(eraseDrawingsAt(drawings, { x: 300, y: 300 }, 15)).toBe(drawings);
    });
});

describe('simplifyPath', () => {
    const path = (...points: [number, number][]) => points.map(([x, y]) => ({ x, y }));

    it('drops the points along a straight run, keeping the ends', () => {
        const line = path([0, 0], [10, 0.2], [20, -0.3], [30, 0.1], [40, 0]);
        expect(simplifyPath(line, 1)).toEqual(path([0, 0], [40, 0]));
    });

    it('keeps the corners of a stroke', () => {
        const corner = path([0, 0], [10, 0], [20, 0], [20, 10], [20, 20]);
        expect(simplifyPath(corner, 1)).toEqual(path([0, 0], [20, 0], [20, 20]));
        const zigzag = path([0, 0], [10, 8], [20, 0], [30, 8], [40, 0]);
        expect(simplifyPath(zigzag, 1)).toEqual(zigzag);
    });

    it('keeps more of a curve the smaller the tolerance', () => {
        const arc = Array.from({ length: 91 }, (_, degree) => ({
            x: 100 * Math.cos(degree * Math.PI / 180),
            y: 100 * Math.sin(degree * Math.PI / 180),
        }));
        const rough = simplifyPath(arc, 2);
        const fine = simplifyPath(arc, 0.2);
        expect(rough.length).toBeLessThan(fine.length);
        expect(fine.length).toBeLessThan(arc.length);
        expect(rough[0]).toBe(arc[0]);
        expect(rough[rough.length - 1]).toBe(arc[90]);
    });

    it('leaves a stroke of one or two points as it is, and a closed stroke closed', () => {
        const short = path([0, 0], [5, 5]);
        expect(simplifyPath(short, 1)).toBe(short);
        const loop = path([0, 0], [50, 0], [50, 50], [0, 50], [0, 0]);
        expect(simplifyPath(loop, 1)).toEqual(loop);
    });
});

describe('nodesInScreenBox', () => {
    const node = (id: string, x: number, y: number) => ({ id, text: id, x, y, color: 'blue' as const, parentId: null });
    const nodes = [node('centre', 0, 0), node('right', 300, 0), node('below', 0, 300)];
    const canvas = { left: 0, top: 0, width: 1000, height: 800 };

    it('selects the nodes whose centres the box covers', () => {
        expect([...nodesInScreenBox(nodes, { x: 450, y: 350, w: 400, h: 100 }, canvas, { x: 0, y: 0 }, 1)]).toEqual(['centre', 'right']);
    });

    it('takes pan and zoom into account', () => {
        expect([...nodesInScreenBox(nodes, { x: 590, y: 540, w: 20, h: 20 }, canvas, { x: 100, y: 0 }, 0.5)]).toEqual(['below']);
    });
});
