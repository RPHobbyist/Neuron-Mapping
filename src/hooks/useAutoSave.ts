import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { get, set, del } from 'idb-keyval';

import { sanitizeUrl, sanitizeImageUrl } from '@/utils/common';
import { sanitizeText } from '@/utils/parsers/parserUtils';

import { MindMapNode, ConnectionStyle, Drawing } from '@/types/mindmap';

const AUTOSAVE_KEY = 'neuron-mapping-autosave';
const AUTOSAVE_DELAY = 2000; // 2 seconds debounce

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
  relations: z.array(z.unknown()).optional(),
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

const AutoSaveSchema = z.object({
  nodes: z.array(NodeSchema),
  connectionStyle: z.string(),
  drawings: z.array(DrawingSchema).optional(),
  lastModified: z.number(),
});

export interface AutoSaveData {
  nodes: MindMapNode[];
  connectionStyle: ConnectionStyle;
  drawings?: Drawing[];
  lastModified: number;
}

// Utility to clear auto-save (call before loading a new template)
export const clearAutoSave = async () => {
  try {
    await del(AUTOSAVE_KEY);
    localStorage.removeItem(AUTOSAVE_KEY); // Clean up legacy data
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
  useEffect(() => {
    const loadData = async () => {
      try {
        let parsed: unknown;
        const idbData = await get(AUTOSAVE_KEY);
        
        if (idbData) {
          parsed = typeof idbData === 'string' ? JSON.parse(idbData) : idbData;
        } else {
          // Fallback to legacy localStorage
          const localData = localStorage.getItem(AUTOSAVE_KEY);
          if (localData) {
            parsed = JSON.parse(localData);
          }
        }

        if (parsed) {
          const data = AutoSaveSchema.parse(parsed) as AutoSaveData;
          if (data.nodes.length > 0) {
            onLoad?.(data);
            toast.info('Restored unsaved session');
          }
        }
      } catch (e) {
        console.error('Failed to validate auto-save data:', e);
      }
    };
    
    loadData();
  }, [onLoad]); // Run once on mount (and if onLoad changes)

  // Tracks the latest not-yet-persisted snapshot so it can be flushed
  // immediately if the tab closes/hides or this hook unmounts before the
  // debounce timer fires below.
  const pendingSaveRef = useRef<AutoSaveData | null>(null);

  // Save to storage on change (debounced)
  useEffect(() => {
    if (nodes.length === 0) return; // Don't save empty state immediately

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

  // Flush any still-pending save when the tab is hidden/closed or this hook
  // truly unmounts. Previously the debounce cleanup above only cancelled the
  // pending timer — closing the tab (or navigating away) within the 2s
  // debounce window silently discarded whatever was edited since the last
  // successful autosave.
  useEffect(() => {
    const flush = () => {
      if (pendingSaveRef.current) {
        const data = pendingSaveRef.current;
        pendingSaveRef.current = null;
        set(AUTOSAVE_KEY, data).catch(e => console.error('AutoSave flush failed:', e));
      }
    };
    // beforeunload can fire moments before the page is torn down, and an
    // in-flight IndexedDB write isn't guaranteed to finish by then — so this
    // path also writes synchronously to localStorage, which the load effect
    // above already reads as a fallback when idb-keyval has nothing.
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
