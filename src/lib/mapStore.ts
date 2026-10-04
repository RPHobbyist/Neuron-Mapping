/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { get, getMany, keys, promisifyRequest, update } from 'idb-keyval';

import { BoxArea, ConnectionStyle, Drawing, MindMapNode, SavedMindMap, Viewport } from '@/types/mindmap';
import { generateId } from '@/utils/common';

import { appStore } from './appStore';
import { DOCUMENT_SCHEMA_VERSION, parseSavedMap } from './mapDocument';

export const MAPS_INDEX_KEY = 'neuron_maps_index';
const MAP_KEY_PREFIX = 'neuron_map:';
export const mapKey = (id: string) => `${MAP_KEY_PREFIX}${id}`;
export const thumbnailKey = (id: string) => `neuron_map_thumb:${id}`;
export const snapshotsKey = (mapId: string) => `mindmap_snapshots:${mapId}`;

export const LEGACY_MAPS_KEY = 'neuron_saved_maps';
export const ARCHIVED_MAPS_KEY = 'neuron_maps_archive';

export interface SavedMapSummary {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    nodeCount: number;
    templateId?: string;
    readable: boolean;
}

export interface SaveMapInput {
    name: string;
    nodes: MindMapNode[];
    connectionStyle: ConnectionStyle;
    templateId?: string;
    existingId?: string;
    thumbnail?: string;
    drawings?: Drawing[];
    boxAreas?: BoxArea[];
    viewport?: Viewport;
}

export type StoredRecord = Record<string, unknown>;

export const isStoredRecord = (value: unknown): value is StoredRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

export const recordId = (record: unknown): string | undefined => {
    const id = isStoredRecord(record) ? record.id : undefined;
    return typeof id === 'string' && id ? id : undefined;
};

export const recordUpdatedAt = (record: unknown): string => {
    const updatedAt = isStoredRecord(record) ? record.updatedAt : undefined;
    return typeof updatedAt === 'string' ? updatedAt : '';
};

export const toStoredList = (value: unknown): unknown[] => {
    if (typeof value === 'string') {
        try {
            value = JSON.parse(value);
        } catch {
            return [];
        }
    }
    return Array.isArray(value) ? value : [];
};

export const toIndex = (value: unknown): SavedMapSummary[] => toStoredList(value).filter(
    (entry): entry is SavedMapSummary => isStoredRecord(entry) && typeof entry.id === 'string' && typeof entry.updatedAt === 'string'
);

export const summarize = (id: string, record: unknown): SavedMapSummary => {
    const map = parseSavedMap(record);
    if (map) {
        return {
            id,
            name: map.name,
            createdAt: map.createdAt,
            updatedAt: map.updatedAt,
            nodeCount: map.nodes.length,
            templateId: map.templateId,
            readable: true,
        };
    }
    const raw = isStoredRecord(record) ? record : {};
    return {
        id,
        name: typeof raw.name === 'string' ? raw.name : 'Unreadable map',
        createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
        updatedAt: recordUpdatedAt(raw),
        nodeCount: Array.isArray(raw.nodes) ? raw.nodes.length : 0,
        readable: false,
    };
};

export const upsertSummary = (index: SavedMapSummary[], summary: SavedMapSummary): void => {
    const i = index.findIndex(entry => entry.id === summary.id);
    if (i >= 0) index[i] = summary;
    else index.push(summary);
};

const byMostRecent = (index: SavedMapSummary[]) => [...index].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

class StaleReadError extends Error {}

export const readThenWrite = (
    keysToRead: string[],
    write: (values: unknown[], store: IDBObjectStore) => void
): Promise<void> => appStore('readwrite', (store) => new Promise<void>((resolve, reject) => {
    const values: unknown[] = new Array(keysToRead.length);
    let pending = keysToRead.length;

    const finish = () => {
        try {
            write(values, store);
        } catch (error) {
            store.transaction.abort();
            reject(error);
            return;
        }
        promisifyRequest(store.transaction).then(() => resolve(), reject);
    };

    if (pending === 0) {
        finish();
        return;
    }
    keysToRead.forEach((key, i) => {
        const request = store.get(key);
        request.onsuccess = () => {
            values[i] = request.result;
            if (--pending === 0) finish();
        };
        request.onerror = () => reject(request.error);
    });
}));

const readLegacyLocalStorage = (): unknown[] => {
    try {
        return toStoredList(localStorage.getItem(LEGACY_MAPS_KEY));
    } catch {
        return [];
    }
};

const MIGRATION_ATTEMPTS = 3;

