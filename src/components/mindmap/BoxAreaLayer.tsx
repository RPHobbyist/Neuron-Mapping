/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState, useRef, useEffect, memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { BoxArea, MindMapNode } from '@/types/mindmap';
import { cn, isComposing } from '@/lib/utils';
import { boxContainsPoint, releaseTextFocus } from '@/utils/common';
import { BOX_AREA_COLORS, BOX_AREA_MIN_WIDTH, BOX_AREA_MIN_HEIGHT, BOX_AREA_DEFAULT_LABEL } from '@/lib/constants';

const DRAG_THRESHOLD = 3;
const LABEL_MAX_LENGTH = 60;

const darkenHex = (hex: string, amount: number): string => {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return '#1f2937';
  const channel = (i: number) => Math.round(parseInt(full.slice(i, i + 2), 16) * (1 - amount))
    .toString(16).padStart(2, '0');
  return `#${channel(0)}${channel(2)}${channel(4)}`;
};

type Corner = 'nw' | 'ne' | 'sw' | 'se';
type Point = { x: number; y: number };

export interface BoxAreaMoveStart {
  boxes: Map<string, Point>;
  nodes: Map<string, Point>;
}

const containsBox = (outer: BoxArea, inner: BoxArea) =>
  inner.x >= outer.x && inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height;

const trackDrag = (
  e: React.MouseEvent,
  zoom: number,
  onStart: () => void,
  onMove: (dx: number, dy: number) => void
) => {
  const startX = e.clientX;
  const startY = e.clientY;
  let didDrag = false;

  const handleMove = (moveEvent: MouseEvent) => {
    const totalX = moveEvent.clientX - startX;
    const totalY = moveEvent.clientY - startY;
    if (!didDrag) {
      if (Math.hypot(totalX, totalY) < DRAG_THRESHOLD) return;
      didDrag = true;
      onStart();
    }
    onMove(totalX / zoom, totalY / zoom);
  };

  const handleUp = () => {
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('mouseup', handleUp);
  };

  document.addEventListener('mousemove', handleMove);
  document.addEventListener('mouseup', handleUp);
};

interface BoxAreaItemProps {
  box: BoxArea;
  boxAreas: BoxArea[];
  nodes: MindMapNode[];
  zoom: number;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: (id: string) => void;
  onStartEdit: (id: string) => void;
  onEndEdit: () => void;
  onRename: (id: string, label: string) => void;
  onDragStart: (movingNodeIds?: Iterable<string>) => void;
  onMove: (dx: number, dy: number, start: BoxAreaMoveStart) => void;
  onResize: (id: string, rect: Pick<BoxArea, 'x' | 'y' | 'width' | 'height'>) => void;
}

