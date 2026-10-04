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

import { linesToEditorHtml } from '@/utils/richText';

import { assertEditorHtml } from './trustedTypes';

describe('assertEditorHtml', () => {
    it('accepts everything the editor markup builder emits', () => {
        const html = linesToEditorHtml([
            [
                { text: 'a < b & "c" > d' },
                { text: 'bold', bold: true },
                { text: 'not bold', bold: false },
                { text: 'italic', italic: true },
                { text: 'upright', italic: false },
                { text: 'under', underline: true },
                { text: 'struck', strike: true },
                { text: 'sized', size: 24 },
                { text: 'mono', font: 'mono' },
                { text: 'all', bold: true, italic: true, underline: true, strike: true, size: 12, font: 'serif' },
            ],
            [{ text: 'second line' }],
        ]);
        expect(html).toContain('<br>');
        expect(assertEditorHtml(html)).toBe(html);
    });

    it('accepts plain text', () => {
        expect(assertEditorHtml('just text &lt;not a tag&gt;')).toBe('just text &lt;not a tag&gt;');
    });

    it.each([
        '<img src=x onerror=alert(1)>',
        '<script>alert(1)</script>',
        '<b onclick="alert(1)">x</b>',
        '<span style="color: red" onmouseover="alert(1)">x</span>',
        '<a href="javascript:alert(1)">x</a>',
        '<svg/onload=alert(1)>',
        'text <!-- comment -->',
        '<b',
    ])('refuses markup the editor never emits: %s', (html) => {
        expect(() => assertEditorHtml(html)).toThrow(TypeError);
    });
});
