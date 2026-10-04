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
import { toClipboardOutline } from '@/utils/exporters/clipboard';

import { parsePastedOutline } from './pastedOutline';

const shape = (nodes: MindMapNode[]): string => {
    const lines: string[] = [];
    const visit = (parentId: string | null, depth: number) => nodes
        .filter(n => n.parentId === parentId)
        .forEach((n) => {
            lines.push(`${'  '.repeat(depth)}${n.text}`);
            visit(n.id, depth + 1);
        });
    visit(null, 0);
    return lines.join('\n');
};

describe('parsePastedOutline', () => {
    it('makes each top line a topic of its own, with no root added', () => {
        const nodes = parsePastedOutline('Milk\nEggs\nBread');
        expect(shape(nodes)).toBe('Milk\nEggs\nBread');
        expect(nodes.every(n => n.parentId === null)).toBe(true);
    });

    it('nests lines by their indentation, in tabs or spaces', () => {
        expect(shape(parsePastedOutline('Fruit\n\tApple\n\t\tGreen\n\tPear\nVeg'))).toBe(
            'Fruit\n  Apple\n    Green\n  Pear\nVeg'
        );
        expect(shape(parsePastedOutline('Fruit\n   Apple\n      Green\n   Pear'))).toBe(
            'Fruit\n  Apple\n    Green\n  Pear'
        );
    });

    it('takes off list bullets and numbers, and skips blank lines and code fences', () => {
        const text = '- Plan\n  * Goals\n\n  + Risks\n1. First\n2) Second\n```\n• Dot';
        expect(shape(parsePastedOutline(text))).toBe('Plan\n  Goals\n  Risks\nFirst\nSecond\nDot');
    });

    it('nests Markdown headings and the lists under them', () => {
        const text = '## Trip\n### Packing\n- Tent\n  - Pegs\n### Route\n- North';
        expect(shape(parsePastedOutline(text))).toBe('Trip\n  Packing\n    Tent\n      Pegs\n  Route\n    North');
    });

    it('treats a list that starts indented as starting at the top', () => {
        expect(shape(parsePastedOutline('    A\n        B\n    C'))).toBe('A\n  B\nC');
    });

    it('keeps a task box for the smart text to read, and ignores carriage returns', () => {
        expect(shape(parsePastedOutline('- [ ] Call Sam\r\n- [x] Book room'))).toBe('[ ] Call Sam\n[x] Book room');
    });

    it('returns nothing for blank text', () => {
        expect(parsePastedOutline('  \n\n\t')).toEqual([]);
    });
});

describe('toClipboardOutline', () => {
    const copied: MindMapNode[] = [
        { id: 'a', text: 'Plan', x: 0, y: 0, color: 'blue', parentId: 'root' },
        { id: 'b', text: 'Goals & <aims>', x: 200, y: -40, color: 'blue', parentId: 'a' },
        { id: 'c', text: 'Risks', x: 200, y: 40, color: 'blue', parentId: 'a' },
        { id: 'd', text: 'Two\nlines', x: 0, y: 300, color: 'blue', parentId: 'elsewhere' },
    ];

    it('pastes back into the same branches', () => {
        const { text } = toClipboardOutline(copied);
        expect(shape(parsePastedOutline(text))).toBe('Plan\n  Goals & <aims>\n  Risks\nTwo lines');
    });

    it('gives word processors a nested list, with the text escaped', () => {
        expect(toClipboardOutline(copied).html).toBe(
            '<ul><li>Plan<ul><li>Goals &amp; &lt;aims&gt;</li><li>Risks</li></ul></li><li>Two lines</li></ul>'
        );
    });
});
