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

import { computeNumbering } from './numbering';

const node = (id: string, parentId: string | null, x: number, y: number): MindMapNode => ({
    id, text: id, x, y, color: 'blue', parentId,
});

describe('computeNumbering', () => {
    it('numbers the branches from 1, and each level below them, in map order', () => {
        const numbers = computeNumbering([
            node('root', null, 0, 0),
            node('B', 'root', 300, 100),
            node('A', 'root', 300, -100),
            node('A2', 'A', 600, -50),
            node('A1', 'A', 600, -150),
            node('A1a', 'A1', 900, -150),
        ]);
        expect(Object.fromEntries(numbers)).toEqual({ A: '1', A1: '1.1', A1a: '1.1.1', A2: '1.2', B: '2' });
    });

    it('leaves the root and detached branches without a number', () => {
        const numbers = computeNumbering([
            node('root', null, 0, 0),
            node('A', 'root', 300, 0),
            node('loose', DETACHED_PARENT_ID, 0, 400),
            node('under', 'loose', 300, 400),
        ]);
        expect([...numbers.keys()]).toEqual(['A']);
    });
});
