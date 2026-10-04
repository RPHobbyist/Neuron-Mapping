/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { MindMapNode, ConnectionStyle, Drawing, BoxArea } from '@/types/mindmap';
import { History, Save, Trash2, RotateCcw, X, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { get, update } from 'idb-keyval';
import { DOCUMENT_SCHEMA_VERSION, parseSnapshot, SnapshotRecord as Snapshot } from '@/lib/mapDocument';
import { AUTO_SNAPSHOT_LIMIT, snapshotsKey as storageKey } from '@/lib/mapStore';
import { generateId } from '@/utils/common';

interface SnapshotPanelProps {
    mapId?: string;
    nodes: MindMapNode[];
    connectionStyle: ConnectionStyle;
    drawings: Drawing[];
    boxAreas: BoxArea[];
    onRestore: (nodes: MindMapNode[], connectionStyle: ConnectionStyle, drawings: Drawing[], boxAreas: BoxArea[]) => void;
    captureThumbnail?: () => Promise<string | undefined>;
    isOpen: boolean;
    onClose: () => void;
}

const MAX_MANUAL_SNAPSHOTS = 10;
const LEGACY_STORAGE_KEY = 'mindmap_snapshots';

const readStored = (raw: unknown): { readable: Snapshot[]; unreadable: unknown[] } => {
    const readable: Snapshot[] = [];
    const unreadable: unknown[] = [];
    (Array.isArray(raw) ? raw : []).forEach((entry) => {
        const snapshot = parseSnapshot(entry);
        if (snapshot) readable.push(snapshot);
        else unreadable.push(entry);
    });
    return { readable, unreadable };
};

const parseSnapshots = (raw: unknown): Snapshot[] => readStored(raw).readable;

const readLegacySnapshots = (): Snapshot[] => {
    try {
        const saved = localStorage.getItem(LEGACY_STORAGE_KEY);
        return saved ? parseSnapshots(JSON.parse(saved)) : [];
    } catch {
        return [];
    }
};

const trim = (list: Snapshot[]): Snapshot[] => {
    const seen = new Set<string>();
    const sorted = [...list]
        .sort((a, b) => b.timestamp - a.timestamp)
        .filter(s => !seen.has(s.id) && seen.add(s.id));
    const manual = sorted.filter(s => !s.auto).slice(0, MAX_MANUAL_SNAPSHOTS);
    const auto = sorted.filter(s => s.auto).slice(0, AUTO_SNAPSHOT_LIMIT);
    return sorted.filter(s => manual.includes(s) || auto.includes(s));
};

export const SnapshotPanel = ({ mapId, nodes, connectionStyle, drawings, boxAreas, onRestore, captureThumbnail, isOpen, onClose }: SnapshotPanelProps) => {
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [legacySnapshots, setLegacySnapshots] = useState<Snapshot[]>(readLegacySnapshots);
    const [snapshotName, setSnapshotName] = useState('');
    const [isBusy, setIsBusy] = useState(false);
    const unsavedRef = useRef<Snapshot[]>([]);

    const change = useCallback(async (apply: (list: Snapshot[]) => Snapshot[]): Promise<boolean> => {
        try {
            if (!mapId) {
                unsavedRef.current = trim(apply(unsavedRef.current));
                setSnapshots(unsavedRef.current);
                return true;
            }
            let next: Snapshot[] = [];
            await update<unknown>(storageKey(mapId), (current) => {
                const { readable, unreadable } = readStored(current);
                next = trim(apply(readable));
                return [...next, ...unreadable];
            });
            setSnapshots(next);
            return true;
        } catch (e) {
            console.error('Failed to persist snapshots:', e);
            toast.error('Failed to save the snapshot. Your browser storage may be full.');
            return false;
        }
    }, [mapId]);

    useEffect(() => {
        if (!mapId || unsavedRef.current.length === 0) return;
        const unsaved = unsavedRef.current;
        unsavedRef.current = [];
        change(list => [...unsaved, ...list]);
    }, [mapId, change]);

    useEffect(() => {
        if (!mapId || !isOpen) return;
        let cancelled = false;
        get(storageKey(mapId))
            .then((stored) => {
                if (!cancelled) setSnapshots(trim(parseSnapshots(stored)));
            })
            .catch(e => console.error('Failed to load snapshots:', e));
        return () => { cancelled = true; };
    }, [mapId, isOpen]);

    const captureCurrent = useCallback(async (name: string, auto: boolean): Promise<Snapshot> => {
        let thumbnail: string | undefined;
        try {
            thumbnail = await captureThumbnail?.();
        } catch (e) {
            console.error('Failed to draw snapshot thumbnail:', e);
        }
        return {
            id: generateId(),
            name,
            timestamp: Date.now(),
            nodes: structuredClone(nodes),
            connectionStyle,
            drawings: structuredClone(drawings),
            boxAreas: structuredClone(boxAreas),
            ...(auto ? { auto } : {}),
            ...(thumbnail ? { thumbnail } : {}),
            schemaVersion: DOCUMENT_SCHEMA_VERSION,
        };
    }, [nodes, connectionStyle, drawings, boxAreas, captureThumbnail]);

    const createSnapshot = useCallback(async () => {
        const name = snapshotName.trim() || `Snapshot ${snapshots.filter(s => !s.auto).length + 1}`;
        setIsBusy(true);
        try {
            const snapshot = await captureCurrent(name, false);
            if (await change(list => [snapshot, ...list])) {
                setSnapshotName('');
                toast.success(`Snapshot "${name}" saved`);
            }
        } finally {
            setIsBusy(false);
        }
    }, [snapshotName, snapshots, captureCurrent, change]);

    const deleteSnapshot = useCallback(async (id: string) => {
        if (await change(list => list.filter(s => s.id !== id))) {
            toast.success('Snapshot deleted');
        }
    }, [change]);

    const deleteLegacySnapshot = useCallback((id: string) => {
        const remaining = legacySnapshots.filter(s => s.id !== id);
        try {
            if (remaining.length > 0) localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(remaining));
            else localStorage.removeItem(LEGACY_STORAGE_KEY);
            setLegacySnapshots(remaining);
            toast.success('Snapshot deleted');
        } catch (e) {
            console.error('Failed to delete snapshot:', e);
        }
    }, [legacySnapshots]);

    const restoreSnapshot = useCallback(async (snapshot: Snapshot) => {
        setIsBusy(true);
        try {
            const current = await captureCurrent(`Before restoring "${snapshot.name}"`, true);
            const backedUp = await change(list => [current, ...list]);
            onRestore(snapshot.nodes, snapshot.connectionStyle ?? connectionStyle, snapshot.drawings ?? drawings, snapshot.boxAreas ?? []);
            toast.success(backedUp ? `Restored to "${snapshot.name}" (Current state backed up)` : `Restored to "${snapshot.name}"`);
            onClose();
        } finally {
            setIsBusy(false);
        }
    }, [connectionStyle, drawings, captureCurrent, change, onRestore, onClose]);

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderSnapshot = (snapshot: Snapshot, onDelete: (id: string) => void) => (
        <div
            key={snapshot.id}
            className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                    {snapshot.thumbnail && (
                        <img
                            src={snapshot.thumbnail}
                            alt=""
                            className="w-16 h-12 rounded border bg-card object-contain shrink-0"
                        />
                    )}
                    <div className="min-w-0">
                        <h4 className="font-medium text-sm truncate">{snapshot.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(snapshot.timestamp)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {snapshot.nodes.length} nodes{snapshot.auto ? ' · automatic' : ''}
                        </p>
                    </div>
                </div>
                <div className="flex gap-1 shrink-0">
                    <button
                        onClick={() => restoreSnapshot(snapshot)}
                        disabled={isBusy}
                        className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 rounded transition-colors disabled:opacity-50"
                        title="Restore this snapshot"
                        aria-label={`Restore ${snapshot.name}`}
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(snapshot.id)}
                        disabled={isBusy}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded transition-colors disabled:opacity-50"
                        title="Delete snapshot"
                        aria-label={`Delete ${snapshot.name}`}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-80 bg-card shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Version History
                </h2>
                <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-all hover:rotate-90 duration-300" aria-label="Close version history">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4 border-b">
                <div className="flex gap-2">
                    <input
                        id="snapshot-name-input"
                        name="snapshot-name"
                        type="text"
                        value={snapshotName}
                        onChange={(e) => setSnapshotName(e.target.value)}
                        placeholder="Snapshot name (optional)"
                        className="flex-1 px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        onKeyDown={(e) => e.key === 'Enter' && !isBusy && createSnapshot()}
                    />
                    <button
                        onClick={createSnapshot}
                        disabled={isBusy}
                        className="px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                        title="Save Snapshot"
                    >
                        <Save className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    {mapId
                        ? `Keeps up to ${MAX_MANUAL_SNAPSHOTS} snapshots you take, plus the last ${AUTO_SNAPSHOT_LIMIT} saved versions.`
                        : 'Snapshots of an unsaved map are kept once you save the map.'}
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {snapshots.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No snapshots yet</p>
                        <p className="text-xs mt-1">Save your first snapshot above</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {snapshots.map(snapshot => renderSnapshot(snapshot, deleteSnapshot))}
                    </div>
                )}

                {legacySnapshots.length > 0 && (
                    <div className="mt-6 space-y-2">
                        <p className="px-1 text-xs text-muted-foreground">
                            Older snapshots, from before version history was kept per map. They may belong to a different map.
                        </p>
                        {legacySnapshots.map(snapshot => renderSnapshot(snapshot, deleteLegacySnapshot))}
                    </div>
                )}
            </div>
        </div>
    );
};
