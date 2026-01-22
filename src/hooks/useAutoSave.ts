import { useEffect, useCallback } from 'react';
import { MindMapNode, ConnectionStyle } from '@/types/mindmap';
import { toast } from 'sonner';

const AUTOSAVE_KEY = 'neuron-mapping-autosave';
const AUTOSAVE_DELAY = 2000; // 2 seconds debounce

export interface AutoSaveData {
  nodes: MindMapNode[];
  connectionStyle: ConnectionStyle;
  drawings?: any[];
  lastModified: number;
}

// Utility to clear auto-save (call before loading a new template)
export const clearAutoSave = () => {
  localStorage.removeItem(AUTOSAVE_KEY);
};

export const useAutoSave = (
  nodes: MindMapNode[],
  connectionStyle: ConnectionStyle = 'curved',
  drawings: any[] = [],
  onLoad?: (data: AutoSaveData) => void
) => {
  // Load from storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved) as AutoSaveData;
        // Only load if it looks valid
        if (Array.isArray(data.nodes) && data.nodes.length > 0) {
          onLoad?.(data);
          toast.info('Restored unsaved session');
        }
      } catch (e) {
        // Silent fail
      }
    }
  }, [onLoad]); // Run once on mount (and if onLoad changes)

  // Save to storage on change (debounced)
  useEffect(() => {
    if (nodes.length === 0) return; // Don't save empty state immediately

    const handler = setTimeout(() => {
      const data: AutoSaveData = {
        nodes,
        connectionStyle,
        drawings,
        lastModified: Date.now(),
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
      // Optional: console.log('Auto-saved');
    }, AUTOSAVE_DELAY);

    return () => clearTimeout(handler);
  }, [nodes, connectionStyle, drawings]);

  return { clearAutoSave };
};
