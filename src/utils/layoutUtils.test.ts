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

import { autoLayoutNodes, layoutSubtree, moveBoxAreasWithNodes } from './layoutUtils';
import { DETACHED_PARENT_ID } from '@/lib/constants';
import { BoxArea, MindMapNode } from '@/types/mindmap';

const node = (id: string, parentId: string | null): MindMapNode =>
    ({ id, text: id, x: 0, y: 0, color: 'orange', parentId });

const DEFAULT_W = 150;
const DEFAULT_H = 60;

const boxesOverlap = (a: MindMapNode, b: MindMapNode) =>
    Math.abs(a.x - b.x) < DEFAULT_W && Math.abs(a.y - b.y) < DEFAULT_H;

const findOverlaps = (nodes: MindMapNode[]) => {
    const overlaps: string[] = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            if (boxesOverlap(nodes[i], nodes[j])) overlaps.push(`${nodes[i].id}/${nodes[j].id}`);
        }
    }
    return overlaps;
};

const twoTrees = (): MindMapNode[] => {
    const nodes = [node('root', null), node('a', 'root'), node('b', 'root'), node('branch', DETACHED_PARENT_ID)];
    for (let i = 0; i < 12; i++) nodes.push(node(`c${i}`, 'branch'));
    return nodes;
};

describe('the other layouts', () => {
    const tree = (): MindMapNode[] => [
        node('r', null),
        ...['a', 'b', 'c'].map(id => node(id, 'r')),
        node('a1', 'a'), node('a2', 'a'), node('c1', 'c'),
    ];
    const at = (nodes: MindMapNode[], id: string) => nodes.find(n => n.id === id)!;

    it('puts every branch on the right in a logic chart', () => {
        const laidOut = autoLayoutNodes(tree(), 'logic');
        laidOut.filter(n => n.id !== 'r').forEach(n => expect(n.x).toBeGreaterThan(0));
        expect(at(laidOut, 'a').y).toBeLessThan(at(laidOut, 'b').y);
        expect(findOverlaps(laidOut)).toEqual([]);
    });

    it('lines the branches up along a timeline, in order, with their topics below', () => {
        const laidOut = autoLayoutNodes(tree(), 'timeline');
        expect(['a', 'b', 'c'].map(id => at(laidOut, id).y)).toEqual([0, 0, 0]);
        expect(at(laidOut, 'a').x).toBeLessThan(at(laidOut, 'b').x);
        expect(at(laidOut, 'b').x).toBeLessThan(at(laidOut, 'c').x);
        expect(at(laidOut, 'a1').y).toBeGreaterThan(0);
        expect(findOverlaps(laidOut)).toEqual([]);
    });

    it('spaces the rings of a radial map by the size of their nodes', () => {
        const wide = tree().map(n => (n.id === 'a' ? { ...n, width: 600, height: 60 } : n));
        const radius = (nodes: MindMapNode[], id: string) => Math.hypot(at(nodes, id).x, at(nodes, id).y);
        expect(radius(autoLayoutNodes(wide, 'radial'), 'a1')).toBeGreaterThan(radius(autoLayoutNodes(tree(), 'radial'), 'a1'));
    });

    it('lays out one branch, which keeps its place, and leaves the rest alone', () => {
        const nodes = tree().map(n => ({ ...n, x: n.id === 'a' ? 400 : n.x, y: n.id === 'a' ? -200 : n.y }));
        const laidOut = layoutSubtree(nodes, 'a', 'vertical');
        expect(at(laidOut, 'a')).toMatchObject({ x: 400, y: -200 });
        expect(at(laidOut, 'a1').y).toBeGreaterThan(-200);
        expect(at(laidOut, 'a1').x).toBeLessThan(at(laidOut, 'a2').x);
        ['r', 'b', 'c', 'c1'].forEach(id => expect(at(laidOut, id)).toBe(at(nodes, id)));
        expect(layoutSubtree(nodes, 'b', 'vertical')).toBe(nodes);
    });
});

describe('autoLayoutNodes with collapsed branches', () => {
    const collapsedMap = (): MindMapNode[] => [
        node('root', null),
        { ...node('big', 'root'), collapsed: true },
        node('small', 'root'),
        ...Array.from({ length: 6 }, (_, i) => node(`h${i}`, 'big')),
    ];
    const at = (nodes: MindMapNode[], id: string) => nodes.find(n => n.id === id)!;

    it.each(['horizontal', 'vertical'] as const)('gives a collapsed node the room of a leaf (%s)', (direction) => {
        const open = autoLayoutNodes(collapsedMap().map(n => ({ ...n, collapsed: undefined })), direction);
        const collapsed = autoLayoutNodes(collapsedMap(), direction);
        const shown = collapsed.filter(n => !n.id.startsWith('h'));
        expect(findOverlaps(shown)).toEqual([]);

        const withoutHidden = autoLayoutNodes(collapsedMap().filter(n => !n.id.startsWith('h')), direction);
        shown.forEach(n => expect({ x: n.x, y: n.y }).toEqual({ x: at(withoutHidden, n.id).x, y: at(withoutHidden, n.id).y }));

        const offset = (nodes: MindMapNode[], id: string) => ({ x: at(nodes, id).x - at(nodes, 'big').x, y: at(nodes, id).y - at(nodes, 'big').y });
        for (let i = 0; i < 6; i++) expect(offset(collapsed, `h${i}`)).toEqual(offset(open, `h${i}`));
    });

    it('keeps every node, in the order given', () => {
        expect(autoLayoutNodes(collapsedMap(), 'horizontal').map(n => n.id)).toEqual(collapsedMap().map(n => n.id));
    });
});

