/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useRef, useState, type RefObject } from 'react';

import { MindMapNode } from '@/types/mindmap';

export interface ScreenBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const nodesInScreenBox = (
  nodes: MindMapNode[],
  box: ScreenBox,
  canvasRect: { left: number; top: number; width: number; height: number },
  pan: { x: number; y: number },
  zoom: number
): Set<string> => {
  const left = (box.x - canvasRect.left - canvasRect.width / 2 - pan.x) / zoom;
  const top = (box.y - canvasRect.top - canvasRect.height / 2 - pan.y) / zoom;
  const right = left + box.w / zoom;
  const bottom = top + box.h / zoom;
  return new Set(nodes
    .filter(node => node.x >= left && node.x <= right && node.y >= top && node.y <= bottom)
    .map(node => node.id));
};

const MIN_BOX_SIZE = 5;

interface SelectionBoxOptions {
  canvasRef: RefObject<HTMLDivElement>;
  pan: { x: number; y: number };
  zoom: number;
  nodes: MindMapNode[];
  onSelect: (ids: Set<string>) => void;
}

export const useSelectionBox = ({ canvasRef, pan, zoom, nodes, onSelect }: SelectionBoxOptions) => {
  const [selectionBox, setSelectionBox] = useState<ScreenBox | null>(null);
  const dragRef = useRef<{ origin: { x: number; y: number }; box: ScreenBox } | null>(null);

  const start = (clientX: number, clientY: number) => {
    dragRef.current = { origin: { x: clientX, y: clientY }, box: { x: clientX, y: clientY, w: 0, h: 0 } };
    setSelectionBox(dragRef.current.box);
  };

  const update = (clientX: number, clientY: number): boolean => {
    const drag = dragRef.current;
    if (!drag) return false;
    drag.box = {
      x: Math.min(clientX, drag.origin.x),
      y: Math.min(clientY, drag.origin.y),
      w: Math.abs(clientX - drag.origin.x),
      h: Math.abs(clientY - drag.origin.y),
    };
    setSelectionBox(drag.box);
    return true;
  };

  const end = () => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setSelectionBox(null);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && (drag.box.w > MIN_BOX_SIZE || drag.box.h > MIN_BOX_SIZE)) {
      const inside = nodesInScreenBox(nodes, drag.box, rect, pan, zoom);
      if (inside.size > 0) onSelect(inside);
    }
  };

  return { selectionBox, start, update, end };
};
