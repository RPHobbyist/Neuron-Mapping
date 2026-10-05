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

import { arrowheadAt, getDash, linePatternOf, lineShapeOf, trimPolyline } from './lineRouting';

describe('line shape and pattern', () => {
    it('reads the old dashed, dotted and arrow types as curves', () => {
        expect(lineShapeOf('dashed')).toBe('curved');
        expect(lineShapeOf('dotted')).toBe('curved');
        expect(lineShapeOf('arrow')).toBe('curved');
        expect(lineShapeOf('orthogonal')).toBe('orthogonal');
        expect(lineShapeOf('straight')).toBe('straight');
        expect(lineShapeOf(undefined)).toBe('curved');
    });

    it('takes the pattern from the old type unless one is set', () => {
        expect(linePatternOf('dashed')).toBe('dashed');
        expect(linePatternOf('straight')).toBe('solid');
        expect(linePatternOf('dashed', 'solid')).toBe('solid');
        expect(linePatternOf('straight', 'dotted')).toBe('dotted');
    });

    it('dashes a straight or step line when its pattern says so', () => {
        expect(getDash('straight', 'dashed')).toBe('8 4');
        expect(getDash('orthogonal', 'dotted')).toBe('0 8');
        expect(getDash('dashed', 'solid')).toBeUndefined();
        expect(getDash('dashed')).toBe('8 4');
    });
});

describe('trimPolyline', () => {
    const line = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }];

    it('shortens both ends by distance along the line', () => {
        expect(trimPolyline(line, 5, 4)).toEqual([{ x: 5, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 6 }]);
    });

    it('cuts across a corner', () => {
        expect(trimPolyline(line, 0, 15)).toEqual([{ x: 0, y: 0 }, { x: 5, y: 0 }]);
    });

    it('leaves the line alone with nothing to trim', () => {
        expect(trimPolyline(line, 0, 0)).toEqual(line);
    });
});

describe('arrowheadAt', () => {
    it('aims along the last stretch of the line, not only its final point', () => {
        const bend = [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 2 }];
        const head = arrowheadAt(bend, true, 12);
        expect(head.x).toBe(20);
        expect(head.y).toBe(2);
        expect(head.angle).toBeGreaterThan(0);
        expect(head.angle).toBeLessThan(45);
    });

    it('points backwards at the start', () => {
        const head = arrowheadAt([{ x: 0, y: 0 }, { x: 30, y: 0 }], false, 10);
        expect(head).toEqual({ x: 0, y: 0, angle: 180 });
    });
});
