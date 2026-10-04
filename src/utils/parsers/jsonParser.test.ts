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

import { parseJSON } from './jsonParser';
import { MindMapNode } from '@/types/mindmap';

const childTexts = (nodes: MindMapNode[], parentText: string) => {
    const parent = nodes.find(n => n.text === parentText)!;
    return nodes.filter(n => n.parentId === parent.id).map(n => n.text);
};

describe('parseJSON', () => {
    it('keeps every field of a record that has a name', () => {
        const nodes = parseJSON(JSON.stringify({
            name: 'my-app',
            version: '1.0.0',
            dependencies: { react: '^18.3.1' },
        }));

        const root = nodes.find(n => n.parentId === null)!;
        expect(root.text).toBe('my-app');
        expect(childTexts(nodes, 'my-app')).toEqual(['version', 'dependencies']);
        expect(childTexts(nodes, 'dependencies')).toEqual(['react']);
        expect(childTexts(nodes, 'react')).toEqual(['^18.3.1']);
    });

    it('labels array records by their name and keeps their other fields', () => {
        const nodes = parseJSON(JSON.stringify([{ name: 'Alice', age: 30 }]));
        expect(childTexts(nodes, 'Alice')).toEqual(['age']);
        expect(childTexts(nodes, 'age')).toEqual(['30']);
    });

    it('reads tree exports with children', () => {
        const nodes = parseJSON(JSON.stringify({
            name: 'Project',
            children: [{ name: 'Phase 1', children: [{ name: 'Task A' }] }],
        }));

        expect(nodes.find(n => n.parentId === null)!.text).toBe('Project');
        expect(childTexts(nodes, 'Project')).toEqual(['Phase 1']);
        expect(childTexts(nodes, 'Phase 1')).toEqual(['Task A']);
        expect(childTexts(nodes, 'Task A')).toEqual([]);
    });

    it('keeps text that looks like markup', () => {
        const nodes = parseJSON(JSON.stringify({ rule: 'a < b && c > d' }));
        expect(nodes.some(n => n.text === 'a < b && c > d')).toBe(true);
    });

    it('keeps a top-level single value under the root', () => {
        const nodes = parseJSON('42');
        expect(nodes.map(n => n.text)).toEqual(['Value', '42']);
        expect(nodes[1].parentId).toBe(nodes[0].id);
    });
});