export const migrateLegacyMaps = async (): Promise<void> => {
    for (let attempt = 0; attempt < MIGRATION_ATTEMPTS; attempt++) {
        const fromLocalStorage = readLegacyLocalStorage();
        const legacyValue = await get(LEGACY_MAPS_KEY, appStore);
        if (legacyValue === undefined && fromLocalStorage.length === 0) return;

        const ids = [...new Set(
            [...toStoredList(legacyValue), ...fromLocalStorage].map(recordId).filter((id): id is string => !!id)
        )];

        try {
            await readThenWrite(
                [LEGACY_MAPS_KEY, MAPS_INDEX_KEY, ARCHIVED_MAPS_KEY, ...ids.map(mapKey)],
                ([legacyRaw, rawIndex, rawArchive, ...currentRecords], store) => {
                    const legacy = [...toStoredList(legacyRaw), ...fromLocalStorage];
                    if (legacy.some((entry) => {
                        const id = recordId(entry);
                        return id !== undefined && !ids.includes(id);
                    })) {
                        throw new StaleReadError();
                    }

                    const current = new Map(ids.map((id, i) => [id, currentRecords[i]]));
                    const index = toIndex(rawIndex);
                    const archive = toStoredList(rawArchive);
                    let archived = false;

                    legacy.forEach((entry) => {
                        const id = recordId(entry);
                        if (!id) {
                            archive.push(entry);
                            archived = true;
                            return;
                        }
                        const existing = current.get(id);
                        if (existing !== undefined && recordUpdatedAt(existing) >= recordUpdatedAt(entry)) return;

                        const { thumbnail, ...record } = entry as StoredRecord;
                        store.put(record, mapKey(id));
                        if (typeof thumbnail === 'string' && thumbnail) store.put(thumbnail, thumbnailKey(id));
                        upsertSummary(index, summarize(id, record));
                        current.set(id, record);
                    });

                    store.put(index, MAPS_INDEX_KEY);
                    if (archived) store.put(archive, ARCHIVED_MAPS_KEY);
                    store.delete(LEGACY_MAPS_KEY);
                }
            );
        } catch (error) {
            if (error instanceof StaleReadError) continue;
            throw error;
        }

        if (fromLocalStorage.length > 0) {
            try {
                localStorage.removeItem(LEGACY_MAPS_KEY);
            } catch {
            }
        }
        return;
    }
};

export const listSavedMaps = async (): Promise<SavedMapSummary[]> => {
    await migrateLegacyMaps();

    const [rawIndex, allKeys] = await Promise.all([get(MAPS_INDEX_KEY, appStore), keys(appStore)]);
    const index = toIndex(rawIndex);
    const storedIds = new Set(allKeys.flatMap((key) => (
        typeof key === 'string' && key.startsWith(MAP_KEY_PREFIX) ? [key.slice(MAP_KEY_PREFIX.length)] : []
    )));
    const indexedIds = new Set(index.map(entry => entry.id));
    const missing = [...storedIds].filter(id => !indexedIds.has(id));
    const stale = new Map(index.filter(entry => !storedIds.has(entry.id)).map(entry => [entry.id, entry.updatedAt]));
    if (missing.length === 0 && stale.size === 0) return byMostRecent(index);

    const records = await getMany(missing.map(mapKey), appStore);
    const found = missing.map((id, i) => summarize(id, records[i]));
    let repaired: SavedMapSummary[] = [];
    await update<unknown>(MAPS_INDEX_KEY, (current) => {
        const latest = toIndex(current).filter(entry => stale.get(entry.id) !== entry.updatedAt);
        found.forEach((summary) => {
            if (!latest.some(entry => entry.id === summary.id)) latest.push(summary);
        });
        repaired = latest;
        return latest;
    }, appStore);
    return byMostRecent(repaired);
};

export const loadSavedMap = async (id: string): Promise<SavedMindMap | null> =>
    parseSavedMap(await get(mapKey(id), appStore));

export const loadThumbnails = async (ids: string[]): Promise<Record<string, string>> => {
    if (ids.length === 0) return {};
    const values = await getMany(ids.map(thumbnailKey), appStore);
    return Object.fromEntries(ids.flatMap((id, i) => (typeof values[i] === 'string' ? [[id, values[i] as string]] : [])));
};

export const AUTO_SNAPSHOT_LIMIT = 5;

const isAutoSnapshot = (snapshot: unknown) => isStoredRecord(snapshot) && snapshot.auto === true;

const withAutoSnapshot = (snapshots: unknown[], snapshot: StoredRecord): unknown[] => [
    ...[snapshot, ...snapshots.filter(isAutoSnapshot)].slice(0, AUTO_SNAPSHOT_LIMIT),
    ...snapshots.filter(entry => !isAutoSnapshot(entry)),
];

const sameContent = (stored: StoredRecord, input: SaveMapInput) =>
    JSON.stringify([stored.nodes, stored.connectionStyle, stored.drawings ?? [], stored.boxAreas ?? []])
    === JSON.stringify([input.nodes, input.connectionStyle, input.drawings ?? [], input.boxAreas ?? []]);

const snapshotOfReplacedVersion = (previous: StoredRecord | undefined, thumbnail: unknown, input: SaveMapInput): StoredRecord | null => {
    if (!previous || sameContent(previous, input)) return null;
    const map = parseSavedMap(previous);
    if (!map) return null;
    return {
        id: generateId(),
        name: 'Saved version',
        timestamp: Date.parse(map.updatedAt) || Date.now(),
        nodes: map.nodes,
        connectionStyle: map.connectionStyle,
        drawings: map.drawings,
        boxAreas: map.boxAreas,
        auto: true,
        ...(typeof thumbnail === 'string' ? { thumbnail } : {}),
        schemaVersion: DOCUMENT_SCHEMA_VERSION,
    };
};

