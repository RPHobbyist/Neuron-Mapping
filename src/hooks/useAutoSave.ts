import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { get, set, del } from 'idb-keyval';

import { MindMapNodeSchema as NodeSchema, DrawingSchema, ConnectionStyleSchema } from '@/lib/schemas';

import { MindMapNode, ConnectionStyle, Drawing } from '@/types/mindmap';

const AUTOSAVE_KEY = 'neuron-mapping-autosave';
const AUTOSAVE_DELAY = 2000;

const AutoSaveSchema = z.object({
  nodes: z.array(NodeSchema),
  connectionStyle: ConnectionStyleSchema,
  drawings: z.array(DrawingSchema).optional(),
  lastModified: z.number(),
});

export interface AutoSaveData {
  nodes: MindMapNode[];
  connectionStyle: ConnectionStyle;
  drawings?: Drawing[];
  lastModified: number;
}

export const clearAutoSave = async () => {
  try {
    await del(AUTOSAVE_KEY);
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch (e) {
    console.error('Failed to clear auto-save', e);
  }
};

export const useAutoSave = (
  nodes: MindMapNode[],
  connectionStyle: ConnectionStyle = 'curved',
  drawings: Drawing[] = [],
  onLoad?: (data: AutoSaveData) => void
) => {
  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;

  useEffect(() => {
    const loadData = async () => {
      try {
        let parsed: unknown;
        const idbData = await get(AUTOSAVE_KEY);
        
        if (idbData) {
          parsed = typeof idbData === 'string' ? JSON.parse(idbData) : idbData;
        } else {
          const localData = localStorage.getItem(AUTOSAVE_KEY);
          if (localData) {
            parsed = JSON.parse(localData);
          }
        }

        if (parsed) {
          const data = AutoSaveSchema.parse(parsed) as AutoSaveData;
          if (data.nodes.length > 0) {
            onLoadRef.current?.(data);
            toast.info('Restored unsaved session');
          }
        }
      } catch (e) {
        console.error('Failed to validate auto-save data:', e);
      }
    };
    
    loadData();
  }, []);

  const pendingSaveRef = useRef<AutoSaveData | null>(null);

  useEffect(() => {
    if (nodes.length === 0) return;

    const data: AutoSaveData = {
      nodes,
      connectionStyle,
      drawings,
      lastModified: Date.now(),
    };
    pendingSaveRef.current = data;

    const handler = setTimeout(() => {
      set(AUTOSAVE_KEY, data)
        .then(() => { pendingSaveRef.current = null; })
        .catch(e => console.error('AutoSave failed:', e));
    }, AUTOSAVE_DELAY);

    return () => clearTimeout(handler);
  }, [nodes, connectionStyle, drawings]);

  useEffect(() => {
    const flush = () => {
      if (pendingSaveRef.current) {
        const data = pendingSaveRef.current;
        pendingSaveRef.current = null;
        set(AUTOSAVE_KEY, data).catch(e => console.error('AutoSave flush failed:', e));
      }
    };
    const flushSync = () => {
      if (pendingSaveRef.current) {
        const data = pendingSaveRef.current;
        try {
          localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
        } catch (e) {
          console.error('AutoSave sync flush failed:', e);
        }
      }
      flush();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('beforeunload', flushSync);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      flush();
      window.removeEventListener('beforeunload', flushSync);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return { clearAutoSave };
};
