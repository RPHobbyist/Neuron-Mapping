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

import { sanitizeText } from './parserUtils';
import { MindMapNodeSchema } from '@/lib/schemas';

describe('sanitizeText', () => {
    it('keeps text that looks like markup unchanged', () => {
        expect(sanitizeText('a < b & c')).toBe('a < b & c');
        expect(sanitizeText('if a<b and c>d')).toBe('if a<b and c>d');
        expect(sanitizeText('<script>alert(1)</script>')).toBe('<script>alert(1)</script>');
        expect(sanitizeText('Tom &amp; Jerry')).toBe('Tom &amp; Jerry');
    });

    it('strips control characters but keeps newlines and tabs', () => {
        expect(sanitizeText('line 1\r\nline 2\tend\u0000\u001b')).toBe('line 1\nline 2\tend');
    });

    it('returns an empty string for empty input', () => {
        expect(sanitizeText('')).toBe('');
    });
});

describe('loading a node through the schema', () => {
    it('round-trips node text, notes and formatted runs', () => {
        const node = MindMapNodeSchema.parse({
            id: 'n1',
            text: 'Revenue < Cost\nx<y',
            x: 0,
            y: 0,
            color: 'blue',
            parentId: null,
            notes: 'see <b>here</b> & there',
            textRuns: [[{ text: 'Revenue < ', bold: true }, { text: 'Cost' }], [{ text: 'x<y' }]],
        });

        expect(node.text).toBe('Revenue < Cost\nx<y');
        expect(node.notes).toBe('see <b>here</b> & there');
        expect(node.textRuns?.map(line => line.map(run => run.text).join('')).join('\n')).toBe(node.text);
    });
});
