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

import { composeConnectionStyle, isConnectionStyle, parseConnectionStyle, withGlobalLinePart } from './lineStyle';
import { MindMapNodeSchema } from '@/lib/schemas';
import { MindMapNode } from '@/types/mindmap';

const node = (extra: Partial<MindMapNode> = {}): MindMapNode =>
    ({ id: 'n', text: 'n', x: 0, y: 0, color: 'blue', parentId: 'root', ...extra });

describe('parseConnectionStyle', () => {
    it('reads the old single-word styles', () => {
        expect(parseConnectionStyle('curved')).toEqual({ shape: 'curved', pattern: 'solid', arrow: false });
        expect(parseConnectionStyle('orthogonal')).toEqual({ shape: 'orthogonal', pattern: 'solid', arrow: false });
        expect(parseConnectionStyle('dashed')).toEqual({ shape: 'curved', pattern: 'dashed', arrow: false });
        expect(parseConnectionStyle('dotted')).toEqual({ shape: 'curved', pattern: 'dotted', arrow: false });
        expect(parseConnectionStyle('arrow')).toEqual({ shape: 'curved', pattern: 'solid', arrow: true });
        expect(parseConnectionStyle(undefined)).toEqual({ shape: 'curved', pattern: 'solid', arrow: false });
    });

    it('reads shape, pattern and arrow together', () => {
        expect(parseConnectionStyle('straight-dashed')).toEqual({ shape: 'straight', pattern: 'dashed', arrow: false });
        expect(parseConnectionStyle('orthogonal-dotted-arrow')).toEqual({ shape: 'orthogonal', pattern: 'dotted', arrow: true });
    });
});

describe('composeConnectionStyle', () => {
    it('writes the old words where they say the same thing, so older versions still read them', () => {
        expect(composeConnectionStyle({ shape: 'curved', pattern: 'solid', arrow: false })).toBe('curved');
        expect(composeConnectionStyle({ shape: 'curved', pattern: 'dashed', arrow: false })).toBe('dashed');
        expect(composeConnectionStyle({ shape: 'curved', pattern: 'solid', arrow: true })).toBe('arrow');
        expect(composeConnectionStyle({ shape: 'straight', pattern: 'solid', arrow: false })).toBe('straight');
    });

    it('round-trips every combination', () => {
        for (const shape of ['curved', 'orthogonal', 'straight'] as const) {
            for (const pattern of ['solid', 'dashed', 'dotted'] as const) {
                for (const arrow of [false, true]) {
                    const style = composeConnectionStyle({ shape, pattern, arrow });
                    expect(isConnectionStyle(style)).toBe(true);
                    expect(parseConnectionStyle(style)).toEqual({ shape, pattern, arrow });
                }
            }
        }
    });

    it('rejects styles it does not know', () => {
        expect(isConnectionStyle('wavy')).toBe(false);
        expect(isConnectionStyle('straight-wavy')).toBe(false);
        expect(isConnectionStyle(3)).toBe(false);
    });
});

describe('withGlobalLinePart', () => {
    it('drops only the part being set for the whole map', () => {
        const before = node({ lineType: 'straight', linePattern: 'dotted', lineArrowDirection: 'both' });
        expect(withGlobalLinePart(before, 'shape')).toEqual(node({ linePattern: 'dotted', lineArrowDirection: 'both' }));
        expect(withGlobalLinePart(before, 'pattern')).toEqual(node({ lineType: 'straight', lineArrowDirection: 'both' }));
        expect(withGlobalLinePart(before, 'arrow')).toEqual(node({ lineType: 'straight', linePattern: 'dotted' }));
    });

    it('keeps the pattern and arrow an old single-word style carried', () => {
        expect(withGlobalLinePart(node({ lineType: 'dashed' }), 'shape')).toEqual(node({ linePattern: 'dashed' }));
        expect(withGlobalLinePart(node({ lineType: 'arrow' }), 'pattern')).toEqual(node({ lineType: 'curved', lineArrowDirection: 'forward' }));
    });

    it('leaves a block with no line settings untouched', () => {
        const plain = node();
        expect(withGlobalLinePart(plain, 'shape')).toBe(plain);
    });
});

describe('saved line styles', () => {
    it('loads the combined styles and drops unknown ones', () => {
        expect(MindMapNodeSchema.parse(node({ lineType: 'orthogonal-dashed-arrow' })).lineType).toBe('orthogonal-dashed-arrow');
        expect(MindMapNodeSchema.parse({ ...node(), lineType: 'wavy' }).lineType).toBeUndefined();
    });
});
