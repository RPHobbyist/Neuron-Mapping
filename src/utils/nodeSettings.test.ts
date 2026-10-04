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

import { commonNodeSettings } from './nodeSettings';

const node = (id: string, extra: Partial<MindMapNode> = {}): MindMapNode => ({
    id, text: id, x: 0, y: 0, color: 'blue', parentId: 'root', ...extra,
});

describe('commonNodeSettings', () => {
    it('shows what the nodes share and marks what differs as mixed', () => {
        const { values, mixed } = commonNodeSettings([
            node('a', { shape: 'pill', priority: 'high' }),
            node('b', { shape: 'pill' }),
        ]);
        expect(values).toMatchObject({ color: 'blue', shape: 'pill' });
        expect(mixed.has('priority')).toBe(true);
        expect(mixed.has('color')).toBe(false);
        expect(values).not.toHaveProperty('priority');
    });

    it("counts the root's text as bold unless set otherwise", () => {
        const { values, mixed } = commonNodeSettings([node('root', { parentId: null }), node('child', { textBold: true })]);
        expect(values.textBold).toBe(true);
        expect(mixed.has('textBold')).toBe(false);
    });
});
