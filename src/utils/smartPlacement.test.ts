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

import { findBestParent } from './smartPlacement';
import { MindMapNode } from '@/types/mindmap';

const node = (id: string, text: string, parentId: string | null): MindMapNode =>
    ({ id, text, x: 0, y: 0, color: 'orange', parentId });

const map = [
    node('root', 'Product Launch', null),
    node('marketing', 'Marketing plan', 'root'),
    node('budget', 'Budget review', 'root'),
    node('ads', 'Social media ads', 'marketing'),
];

describe('findBestParent', () => {
    it('attaches text that matches nothing to the root', () => {
        expect(findBestParent(map, 'Zebra xylophone', new Set())).toBe('root');
    });

    it('attaches to the node that shares words with the text', () => {
        expect(findBestParent(map, 'Budget forecast', new Set())).toBe('budget');
    });

    it('uses the single selected node when there is one', () => {
        expect(findBestParent(map, 'Zebra', new Set(['ads']))).toBe('ads');
    });

    it('matches words in non-Latin scripts', () => {
        const nodes = [node('r', 'Проект', null), node('p', 'Бюджет компании', 'r'), node('q', 'Реклама', 'r')];
        expect(findBestParent(nodes, 'Бюджет на год', new Set())).toBe('p');
    });

    it('finds the root by parentage, not by id', () => {
        const imported = [node('3f2c', 'Imported', null), node('a1', 'Alpha', '3f2c')];
        expect(findBestParent(imported, 'Nothing related', new Set())).toBe('3f2c');
    });

    it('matches a node by its tags as it does by its text', () => {
        const nodes = [...map, { ...node('q3', 'Third quarter', 'root'), tags: ['hiring', 'people team'] }];
        expect(findBestParent(nodes, 'Hiring a designer', new Set())).toBe('q3');
        expect(findBestParent(nodes, 'People survey', new Set())).toBe('q3');
    });

    it('matches a node by its notes, though less than by text or tags', () => {
        const nodes = [
            ...map,
            { ...node('press', 'Press', 'root'), notes: 'Draft the **newsletter** and the press kit.' },
            node('mail', 'Newsletter', 'root'),
        ];
        expect(findBestParent(nodes, 'Press kit photos', new Set())).toBe('press');
        expect(findBestParent(nodes, 'Newsletter signup', new Set())).toBe('mail');
        expect(findBestParent(nodes.slice(0, -1), 'Newsletter signup', new Set())).toBe('press');
    });

    it('attaches to a weakly matching detached node, not to its marker parent', () => {
        const nodes = [node('root', 'Product Launch', null), node('loose', 'Recruiting', '__detached__')];
        expect(findBestParent(nodes, 'recruit plan', new Set())).toBe('loose');
    });
});