const BoxAreaItem = memo(({
  box,
  boxAreas,
  nodes,
  zoom,
  isSelected,
  isEditing,
  onSelect,
  onStartEdit,
  onEndEdit,
  onRename,
  onDragStart,
  onMove,
  onResize,
}: BoxAreaItemProps) => {
  const [draft, setDraft] = useState(box.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setDraft(box.label);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [isEditing, box.label]);

  const commitLabel = () => {
    const label = draft.trim() || BOX_AREA_DEFAULT_LABEL;
    if (label !== box.label) onRename(box.id, label);
    onEndEdit();
  };

  const handleMoveMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || isEditing) return;
    e.stopPropagation();
    e.preventDefault();
    releaseTextFocus();
    onSelect(box.id);

    const start: BoxAreaMoveStart = { boxes: new Map([[box.id, { x: box.x, y: box.y }]]), nodes: new Map() };
    boxAreas.forEach(b => {
      if (b.id !== box.id && containsBox(box, b)) start.boxes.set(b.id, { x: b.x, y: b.y });
    });
    nodes.forEach(n => {
      if (boxContainsPoint(box, n.x, n.y)) start.nodes.set(n.id, { x: n.x, y: n.y });
    });

    trackDrag(e, zoom, () => onDragStart(start.nodes.keys()), (dx, dy) => onMove(dx, dy, start));
  };

  const handleResizeMouseDown = (corner: Corner) => (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const start = { x: box.x, y: box.y, width: box.width, height: box.height };

    trackDrag(e, zoom, () => onDragStart(), (dx, dy) => {
      let { x, y, width, height } = start;
      if (corner.includes('e')) width = Math.max(BOX_AREA_MIN_WIDTH, start.width + dx);
      if (corner.includes('w')) {
        width = Math.max(BOX_AREA_MIN_WIDTH, start.width - dx);
        x = start.x + start.width - width;
      }
      if (corner.includes('s')) height = Math.max(BOX_AREA_MIN_HEIGHT, start.height + dy);
      if (corner.includes('n')) {
        height = Math.max(BOX_AREA_MIN_HEIGHT, start.height - dy);
        y = start.y + start.height - height;
      }
      onResize(box.id, { x, y, width, height });
    });
  };

  const borderWidth = Math.max(1.5, 1.5 / zoom);
  const hitSize = 10 / zoom;
  const handleSize = 10 / zoom;
  const labelColor = darkenHex(box.color, 0.5);

  const edges: { key: string; style: React.CSSProperties }[] = [
    { key: 'top', style: { left: 0, right: 0, top: -hitSize / 2, height: hitSize } },
    { key: 'bottom', style: { left: 0, right: 0, bottom: -hitSize / 2, height: hitSize } },
    { key: 'left', style: { top: 0, bottom: 0, left: -hitSize / 2, width: hitSize } },
    { key: 'right', style: { top: 0, bottom: 0, right: -hitSize / 2, width: hitSize } },
  ];

  const corners: { corner: Corner; style: React.CSSProperties; cursor: string }[] = [
    { corner: 'nw', style: { left: -handleSize / 2, top: -handleSize / 2 }, cursor: 'nwse-resize' },
    { corner: 'ne', style: { right: -handleSize / 2, top: -handleSize / 2 }, cursor: 'nesw-resize' },
    { corner: 'sw', style: { left: -handleSize / 2, bottom: -handleSize / 2 }, cursor: 'nesw-resize' },
    { corner: 'se', style: { right: -handleSize / 2, bottom: -handleSize / 2 }, cursor: 'nwse-resize' },
  ];

  return (
    <div
      className="absolute rounded-2xl pointer-events-none"
      style={{
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
        border: `${borderWidth}px solid ${isSelected ? box.color : `${box.color}99`}`,
        backgroundColor: `${box.color}10`,
        boxShadow: isSelected ? `0 0 0 ${3 / zoom}px ${box.color}33` : undefined,
      }}
    >
      {edges.map(edge => (
        <div
          key={edge.key}
          className="absolute pointer-events-auto cursor-move"
          style={edge.style}
          onMouseDown={handleMoveMouseDown}
        />
      ))}

      <div
        className="absolute left-3 top-3 max-w-[calc(100%-24px)] pointer-events-auto rounded-lg px-2.5 py-1 text-[13px] font-semibold select-none cursor-move"
        style={{ backgroundColor: `${box.color}26`, color: labelColor }}
        onMouseDown={handleMoveMouseDown}
        onDoubleClick={(e) => { e.stopPropagation(); onStartEdit(box.id); }}
        title="Drag to move, double-click to rename"
      >
        {isEditing ? (
          <input
            ref={inputRef}
            value={draft}
            maxLength={LABEL_MAX_LENGTH}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => {
              if (isComposing(e)) return;
              if (e.key === 'Enter') { e.preventDefault(); commitLabel(); }
              else if (e.key === 'Escape') { e.preventDefault(); onEndEdit(); }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="bg-transparent outline-none border-none p-0 m-0 font-semibold text-[13px] placeholder:opacity-60"
            style={{ color: labelColor, width: `${Math.max(draft.length, 6) + 1}ch` }}
            placeholder={BOX_AREA_DEFAULT_LABEL}
          />
        ) : (
          <span className="block truncate whitespace-nowrap">{box.label}</span>
        )}
      </div>

      {isSelected && corners.map(({ corner, style, cursor }) => (
        <div
          key={corner}
          className="absolute pointer-events-auto bg-card rounded-sm"
          style={{
            ...style,
            width: handleSize,
            height: handleSize,
            border: `${borderWidth}px solid ${box.color}`,
            cursor,
          }}
          onMouseDown={handleResizeMouseDown(corner)}
        />
      ))}
    </div>
  );
});

