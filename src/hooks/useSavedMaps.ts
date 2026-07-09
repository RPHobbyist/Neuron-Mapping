import { useState, useEffect, useCallback } from 'react';
import { SavedMindMap, MindMapNode, ConnectionStyle, Drawing } from '@/types/mindmap';
import { z } from 'zod';
import { sanitizeUrl } from '@/utils/common';
import { sanitizeText } from '@/utils/parsers/parserUtils';
import { get, set } from 'idb-keyval';

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
  })).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  measuredWidth: z.number().optional(),
  measuredHeight: z.number().optional(),
  image: z.string().optional().transform(v => sanitizeUrl(v)),
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
        const idbData = await get(STORAGE_KEY);
        
        if (idbData) {
          parsed = typeof idbData === 'string' ? JSON.parse(idbData) : idbData;
        } else {
          const localData = localStorage.getItem(STORAGE_KEY);
          if (localData) {
            parsed = JSON.parse(localData);
            // Migrate to IndexedDB
            await set(STORAGE_KEY, parsed);
          }
        }

        if (parsed) {
          const validated = SavedMapsArraySchema.parse(parsed) as SavedMindMap[];
          setSavedMaps(validated);
        }
      } catch (e) {
        console.error('Failed to parse or validate saved maps:', e);
      }
    };

    loadData();
  }, []);

  const persistMaps = useCallback((maps: SavedMindMap[]) => {
    set(STORAGE_KEY, maps).catch(e => console.error('Failed to save maps to IndexedDB:', e));
    setSavedMaps(maps);
  }, []);

  const saveMap = useCallback((
    name: string,
    nodes: MindMapNode[],
    connectionStyle: ConnectionStyle,
    templateId?: string,
    existingId?: string,
    thumbnail?: string,
    drawings?: Drawing[]
  ): SavedMindMap => {
    const now = new Date().toISOString();

    if (existingId) {
      // Update existing map
      const updated = savedMaps.map(map =>
        map.id === existingId
          ? { ...map, name, nodes, connectionStyle, updatedAt: now, thumbnail: thumbnail || map.thumbnail, drawings }
          : map
      );
      persistMaps(updated);
      return updated.find(m => m.id === existingId)!;
    } else {
      // Create new map
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
      persistMaps([newMap, ...savedMaps]);
      return newMap;
    }
  }, [savedMaps, persistMaps]);

  const deleteMap = useCallback((id: string) => {
    persistMaps(savedMaps.filter(m => m.id !== id));
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
