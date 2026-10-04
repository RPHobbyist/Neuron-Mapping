/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { Drawing } from '@/types/mindmap';

export interface Point {
    x: number;
    y: number;
}

const distanceToSegment = (p: Point, a: Point, b: Point) => {
    const lengthSquared = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
    if (lengthSquared === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / lengthSquared));
    return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
};

export const simplifyPath = (points: Point[], tolerance: number): Point[] => {
    if (points.length < 3) return points;
    const keep = new Array<boolean>(points.length).fill(false);
    keep[0] = true;
    keep[points.length - 1] = true;

    const spans: [number, number][] = [[0, points.length - 1]];
    while (spans.length > 0) {
        const [first, last] = spans.pop()!;
        let furthest = -1;
        let furthestDistance = tolerance;
        for (let i = first + 1; i < last; i++) {
            const distance = distanceToSegment(points[i], points[first], points[last]);
            if (distance > furthestDistance) {
                furthest = i;
                furthestDistance = distance;
            }
        }
        if (furthest === -1) continue;
        keep[furthest] = true;
        spans.push([first, furthest], [furthest, last]);
    }
    return points.filter((_, i) => keep[i]);
};

export const eraseDrawingsAt = (drawings: Drawing[], pos: Point, radius: number): Drawing[] => {
    const kept = drawings.filter((d) => {
        if (d.points.length === 1) return Math.hypot(d.points[0].x - pos.x, d.points[0].y - pos.y) >= radius;
        for (let i = 0; i < d.points.length - 1; i++) {
            if (distanceToSegment(pos, d.points[i], d.points[i + 1]) < radius) return false;
        }
        return true;
    });
    return kept.length === drawings.length ? drawings : kept;
};