BoxAreaItem.displayName = 'BoxAreaItem';

interface BoxAreaLayerProps {
  boxAreas: BoxArea[];
  nodes: MindMapNode[];
  zoom: number;
  selectedId: string | null;
  editingId: string | null;
  onSelect: (id: string) => void;
  onStartEdit: (id: string) => void;
  onEndEdit: () => void;
  onRename: (id: string, label: string) => void;
  onDragStart: (movingNodeIds?: Iterable<string>) => void;
  onMove: (dx: number, dy: number, start: BoxAreaMoveStart) => void;
  onResize: (id: string, rect: Pick<BoxArea, 'x' | 'y' | 'width' | 'height'>) => void;
}

export const BoxAreaLayer = ({ boxAreas, selectedId, editingId, ...rest }: BoxAreaLayerProps) => {
  const ordered = [...boxAreas].sort((a, b) => b.width * b.height - a.width * a.height);

  return (
    <>
      {ordered.map(box => (
        <BoxAreaItem
          key={box.id}
          box={box}
          boxAreas={boxAreas}
          isSelected={box.id === selectedId}
          isEditing={box.id === editingId}
          {...rest}
        />
      ))}
    </>
  );
};

interface BoxAreaToolbarProps {
  box: BoxArea;
  position: Point;
  onColorChange: (color: string) => void;
  onColorChangeLive: (color: string) => void;
  onLiveEditStart: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export const BoxAreaToolbar = ({ box, position, onColorChange, onColorChangeLive, onLiveEditStart, onRename, onDelete }: BoxAreaToolbarProps) => (
  <div
    className="fixed z-50 flex items-center gap-1 bg-card/95 backdrop-blur-sm border rounded-lg shadow-lg px-2 py-1.5"
    style={{ left: position.x, top: Math.max(position.y - 8, 104), transform: 'translate(-100%, -100%)' }}
    onMouseDown={(e) => e.stopPropagation()}
  >
    {BOX_AREA_COLORS.map(color => (
      <button
        key={color}
        onClick={() => onColorChange(color)}
        className={cn(
          "w-5 h-5 rounded-full border transition-transform hover:scale-110",
          box.color === color ? 'border-primary ring-2 ring-primary/30 ring-offset-1' : 'border-transparent ring-1 ring-border'
        )}
        style={{ backgroundColor: color }}
        title={color}
      />
    ))}
    <div className="relative">
      <input
        id="box-area-color-custom"
        name="box-area-color-custom"
        type="color"
        value={box.color}
        onPointerDown={onLiveEditStart}
        onFocus={onLiveEditStart}
        onChange={(e) => onColorChangeLive(e.target.value)}
        className="w-5 h-5 rounded-full cursor-pointer opacity-0 absolute inset-0"
        title="Custom color"
      />
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 via-green-500 to-blue-500 border border-border" />
    </div>
    <div className="w-px h-5 bg-border mx-1" />
    <button
      onClick={onRename}
      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      title="Rename box area"
    >
      <Pencil className="w-3.5 h-3.5" />
    </button>
    <button
      onClick={onDelete}
      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
      title="Delete box area (Del)"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  </div>
);