describe('autoLayoutNodes', () => {
    it.each(['horizontal', 'vertical', 'radial', 'logic', 'timeline', 'fishbone'] as const)('keeps separate trees apart (%s)', (direction) => {
        expect(findOverlaps(autoLayoutNodes(twoTrees(), direction))).toEqual([]);
    });

    it('keeps many branches apart in a radial layout', () => {
        const nodes = [node('r', null)];
        for (let i = 0; i < 20; i++) {
            nodes.push(node(`b${i}`, 'r'));
            for (let j = 0; j < 3; j++) nodes.push(node(`b${i}-${j}`, `b${i}`));
        }
        expect(findOverlaps(autoLayoutNodes(nodes, 'radial'))).toEqual([]);
    });

    it('keeps large nodes apart in a radial layout', () => {
        const nodes = [node('r', null)];
        for (let i = 0; i < 8; i++) nodes.push({ ...node(`big${i}`, 'r'), width: 400, height: 200 });
        const laidOut = autoLayoutNodes(nodes, 'radial');
        for (let i = 0; i < laidOut.length; i++) {
            for (let j = i + 1; j < laidOut.length; j++) {
                const [a, b] = [laidOut[i], laidOut[j]];
                const apart = Math.abs(a.x - b.x) >= ((a.width ?? DEFAULT_W) + (b.width ?? DEFAULT_W)) / 2
                    || Math.abs(a.y - b.y) >= ((a.height ?? DEFAULT_H) + (b.height ?? DEFAULT_H)) / 2;
                expect(apart, `${a.id}/${b.id}`).toBe(true);
            }
        }
    });

    const bushyTree = (): MindMapNode[] => {
        const nodes = [node('root', null)];
        for (let b = 0; b < 5; b++) {
            nodes.push(node(`b${b}`, 'root'));
            for (let c = 0; c <= b; c++) {
                nodes.push(node(`b${b}c${c}`, `b${b}`));
                if (c % 2 === 0) nodes.push(node(`b${b}c${c}g`, `b${b}c${c}`));
            }
        }
        return nodes;
    };

    it.each(['logic', 'timeline', 'fishbone'] as const)('lays a larger map out without overlaps (%s)', (direction) => {
        expect(findOverlaps(autoLayoutNodes(bushyTree(), direction))).toEqual([]);
    });

    it('puts every branch of a logic chart to the right of its parent', () => {
        const laidOut = autoLayoutNodes(bushyTree(), 'logic');
        const byId = new Map(laidOut.map(n => [n.id, n]));
        laidOut.filter(n => n.parentId).forEach(n => expect(n.x).toBeGreaterThan(byId.get(n.parentId!)!.x));
    });

    it('puts the head of a fishbone on the right and its bones off to the left', () => {
        const laidOut = autoLayoutNodes(bushyTree(), 'fishbone');
        const root = laidOut.find(n => n.id === 'root')!;
        laidOut.filter(n => n.id !== root.id).forEach(n => expect(n.x).toBeLessThan(root.x));
        const byId = new Map(laidOut.map(n => [n.id, n]));
        ['b0', 'b1', 'b2', 'b3', 'b4'].forEach((id, i) => {
            laidOut.filter(n => n.id.startsWith(id)).forEach(n => expect(Math.sign(n.y)).toBe(i % 2 === 0 ? -1 : 1));
            expect(byId.get(id)).toBeDefined();
        });
    });

    it('keeps the root children in their original order, reading clockwise', () => {
        const nodes = [node('r', null), node('s1', 'r'), node('s2', 'r'), node('s3', 'r'), node('s4', 'r')];
        const laidOut = autoLayoutNodes(nodes, 'horizontal');
        const byId = new Map(laidOut.map(n => [n.id, n]));
        const root = byId.get('r')!;

        const right = ['s1', 's2', 's3', 's4'].filter(id => byId.get(id)!.x > root.x);
        const left = ['s1', 's2', 's3', 's4'].filter(id => byId.get(id)!.x < root.x);

        expect(right).toEqual(['s1', 's2']);
        expect(left).toEqual(['s3', 's4']);
        expect(byId.get('s1')!.y).toBeLessThan(byId.get('s2')!.y);
        expect(byId.get('s3')!.y).toBeGreaterThan(byId.get('s4')!.y);
    });

    it('keeps the first tree at the origin', () => {
        const laidOut = autoLayoutNodes(twoTrees(), 'horizontal');
        const root = laidOut.find(n => n.id === 'root')!;
        expect([root.x, root.y]).toEqual([0, 0]);
    });
});

describe('moveBoxAreasWithNodes', () => {
    const box = (id: string, x: number, y: number): BoxArea =>
        ({ id, x, y, width: 100, height: 100, label: id, color: '#000' });
    const at = (id: string, x: number, y: number): MindMapNode => ({ ...node(id, null), x, y });

    it('moves a box by the average displacement of the nodes it contained', () => {
        const before = [at('a', 10, 10), at('b', 50, 50), at('far', 500, 500)];
        const after = [at('a', 110, 10), at('b', 150, 90), at('far', 0, 0)];
        expect(moveBoxAreasWithNodes([box('g', 0, 0)], before, after)).toEqual([{ ...box('g', 0, 0), x: 100, y: 20 }]);
    });

    it('leaves empty and unmoved boxes as they are', () => {
        const boxes = [box('empty', 1000, 1000), box('still', 0, 0)];
        const nodes = [at('a', 10, 10)];
        const result = moveBoxAreasWithNodes(boxes, nodes, nodes);
        expect(result[0]).toBe(boxes[0]);
        expect(result[1]).toBe(boxes[1]);
    });
});
