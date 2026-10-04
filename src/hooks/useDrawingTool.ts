/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Drawing } from '@/types/mindmap';
import { generateId } from '@/utils/common';
import { eraseDrawingsAt, Point, simplifyPath } from '@/utils/drawing';

export type DrawingMode = 'none' | 'pen' | 'eraser' | 'box';

export interface PenSettings {
  color: string;
  width: number;
}

export const PEN_COLORS = [
  { color: '#ef4444', label: 'Red' },
  { color: '#f97316', label: 'Orange' },
  { color: '#eab308', label: 'Yellow' },
  { color: '#22c55e', label: 'Green' },
  { color: '#3b82f6', label: 'Blue' },
  { color: '#a855f7', label: 'Purple' },
  { color: '#64748b', label: 'Grey' },
];
export const PEN_WIDTHS = [
  { width: 2, label: 'Thin' },
  { width: 3, label: 'Medium' },
  { width: 6, label: 'Thick' },
];
export const DEFAULT_PEN: PenSettings = { color: PEN_COLORS[0].color, width: 3 };
const PEN_STORAGE_KEY = 'neuron-pen';

const loadPen = (): PenSettings => {
  try {
    const stored = JSON.parse(localStorage.getItem(PEN_STORAGE_KEY) ?? 'null');
    const color = PEN_COLORS.find(option => option.color === stored?.color)?.color;
    const width = PEN_WIDTHS.find(option => option.width === stored?.width)?.width;
    return { color: color ?? DEFAULT_PEN.color, width: width ?? DEFAULT_PEN.width };
  } catch {
    return DEFAULT_PEN;
  }
};

const ERASER_RADIUS = 15;
const MIN_BOX_AREA_SIZE = 20;
const STROKE_TOLERANCE = 0.75;

const penCursor = (color: string) =>
  `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color.replace('#', '%23')}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>') 0 24, crosshair`;
const ERASER_CURSOR = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>') 12 12, cell`;

interface DrawingToolOptions {
  zoom: number;
  setDrawings: (update: (prev: Drawing[]) => Drawing[]) => void;
  replaceDrawings: (update: (prev: Drawing[]) => Drawing[]) => void;
  checkpoint: () => void;
  onBoxDrawn: (rect: { x: number; y: number; width: number; height: number }) => void;
}

export const useDrawingTool = ({ zoom, setDrawings, replaceDrawings, checkpoint, onBoxDrawn }: DrawingToolOptions) => {
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('none');
  const [pen, setPenState] = useState<PenSettings>(loadPen);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [boxDraft, setBoxDraft] = useState<{ start: Point; end: Point } | null>(null);
  const gestureRef = useRef<{ path: Point[]; box: { start: Point; end: Point } | null } | null>(null);
  const frameRef = useRef(0);

  const setPen = (changes: Partial<PenSettings>) => {
    const next = { ...pen, ...changes };
    setPenState(next);
    try {
      localStorage.setItem(PEN_STORAGE_KEY, JSON.stringify(next));
    } catch {
    }
  };

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawingMode !== 'none') {
        setDrawingMode('none');
        gestureRef.current = null;
        setCurrentPath([]);
        setBoxDraft(null);
        toast.info(drawingMode === 'box' ? "Exit box area mode" : "Exit drawing mode");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingMode]);

  const eraseAt = (pos: Point) => replaceDrawings(prev => eraseDrawingsAt(prev, pos, ERASER_RADIUS / zoom));

  const start = (pos: Point) => {
    if (drawingMode === 'none') return;
    gestureRef.current = { path: [pos], box: drawingMode === 'box' ? { start: pos, end: pos } : null };
    if (drawingMode === 'pen') {
      setCurrentPath([pos]);
    } else if (drawingMode === 'eraser') {
      checkpoint();
      eraseAt(pos);
    } else if (drawingMode === 'box') {
      setBoxDraft(gestureRef.current.box);
    }
  };

  const move = (pos: Point) => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    if (drawingMode === 'pen') {
      gesture.path.push(pos);
      if (!frameRef.current) {
        frameRef.current = requestAnimationFrame(() => {
          frameRef.current = 0;
          if (gestureRef.current) setCurrentPath([...gestureRef.current.path]);
        });
      }
    } else if (drawingMode === 'eraser') {
      eraseAt(pos);
    } else if (drawingMode === 'box' && gesture.box) {
      gesture.box = { ...gesture.box, end: pos };
      setBoxDraft(gesture.box);
    }
  };

  const end = (): boolean => {
    const gesture = gestureRef.current;
    if (!gesture) return false;
    gestureRef.current = null;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    if (drawingMode === 'pen' && gesture.path.length > 1) {
      const points = simplifyPath(gesture.path, STROKE_TOLERANCE / zoom);
      setDrawings(prev => [...prev, { id: generateId(), points, color: pen.color, width: pen.width }]);
    }
    if (drawingMode === 'box' && gesture.box) {
      const { start: from, end: to } = gesture.box;
      const width = Math.abs(to.x - from.x);
      const height = Math.abs(to.y - from.y);
      if (width >= MIN_BOX_AREA_SIZE && height >= MIN_BOX_AREA_SIZE) {
        onBoxDrawn({ x: Math.min(from.x, to.x), y: Math.min(from.y, to.y), width, height });
        setDrawingMode('none');
      }
      setBoxDraft(null);
    }
    setCurrentPath([]);
    return true;
  };

  const cursor = drawingMode === 'pen' ? penCursor(pen.color) : drawingMode === 'eraser' ? ERASER_CURSOR : drawingMode === 'box' ? 'crosshair' : undefined;

  return { drawingMode, setDrawingMode, currentPath, boxDraft, isActive: drawingMode !== 'none', start, move, end, cursor, pen, setPen };
};
