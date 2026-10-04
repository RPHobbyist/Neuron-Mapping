/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { memo, useEffect, useRef } from 'react';

import type { LineRouting } from './lineRouting';
import { releaseTextFocus } from '@/utils/common';
import { ColorResolver, NodeBox, drawMap } from '@/utils/mapRenderer';
import { SpatialIndex } from '@/utils/spatialIndex';

interface CanvasOverviewLayerProps {
    width: number;
    height: number;
    pan: { x: number; y: number };
    zoom: number;
    nodes: NodeBox[];
    index: SpatialIndex<NodeBox>;
    routing: LineRouting;
    getColors: () => ColorResolver;
    themeKey: string;
    selectedIds: ReadonlySet<string>;
    highlightedIds: ReadonlySet<string>;
    onSelect: (e: React.MouseEvent, id: string) => void;
    onDragStart: (id: string) => void;
    onPositionChange: (id: string, x: number, y: number) => void;
    onDragEnd: () => void;
    onOpenNode: (id: string) => void;
}

const DRAG_THRESHOLD = 3;

export const CanvasOverviewLayer = memo(({
    width, height, pan, zoom, nodes, index, routing, getColors, themeKey, selectedIds, highlightedIds,
    onSelect, onDragStart, onPositionChange, onDragEnd, onOpenNode,
}: CanvasOverviewLayerProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        frameRef.current = requestAnimationFrame(() => {
            frameRef.current = null;
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!canvas || !ctx) return;
            const pixelRatio = window.devicePixelRatio || 1;
            if (canvas.width !== Math.round(width * pixelRatio) || canvas.height !== Math.round(height * pixelRatio)) {
                canvas.width = Math.round(width * pixelRatio);
                canvas.height = Math.round(height * pixelRatio);
            }
            drawMap(ctx, {
                width, height, pixelRatio,
                view: { originX: width / 2 + pan.x, originY: height / 2 + pan.y, scale: zoom },
                nodes, index, routing,
                colors: getColors(),
                selectedIds, highlightedIds,
            });
        });
        return () => {
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        };
    }, [width, height, pan, zoom, nodes, index, routing, getColors, themeKey, selectedIds, highlightedIds]);

    const toMap = (e: { clientX: number; clientY: number }) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - width / 2 - pan.x) / zoom,
            y: (e.clientY - rect.top - height / 2 - pan.y) / zoom,
        };
    };

    const nodeAt = (e: { clientX: number; clientY: number }) => {
        const { x, y } = toMap(e);
        const hits = index.query({ x1: x, y1: y, x2: x, y2: y });
        return hits.length === 0 ? null : hits.reduce((top, box) => (box.order > top.order ? box : top)).node;
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (e.button !== 0) return;
        const node = nodeAt(e);
        if (!node) return;
        e.stopPropagation();
        e.preventDefault();
        releaseTextFocus();
        const start = { x: e.clientX, y: e.clientY, nodeX: node.x, nodeY: node.y };
        let dragging = false;
        const handleMove = (move: MouseEvent) => {
            const dx = move.clientX - start.x;
            const dy = move.clientY - start.y;
            if (!dragging) {
                if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
                dragging = true;
                onDragStart(node.id);
            }
            onPositionChange(node.id, start.nodeX + dx / zoom, start.nodeY + dy / zoom);
        };
        const handleUp = () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            if (dragging) onDragEnd();
            else onSelect(e, node.id);
        };
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
    };

    return (
        <canvas
            ref={canvasRef}
            data-testid="overview-layer"
            aria-label="Map overview. Zoom in to edit topics."
            className="canvas-area absolute inset-0"
            style={{ width, height }}
            onMouseDown={handleMouseDown}
            onMouseMove={(e) => { e.currentTarget.style.cursor = nodeAt(e) ? 'pointer' : ''; }}
            onDoubleClick={(e) => {
                const node = nodeAt(e);
                if (node) onOpenNode(node.id);
            }}
        />
    );
});
CanvasOverviewLayer.displayName = 'CanvasOverviewLayer';
