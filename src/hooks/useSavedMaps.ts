import { useState, useEffect, useCallback } from 'react';
import { SavedMindMap, MindMapNode, ConnectionStyle } from '@/types/mindmap';

const STORAGE_KEY = 'neuron_saved_maps';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useSavedMaps = () => {
  const [savedMaps, setSavedMaps] = useState<SavedMindMap[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedMaps(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse saved maps:', e);
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
    drawings?: any[]
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
