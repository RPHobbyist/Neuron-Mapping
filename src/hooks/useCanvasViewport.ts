/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';

import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from '@/lib/constants';
import { BoxArea, Drawing, MindMapNode, Viewport } from '@/types/mindmap';
import { ContentBounds, getContentBounds } from '@/utils/common';

export const FIT_PADDING = 80;
const REVEAL_MARGIN = 72;

export const clampZoom = (z: number) => Math.min(Math.max(z, MIN_ZOOM), MAX_ZOOM);

const WHEEL_ZOOM_RATE = 0.01;
const WHEEL_LINE_HEIGHT = 16;

export const zoomedAround = (view: Viewport, px: number, py: number, factor: number): Viewport => {
  const zoom = clampZoom(view.zoom * factor);
  if (zoom === view.zoom) return view;
  const scale = zoom / view.zoom;
  return { zoom, x: px - (px - view.x) * scale, y: py - (py - view.y) * scale };
};

export const revealed = (view: Viewport, bounds: ContentBounds, width: number, height: number): Viewport => {
  const shift = (start: number, end: number, size: number) => {
    const half = Math.max(size / 2 - REVEAL_MARGIN, 0);
    if (start < -half || end - start > half * 2) return -half - start;
    return end > half ? half - end : 0;
  };
  const dx = shift(view.x + bounds.minX * view.zoom, view.x + bounds.maxX * view.zoom, width);
  const dy = shift(view.y + bounds.minY * view.zoom, view.y + bounds.maxY * view.zoom, height);
  return dx === 0 && dy === 0 ? view : { ...view, x: view.x + dx, y: view.y + dy };
};

interface ViewportOptions {
  canvasRef: RefObject<HTMLDivElement>;
  contentRef: RefObject<HTMLDivElement>;
  nodes: MindMapNode[];
  drawings: Drawing[];
  boxAreas: BoxArea[];
  is3DMode: boolean;
  initialViewport?: Viewport;
}

export const useCanvasViewport = ({ canvasRef, contentRef, nodes, drawings, boxAreas, is3DMode, initialViewport }: ViewportOptions) => {
  const [viewport, setViewport] = useState<Viewport>(() => (initialViewport
    ? { x: initialViewport.x, y: initialViewport.y, zoom: clampZoom(initialViewport.zoom) }
    : { x: 0, y: 0, zoom: 1 }));
  const { zoom } = viewport;
  const pan = useMemo(() => ({ x: viewport.x, y: viewport.y }), [viewport.x, viewport.y]);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);

  const setZoom = useCallback((next: number) => setViewport(view => ({ ...view, zoom: clampZoom(next) })), []);
  const setPan = useCallback((next: { x: number; y: number }) => setViewport(view => ({ ...view, x: next.x, y: next.y })), []);

  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    if (!contentRef.current) return { x: 0, y: 0 };
    const rect = contentRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom
    };
  }, [contentRef, zoom]);

  const getScreenPos = useCallback((x: number, y: number) => {
    if (is3DMode) {
      return { x: window.innerWidth - 340, y: 96 };
    }
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    return {
      x: rect.left + rect.width / 2 + pan.x + (x * zoom),
      y: rect.top + rect.height / 2 + pan.y + (y * zoom)
    };
  }, [canvasRef, is3DMode, pan, zoom]);

  const fitToScreen = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const bounds = getContentBounds(nodes, drawings, boxAreas);
    if (!rect || !bounds) {
      setViewport({ x: 0, y: 0, zoom: 1 });
      return;
    }
    const { minX, minY, maxX, maxY } = bounds;

    const availW = Math.max(rect.width - FIT_PADDING * 2, 1);
    const availH = Math.max(rect.height - FIT_PADDING * 2, 1);
    const contentW = Math.max(maxX - minX, 1);
    const contentH = Math.max(maxY - minY, 1);
    const nextZoom = clampZoom(Math.min(availW / contentW, availH / contentH, 1));

    setViewport({
      zoom: nextZoom,
      x: -((minX + maxX) / 2) * nextZoom,
      y: -((minY + maxY) / 2) * nextZoom,
    });
  }, [canvasRef, nodes, drawings, boxAreas]);

  const fitOnOpenRef = useRef(!initialViewport);
  useLayoutEffect(() => {
    if (!fitOnOpenRef.current) return;
    fitOnOpenRef.current = false;
    fitToScreen();
  }, [fitToScreen]);

  const reveal = useCallback((bounds: ContentBounds) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) setViewport(view => revealed(view, bounds, rect.width, rect.height));
  }, [canvasRef]);

  const zoomIn = useCallback(() => setViewport(view => zoomedAround(view, 0, 0, ZOOM_STEP)), []);
  const zoomOut = useCallback(() => setViewport(view => zoomedAround(view, 0, 0, 1 / ZOOM_STEP)), []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const onNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      const unit = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? WHEEL_LINE_HEIGHT
        : e.deltaMode === WheelEvent.DOM_DELTA_PAGE ? el.clientHeight
        : 1;
      const dx = e.deltaX * unit;
      const dy = e.deltaY * unit;

      if (e.ctrlKey || e.metaKey) {
        const rect = el.getBoundingClientRect();
        const step = Math.min(Math.abs(dy) * WHEEL_ZOOM_RATE, Math.log(ZOOM_STEP));
        const factor = Math.exp(-Math.sign(dy) * step);
        setViewport(view => zoomedAround(
          view,
          e.clientX - (rect.left + rect.width / 2),
          e.clientY - (rect.top + rect.height / 2),
          factor
        ));
        return;
      }

      const sideways = e.shiftKey && dx === 0;
      setViewport(view => ({ ...view, x: view.x - (sideways ? dy : dx), y: view.y - (sideways ? 0 : dy) }));
    };

    let gestureScale = 1;
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      gestureScale = 1;
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      const { scale, clientX, clientY } = e as Event & { scale: number; clientX: number; clientY: number };
      if (!scale) return;
      const rect = el.getBoundingClientRect();
      const factor = scale / gestureScale;
      gestureScale = scale;
      setViewport(view => zoomedAround(
        view,
        clientX - (rect.left + rect.width / 2),
        clientY - (rect.top + rect.height / 2),
        factor
      ));
    };

    el.addEventListener('wheel', onNativeWheel, { passive: false });
    el.addEventListener('gesturestart', onGestureStart, { passive: false });
    el.addEventListener('gesturechange', onGestureChange, { passive: false });
    return () => {
      el.removeEventListener('wheel', onNativeWheel);
      el.removeEventListener('gesturestart', onGestureStart);
      el.removeEventListener('gesturechange', onGestureChange);
    };
  }, [canvasRef, is3DMode]);

  const startPan = (clientX: number, clientY: number) => {
    panStartRef.current = { x: clientX - pan.x, y: clientY - pan.y };
  };
  const movePan = (clientX: number, clientY: number): boolean => {
    const start = panStartRef.current;
    if (!start) return false;
    setPan({ x: clientX - start.x, y: clientY - start.y });
    return true;
  };
  const endPan = () => {
    panStartRef.current = null;
  };

  return {
    zoom, setZoom, pan, setPan, viewport, screenToCanvas, getScreenPos, fitToScreen, reveal, zoomIn, zoomOut, startPan, movePan, endPan,
  };
};
