/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import {
  DeletedMap,
  SavedMapSummary,
  deleteMapRecord,
  duplicateMapRecord,
  listSavedMaps,
  loadSavedMap,
  loadThumbnails,
  renameMapRecord,
  restoreDeletedMap,
  saveMapRecord,
} from '@/lib/mapStore';
import { requestPersistentStorage } from '@/utils/storageHealth';

import { SavedMindMap, MindMapNode, ConnectionStyle, Drawing, BoxArea, Viewport } from '@/types/mindmap';

export type { SavedMapSummary } from '@/lib/mapStore';

export const useSavedMaps = () => {
  const [savedMaps, setSavedMaps] = useState<SavedMapSummary[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const thumbnailCacheRef = useRef(new Map<string, { updatedAt: string; url?: string }>());

  const reload = useCallback(async () => {
    try {
      const readable = (await listSavedMaps()).filter(summary => summary.readable);
      const cache = thumbnailCacheRef.current;
      const outdated = readable.filter(summary => cache.get(summary.id)?.updatedAt !== summary.updatedAt);
      if (outdated.length > 0) {
        const loaded = await loadThumbnails(outdated.map(summary => summary.id));
        outdated.forEach(summary => cache.set(summary.id, { updatedAt: summary.updatedAt, url: loaded[summary.id] }));
      }
      setSavedMaps(readable);
      setThumbnails(Object.fromEntries(readable.flatMap((summary) => {
        const url = cache.get(summary.id)?.url;
        return url ? [[summary.id, url]] : [];
      })));
    } catch (e) {
      console.error('Failed to load saved maps:', e);
    }
  }, []);

  useEffect(() => {
    reload();
    window.addEventListener('focus', reload);
    return () => window.removeEventListener('focus', reload);
  }, [reload]);

  const saveMap = useCallback(async (
    name: string,
    nodes: MindMapNode[],
    connectionStyle: ConnectionStyle,
    templateId?: string,
    existingId?: string,
    thumbnail?: string,
    drawings?: Drawing[],
    boxAreas?: BoxArea[],
    viewport?: Viewport
  ): Promise<SavedMindMap> => {
    const saved = await saveMapRecord({ name, nodes, connectionStyle, templateId, existingId, thumbnail, drawings, boxAreas, viewport });
    void requestPersistentStorage();
    await reload();
    return saved;
  }, [reload]);

  const renameMap = useCallback(async (id: string, name: string): Promise<boolean> => {
    const renamed = await renameMapRecord(id, name);
    await reload();
    return renamed;
  }, [reload]);

  const duplicateMap = useCallback(async (id: string, name: string): Promise<SavedMindMap | null> => {
    const copy = await duplicateMapRecord(id, name);
    await reload();
    return copy;
  }, [reload]);

  const deleteMap = useCallback(async (id: string): Promise<DeletedMap> => {
    const deleted = await deleteMapRecord(id);
    thumbnailCacheRef.current.delete(id);
    await reload();
    return deleted;
  }, [reload]);

  const undoDelete = useCallback(async (deleted: DeletedMap): Promise<boolean> => {
    const restored = await restoreDeletedMap(deleted);
    await reload();
    return restored;
  }, [reload]);

  return {
    savedMaps,
    thumbnails,
    saveMap,
    renameMap,
    duplicateMap,
    deleteMap,
    undoDelete,
    loadMap: loadSavedMap,
    reload,
  };
};
