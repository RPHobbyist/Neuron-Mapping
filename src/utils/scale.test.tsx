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
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';

import { clipPolyline, useLineRouting } from '@/components/mindmap/lineRouting';
import { historyReducer, createHistoryState } from '@/hooks/useHistory';
import { undoLimit } from '@/hooks/useMindMapNodes';
import { buildOutline, walkOutline } from '@/utils/exporters/outline';
import { LAYOUTS, autoLayoutNodes } from '@/utils/layoutUtils';
import { normalizeMapNodes } from '@/utils/mapIntegrity';
import { generateStressMap } from '@/utils/stressMap';
import { SpatialIndex } from '@/utils/spatialIndex';
import { MindMapNode } from '@/types/mindmap';

const LARGE = 10_000;

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const renderHook = <P, R>(hook: (props: P) => R, { initialProps }: { initialProps: P }) => {
    const result = { current: null as unknown as R };
    let props = initialProps;
    const Probe = () => {
        result.current = hook(props);
        return null;
    };
    const root = createRoot(document.createElement('div'));
    act(() => root.render(<Probe />));
    return {
        result,
        rerender: (next: P) => {
            props = next;
            act(() => root.render(<Probe />));
        },
        unmount: () => act(() => root.unmount()),
    };
};

const timed = <T,>(work: () => T): { result: T; ms: number } => {
    const start = performance.now();
    const result = work();
    return { result, ms: performance.now() - start };
};

describe('a map of 10,000 topics', () => {
    const map = generateStressMap(LARGE, { relationsRatio: 0.02 });
    const chain = generateStressMap(LARGE, { chain: true });

    it('is read and checked quickly', () => {
        const { result, ms } = timed(() => normalizeMapNodes(map));
        expect(result.nodes).toHaveLength(LARGE);
        expect(result.repaired).toBe(0);
        expect(ms).toBeLessThan(3000);
    });

    it.each(LAYOUTS.map(layout => layout.type))('is laid out (%s), also as one 10,000-deep branch', (direction) => {
        const { result, ms } = timed(() => autoLayoutNodes(map, direction));
        expect(result).toHaveLength(LARGE);
        expect(result.every(n => Number.isFinite(n.x) && Number.isFinite(n.y))).toBe(true);
        expect(ms).toBeLessThan(3000);
        expect(autoLayoutNodes(chain, direction)).toHaveLength(LARGE);
    });

    it('is walked as an outline, also as one 10,000-deep branch', () => {
        let count = 0;
        walkOutline(buildOutline(chain), () => { count++; });
        expect(count).toBe(LARGE);
    });

    it('keeps 50 undo steps of whole-map changes without copying unchanged topics', () => {
        let history = createHistoryState(map);
        for (let i = 0; i < 50; i++) {
            history = historyReducer(history, { type: 'set', update: prev => prev.map((n, k) => (k === i ? { ...n, x: n.x + 1 } : n)) }, 20);
        }
        expect(history.past).toHaveLength(20);
        const shared = history.past[0].filter((n, k) => n === history.present[k]).length;
        expect(shared).toBeGreaterThan(LARGE - 60);
    });
});

describe('SpatialIndex', () => {
    const box = (x: number, y: number, size = 10) => ({ x1: x, y1: y, x2: x + size, y2: y + size, id: `${x},${y}` });

    it('finds exactly what overlaps a box, each once, also across many cells', () => {
        const items = [box(0, 0), box(300, 300), box(1000, 1000), { x1: -2000, y1: 50, x2: 2000, y2: 60, id: 'wide' }];
        const index = new SpatialIndex(items);
        expect(index.query({ x1: -5, y1: -5, x2: 5, y2: 5 }).map(i => i.id).sort()).toEqual(['0,0']);
        expect(index.query({ x1: 0, y1: 0, x2: 1100, y2: 1100 }).map(i => i.id).sort()).toEqual(['0,0', '1000,1000', '300,300', 'wide']);
        expect(index.query({ x1: 1500, y1: 55, x2: 1501, y2: 56 }).map(i => i.id)).toEqual(['wide']);
        expect(index.any({ x1: 500, y1: 500, x2: 600, y2: 600 })).toBe(false);
    });

    it('answers a query among 10,000 boxes without looking at all of them', () => {
        const items = Array.from({ length: LARGE }, (_, i) => box((i % 100) * 50, Math.floor(i / 100) * 50));
        const index = new SpatialIndex(items);
        const { result, ms } = timed(() => {
            let found = 0;
            for (let i = 0; i < 10_000; i++) found += index.query({ x1: 1000, y1: 1000, x2: 1100, y2: 1100 }).length;
            return found;
        });
        expect(result).toBe(10_000 * 9);
        expect(ms).toBeLessThan(2000);
    });
});

