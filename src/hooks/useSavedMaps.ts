import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { get, set } from 'idb-keyval';

import { sanitizeUrl, sanitizeImageUrl } from '@/utils/common';
import { sanitizeText } from '@/utils/parsers/parserUtils';

import { SavedMindMap, MindMapNode, ConnectionStyle, Drawing } from '@/types/mindmap';

const STORAGE_KEY = 'neuron_saved_maps';

// Zod schemas for validation and sanitization
const NodeSchema = z.object({
  id: z.string(),
  text: z.string().transform(v => sanitizeText(v)),
  x: z.number(),
  y: z.number(),
  color: z.string(),
  parentId: z.string().nullable(),
  shape: z.string().optional(),
  nodeAnimation: z.string().optional(),
  lineType: z.string().optional(),
  lineThickness: z.string().optional(),
  lineColor: z.string().optional(),
  lineLabel: z.string().optional(),
  lineAnimated: z.boolean().optional(),
  lineDouble: z.boolean().optional(),
  lineGradient: z.boolean().optional(),
  lineTension: z.number().optional(),
  lineAnimationDirection: z.string().optional(),
  lineAnimationType: z.string().optional(),
  lineArrowDirection: z.string().optional(),
  relations: z.array(z.object({
    targetId: z.string(),
    sourceId: z.string().optional(),
    label: z.string().optional(),
    type: z.string().optional(),
    thickness: z.string().optional(),
    color: z.string().optional(),
    animated: z.boolean().optional(),
    animationSpeed: z.string().optional(),
    animationDirection: z.string().optional(),
    animationType: z.string().optional(),
    arrowDirection: z.string().optional(),
  })).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  measuredWidth: z.number().optional(),
  measuredHeight: z.number().optional(),
  image: z.string().optional().transform(v => sanitizeImageUrl(v)),
  icon: z.string().optional(),
  iconStyle: z.string().optional(),
  link: z.string().optional().transform(v => sanitizeUrl(v)),
  notes: z.string().optional().transform(v => v ? sanitizeText(v) : v),
  priority: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

const DrawingSchema = z.object({
  id: z.string(),
  points: z.array(z.object({
    x: z.number(),
    y: z.number(),
  })),
  color: z.string(),
});

const SavedMapSchema = z.object({
  id: z.string(),
  name: z.string(),
  nodes: z.array(NodeSchema),
  connectionStyle: z.string(),
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
          // Validate each map independently instead of the whole array
          // at once — one legacy/malformed map used to throw away every
          // saved map, and the very next save would then overwrite storage
          // with just the new one, permanently destroying the rest.
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
            // Only write the *validated* data to IndexedDB, and only clear
            // the legacy localStorage copy, once that write succeeds — writing
            // the raw payload first (and validating after) could otherwise
            // permanently poison IndexedDB with corrupt data while orphaning
            // the still-good localStorage backup.
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
    // Write must succeed before state (and therefore the UI) reflects the
    // change — otherwise a failed write (e.g. quota exceeded) still shows
    // "Saved!" for data that was never actually persisted.
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
