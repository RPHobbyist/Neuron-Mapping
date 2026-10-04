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

import { parseMarkdown } from './markdownParser';
import { toMarkdown } from '../exporters/markdown';
import { parseTextFile } from './textParser';
import { parseCSV } from './csvParser';
import { MindMapNode } from '@/types/mindmap';

const root = (nodes: MindMapNode[]) => nodes.find(n => n.parentId === null)!;
const childrenOf = (nodes: MindMapNode[], text: string) => {
    const parent = nodes.find(n => n.text === text)!;
    return nodes.filter(n => n.parentId === parent.id).map(n => n.text);
};

describe('parseMarkdown', () => {
    it('uses a single title heading as the root', () => {
        const nodes = parseMarkdown('# Plan\n## Research\n- read papers\n## Build\n', 'file');
        expect(root(nodes).text).toBe('Plan');
        expect(childrenOf(nodes, 'Plan')).toEqual(['Research', 'Build']);
        expect(childrenOf(nodes, 'Research')).toEqual(['read papers']);
    });

    it('puts several top-level items under a root named after the file', () => {
        const nodes = parseMarkdown('- first\n  - nested\n- second\n', 'groceries');
        expect(root(nodes).text).toBe('groceries');
        expect(childrenOf(nodes, 'groceries')).toEqual(['first', 'second']);
        expect(childrenOf(nodes, 'first')).toEqual(['nested']);
    });

    it('keeps snake_case and intraword underscores but strips emphasis', () => {
        const nodes = parseMarkdown('# Notes\n- my_var_name\n- **bold** and _em_ and *star*\n- [link](http://x.y)\n', 'f');
        expect(childrenOf(nodes, 'Notes')).toEqual(['my_var_name', 'bold and em and star', 'link']);
    });

    it('ignores fenced code blocks', () => {
        const nodes = parseMarkdown('# Script\n```bash\n# a comment\n- not an item\n```\n- real item\n', 'f');
        expect(nodes.map(n => n.text)).toEqual(['Script', 'real item']);
    });

    it('ignores #hashtags that are not headings', () => {
        const nodes = parseMarkdown('# Title\n#hashtag\n- item\n', 'f');
        expect(nodes.map(n => n.text)).toEqual(['Title', 'item']);
    });
});

describe('markdown round trip', () => {
    it('keeps empty topics and the topics under them', () => {
        const nodes: MindMapNode[] = [
            { id: 'r', text: 'Root', x: 0, y: 0, color: 'root', parentId: null },
            { id: 'a', text: 'First', x: 0, y: 0, color: 'blue', parentId: 'r' },
            { id: 'e', text: '', x: 0, y: 0, color: 'blue', parentId: 'r' },
            { id: 'c', text: 'Child', x: 0, y: 0, color: 'blue', parentId: 'e' },
        ];
        const parsed = parseMarkdown(toMarkdown(nodes));
        const byText = (text: string) => parsed.find(n => n.text === text)!;

        expect(parsed.map(n => n.text)).toEqual(['Root', 'First', '', 'Child']);
        expect(byText('Child').parentId).toBe(byText('').id);
        expect(byText('').parentId).toBe(byText('Root').id);
    });
});

describe('parseTextFile', () => {
    it('handles tab indentation and a first indented line that is two levels deep', () => {
        const nodes = parseTextFile('Root\n\t\tDeep\n\tShallow\n\t\tUnder shallow\n');
        expect(childrenOf(nodes, 'Root')).toEqual(['Deep', 'Shallow']);
        expect(childrenOf(nodes, 'Shallow')).toEqual(['Under shallow']);
    });

    it('treats a tab like the same width of spaces', () => {
        const nodes = parseTextFile('Root\n    A\n\tA child\n');
        expect(childrenOf(nodes, 'Root')).toEqual(['A', 'A child']);
    });
});

describe('parseCSV', () => {
    it('keeps quotes that are part of a value', () => {
        const nodes = parseCSV('Quotes,"She said ""hi""","""boxed"""\n', 'file');
        expect(childrenOf(nodes, 'Quotes')).toEqual(['She said "hi"', '"boxed"']);
    });

    it('names the root after the file when the rows are separate topics', () => {
        expect(root(parseCSV('A,b\nC,d\n', 'inventory')).text).toBe('inventory');
    });
});
