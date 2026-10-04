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

import { MAX_ZOOM, MIN_ZOOM } from '@/lib/constants';
import { Viewport } from '@/types/mindmap';

import { revealed, zoomedAround } from './useCanvasViewport';

const mapPointAt = (view: Viewport, px: number, py: number) => ({
    x: (px - view.x) / view.zoom,
    y: (py - view.y) / view.zoom,
});

describe('revealed', () => {
    const view = { x: 0, y: 0, zoom: 1 };
    const box = (minX: number, minY: number, maxX: number, maxY: number) => ({ minX, minY, maxX, maxY });

    it('leaves the view alone when the node is showing', () => {
        expect(revealed(view, box(-75, -30, 75, 30), 1000, 600)).toBe(view);
        expect(revealed(view, box(280, 170, 428, 228), 1000, 600)).toBe(view);
    });

    it('moves just far enough to show a node beyond an edge', () => {
        expect(revealed(view, box(500, -30, 650, 30), 1000, 600)).toEqual({ x: -222, y: 0, zoom: 1 });
        expect(revealed(view, box(-75, -400, 75, -340), 1000, 600)).toEqual({ x: 0, y: 172, zoom: 1 });
    });

    it('measures the node at the current zoom and pan', () => {
        expect(revealed({ x: 100, y: 0, zoom: 0.5 }, box(800, 0, 900, 40), 1000, 600)).toEqual({ x: -22, y: 0, zoom: 0.5 });
    });

    it('shows the top left corner of something too large to fit', () => {
        expect(revealed(view, box(-100, -100, 2000, 2000), 1000, 600)).toEqual({ x: -328, y: -128, zoom: 1 });
    });
});

describe('zoomedAround', () => {
    it('keeps the point under the pointer where it is', () => {
        const view = { x: 40, y: -25, zoom: 0.8 };
        const zoomed = zoomedAround(view, 210, -130, 1.2);

        expect(zoomed.zoom).toBeCloseTo(0.96);
        const before = mapPointAt(view, 210, -130);
        const after = mapPointAt(zoomed, 210, -130);
        expect(after.x).toBeCloseTo(before.x);
        expect(after.y).toBeCloseTo(before.y);
    });

    it('zooms on the middle of the view when given that', () => {
        expect(zoomedAround({ x: 100, y: -50, zoom: 1 }, 0, 0, 0.5)).toEqual({ x: 50, y: -25, zoom: 0.5 });
    });

    it('stops at the zoom limits, and then leaves the view as it is', () => {
        const zoomedIn = zoomedAround({ x: 10, y: 10, zoom: 1.9 }, 300, 200, 1.2);
        expect(zoomedIn.zoom).toBe(MAX_ZOOM);
        expect(mapPointAt(zoomedIn, 300, 200).x).toBeCloseTo(mapPointAt({ x: 10, y: 10, zoom: 1.9 }, 300, 200).x);
        expect(zoomedAround(zoomedIn, 300, 200, 1.2)).toBe(zoomedIn);

        const atMin = { x: 0, y: 0, zoom: MIN_ZOOM };
        expect(zoomedAround(atMin, 50, 50, 0.5)).toBe(atMin);
    });
});
