/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DETACHED_PARENT_ID } from '@/lib/constants';

import {
    UnsupportedFileVersionError,
    isSupportedFileVersion,
    parseAutoSave,
    parseMapFile,
    parseSavedMap,
    parseSnapshot,
} from './mapDocument';

const node = (overrides: Record<string, unknown> = {}) => ({
    id: 'n', text: 'Node', x: 0, y: 0, color: 'orange', parentId: null, ...overrides,
});

const savedMap = (nodes: unknown[], overrides: Record<string, unknown> = {}) => ({
    id: 'm',
    name: 'Map',
    nodes,
    connectionStyle: 'curved',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
});

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('parseSavedMap', () => {
    it('keeps a map readable when a field has an unexpected value', () => {
        const map = parseSavedMap(savedMap(
            [node({ id: 'root', lineType: 'zigzag', shape: 'star', priority: 'urgent', x: Infinity, color: 'url(x)' })],
            { connectionStyle: 'spiral' }
        ));

        expect(map?.connectionStyle).toBe('curved');
        const [root] = map!.nodes;
        expect(root.lineType).toBeUndefined();
        expect(root.shape).toBeUndefined();
        expect(root.priority).toBeUndefined();
        expect(root.x).toBe(0);
        expect(root.color).toBe('grey');
    });

    it('keeps valid values, including custom colors and the older shape name', () => {
        const [n] = parseSavedMap(savedMap([
            node({ color: '#1A2b3C', shape: 'iso-cube', lineColor: 'red', status: 'done', priority: null }),
        ]))!.nodes;
        expect(n).toMatchObject({ color: '#1A2b3C', shape: 'iso-cube', lineColor: 'red', status: 'done', priority: null });
    });

    it('keeps node fields it does not know about', () => {
        const [n] = parseSavedMap(savedMap([node({ fromNewerVersion: { a: 1 } })]))!.nodes;
        expect(n).toMatchObject({ fromNewerVersion: { a: 1 } });
    });

    it('drops only the entries it cannot read', () => {
        const map = parseSavedMap(savedMap([
            node({ id: 'root' }),
            'not a node',
            node({ id: 'child', parentId: 'root', relations: [{ targetId: 'root' }, { nope: true }] }),
        ]));
        expect(map!.nodes.map(n => n.id)).toEqual(['root', 'child']);
        expect(map!.nodes[1].relations).toEqual([{ targetId: 'root' }]);
    });

    it('removes control characters from labels and tags', () => {
        const [n] = parseSavedMap(savedMap([node({ lineLabel: 'a\u0007b', tags: ['x\u0000y', 5, ''] })]))!.nodes;
        expect(n.lineLabel).toBe('ab');
        expect(n.tags).toEqual(['xy']);
    });

    it('makes a node without a parent a root, and one with an unusable parent detached', () => {
        const map = parseSavedMap(savedMap([
            { id: 'r', text: 'Root', x: 0, y: 0, color: 'root' },
            node({ id: 'a', parentId: 42 }),
        ]))!;
        expect(map.nodes[0].parentId).toBeNull();
        expect(map.nodes[1].parentId).toBe(DETACHED_PARENT_ID);
    });

    it('detaches one node of a parent loop', () => {
        const map = parseSavedMap(savedMap([
            node({ id: 'r' }),
            node({ id: 'a', parentId: 'b' }),
            node({ id: 'b', parentId: 'a' }),
        ]))!;
        expect(map.nodes.filter(n => n.parentId === DETACHED_PARENT_ID)).toHaveLength(1);
    });

    it('reads a record written by a newer version as far as it can', () => {
        expect(parseSavedMap(savedMap([node()], { schemaVersion: 99, fromNewerVersion: true }))?.nodes).toHaveLength(1);
    });

    it('rejects a record that is not a map', () => {
        expect(parseSavedMap({ id: 'm', nodes: 'nope' })).toBeNull();
        expect(parseSavedMap('text')).toBeNull();
    });

    it('keeps the view the map was saved with, and opens a map without one it can read', () => {
        const viewport = { x: 120, y: -45.5, zoom: 0.6 };
        expect(parseSavedMap(savedMap([node()], { viewport }))?.viewport).toEqual(viewport);

        const broken = parseSavedMap(savedMap([node()], { viewport: { x: 120, y: 'far', zoom: 0 } }));
        expect(broken?.nodes).toHaveLength(1);
        expect(broken?.viewport).toBeUndefined();
    });
});

describe('parseAutoSave', () => {
    it('fills in a missing connection style', () => {
        expect(parseAutoSave({ nodes: [node()], lastModified: 5 })?.connectionStyle).toBe('curved');
    });

    it('keeps the view the session was left with', () => {
        const viewport = { x: -300, y: 80, zoom: 1.44 };
        expect(parseAutoSave({ nodes: [node()], lastModified: 5, viewport })?.viewport).toEqual(viewport);
    });
});

describe('parseSnapshot', () => {
    it('keeps fields from newer versions, since snapshot lists are written back', () => {
        const snapshot = parseSnapshot({ id: 's', name: 'Snap', timestamp: 1, nodes: [node()], auto: true, fromNewerVersion: 'kept' });
        expect(snapshot).toMatchObject({ auto: true, fromNewerVersion: 'kept' });
    });
});

describe('parseMapFile', () => {
    it('reads every 1.x version', () => {
        expect(isSupportedFileVersion('1.0')).toBe(true);
        expect(isSupportedFileVersion('1.7')).toBe(true);
        expect(isSupportedFileVersion('2.0')).toBe(false);
        expect(parseMapFile({ version: '1.3', name: 'F', nodes: [node()], createdAt: '', updatedAt: '' })?.name).toBe('F');
    });

    it('refuses a file from a newer major version', () => {
        expect(() => parseMapFile({ version: '2.0', name: 'F', nodes: [] })).toThrow(UnsupportedFileVersionError);
    });

    it('returns null for content that is not a map file', () => {
        expect(parseMapFile({ nodes: [node()] })).toBeNull();
        expect(parseMapFile(undefined)).toBeNull();
    });
});
