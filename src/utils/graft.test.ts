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

import { DETACHED_PARENT_ID } from '@/lib/constants';
import { MindMapNode, NodeColor } from '@/types/mindmap';

import { graftNodes } from './graft';
import { layoutBranch } from './layoutUtils';

const node = (id: string, parentId: string | null, x = 0, y = 0, color: NodeColor = 'blue', extra: Partial<MindMapNode> = {}): MindMapNode => ({
    id, text: id, x, y, color, parentId, width: 150, height: 60, ...extra,
});

const outline = (): MindMapNode[] => [
    node('File root', null, 0, 0, 'root'),
    node('First', 'File root', 0, 0, 'orange'),
    node('Second', 'File root', 0, 0, 'orange', { relations: [{ targetId: 'First' }] }),
    node('Deeper', 'First', 0, 0, 'blue'),
];

const byText = (nodes: MindMapNode[], text: string) => nodes.find(n => n.text === text)!;

describe('layoutBranch', () => {
    it('lays every subtopic out on one side of the branch top, which stays at the origin', () => {
        const laidOut = layoutBranch(outline(), 'File root', 'left');
        expect(byText(laidOut, 'File root')).toMatchObject({ x: 0, y: 0 });
        expect(laidOut.filter(n => n.text !== 'File root').every(n => n.x < 0)).toBe(true);
        expect(byText(laidOut, 'Deeper').x).toBeLessThan(byText(laidOut, 'First').x);
    });
});

describe('graftNodes', () => {
    const map = [node('Root', null, 0, 0, 'root'), node('Right child', 'Root', 300, 0, 'orange'), node('Under it', 'Right child', 600, 200)];

    it('adds the imported tree under the target with new ids, keeping its links', () => {
        const { nodes, topIds } = graftNodes(outline(), map[0], map);
        const top = nodes.find(n => n.id === topIds[0])!;
        expect(top).toMatchObject({ text: 'File root', parentId: 'Root' });
        expect(nodes.every(n => !['File root', 'First', 'Second', 'Deeper'].includes(n.id))).toBe(true);
        expect(byText(nodes, 'Deeper').parentId).toBe(byText(nodes, 'First').id);
        expect(byText(nodes, 'Second').relations).toEqual([{ targetId: byText(nodes, 'First').id }]);
    });

    it('places the branch beside the target, below what already grows on that side', () => {
        const { nodes, topIds } = graftNodes(outline(), map[0], map);
        const branch = nodes;
        const top = branch.find(n => n.id === topIds[0])!;
        expect(top.x).toBeGreaterThan(0);
        expect(Math.min(...branch.map(n => n.y - 30))).toBeGreaterThan(230);
    });

    it('grows to the left of a node that is left of its parent', () => {
        const leftMap = [node('Root', null, 0, 0, 'root'), node('Left child', 'Root', -300, 0, 'green')];
        const { nodes } = graftNodes(outline(), leftMap[1], leftMap);
        expect(nodes.every(n => n.x < -300)).toBe(true);
    });

    it('gives the branch the colour of the target branch, unless the file has its own', () => {
        const recoloured = graftNodes(outline(), map[1], map).nodes;
        expect(new Set(recoloured.map(n => n.color))).toEqual(new Set(['orange']));

        const kept = graftNodes(outline(), map[1], map, { keepColors: true }).nodes;
        expect(byText(kept, 'Deeper').color).toBe('blue');
        expect(byText(kept, 'File root').color).toBe('orange');
    });

    it('attaches detached branches of the file to the target too', () => {
        const { nodes, topIds } = graftNodes([...outline(), node('Floating', DETACHED_PARENT_ID)], map[0], map);
        expect(topIds).toHaveLength(2);
        expect(byText(nodes, 'Floating').parentId).toBe('Root');
    });
});
