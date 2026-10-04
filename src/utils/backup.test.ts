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

import { SESSION_KEY_PREFIX, readPendingSessions } from '@/hooks/useAutoSave';
import { appStore } from '@/lib/appStore';
import { ARCHIVED_MAPS_KEY, listSavedMaps, loadSavedMap, loadThumbnails, mapKey, saveMapRecord, snapshotsKey } from '@/lib/mapStore';
import { MindMapNode } from '@/types/mindmap';
import { getCustomTemplates, saveCustomTemplate } from '@/utils/customTemplates';

import { createBackup, describeRestore, parseBackup, restoreBackup } from './backup';

const local = new Map<string, string>();
vi.stubGlobal('localStorage', {
    getItem: (key: string) => local.get(key) ?? null,
    setItem: (key: string, value: string) => { local.set(key, value); },
    removeItem: (key: string) => { local.delete(key); },
    key: (index: number) => [...local.keys()][index] ?? null,
    get length() { return local.size; },
});

const nodes: MindMapNode[] = [{ id: 'root', text: 'Root', x: 0, y: 0, color: 'root', parentId: null }];
const THUMBNAIL = 'data:image/png;base64,AA==';
const tick = () => new Promise(resolve => setTimeout(resolve, 5));
const nothingRestored = { added: 0, updated: 0, keptNewer: 0, templatesAdded: 0, sessionsRestored: 0 };

