/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clear, get, set } from 'idb-keyval';

import { MindMapNode } from '@/types/mindmap';

import { appStore } from './appStore';
import {
    ARCHIVED_MAPS_KEY,
    AUTO_SNAPSHOT_LIMIT,
    LEGACY_MAPS_KEY,
    MAPS_INDEX_KEY,
    StoredRecord,
    deleteMapRecord,
    duplicateMapRecord,
    listSavedMaps,
    loadSavedMap,
    loadThumbnails,
    mapKey,
    renameMapRecord,
    restoreDeletedMap,
    saveMapRecord,
    snapshotsKey,
    thumbnailKey,
} from './mapStore';

const local = new Map<string, string>();
vi.stubGlobal('localStorage', {
    getItem: (key: string) => local.get(key) ?? null,
    setItem: (key: string, value: string) => { local.set(key, value); },
    removeItem: (key: string) => { local.delete(key); },
});

const nodes: MindMapNode[] = [{ id: 'root', text: 'Map', x: 0, y: 0, color: 'root', parentId: null }];
const THUMBNAIL = 'data:image/png;base64,AA==';

const legacyRecord = (id: string, updatedAt: string, extra: Record<string, unknown> = {}) => ({
    id,
    name: `Map ${id}`,
    nodes,
    connectionStyle: 'curved',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt,
    ...extra,
});

const tick = () => new Promise(resolve => setTimeout(resolve, 5));

