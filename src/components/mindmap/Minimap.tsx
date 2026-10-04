/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { memo, useEffect, useMemo, useRef } from 'react';

import { MindMapNode } from '@/types/mindmap';
import { getNodeDimensions } from '@/utils/common';

export interface MapRect {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

interface MinimapProps {
    nodes: MindMapNode[];
    view: MapRect;
    onCenterOn: (x: number, y: number) => void;
}

const WIDTH = 184;
const HEIGHT = 124;
const PADDING = 6;

interface NodeRect extends MapRect { isRoot: boolean }

const union = (a: MapRect, b: MapRect): MapRect => ({
    minX: Math.min(a.minX, b.minX), minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX), maxY: Math.max(a.maxY, b.maxY),
});

export const Minimap = memo(({ nodes, view, onCenterOn }: MinimapProps) => {
    const rects = useMemo(() => nodes.map((node): NodeRect => {
        const { w, h } = getNodeDimensions(node);
        return { isRoot: node.parentId === null, minX: node.x - w / 2, minY: node.y - h / 2, maxX: node.x + w / 2, maxY: node.y + h / 2 };
    }), [nodes]);
    const nodeBounds = useMemo(() => rects.reduce<MapRect | null>((all, r) => (all ? union(all, r) : r), null), [rects]);
    const bounds = nodeBounds ? union(nodeBounds, view) : view;

    const dragBoundsRef = useRef<MapRect | null>(null);
    const frame = dragBoundsRef.current ?? bounds;
    const scale = Math.min(
        (WIDTH - PADDING * 2) / Math.max(frame.maxX - frame.minX, 1),
        (HEIGHT - PADDING * 2) / Math.max(frame.maxY - frame.minY, 1)
    );
    const offsetX = (WIDTH - (frame.maxX - frame.minX) * scale) / 2;
    const offsetY = (HEIGHT - (frame.maxY - frame.minY) * scale) / 2;
    const toX = (x: number) => offsetX + (x - frame.minX) * scale;
    const toY = (y: number) => offsetY + (y - frame.minY) * scale;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        const ratio = window.devicePixelRatio || 1;
        if (canvas.width !== WIDTH * ratio) {
            canvas.width = WIDTH * ratio;
            canvas.height = HEIGHT * ratio;
        }
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = getComputedStyle(canvas).color;
        [false, true].forEach((rootPass) => {
            ctx.globalAlpha = rootPass ? 0.7 : 0.35;
            rects.forEach((r) => {
                if (r.isRoot !== rootPass) return;
                ctx.fillRect(
                    offsetX + (r.minX - frame.minX) * scale,
                    offsetY + (r.minY - frame.minY) * scale,
                    Math.max((r.maxX - r.minX) * scale, 1.5),
                    Math.max((r.maxY - r.minY) * scale, 1.5)
                );
            });
        });
        ctx.globalAlpha = 1;
    }, [rects, frame.minX, frame.minY, scale, offsetX, offsetY]);

    const centerAt = (e: React.PointerEvent<SVGSVGElement>) => {
        const box = e.currentTarget.getBoundingClientRect();
        onCenterOn(
            frame.minX + (e.clientX - box.left - offsetX) / scale,
            frame.minY + (e.clientY - box.top - offsetY) / scale
        );
    };

    return (
        <div
            className="relative rounded-lg border border-border/60 bg-card/90 backdrop-blur-sm shadow-sm text-foreground overflow-hidden"
            style={{ width: WIDTH, height: HEIGHT }}
        >
            <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0" style={{ width: WIDTH, height: HEIGHT }} />
            <svg
                data-testid="minimap"
                width={WIDTH}
                height={HEIGHT}
                className="relative block cursor-pointer touch-none"
                role="img"
                aria-label="Map overview. Press or drag to move the view."
                onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    dragBoundsRef.current = bounds;
                    centerAt(e);
                }}
                onPointerMove={(e) => { if (dragBoundsRef.current) centerAt(e); }}
                onPointerUp={() => { dragBoundsRef.current = null; }}
                onPointerCancel={() => { dragBoundsRef.current = null; }}
            >
                <rect
                    data-testid="minimap-view"
                    x={toX(view.minX)}
                    y={toY(view.minY)}
                    width={(view.maxX - view.minX) * scale}
                    height={(view.maxY - view.minY) * scale}
                    fill="hsl(var(--primary))"
                    fillOpacity={0.08}
                    stroke="hsl(var(--primary))"
                    strokeWidth={1.5}
                    rx={2}
                />
            </svg>
        </div>
    );
});
Minimap.displayName = 'Minimap';