beforeEach(async () => {
    await clear(appStore);
    local.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('backup and restore', () => {
    it('brings everything back into an empty browser', async () => {
        const map = await saveMapRecord({ name: 'Plan', nodes, connectionStyle: 'curved', thumbnail: THUMBNAIL });
        await set(snapshotsKey(map.id), [{ id: 's1', name: 'Snap', timestamp: 1, nodes }], appStore);
        await saveCustomTemplate('Mine', nodes, 'curved');
        await set(ARCHIVED_MAPS_KEY, [{ name: 'no id' }], appStore);
        local.set('mindmap_snapshots', JSON.stringify([{ id: 'legacy-snapshot', name: 'Old', timestamp: 1, nodes }]));
        const backup = parseBackup(JSON.stringify(await createBackup()));

        await clear(appStore);
        local.clear();
        const result = await restoreBackup(backup);

        expect(result).toEqual({ ...nothingRestored, added: 1, templatesAdded: 1 });
        expect((await listSavedMaps()).map(m => m.name)).toEqual(['Plan']);
        expect(await loadThumbnails([map.id])).toEqual({ [map.id]: THUMBNAIL });
        expect(await get(snapshotsKey(map.id), appStore)).toHaveLength(1);
        expect((await getCustomTemplates()).map(t => t.name)).toEqual(['Mine']);
        expect(await get(ARCHIVED_MAPS_KEY, appStore)).toEqual([{ name: 'no id' }]);
        expect(JSON.parse(local.get('mindmap_snapshots')!)).toHaveLength(1);
    });

    it('keeps the copy in this browser when it is newer than the backup', async () => {
        const map = await saveMapRecord({ name: 'Before', nodes, connectionStyle: 'curved' });
        const backup = await createBackup();
        await tick();
        await saveMapRecord({ name: 'Edited since', nodes, connectionStyle: 'curved', existingId: map.id });

        const result = await restoreBackup(backup);

        expect(result.keptNewer).toBe(1);
        expect((await loadSavedMap(map.id))?.name).toBe('Edited since');
    });

    it('replaces an older copy and keeps it as a snapshot', async () => {
        const older = await saveMapRecord({ name: 'Older', nodes, connectionStyle: 'curved' });
        await tick();
        await saveMapRecord({ name: 'Newer in backup', nodes, connectionStyle: 'curved', existingId: older.id });
        const backup = await createBackup();
        await set(mapKey(older.id), older, appStore);

        const result = await restoreBackup(backup);

        expect(result.updated).toBe(1);
        expect((await loadSavedMap(older.id))?.name).toBe('Newer in backup');
        const snapshots = (await get(snapshotsKey(older.id), appStore)) as { name: string }[];
        expect(snapshots[0].name).toMatch(/^Before restore/);
    });

    it('archives a damaged map from the backup instead of overwriting the readable copy', async () => {
        const map = await saveMapRecord({ name: 'Good', nodes, connectionStyle: 'curved' });
        const backup = await createBackup();
        const damaged = { id: map.id, name: 'Damaged', nodes: 'not a list', updatedAt: '9999-01-01T00:00:00.000Z' };
        backup.maps = [damaged];

        const result = await restoreBackup(backup);

        expect(result).toEqual(nothingRestored);
        expect((await loadSavedMap(map.id))?.name).toBe('Good');
        expect(await get(ARCHIVED_MAPS_KEY, appStore)).toEqual([damaged]);
    });

    it('restores unsaved changes, unless this browser has newer ones for the same map', async () => {
        await set(`${SESSION_KEY_PREFIX}new:draft`, { nodes, connectionStyle: 'curved', lastModified: 100 }, appStore);
        await set(`${SESSION_KEY_PREFIX}map:m1`, { nodes, connectionStyle: 'curved', lastModified: 100, mapId: 'm1' }, appStore);
        local.set(`${SESSION_KEY_PREFIX}map:m2`, JSON.stringify({ nodes, connectionStyle: 'curved', lastModified: 150, mapId: 'm2' }));
        const backup = parseBackup(JSON.stringify(await createBackup()));
        expect(Object.keys(backup.sessions).sort()).toEqual(['map:m1', 'map:m2', 'new:draft']);

        await clear(appStore);
        await set(`${SESSION_KEY_PREFIX}map:m1`, { nodes, connectionStyle: 'curved', lastModified: 200, mapId: 'm1' }, appStore);
        const result = await restoreBackup(backup);

        expect(result.sessionsRestored).toBe(2);
        const sessions = await readPendingSessions();
        expect(sessions.map(s => [s.sessionId, s.lastModified])).toEqual([['map:m1', 200], ['map:m2', 150], ['new:draft', 100]]);
    });

    it('does nothing twice: restoring the same backup again changes nothing', async () => {
        await saveMapRecord({ name: 'Plan', nodes, connectionStyle: 'curved' });
        await saveCustomTemplate('Mine', nodes, 'curved');
        await set(`${SESSION_KEY_PREFIX}new:draft`, { nodes, connectionStyle: 'curved', lastModified: 100 }, appStore);
        const backup = await createBackup();

        expect(await restoreBackup(backup)).toEqual({ ...nothingRestored, keptNewer: 1 });
        expect(await getCustomTemplates()).toHaveLength(1);
    });

    it('refuses files that are not backups', () => {
        expect(() => parseBackup('not json')).toThrow('not a Neuron Mapping backup');
        expect(() => parseBackup(JSON.stringify({ format: 'something-else' }))).toThrow('not a Neuron Mapping backup');
        expect(() => parseBackup(JSON.stringify({ format: 'neuron-mapping-backup', version: 99, maps: [] }))).toThrow('newer version');
    });

    it('reads backups made before they held unsaved changes', () => {
        const backup = parseBackup(JSON.stringify({ format: 'neuron-mapping-backup', version: 1, exportedAt: '', maps: [] }));
        expect(backup.sessions).toEqual({});
    });

    it('describes what a restore did', () => {
        expect(describeRestore({ ...nothingRestored, added: 2, keptNewer: 1, templatesAdded: 1 }))
            .toBe("Added 2 maps, kept this browser's newer copy of 1 map, added 1 template.");
        expect(describeRestore({ ...nothingRestored, sessionsRestored: 1 })).toBe('Restored unsaved changes to 1 map.');
        expect(describeRestore(nothingRestored)).toMatch(/^Nothing new/);
    });
});
