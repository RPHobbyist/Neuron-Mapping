import { useEffect, useCallback } from 'react';
import { MindMapNode, ConnectionStyle, Drawing } from '@/types/mindmap';
import { toast } from 'sonner';
import { z } from 'zod';
import { sanitizeUrl } from '@/utils/common';

const AUTOSAVE_KEY = 'neuron-mapping-autosave';
const AUTOSAVE_DELAY = 2000; // 2 seconds debounce

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
  relations: z.array(z.unknown()).optional(),
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
export const clearAutoSave = () => {
  localStorage.removeItem(AUTOSAVE_KEY);
};

export const useAutoSave = (
  nodes: MindMapNode[],
  connectionStyle: ConnectionStyle = 'curved',
  drawings: Drawing[] = [],
  onLoad?: (data: AutoSaveData) => void
) => {
  // Load from storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const data = AutoSaveSchema.parse(parsed) as AutoSaveData;

        if (data.nodes.length > 0) {
          onLoad?.(data);
          toast.info('Restored unsaved session');
        }
      } catch (e) {
        console.error('Failed to validate auto-save data:', e);
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
    }, AUTOSAVE_DELAY);

    return () => clearTimeout(handler);
  }, [nodes, connectionStyle, drawings]);

  return { clearAutoSave };
};
