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

import { parseCSV } from './csvParser';

describe('parseCSV', () => {
    it('labels a row without a first cell by its row in the file', () => {
        const nodes = parseCSV('Fruits,Apple\n\n,Carrot\n');
        expect(nodes.map(n => n.text)).toContain('Row 3');
    });

    it('trims around cells but keeps whitespace inside quotes', () => {
        const texts = parseCSV('Group,  plain  , "  padded "').map(n => n.text);
        expect(texts).toContain('plain');
        expect(texts).toContain('  padded ');
    });

    it('treats a quote in the middle of a field as part of the value', () => {
        const texts = parseCSV('TV,55" screen\nPhone,6" screen\n').map(n => n.text);
        expect(texts).toEqual(['CSV Import', 'TV', '55" screen', 'Phone', '6" screen']);
    });

    it('keeps line breaks, commas and escaped quotes inside a quoted field', () => {
        const texts = parseCSV('Note,"line 1\r\nline 2, still ""quoted"""\r\nNext,Item\r\n').map(n => n.text);
        expect(texts).toEqual(['CSV Import', 'Note', 'line 1\nline 2, still "quoted"', 'Next', 'Item']);
    });

    it('skips cells that are only whitespace', () => {
        const nodes = parseCSV('Group,"   ",Item\nOther,x');
        expect(nodes.map(n => n.text)).toEqual(['CSV Import', 'Group', 'Item', 'Other', 'x']);
    });

    it('continues a topic named in an earlier row, and uses the top of one tree as the root', () => {
        const nodes = parseCSV('Plan,Research,Build\nResearch,Read,Interview\nRead,Papers\n', 'file');
        const byText = new Map(nodes.map(n => [n.text, n]));
        expect(nodes.filter(n => n.parentId === null).map(n => n.text)).toEqual(['Plan']);
        expect(byText.get('Read')!.parentId).toBe(byText.get('Research')!.id);
        expect(byText.get('Papers')!.parentId).toBe(byText.get('Read')!.id);
        expect(byText.get('Plan')!.color).toBe('root');
    });

    it('reads cells a spreadsheet export marked as text', () => {
        const texts = parseCSV("Sums,'=1+1,'-5 degrees,'plain").map(n => n.text);
        expect(texts).toEqual(['Sums', '=1+1', '-5 degrees', "'plain"]);
    });
});
