/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { z } from 'zod';
import { get, getMany, keys } from 'idb-keyval';

import { SESSION_KEY_PREFIX, readPendingSessions } from '@/hooks/useAutoSave';
import { appStore } from '@/lib/appStore';
import { DOCUMENT_SCHEMA_VERSION, parseSavedMap } from '@/lib/mapDocument';
import {
    ARCHIVED_MAPS_KEY,
    MAPS_INDEX_KEY,
    isStoredRecord,
    listSavedMaps,
    mapKey,
    migrateLegacyMaps,
    readThenWrite,
    recordId,
    recordUpdatedAt,
    snapshotsKey,
    summarize,
    thumbnailKey,
    toIndex,
    toStoredList,
    upsertSummary,
} from '@/lib/mapStore';
import { generateId } from '@/utils/common';
import { CUSTOM_TEMPLATES_KEY, readStoredTemplates } from '@/utils/customTemplates';
import { buildExportFileName, downloadBlob } from '@/utils/exportUtils';
import { markBackupDone } from '@/utils/storageHealth';

export const BACKUP_FORMAT = 'neuron-mapping-backup';
export const BACKUP_VERSION = 1;
const LEGACY_SNAPSHOTS_KEY = 'mindmap_snapshots';

export interface BackupFile {
    format: typeof BACKUP_FORMAT;
    version: number;
    exportedAt: string;
    maps: unknown[];
    snapshots: Record<string, unknown[]>;
    customTemplates: unknown[];
    archivedMaps: unknown[];
    legacySnapshots: unknown[];
    sessions: Record<string, unknown>;
}

export interface RestoreResult {
    added: number;
    updated: number;
    keptNewer: number;
    templatesAdded: number;
    sessionsRestored: number;
}

const NOT_A_BACKUP = 'This file is not a Neuron Mapping backup.';

const BackupSchema = z.object({
    format: z.literal(BACKUP_FORMAT),
    version: z.number().int().positive(),
    exportedAt: z.string().catch(''),
    maps: z.array(z.unknown()),
    snapshots: z.record(z.array(z.unknown())).catch({}),
    customTemplates: z.array(z.unknown()).catch([]),
    archivedMaps: z.array(z.unknown()).catch([]),
    legacySnapshots: z.array(z.unknown()).catch([]),
    sessions: z.record(z.unknown()).catch({}),
});

const SESSION_ID_RE = /^(map|new):./;

const sessionLastModified = (session: unknown): number => {
    const value = isStoredRecord(session) ? session.lastModified : undefined;
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
};

const readStoredSessions = async (): Promise<Record<string, unknown>> => {
    await readPendingSessions();
    const sessionKeys = (await keys(appStore)).filter(
        (key): key is string => typeof key === 'string' && key.startsWith(SESSION_KEY_PREFIX)
    );
    const values = await getMany(sessionKeys, appStore);
    return Object.fromEntries(sessionKeys.map((key, i) => [key.slice(SESSION_KEY_PREFIX.length), values[i]]));
};

const readLegacySnapshots = (): unknown[] => {
    try {
        return toStoredList(localStorage.getItem(LEGACY_SNAPSHOTS_KEY));
    } catch {
        return [];
    }
};

const mergeById = (base: unknown[], extra: unknown[]): unknown[] => {
    const known = new Set(base.map(recordId));
    return [...base, ...extra.filter((entry) => {
        const id = recordId(entry);
        return id !== undefined && !known.has(id);
    })];
};

export const createBackup = async (): Promise<BackupFile> => {
    const ids = (await listSavedMaps()).map(summary => summary.id);
    const [records, thumbnails, snapshotLists, archive, customTemplates, sessions] = await Promise.all([
        getMany(ids.map(mapKey), appStore),
        getMany(ids.map(thumbnailKey), appStore),
        getMany(ids.map(snapshotsKey), appStore),
        get(ARCHIVED_MAPS_KEY, appStore),
        readStoredTemplates(),
        readStoredSessions(),
    ]);

    const maps = records.flatMap((record, i) => {
        if (!isStoredRecord(record)) return [];
        const thumbnail = thumbnails[i];
        return [typeof thumbnail === 'string' ? { ...record, thumbnail } : record];
    });
    const snapshots: Record<string, unknown[]> = {};
    ids.forEach((id, i) => {
        const list = toStoredList(snapshotLists[i]);
        if (list.length > 0) snapshots[id] = list;
    });

    return {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        maps,
        snapshots,
        customTemplates,
        archivedMaps: toStoredList(archive),
        legacySnapshots: readLegacySnapshots(),
        sessions,
    };
};

export const downloadBackup = async (): Promise<number> => {
    const backup = await createBackup();
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    downloadBlob(blob, buildExportFileName('Neuron Mapping backup', 'nmmbackup'));
    markBackupDone();
    return backup.maps.length;
};

export const parseBackup = (text: string): BackupFile => {
    let raw: unknown;
    try {
        raw = JSON.parse(text);
    } catch {
        throw new Error(NOT_A_BACKUP);
    }
    if (isStoredRecord(raw) && raw.format === BACKUP_FORMAT && typeof raw.version === 'number' && raw.version > BACKUP_VERSION) {
        throw new Error('This backup was made by a newer version of Neuron Mapping.');
    }
    const result = BackupSchema.safeParse(raw);
    if (!result.success) throw new Error(NOT_A_BACKUP);
    return result.data as BackupFile;
};

