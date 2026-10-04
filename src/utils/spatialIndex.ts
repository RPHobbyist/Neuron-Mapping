/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

export interface Box { x1: number; y1: number; x2: number; y2: number }

export const boxesOverlap = (a: Box, b: Box): boolean =>
    a.x1 <= b.x2 && a.x2 >= b.x1 && a.y1 <= b.y2 && a.y2 >= b.y1;

const DEFAULT_CELL = 256;
const MAX_QUERY_CELLS = 4096;

export class SpatialIndex<T extends Box> {
    private readonly cells = new Map<number, T[]>();
    private readonly all: T[] = [];
    private stamp = 0;
    private readonly seen = new Map<T, number>();

    constructor(items: Iterable<T>, private readonly cellSize = DEFAULT_CELL) {
        for (const item of items) this.insert(item);
    }

    get size(): number {
        return this.all.length;
    }

    private key(cx: number, cy: number): number {
        return (cx + 1048576) * 2097152 + (cy + 1048576);
    }

    private insert(item: T): void {
        this.all.push(item);
        const { cellSize } = this;
        const cx1 = Math.floor(item.x1 / cellSize), cx2 = Math.floor(item.x2 / cellSize);
        const cy1 = Math.floor(item.y1 / cellSize), cy2 = Math.floor(item.y2 / cellSize);
        for (let cx = cx1; cx <= cx2; cx++) {
            for (let cy = cy1; cy <= cy2; cy++) {
                const key = this.key(cx, cy);
                const cell = this.cells.get(key);
                if (cell) cell.push(item); else this.cells.set(key, [item]);
            }
        }
    }

    query(box: Box): T[] {
        const { cellSize } = this;
        const cx1 = Math.floor(box.x1 / cellSize), cx2 = Math.floor(box.x2 / cellSize);
        const cy1 = Math.floor(box.y1 / cellSize), cy2 = Math.floor(box.y2 / cellSize);
        if ((cx2 - cx1 + 1) * (cy2 - cy1 + 1) > MAX_QUERY_CELLS) {
            return this.all.filter(item => boxesOverlap(item, box));
        }
        const stamp = ++this.stamp;
        const found: T[] = [];
        for (let cx = cx1; cx <= cx2; cx++) {
            for (let cy = cy1; cy <= cy2; cy++) {
                const cell = this.cells.get(this.key(cx, cy));
                if (!cell) continue;
                for (const item of cell) {
                    if (this.seen.get(item) === stamp || !boxesOverlap(item, box)) continue;
                    this.seen.set(item, stamp);
                    found.push(item);
                }
            }
        }
        return found;
    }

    any(box: Box): boolean {
        const { cellSize } = this;
        const cx1 = Math.floor(box.x1 / cellSize), cx2 = Math.floor(box.x2 / cellSize);
        const cy1 = Math.floor(box.y1 / cellSize), cy2 = Math.floor(box.y2 / cellSize);
        if ((cx2 - cx1 + 1) * (cy2 - cy1 + 1) > MAX_QUERY_CELLS) return this.all.some(item => boxesOverlap(item, box));
        for (let cx = cx1; cx <= cx2; cx++) {
            for (let cy = cy1; cy <= cy2; cy++) {
                const cell = this.cells.get(this.key(cx, cy));
                if (cell?.some(item => boxesOverlap(item, box))) return true;
            }
        }
        return false;
    }
}
