/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { DETACHED_PARENT_ID } from '@/lib/constants';
import { MindMapNode } from '@/types/mindmap';
import { parseContent } from '@/utils/parsers';

import { buildOutline, toCSV, toMarkdown, toOPML, toText } from '.';
import type { OutlineItem } from './outline';

const node = (text: string, parentId: string | null, x = 0, y = 0, extra: Partial<MindMapNode> = {}): MindMapNode => ({
    id: text, text, x, y, color: parentId === null ? 'root' : 'blue', parentId, ...extra,
});

const map: MindMapNode[] = [
    node('Plan', null, 0, 0, { notes: 'Why we plan.\n\nA second paragraph.' }),
    node('Build', 'Plan', 250, 100),
    node('Research', 'Plan', 250, -100, { link: 'https://example.com/research' }),
    node('Read papers', 'Research', 500, -100, { notes: 'Start with the survey.' }),
    node('Interview', 'Research', 500, -40),
];

interface Shape { text: string; notes?: string; link?: string; children: Shape[] }

const shapeOf = (nodes: MindMapNode[], withContent: boolean): Shape[] => {
    const toShape = ({ node: n, children }: OutlineItem): Shape => ({
        text: n.text,
        ...(withContent && n.notes ? { notes: n.notes } : {}),
        ...(withContent && n.link ? { link: n.link } : {}),
        children: children.map(toShape),
    });
    return buildOutline(nodes).map(toShape);
};

describe('buildOutline', () => {
    it('orders siblings as they appear on the canvas', () => {
        expect(shapeOf(map, false)[0].children.map(c => c.text)).toEqual(['Research', 'Build']);
    });

    it('orders the siblings of a top-down tree left to right', () => {
        const tree = [node('Top', null), node('Right', 'Top', 200, 150), node('Left', 'Top', -200, 150)];
        expect(shapeOf(tree, false)[0].children.map(c => c.text)).toEqual(['Left', 'Right']);
    });

    it('puts detached branches after the root and leaves out parent loops', () => {
        const nodes = [
            node('Detached', DETACHED_PARENT_ID), node('Root', null), node('Under detached', 'Detached'),
            node('Loop A', 'Loop B'), node('Loop B', 'Loop A'),
        ];
        expect(shapeOf(nodes, false)).toEqual([
            { text: 'Root', children: [] },
            { text: 'Detached', children: [{ text: 'Under detached', children: [] }] },
        ]);
    });
});

describe('exports read back into the same map', () => {
    it('Markdown, with notes and links', () => {
        const imported = parseContent(toMarkdown(map), 'md', 'file');
        expect(shapeOf(imported, true)).toEqual(shapeOf(map, true));
    });

    it('OPML, with notes and links', () => {
        const imported = parseContent(toOPML(map, 'Plan'), 'opml', 'file');
        expect(shapeOf(imported, true)).toEqual(shapeOf(map, true));
    });

    it('plain text', () => {
        const imported = parseContent(toText(map), 'txt', 'file');
        expect(shapeOf(imported, false)).toEqual(shapeOf(map, false));
    });

    it('CSV', () => {
        const imported = parseContent(toCSV(map), 'csv', 'file');
        expect(shapeOf(imported, false)).toEqual(shapeOf(map, false));
    });
});

describe('text that looks like markup survives', () => {
    const tricky = [
        '*not emphasis* and _not either_',
        '[x] not a checkbox',
        'a <br> tag, `code` and ~~strike~~',
        'back\\slash # hash',
        'two\nlines',
        '=SUM(A1:A3)',
        '-5 degrees, "quoted"',
        'x < y & y > z',
    ];
    const trickyMap = [node('Root', null), ...tricky.map((text, i) => node(text, 'Root', 200, i * 50))];
    const texts = (nodes: MindMapNode[]) => shapeOf(nodes, false)[0].children.map(c => c.text);

    it('in Markdown', () => {
        expect(texts(parseContent(toMarkdown(trickyMap), 'md', 'file'))).toEqual(tricky);
    });

    it('in OPML', () => {
        expect(texts(parseContent(toOPML(trickyMap, 'Root'), 'opml', 'file'))).toEqual(tricky);
    });

    it('in CSV', () => {
        expect(texts(parseContent(toCSV(trickyMap), 'csv', 'file'))).toEqual(tricky);
    });
});

describe('Markdown import', () => {
    it('keeps paragraphs, quotes and code under a topic as its notes', () => {
        const nodes = parseContent('# Title\nIntro text.\n\n## Part\n> quoted\n\n```js\nconst a = 1;\n```\n- item\n', 'md');
        const notesOf = (text: string) => nodes.find(n => n.text === text)?.notes;
        expect(notesOf('Title')).toBe('Intro text.');
        expect(notesOf('Part')).toBe('quoted\n\n```js\nconst a = 1;\n```');
        expect(notesOf('item')).toBeUndefined();
    });

    it('joins a list item that wraps onto the next line', () => {
        const nodes = parseContent('- a long item\n  that wraps\n- next\n', 'md', 'file');
        expect(nodes.map(n => n.text)).toEqual(['file', 'a long item that wraps', 'next']);
    });

    it('drops links it would not open', () => {
        const nodes = parseContent('# [Title](javascript:alert(1))\n', 'md');
        expect(nodes[0]).toMatchObject({ text: 'Title' });
        expect(nodes[0].link).toBeUndefined();
    });
});