const restoreLegacySnapshots = (entries: unknown[]) => {
    if (entries.length === 0) return;
    try {
        const current = readLegacySnapshots();
        const merged = mergeById(current, entries);
        if (merged.length > current.length) localStorage.setItem(LEGACY_SNAPSHOTS_KEY, JSON.stringify(merged));
    } catch (e) {
        console.error('Failed to restore older snapshots:', e);
    }
};

export const restoreBackup = async (backup: BackupFile): Promise<RestoreResult> => {
    await migrateLegacyMaps();
    await readStoredTemplates();
    await readPendingSessions();

    const incoming = backup.maps.filter(isStoredRecord);
    const ids = [...new Set(incoming.map(recordId).filter((id): id is string => !!id))];
    const sessionIds = Object.keys(backup.sessions).filter(
        id => SESSION_ID_RE.test(id) && isStoredRecord(backup.sessions[id])
    );
    const sessionKeys = sessionIds.map(id => `${SESSION_KEY_PREFIX}${id}`);
    const result: RestoreResult = { added: 0, updated: 0, keptNewer: 0, templatesAdded: 0, sessionsRestored: 0 };
    const restoredAt = Date.now();

    await readThenWrite(
        [MAPS_INDEX_KEY, CUSTOM_TEMPLATES_KEY, ARCHIVED_MAPS_KEY, ...ids.map(mapKey), ...ids.map(snapshotsKey), ...sessionKeys],
        (values, store) => {
            const [rawIndex, rawTemplates, rawArchive] = values;
            const current = new Map(ids.map((id, i) => [id, values[3 + i]]));
            const snapshots = new Map(ids.map((id, i) => [id, toStoredList(values[3 + ids.length + i])]));
            const currentSessions = values.slice(3 + 2 * ids.length);
            const index = toIndex(rawIndex);
            const archive = toStoredList(rawArchive);
            const archivedJson = new Set(archive.map(entry => JSON.stringify(entry)));
            const addToArchive = (entry: unknown) => {
                const json = JSON.stringify(entry);
                if (archivedJson.has(json)) return;
                archivedJson.add(json);
                archive.push(entry);
            };

            incoming.forEach((entry) => {
                const id = recordId(entry);
                if (!id || !parseSavedMap(entry)) {
                    addToArchive(entry);
                    return;
                }
                const existing = current.get(id);
                if (existing !== undefined && recordUpdatedAt(existing) >= recordUpdatedAt(entry)) {
                    result.keptNewer++;
                    return;
                }
                if (existing !== undefined) {
                    const previous = parseSavedMap(existing);
                    if (previous) {
                        snapshots.set(id, [{
                            id: generateId(),
                            name: `Before restore, ${new Date(restoredAt).toLocaleString()}`,
                            timestamp: restoredAt,
                            nodes: previous.nodes,
                            connectionStyle: previous.connectionStyle,
                            drawings: previous.drawings,
                            boxAreas: previous.boxAreas,
                            schemaVersion: DOCUMENT_SCHEMA_VERSION,
                        }, ...(snapshots.get(id) ?? [])]);
                    } else {
                        addToArchive(existing);
                    }
                }

                const { thumbnail, ...record } = entry;
                store.put(record, mapKey(id));
                if (typeof thumbnail === 'string' && thumbnail) store.put(thumbnail, thumbnailKey(id));
                upsertSummary(index, summarize(id, record));
                current.set(id, record);
                if (existing !== undefined) result.updated++;
                else result.added++;
            });

            ids.forEach((id) => {
                const merged = mergeById(snapshots.get(id) ?? [], toStoredList(backup.snapshots[id]));
                if (merged.length > 0) store.put(merged, snapshotsKey(id));
            });

            const templates = toStoredList(rawTemplates);
            const mergedTemplates = mergeById(templates, backup.customTemplates);
            result.templatesAdded = mergedTemplates.length - templates.length;
            if (result.templatesAdded > 0) store.put(mergedTemplates, CUSTOM_TEMPLATES_KEY);

            sessionIds.forEach((id, i) => {
                const session = backup.sessions[id];
                const existing = currentSessions[i];
                if (existing !== undefined && sessionLastModified(existing) >= sessionLastModified(session)) return;
                store.put(session, sessionKeys[i]);
                result.sessionsRestored++;
            });

            backup.archivedMaps.forEach(addToArchive);
            if (archive.length > 0) store.put(archive, ARCHIVED_MAPS_KEY);
            store.put(index, MAPS_INDEX_KEY);
        }
    );

    restoreLegacySnapshots(backup.legacySnapshots);
    return result;
};

export const describeRestore = ({ added, updated, keptNewer, templatesAdded, sessionsRestored }: RestoreResult): string => {
    const maps = (count: number) => `${count} ${count === 1 ? 'map' : 'maps'}`;
    const parts: string[] = [];
    if (added > 0) parts.push(`added ${maps(added)}`);
    if (updated > 0) parts.push(`updated ${maps(updated)}`);
    if (keptNewer > 0) parts.push(`kept this browser's newer ${keptNewer === 1 ? 'copy' : 'copies'} of ${maps(keptNewer)}`);
    if (templatesAdded > 0) parts.push(`added ${templatesAdded} ${templatesAdded === 1 ? 'template' : 'templates'}`);
    if (sessionsRestored > 0) parts.push(`restored unsaved changes to ${maps(sessionsRestored)}`);
    if (parts.length === 0) return 'Nothing new to restore: this browser already has everything in the backup.';
    const sentence = parts.join(', ');
    return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
};