export const saveMapRecord = async (input: SaveMapInput): Promise<SavedMindMap> => {
    const id = input.existingId ?? generateId();
    const now = new Date().toISOString();
    let saved!: SavedMindMap;

    const keysToRead = [MAPS_INDEX_KEY, mapKey(id), thumbnailKey(id), snapshotsKey(id)];
    await readThenWrite(keysToRead, ([rawIndex, existing, previousThumbnail, rawSnapshots], store) => {
        const previous = isStoredRecord(existing) ? existing : undefined;
        const replaced = snapshotOfReplacedVersion(previous, previousThumbnail, input);
        if (replaced) store.put(withAutoSnapshot(toStoredList(rawSnapshots), replaced), snapshotsKey(id));

        const record: StoredRecord = {
            ...previous,
            id,
            name: input.name,
            nodes: input.nodes,
            connectionStyle: input.connectionStyle,
            templateId: previous ? previous.templateId : input.templateId,
            createdAt: typeof previous?.createdAt === 'string' ? previous.createdAt : now,
            updatedAt: now,
            drawings: input.drawings,
            boxAreas: input.boxAreas,
            ...(input.viewport ? { viewport: input.viewport } : {}),
            schemaVersion: DOCUMENT_SCHEMA_VERSION,
        };
        delete record.thumbnail;

        store.put(record, mapKey(id));
        if (input.thumbnail) store.put(input.thumbnail, thumbnailKey(id));
        const index = toIndex(rawIndex).filter(entry => entry.id !== id);
        index.push({
            id,
            name: input.name,
            createdAt: record.createdAt as string,
            updatedAt: now,
            nodeCount: input.nodes.length,
            templateId: record.templateId as string | undefined,
            readable: true,
        });
        store.put(index, MAPS_INDEX_KEY);
        saved = record as unknown as SavedMindMap;
    });

    return saved;
};

export const renameMapRecord = async (id: string, name: string): Promise<boolean> => {
    const now = new Date().toISOString();
    let renamed = false;
    await readThenWrite([MAPS_INDEX_KEY, mapKey(id)], ([rawIndex, existing], store) => {
        if (!isStoredRecord(existing)) return;
        const record: StoredRecord = { ...existing, name, updatedAt: now };
        store.put(record, mapKey(id));
        const index = toIndex(rawIndex);
        upsertSummary(index, summarize(id, record));
        store.put(index, MAPS_INDEX_KEY);
        renamed = true;
    });
    return renamed;
};

export const duplicateMapRecord = async (id: string, name: string): Promise<SavedMindMap | null> => {
    const copyId = generateId();
    const now = new Date().toISOString();
    let copy: SavedMindMap | null = null;
    await readThenWrite([MAPS_INDEX_KEY, mapKey(id), thumbnailKey(id)], ([rawIndex, existing, thumbnail], store) => {
        if (!isStoredRecord(existing)) return;
        const record: StoredRecord = { ...existing, id: copyId, name, createdAt: now, updatedAt: now };
        store.put(record, mapKey(copyId));
        if (typeof thumbnail === 'string') store.put(thumbnail, thumbnailKey(copyId));
        const index = toIndex(rawIndex);
        upsertSummary(index, summarize(copyId, record));
        store.put(index, MAPS_INDEX_KEY);
        copy = record as unknown as SavedMindMap;
    });
    return copy;
};

export interface DeletedMap {
    id: string;
    record: unknown;
    thumbnail: unknown;
    snapshots: unknown;
}

export const deleteMapRecord = async (id: string): Promise<DeletedMap> => {
    let deleted!: DeletedMap;
    await readThenWrite(
        [MAPS_INDEX_KEY, mapKey(id), thumbnailKey(id), snapshotsKey(id)],
        ([rawIndex, record, thumbnail, snapshots], store) => {
            deleted = { id, record, thumbnail, snapshots };
            store.delete(mapKey(id));
            store.delete(thumbnailKey(id));
            store.delete(snapshotsKey(id));
            store.put(toIndex(rawIndex).filter(entry => entry.id !== id), MAPS_INDEX_KEY);
        }
    );
    return deleted;
};

export const restoreDeletedMap = async (deleted: DeletedMap): Promise<boolean> => {
    let restored = false;
    await readThenWrite([MAPS_INDEX_KEY, mapKey(deleted.id)], ([rawIndex, current], store) => {
        if (current !== undefined || deleted.record === undefined) return;
        store.put(deleted.record, mapKey(deleted.id));
        if (deleted.thumbnail !== undefined) store.put(deleted.thumbnail, thumbnailKey(deleted.id));
        if (deleted.snapshots !== undefined) store.put(deleted.snapshots, snapshotsKey(deleted.id));
        const index = toIndex(rawIndex).filter(entry => entry.id !== deleted.id);
        index.push(summarize(deleted.id, deleted.record));
        store.put(index, MAPS_INDEX_KEY);
        restored = true;
    });
    return restored;
};
