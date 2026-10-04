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

import { sanitizeUrl, sanitizeImageUrl, isRootNode, getContentBounds, getAncestorIds, getNodeDimensions, getDescendantIds, detachParentCycles, areNodesConnected } from './common';
import { DETACHED_PARENT_ID } from '@/lib/constants';
import { MindMapNode } from '@/types/mindmap';

const node = (id: string, parentId: string | null, extra: Partial<MindMapNode> = {}): MindMapNode =>
    ({ id, text: id, x: 0, y: 0, color: 'orange', parentId, ...extra });

describe('sanitizeUrl', () => {
    it('adds https:// to a bare hostname', () => {
        expect(sanitizeUrl('example.com')).toBe('https://example.com');
        expect(sanitizeUrl('www.example.com/page?x=1')).toBe('https://www.example.com/page?x=1');
    });

    it('keeps allowed absolute URLs and site-relative paths', () => {
        expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
        expect(sanitizeUrl('mailto:someone@example.com')).toBe('mailto:someone@example.com');
        expect(sanitizeUrl('/templates')).toBe('/templates');
    });

    it('rejects script and unknown schemes', () => {
        expect(sanitizeUrl('javascript:alert(1)')).toBeUndefined();
        expect(sanitizeUrl('data:text/html,hi')).toBeUndefined();
    });
});

describe('root handling', () => {
    it('recognises the root by parentage, not id', () => {
        expect(isRootNode(node('3f2c', null))).toBe(true);
        expect(isRootNode(node('root', 'other'))).toBe(false);
    });

    it('sizes an unmeasured root as the default circle only when it has no other shape', () => {
        expect(getNodeDimensions(node('x', null))).toEqual({ w: 128, h: 128 });
        expect(getNodeDimensions(node('x', null, { shape: 'rectangle' })).h).toBe(50);
    });

    it('lists ancestors and stops on a cycle', () => {
        const nodes = [node('a', null), node('b', 'a'), node('c', 'b'), node('x', 'y'), node('y', 'x')];
        expect([...getAncestorIds('c', nodes)]).toEqual(['b', 'a']);
        expect([...getAncestorIds('x', nodes)]).toEqual(['y', 'x']);
    });
});

describe('getContentBounds', () => {
    it('covers nodes, drawings and box areas', () => {
        const bounds = getContentBounds(
            [node('a', null, { x: 0, y: 0, width: 100, height: 40 })],
            [{ id: 'd', color: '#f00', points: [{ x: -300, y: 10 }] }],
            [{ id: 'b', x: 10, y: 10, width: 500, height: 200, label: '', color: '#000' }],
        );
        expect(bounds).toEqual({ minX: -300, minY: -20, maxX: 510, maxY: 210 });
    });

    it('is null for an empty canvas', () => {
        expect(getContentBounds([])).toBeNull();
    });
});

describe('sanitizeImageUrl', () => {
    it('accepts ICO images under both of their MIME types', () => {
        expect(sanitizeImageUrl('data:image/x-icon;base64,AAAB')).toBe('data:image/x-icon;base64,AAAB');
        expect(sanitizeImageUrl('data:image/vnd.microsoft.icon;base64,AAAB')).toBe('data:image/vnd.microsoft.icon;base64,AAAB');
    });
});

describe('getDescendantIds', () => {
    it('returns the node and its whole subtree', () => {
        const nodes = [node('r', null), node('a', 'r'), node('b', 'a'), node('c', 'r')];
        expect(getDescendantIds('a', nodes)).toEqual(new Set(['a', 'b']));
    });

    it('ends on data with a parent cycle', () => {
        const nodes = [node('a', 'b'), node('b', 'a'), node('c', 'c')];
        expect(getDescendantIds('a', nodes)).toEqual(new Set(['a', 'b']));
        expect(getDescendantIds('c', nodes)).toEqual(new Set(['c']));
    });
});

describe('detachParentCycles', () => {
    const parentOf = (nodes: MindMapNode[], id: string) => nodes.find(n => n.id === id)!.parentId;
    const detachedCount = (nodes: MindMapNode[]) => nodes.filter(n => n.parentId === DETACHED_PARENT_ID).length;

    it('returns a valid tree unchanged', () => {
        const nodes = [node('r', null), node('a', 'r'), node('b', 'a'), node('d', DETACHED_PARENT_ID)];
        expect(detachParentCycles(nodes)).toBe(nodes);
    });

    it('detaches a node that is its own parent', () => {
        expect(parentOf(detachParentCycles([node('a', 'a')]), 'a')).toBe(DETACHED_PARENT_ID);
    });

    it('breaks two- and three-node loops by detaching one node each', () => {
        const fixed = detachParentCycles([node('a', 'b'), node('b', 'a'), node('x', 'z'), node('y', 'x'), node('z', 'y')]);
        expect(detachedCount(fixed)).toBe(2);
        fixed.forEach(n => expect(getAncestorIds(n.id, fixed).has(n.id)).toBe(false));
    });

    it('leaves a branch that leads into a loop attached', () => {
        const fixed = detachParentCycles([node('tail', 'a'), node('a', 'b'), node('b', 'a')]);
        expect(parentOf(fixed, 'tail')).toBe('a');
        expect(detachedCount(fixed)).toBe(1);
    });
});

describe('areNodesConnected', () => {
    it('sees parent links and relations in either direction', () => {
        const a = node('a', null, { relations: [{ targetId: 'b' }] });
        const b = node('b', null);
        const c = node('c', 'a');
        expect(areNodesConnected(a, b)).toBe(true);
        expect(areNodesConnected(b, a)).toBe(true);
        expect(areNodesConnected(a, c)).toBe(true);
        expect(areNodesConnected(b, c)).toBe(false);
    });

    it('can leave out the relation that is being moved', () => {
        const a = node('a', null, { relations: [{ targetId: 'b' }] });
        const b = node('b', null);
        expect(areNodesConnected(a, b, { sourceId: 'a', targetId: 'b' })).toBe(false);
        expect(areNodesConnected(b, a, { sourceId: 'a', targetId: 'b' })).toBe(false);
    });
});
