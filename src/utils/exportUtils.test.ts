/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { describe, expect, it, vi } from 'vitest';

import { exportPixelRatio, loadFromFile, planPdfPages } from './exportUtils';
import { DETACHED_PARENT_ID } from '@/lib/constants';

class FakeFileReader {
    result: string | null = null;
    onload: ((e: { target: FakeFileReader }) => void) | null = null;
    onerror: (() => void) | null = null;
    readAsText(file: File) {
        file.text().then((text) => {
            this.result = text;
            this.onload?.({ target: this });
        }, () => this.onerror?.());
    }
}
vi.stubGlobal('FileReader', FakeFileReader);

const fileOf = (name: string, content: unknown) => new File([JSON.stringify(content)], name);
const node = (id: string, parentId: string | null) => ({ id, text: id, x: 0, y: 0, color: 'orange', parentId });

describe('loadFromFile', () => {
    it('loads a current file and detaches nodes in a parent loop', async () => {
        const data = await loadFromFile(fileOf('map.nmm', {
            version: '1.0', name: 'Map', createdAt: '', updatedAt: '',
            nodes: [node('r', null), node('a', 'b'), node('b', 'a')],
        }));
        expect(data.name).toBe('Map');
        expect(data.nodes.filter(n => n.parentId === DETACHED_PARENT_ID)).toHaveLength(1);
    });

    it('loads an older file that only has the nodes, named after the file', async () => {
        const data = await loadFromFile(fileOf('Old plan.nmm', { nodes: [node('r', null), node('a', 'r')] }));
        expect(data.name).toBe('Old plan');
        const root = data.nodes.find(n => n.parentId === null)!;
        expect(data.nodes.find(n => n.text === 'a')!.parentId).toBe(root.id);
    });

    it('gives repeated ids in an older file their own ids', async () => {
        const data = await loadFromFile(fileOf('Old.nmm', [node('r', null), node('a', 'r'), { ...node('a', 'r'), text: 'twin' }]));
        expect(new Set(data.nodes.map(n => n.id)).size).toBe(3);
        expect(data.nodes.find(n => n.text === 'twin')).toBeDefined();
    });

    it('keeps drawings, box areas and the name when one part is incomplete, filling in its defaults', async () => {
        const data = await loadFromFile(fileOf('map.nmm', {
            version: '1.1', name: 'Kept', createdAt: '', updatedAt: '', connectionStyle: 'curved',
            nodes: [node('r', null)],
            drawings: [{ id: 'd1', points: [{ x: 0, y: 0 }], color: '#000' }],
            boxAreas: [{ id: 'b1', x: 0, y: 0, width: 10, height: 10, label: 'Box', color: '#fff' }, { id: 'b2' }],
        }));
        expect(data.name).toBe('Kept');
        expect(data.connectionStyle).toBe('curved');
        expect(data.drawings).toHaveLength(1);
        expect(data.boxAreas).toHaveLength(2);
        expect(data.boxAreas?.[1]).toMatchObject({ id: 'b2', x: 0, y: 0, width: 120, height: 80 });
    });

    it('opens a file larger than the old 5 MB limit', async () => {
        const image = `data:image/png;base64,${'A'.repeat(6 * 1024 * 1024)}`;
        const data = await loadFromFile(fileOf('big.nmm', { version: '1.0', name: 'Big', createdAt: '', updatedAt: '', nodes: [node('r', null)].map(n => ({ ...n, image })) }));
        expect(data.nodes[0].image).toBe(image);
    });

    it('rejects a file that is not a mind map', async () => {
        await expect(loadFromFile(fileOf('x.nmm', { hello: 'world' }))).rejects.toThrow('Failed to parse mind map file');
    });
});

describe('planPdfPages', () => {
    it('makes one page the size of the map', () => {
        expect(planPdfPages(500, 300, { page: 'fit', orientation: 'auto', scale: 'fit' }))
            .toMatchObject({ pageWidth: 500, pageHeight: 300, columns: 1, rows: 1, landscape: true });
    });

    it('fits the map on one page, turned to match its shape', () => {
        expect(planPdfPages(500, 300, { page: 'a4', orientation: 'auto', scale: 'fit' }))
            .toMatchObject({ landscape: true, pageWidth: 297, pageHeight: 210, columns: 1, rows: 1 });
        expect(planPdfPages(300, 500, { page: 'a4', orientation: 'auto', scale: 'fit' }).landscape).toBe(false);
    });

    it('at actual size, turns the pages whichever way needs fewer of them', () => {
        expect(planPdfPages(500, 150, { page: 'a4', orientation: 'auto', scale: 'actual' }))
            .toMatchObject({ landscape: true, columns: 2, rows: 1 });
    });

    it('keeps the orientation that was asked for', () => {
        expect(planPdfPages(500, 150, { page: 'letter', orientation: 'portrait', scale: 'actual' }))
            .toMatchObject({ landscape: false, columns: 3, rows: 1 });
    });

    it('needs one page for a map that fits exactly', () => {
        expect(planPdfPages(190, 277, { page: 'a4', orientation: 'portrait', scale: 'actual' }))
            .toMatchObject({ columns: 1, rows: 1 });
    });
});

describe('exportPixelRatio', () => {
    it('keeps small maps sharp', () => {
        expect(exportPixelRatio(800, 600)).toBe(3);
    });

    it('keeps both sides of a long, thin map within canvas limits', () => {
        const ratio = exportPixelRatio(40_000, 800);
        expect(40_000 * ratio).toBeLessThanOrEqual(16_384);
        expect(800 * ratio).toBeLessThanOrEqual(16_384);
    });

    it('caps the total pixel count of a large square map', () => {
        const ratio = exportPixelRatio(10_000, 10_000);
        expect(10_000 * ratio * 10_000 * ratio).toBeLessThanOrEqual(64_000_000 + 1);
    });
});
