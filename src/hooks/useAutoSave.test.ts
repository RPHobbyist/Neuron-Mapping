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

const local = new Map<string, string>();
vi.stubGlobal('localStorage', {
    getItem: (key: string) => local.get(key) ?? null,
    setItem: (key: string, value: string) => { local.set(key, value); },
    removeItem: (key: string) => { local.delete(key); },
    key: (index: number) => [...local.keys()][index] ?? null,
    get length() { return local.size; },
});

import { AutoSaveData, clearAutoSave, readPendingSession, readPendingSessions } from './useAutoSave';

const KEY = 'neuron-mapping-autosave:';

const session = (text: string, lastModified: number, mapId?: string): AutoSaveData => ({
    nodes: [{ id: 'r', text, x: 0, y: 0, color: 'root', parentId: null }],
    connectionStyle: 'curved',
    lastModified,
    mapId,
    name: text,
});

beforeEach(async () => {
    await clear();
    local.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('readPendingSessions', () => {
    it('returns nothing when there are no sessions', async () => {
        expect(await readPendingSessions()).toEqual([]);
    });

    it("lists every map's session, most recent first", async () => {
        await set(`${KEY}map:a`, session('A', 1000, 'a'));
        await set(`${KEY}new:b`, session('B', 2000));

        const sessions = await readPendingSessions();

        expect(sessions.map(s => s.sessionId)).toEqual(['new:b', 'map:a']);
        expect(sessions[1]).toMatchObject({ mapId: 'a', name: 'A' });
    });

    it('prefers the newer copy written while the page was closing, and moves it into IndexedDB', async () => {
        await set(`${KEY}map:a`, session('older', 1000, 'a'));
        local.set(`${KEY}map:a`, JSON.stringify(session('newer', 2000, 'a')));

        const [result] = await readPendingSessions();

        expect(result.nodes[0].text).toBe('newer');
        expect(((await get(`${KEY}map:a`)) as AutoSaveData).nodes[0].text).toBe('newer');
        expect(local.size).toBe(0);
    });

    it('keeps the IndexedDB copy when the one written while closing is older', async () => {
        await set(`${KEY}map:a`, session('newer', 2000, 'a'));
        local.set(`${KEY}map:a`, JSON.stringify(session('older', 1000, 'a')));

        expect((await readPendingSessions())[0].nodes[0].text).toBe('newer');
        expect(local.size).toBe(0);
    });

    it('ignores an empty session', async () => {
        await set(`${KEY}map:a`, { ...session('x', 1, 'a'), nodes: [] });
        expect(await readPendingSessions()).toEqual([]);
    });

    it('moves the one session kept before sessions were per map to its own key', async () => {
        await set('neuron-mapping-autosave', session('Earlier', 500, 'x'));

        expect((await readPendingSessions()).map(s => s.sessionId)).toEqual(['map:x']);
        expect(await get('neuron-mapping-autosave')).toBeUndefined();
    });
});

describe('readPendingSession', () => {
    it("reads one map's session, preferring the newer of its two copies", async () => {
        await set(`${KEY}map:a`, session('stored', 1000, 'a'));
        local.set(`${KEY}map:a`, JSON.stringify(session('closing', 2000, 'a')));
        await set(`${KEY}map:b`, session('other', 3000, 'b'));

        expect(await readPendingSession('map:a')).toMatchObject({ sessionId: 'map:a', name: 'closing' });
        expect(await readPendingSession('map:c')).toBeNull();
    });
});

describe('clearAutoSave', () => {
    it('removes a session from both places and leaves the others', async () => {
        await set(`${KEY}map:a`, session('A', 1000, 'a'));
        await set(`${KEY}map:b`, session('B', 1000, 'b'));
        local.set(`${KEY}map:a`, JSON.stringify(session('A', 2000, 'a')));

        await clearAutoSave('map:a');

        expect((await readPendingSessions()).map(s => s.sessionId)).toEqual(['map:b']);
    });
});
