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

import { calculateLayout } from './layout3d';
import { MindMapNode } from '@/types/mindmap';

const node = (id: string, parentId: string | null): MindMapNode =>
    ({ id, text: id, x: 0, y: 0, color: 'orange', parentId });

describe('calculateLayout (force)', () => {
    it('produces finite positions for every node', () => {
        const nodes = [node('root', null), ...Array.from({ length: 30 }, (_, i) => node(`n${i}`, i < 5 ? 'root' : `n${i % 5}`))];
        const positions = calculateLayout(nodes, 'force');
        expect(Object.keys(positions)).toHaveLength(nodes.length);
        expect(Object.values(positions).flat().every(Number.isFinite)).toBe(true);
    });

    it('stays fast on a large map', () => {
        const nodes = [node('root', null), ...Array.from({ length: 1000 }, (_, i) => node(`n${i}`, i < 10 ? 'root' : `n${i % 10}`))];
        const started = performance.now();
        calculateLayout(nodes, 'force');
        expect(performance.now() - started).toBeLessThan(5000);
    });
});
