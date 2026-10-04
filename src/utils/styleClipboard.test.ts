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

import { styleOf } from './styleClipboard';

describe('styleOf', () => {
    const node: MindMapNode = {
        id: 'a', text: 'Plan', x: 10, y: 20, color: 'pink', parentId: 'root',
        shape: 'pill', textItalic: true, lineColor: '#ff0000', tags: ['work'], task: 'open', icon: 'star',
    };

    it('takes how the block looks, not what it says or holds', () => {
        const style = styleOf(node);
        expect(style).toMatchObject({ color: 'pink', shape: 'pill', textItalic: true, lineColor: '#ff0000' });
        expect(style).not.toHaveProperty('text');
        expect(style).not.toHaveProperty('tags');
        expect(style).not.toHaveProperty('task');
        expect(style).not.toHaveProperty('icon');
        expect(style).not.toHaveProperty('x');
    });

    it('carries unset fields as unset, so pasting clears them', () => {
        const style = styleOf(node);
        expect('textBold' in style).toBe(true);
        expect(style.textBold).toBeUndefined();
    });

    it("keeps the root's bold text, which it has unless set otherwise", () => {
        expect(styleOf({ ...node, parentId: null }).textBold).toBe(true);
    });
});
