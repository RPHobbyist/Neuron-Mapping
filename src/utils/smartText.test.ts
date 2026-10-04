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

import { parseSmartText, withSmartText } from './smartText';

describe('parseSmartText', () => {
    it('reads a task box at the start, open or done, in the ways people write it', () => {
        expect(parseSmartText('[ ] Call Sam')).toEqual({ text: 'Call Sam', tags: [], task: 'open', priority: undefined });
        expect(parseSmartText('[] Call Sam').task).toBe('open');
        expect(parseSmartText('-[] Call Sam').task).toBe('open');
        expect(parseSmartText('- [x] Book room')).toMatchObject({ text: 'Book room', task: 'done' });
        expect(parseSmartText('[X] Book room').task).toBe('done');
    });

    it('leaves a box that is not at the start in the text', () => {
        expect(parseSmartText('Tick [ ] later')).toMatchObject({ text: 'Tick [ ] later', task: undefined });
    });

    it('takes hashtags out as tags, wherever they are', () => {
        expect(parseSmartText('Plan #work the #Q3-launch trip')).toMatchObject({
            text: 'Plan the trip',
            tags: ['work', 'Q3-launch'],
        });
        expect(parseSmartText('Résumé #été')).toMatchObject({ text: 'Résumé', tags: ['été'] });
    });

    it('keeps a # that is not a tag: a number, a heading mark, or inside a word', () => {
        expect(parseSmartText('Ticket #42').tags).toEqual([]);
        expect(parseSmartText('# Title').tags).toEqual([]);
        expect(parseSmartText('Learn C# fast').text).toBe('Learn C# fast');
    });

    it('reads !! on its own as high priority, but not inside a word', () => {
        expect(parseSmartText('Pay rent !!')).toMatchObject({ text: 'Pay rent', priority: 'high' });
        expect(parseSmartText('!! Pay rent')).toMatchObject({ text: 'Pay rent', priority: 'high' });
        expect(parseSmartText('Wow!!').priority).toBeUndefined();
    });

    it('reads everything at once and keeps line breaks', () => {
        expect(parseSmartText('[ ] Buy milk #home !!\nsemi-skimmed')).toEqual({
            text: 'Buy milk\nsemi-skimmed', tags: ['home'], task: 'open', priority: 'high',
        });
    });
});

describe('withSmartText', () => {
    const node = (text: string, extra: Partial<MindMapNode> = {}): MindMapNode => ({
        id: 'n', text, x: 0, y: 0, color: 'blue', parentId: 'root', ...extra,
    });

    it('sets what the shorthand says and takes it out of the text', () => {
        const result = withSmartText(node('[ ] Buy milk #home !!', { tags: ['errand'], textRuns: [[{ text: 'x' }]] }));
        expect(result).toMatchObject({ text: 'Buy milk', task: 'open', priority: 'high', tags: ['errand', 'home'] });
        expect(result.textRuns).toBeUndefined();
    });

    it("doesn't add a tag twice, whatever its case", () => {
        expect(withSmartText(node('Plan #Home', { tags: ['home'] })).tags).toEqual(['home']);
    });

    it('returns the same node when there is no shorthand, or nothing but shorthand', () => {
        const plain = node('Just words');
        expect(withSmartText(plain)).toBe(plain);
        const onlyTag = node('#home');
        expect(withSmartText(onlyTag)).toBe(onlyTag);
    });
});
