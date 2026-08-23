import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { get, set } from 'idb-keyval';

import { MindMapNodeSchema as NodeSchema, DrawingSchema, ConnectionStyleSchema } from '@/lib/schemas';

import { SavedMindMap, MindMapNode, ConnectionStyle, Drawing } from '@/types/mindmap';

const STORAGE_KEY = 'neuron_saved_maps';

const SavedMapSchema = z.object({
  id: z.string(),
  name: z.string(),
  nodes: z.array(NodeSchema),
  connectionStyle: ConnectionStyleSchema,
  templateId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  thumbnail: z.string().optional(),
  drawings: z.array(DrawingSchema).optional(),
});

const SavedMapsArraySchema = z.array(SavedMapSchema);

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substr(2, 9);
};

export const useSavedMaps = () => {
  const [savedMaps, setSavedMaps] = useState<SavedMindMap[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        let parsed: unknown;
        let migratingFromLocalStorage = false;
        const idbData = await get(STORAGE_KEY);

        if (idbData) {
          parsed = typeof idbData === 'string' ? JSON.parse(idbData) : idbData;
        } else {
          const localData = localStorage.getItem(STORAGE_KEY);
          if (localData) {
            parsed = JSON.parse(localData);
            migratingFromLocalStorage = true;
          }
        }

        if (Array.isArray(parsed)) {
          const valid: SavedMindMap[] = [];
          for (const raw of parsed) {
            const result = SavedMapSchema.safeParse(raw);
            if (result.success) {
              valid.push(result.data as SavedMindMap);
            } else {
              console.error('Skipping invalid saved map:', result.error);
            }
          }
          setSavedMaps(valid);

          if (migratingFromLocalStorage) {
            await set(STORAGE_KEY, valid);
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (e) {
        console.error('Failed to parse or validate saved maps:', e);
      }
    };

    loadData();
  }, []);

  const persistMaps = useCallback(async (maps: SavedMindMap[]) => {
    await set(STORAGE_KEY, maps);
    setSavedMaps(maps);
  }, []);

  const saveMap = useCallback(async (
    name: string,
    nodes: MindMapNode[],
    connectionStyle: ConnectionStyle,
    templateId?: string,
    existingId?: string,
    thumbnail?: string,
    drawings?: Drawing[]
  ): Promise<SavedMindMap> => {
    const now = new Date().toISOString();

    if (existingId) {
      const updated = savedMaps.map(map =>
        map.id === existingId
          ? { ...map, name, nodes, connectionStyle, updatedAt: now, thumbnail: thumbnail || map.thumbnail, drawings }
          : map
      );
      await persistMaps(updated);
      return updated.find(m => m.id === existingId)!;
    } else {
      const newMap: SavedMindMap = {
        id: generateId(),
        name,
        nodes,
        connectionStyle,
        templateId,
        createdAt: now,
        updatedAt: now,
        thumbnail,
        drawings,
      };
      await persistMaps([newMap, ...savedMaps]);
      return newMap;
    }
  }, [savedMaps, persistMaps]);

  const deleteMap = useCallback(async (id: string) => {
    await persistMaps(savedMaps.filter(m => m.id !== id));
  }, [savedMaps, persistMaps]);

  const getMap = useCallback((id: string) => {
    return savedMaps.find(m => m.id === id);
  }, [savedMaps]);

  return {
    savedMaps,
    saveMap,
    deleteMap,
    getMap,
  };
};