beforeEach(async () => {
    await clear(appStore);
    local.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('saving maps', () => {
    it('stores each map on its own, with its thumbnail apart', async () => {
        const saved = await saveMapRecord({ name: 'First', nodes, connectionStyle: 'curved', thumbnail: THUMBNAIL });

        const record = await get(mapKey(saved.id), appStore);
        expect(record).toMatchObject({ id: saved.id, name: 'First', schemaVersion: 1 });
        expect(record).not.toHaveProperty('thumbnail');
        expect(await loadThumbnails([saved.id])).toEqual({ [saved.id]: THUMBNAIL });
        expect((await loadSavedMap(saved.id))?.nodes).toHaveLength(1);
    });

    it('updates a map in place, keeping its creation date, template, thumbnail and unknown fields', async () => {
        const first = await saveMapRecord({ name: 'Map', nodes, connectionStyle: 'curved', templateId: 'swot', thumbnail: THUMBNAIL });
        await set(mapKey(first.id), { ...(await get(mapKey(first.id), appStore)), fromNewerVersion: 1 }, appStore);

        const updated = await saveMapRecord({ name: 'Renamed', nodes, connectionStyle: 'straight', existingId: first.id });

        expect(updated).toMatchObject({ id: first.id, name: 'Renamed', createdAt: first.createdAt, templateId: 'swot', fromNewerVersion: 1 });
        expect(await loadThumbnails([first.id])).toEqual({ [first.id]: THUMBNAIL });
        expect((await listSavedMaps()).map(m => m.id)).toEqual([first.id]);
    });

    it('keeps the view a map was saved with until it is saved with another', async () => {
        const viewport = { x: 40, y: -10, zoom: 0.5 };
        const first = await saveMapRecord({ name: 'Map', nodes, connectionStyle: 'curved', viewport });
        expect((await loadSavedMap(first.id))?.viewport).toEqual(viewport);

        await saveMapRecord({ name: 'Map', nodes, connectionStyle: 'curved', existingId: first.id });
        expect((await loadSavedMap(first.id))?.viewport).toEqual(viewport);

        await saveMapRecord({ name: 'Map', nodes, connectionStyle: 'curved', existingId: first.id, viewport: { x: 0, y: 0, zoom: 1 } });
        expect((await loadSavedMap(first.id))?.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
    });

    it('renames a map without touching its content, thumbnail or snapshots', async () => {
        const viewport = { x: 5, y: 6, zoom: 0.8 };
        const first = await saveMapRecord({ name: 'Draft', nodes, connectionStyle: 'straight', thumbnail: THUMBNAIL, viewport });
        await tick();

        expect(await renameMapRecord(first.id, 'Final')).toBe(true);

        const renamed = await loadSavedMap(first.id);
        expect(renamed).toMatchObject({ name: 'Final', connectionStyle: 'straight', createdAt: first.createdAt, viewport });
        expect(renamed!.updatedAt > first.updatedAt).toBe(true);
        expect(await loadThumbnails([first.id])).toEqual({ [first.id]: THUMBNAIL });
        expect(await get(snapshotsKey(first.id), appStore)).toBeUndefined();
        expect((await listSavedMaps()).map(m => m.name)).toEqual(['Final']);

        expect(await renameMapRecord('no-such-map', 'Anything')).toBe(false);
        expect(await listSavedMaps()).toHaveLength(1);
    });

    it('duplicates a map as a map of its own, with its thumbnail', async () => {
        const original = await saveMapRecord({ name: 'Plan', nodes, connectionStyle: 'curved', templateId: 'swot', thumbnail: THUMBNAIL });
        await tick();

        const copy = await duplicateMapRecord(original.id, 'Plan (copy)');

        expect(copy).toMatchObject({ name: 'Plan (copy)', templateId: 'swot', nodes });
        expect(copy!.id).not.toBe(original.id);
        expect(copy!.createdAt > original.createdAt).toBe(true);
        expect(await loadThumbnails([copy!.id])).toEqual({ [copy!.id]: THUMBNAIL });
        expect((await listSavedMaps()).map(m => m.name)).toEqual(['Plan (copy)', 'Plan']);

        await deleteMapRecord(original.id);
        expect((await loadSavedMap(copy!.id))?.name).toBe('Plan (copy)');
        expect(await duplicateMapRecord(original.id, 'Again')).toBeNull();
    });

    it('saves again under the same id when the map is no longer stored', async () => {
        const saved = await saveMapRecord({ name: 'Gone', nodes, connectionStyle: 'curved', existingId: 'deleted-elsewhere' });
        expect(saved.id).toBe('deleted-elsewhere');
        expect((await listSavedMaps()).map(m => m.id)).toEqual(['deleted-elsewhere']);
    });

    it('lists the most recently saved map first', async () => {
        const a = await saveMapRecord({ name: 'A', nodes, connectionStyle: 'curved' });
        await tick();
        const b = await saveMapRecord({ name: 'B', nodes, connectionStyle: 'curved' });
        await tick();
        await saveMapRecord({ name: 'A again', nodes, connectionStyle: 'curved', existingId: a.id });

        expect((await listSavedMaps()).map(m => m.id)).toEqual([a.id, b.id]);
    });

    it('deletes a map with its thumbnail and snapshots, and nothing else', async () => {
        const a = await saveMapRecord({ name: 'A', nodes, connectionStyle: 'curved', thumbnail: THUMBNAIL });
        const b = await saveMapRecord({ name: 'B', nodes, connectionStyle: 'curved', thumbnail: THUMBNAIL });
        await set(snapshotsKey(a.id), [{ id: 's' }], appStore);

        await deleteMapRecord(a.id);

        expect(await get(mapKey(a.id), appStore)).toBeUndefined();
        expect(await get(thumbnailKey(a.id), appStore)).toBeUndefined();
        expect(await get(snapshotsKey(a.id), appStore)).toBeUndefined();
        expect((await listSavedMaps()).map(m => m.id)).toEqual([b.id]);
        expect(await loadThumbnails([b.id])).toEqual({ [b.id]: THUMBNAIL });
    });
});

describe('automatic snapshots', () => {
    const version = (text: string): MindMapNode[] => [{ ...nodes[0], text }];
    const storedSnapshots = async (id: string) => (await get(snapshotsKey(id), appStore)) as StoredRecord[];
    const textOf = (snapshot: StoredRecord) => (snapshot.nodes as MindMapNode[])[0].text;

    it('keeps the version each save replaces, with its thumbnail', async () => {
        const first = await saveMapRecord({ name: 'Map', nodes: version('v1'), connectionStyle: 'curved', thumbnail: THUMBNAIL });
        await saveMapRecord({ name: 'Map', nodes: version('v2'), connectionStyle: 'curved', existingId: first.id });

        const snapshots = await storedSnapshots(first.id);
        expect(snapshots).toHaveLength(1);
        expect(snapshots[0]).toMatchObject({ auto: true, thumbnail: THUMBNAIL, timestamp: Date.parse(first.updatedAt) });
        expect(textOf(snapshots[0])).toBe('v1');
    });

    it('takes none when only the name changed', async () => {
        const first = await saveMapRecord({ name: 'Map', nodes, connectionStyle: 'curved' });
        await saveMapRecord({ name: 'Renamed', nodes, connectionStyle: 'curved', existingId: first.id });

        expect(await get(snapshotsKey(first.id), appStore)).toBeUndefined();
    });

    it('keeps only the latest few, and never trims snapshots taken by hand', async () => {
        const first = await saveMapRecord({ name: 'Map', nodes: version('v0'), connectionStyle: 'curved' });
        await set(snapshotsKey(first.id), [{ id: 'manual', name: 'Mine', timestamp: 1, nodes }], appStore);
        for (let i = 1; i <= AUTO_SNAPSHOT_LIMIT + 2; i++) {
            await saveMapRecord({ name: 'Map', nodes: version(`v${i}`), connectionStyle: 'curved', existingId: first.id });
        }

        const snapshots = await storedSnapshots(first.id);
        expect(snapshots.filter(s => s.auto === true).map(textOf)).toEqual(['v6', 'v5', 'v4', 'v3', 'v2']);
        expect(snapshots.map(s => s.id)).toContain('manual');
    });
});

describe('undoing a delete', () => {
    it('puts the map back with its thumbnail and snapshots', async () => {
        const map = await saveMapRecord({ name: 'A', nodes, connectionStyle: 'curved', thumbnail: THUMBNAIL });
        await set(snapshotsKey(map.id), [{ id: 's' }], appStore);

        const deleted = await deleteMapRecord(map.id);
        expect(await restoreDeletedMap(deleted)).toBe(true);

        expect((await listSavedMaps()).map(m => m.id)).toEqual([map.id]);
        expect((await loadSavedMap(map.id))?.name).toBe('A');
        expect(await loadThumbnails([map.id])).toEqual({ [map.id]: THUMBNAIL });
        expect(await get(snapshotsKey(map.id), appStore)).toEqual([{ id: 's' }]);
    });

    it('leaves alone a map saved under the same id since', async () => {
        const map = await saveMapRecord({ name: 'Deleted', nodes, connectionStyle: 'curved' });
        const deleted = await deleteMapRecord(map.id);
        await saveMapRecord({ name: 'Saved since', nodes, connectionStyle: 'curved', existingId: map.id });

        expect(await restoreDeletedMap(deleted)).toBe(false);
        expect((await loadSavedMap(map.id))?.name).toBe('Saved since');
    });
});

describe('moving maps from the old one-array layout', () => {
    it('moves every map and keeps the records it cannot read', async () => {
        const unreadable = { id: 'future', format: 'from a newer version', updatedAt: '2026-03-01T00:00:00.000Z' };
        const withoutId = { name: 'no id' };
        await set(LEGACY_MAPS_KEY, [
            legacyRecord('a', '2026-01-02T00:00:00.000Z', { thumbnail: THUMBNAIL }),
            unreadable,
            withoutId,
        ], appStore);
        local.set(LEGACY_MAPS_KEY, JSON.stringify([legacyRecord('b', '2026-01-03T00:00:00.000Z')]));

        const listed = await listSavedMaps();

        expect(listed.filter(m => m.readable).map(m => m.id)).toEqual(['b', 'a']);
        expect(listed.find(m => m.id === 'future')?.readable).toBe(false);
        expect(await get(mapKey('future'), appStore)).toEqual(unreadable);
        expect(await get(ARCHIVED_MAPS_KEY, appStore)).toEqual([withoutId]);
        expect(await loadThumbnails(['a'])).toEqual({ a: THUMBNAIL });
        expect(await get(mapKey('a'), appStore)).not.toHaveProperty('thumbnail');
        expect(await get(LEGACY_MAPS_KEY, appStore)).toBeUndefined();
        expect(local.has(LEGACY_MAPS_KEY)).toBe(false);
    });

    it('lets only a newer copy from a tab on the old version replace a map', async () => {
        await saveMapRecord({ name: 'Current', nodes, connectionStyle: 'curved', existingId: 'x' });

        await set(LEGACY_MAPS_KEY, [legacyRecord('x', '2020-01-01T00:00:00.000Z', { name: 'Older' })], appStore);
        await listSavedMaps();
        expect((await loadSavedMap('x'))?.name).toBe('Current');

        await set(LEGACY_MAPS_KEY, [legacyRecord('x', '2999-01-01T00:00:00.000Z', { name: 'Newer' })], appStore);
        await listSavedMaps();
        expect((await loadSavedMap('x'))?.name).toBe('Newer');
    });
});

describe('the index', () => {
    it('is rebuilt from the records when the two disagree', async () => {
        const a = await saveMapRecord({ name: 'A', nodes, connectionStyle: 'curved' });
        await set(mapKey('orphan'), legacyRecord('orphan', '2026-01-05T00:00:00.000Z'), appStore);
        await set(MAPS_INDEX_KEY, [
            ...(await get(MAPS_INDEX_KEY, appStore)),
            { id: 'ghost', name: 'Ghost', createdAt: '', updatedAt: '2026-01-01T00:00:00.000Z', nodeCount: 1, readable: true },
        ], appStore);

        const ids = (await listSavedMaps()).map(m => m.id);

        expect(ids.sort()).toEqual([a.id, 'orphan'].sort());
        const index = (await get(MAPS_INDEX_KEY, appStore)) as { id: string }[];
        expect(index.map(entry => entry.id).sort()).toEqual([a.id, 'orphan'].sort());
    });
});