describe('clipPolyline', () => {
    it('keeps the part of a line inside a box, with how far along it starts', () => {
        const runs = clipPolyline([{ x: -100, y: 0 }, { x: 100, y: 0 }], { x1: -10, y1: -10, x2: 10, y2: 10 });
        expect(runs).toHaveLength(1);
        expect(runs[0].start).toBeCloseTo(90);
        expect(runs[0].points.map(p => [Math.round(p.x), Math.round(p.y)])).toEqual([[-10, 0], [10, 0]]);
    });

    it('splits a line that leaves the box and comes back', () => {
        const runs = clipPolyline([{ x: 0, y: 0 }, { x: 0, y: 100 }, { x: 5, y: 100 }, { x: 5, y: 0 }], { x1: -1, y1: -1, x2: 10, y2: 20 });
        expect(runs.map(r => Math.round(r.start))).toEqual([0, 185]);
    });

    it('returns nothing for a line outside the box', () => {
        expect(clipPolyline([{ x: 50, y: 50 }, { x: 60, y: 60 }], { x1: 0, y1: 0, x2: 10, y2: 10 })).toEqual([]);
    });
});

describe('useLineRouting', () => {
    const base = (): MindMapNode[] => [
        { id: 'r', text: 'r', x: 0, y: 0, color: 'root', parentId: null, lineType: 'orthogonal' },
        { id: 'a', text: 'a', x: 300, y: -200, color: 'blue', parentId: 'r', lineType: 'orthogonal' },
        { id: 'b', text: 'b', x: 300, y: 600, color: 'blue', parentId: 'r', lineType: 'orthogonal' },
        { id: 'far', text: 'far', x: 5000, y: 5000, color: 'blue', parentId: null },
    ];

    it('routes a line again only when something it depends on changes', () => {
        const first = base();
        const { result, rerender } = renderHook(({ nodes }) => useLineRouting(nodes, 'orthogonal'), { initialProps: { nodes: first } });
        const before = result.current.routes;

        const moved = first.map(n => (n.id === 'far' ? { ...n, x: 6000 } : n));
        rerender({ nodes: moved });
        expect(result.current.routes.get('r::a')).toBe(before.get('r::a'));
        expect(result.current.routes.get('r::b')).toBe(before.get('r::b'));

        const blocking = moved.map(n => (n.id === 'far' ? { ...n, x: 150, y: 300 } : n));
        rerender({ nodes: blocking });
        expect(result.current.routes.get('r::a')).toBe(before.get('r::a'));
        expect(result.current.routes.get('r::b')).not.toBe(before.get('r::b'));
        expect(result.current.routes.get('r::b')!.path).not.toBe(before.get('r::b')!.path);
    });

    it('routes the lines of 10,000 topics, and a drag of one, quickly', () => {
        const map = generateStressMap(LARGE, { relationsRatio: 0.02, lineType: 'orthogonal' });
        const first = timed(() => renderHook(({ nodes }) => useLineRouting(nodes, 'orthogonal'), { initialProps: { nodes: map } }));
        expect(first.ms).toBeLessThan(5000);
        const { result, rerender } = first.result;
        const dragged = map.map((n, i) => (i === 5000 ? { ...n, x: n.x + 40 } : n));
        const drag = timed(() => rerender({ nodes: dragged }));
        expect(drag.ms).toBeLessThan(500);
        expect(result.current.routes.size).toBeGreaterThan(LARGE - 1);
    });
});

describe('undoLimit', () => {
    it('keeps 100 steps on most maps, fewer on very large ones, never under 20', () => {
        const ofSize = (count: number) => undoLimit({ nodes: new Array(count) });
        expect(ofSize(50)).toBe(100);
        expect(ofSize(3000)).toBe(100);
        expect(ofSize(10_000)).toBe(30);
        expect(ofSize(1_000_000)).toBe(20);
    });

    it('is read from the state each time a step is recorded', () => {
        let history = createHistoryState({ nodes: new Array(10_000) });
        for (let i = 0; i < 60; i++) history = historyReducer(history, { type: 'set', update: prev => ({ nodes: prev.nodes.slice() }) }, undoLimit);
        expect(history.past).toHaveLength(30);
    });
});
