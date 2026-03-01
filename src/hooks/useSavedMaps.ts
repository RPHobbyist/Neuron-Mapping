import { useState, useEffect, useCallback } from 'react';
import { SavedMindMap, MindMapNode, ConnectionStyle, Drawing } from '@/types/mindmap';
import { z } from 'zod';
import { sanitizeUrl } from '@/utils/common';

const STORAGE_KEY = 'neuron_saved_maps';

// Zod schemas for validation and sanitization
const NodeSchema = z.object({
  id: z.string(),
  text: z.string(),
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
  notes: z.string().optional(),
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
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Validate and sanitize the entire array
        const validated = SavedMapsArraySchema.parse(parsed) as SavedMindMap[];
        setSavedMaps(validated);
      } catch (e) {
        console.error('Failed to parse or validate saved maps:', e);
        // If it fails validation, we might want to try to recover what we can
        // but for now, we just log and fall back to empty to be safe
      }
    }
  }, []);

  const persistMaps = useCallback((maps: SavedMindMap[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
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
