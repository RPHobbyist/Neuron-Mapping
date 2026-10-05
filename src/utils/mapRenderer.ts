/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import type { LineRouting, ResolvedConnection } from '@/components/mindmap/lineRouting';
import { BoxArea, Drawing, MindMapNode } from '@/types/mindmap';
import { getNodeDimensions, isRootNode } from '@/utils/common';
import { linePatternOf } from '@/utils/lineStyle';
import { getPaletteName } from '@/utils/nodeStyles';
import { Box, SpatialIndex, boxesOverlap } from '@/utils/spatialIndex';

export interface NodeBox extends Box {
    node: MindMapNode;
    order: number;
}

export const toNodeBoxes = (nodes: MindMapNode[]): NodeBox[] => nodes.map((node, order) => {
    const { w, h } = getNodeDimensions(node);
    return { x1: node.x - w / 2, y1: node.y - h / 2, x2: node.x + w / 2, y2: node.y + h / 2, node, order };
});

export interface NodeColors { fill: string; border: string; text: string }

export interface ColorResolver {
    css: (value: string) => string;
    node: (node: MindMapNode) => NodeColors;
    primary: string;
    highlight: string;
}

export const createColorResolver = (element: Element): ColorResolver => {
    const style = getComputedStyle(element);
    const variable = (name: string) => style.getPropertyValue(name).trim();
    const cache = new Map<string, string>();
    const css = (value: string) => {
        if (!value.includes('var(')) return value;
        let resolved = cache.get(value);
        if (resolved === undefined) {
            resolved = value.replace(/var\((--[\w-]+)\)/g, (_, name: string) => variable(name));
            cache.set(value, resolved);
        }
        return resolved;
    };
    const palettes = new Map<string, NodeColors>();
    const node = (n: MindMapNode): NodeColors => {
        if (n.color?.startsWith('#')) return { fill: n.color, border: n.color, text: contrastText(n.color) };
        const palette = getPaletteName(n.color, isRootNode(n));
        let colors = palettes.get(palette);
        if (!colors) {
            colors = {
                fill: `hsl(${variable(`--node-${palette}-bg`)})`,
                border: `hsl(${variable(`--node-${palette}-border`)})`,
                text: `hsl(${variable(`--node-${palette}-text`)})`,
            };
            palettes.set(palette, colors);
        }
        return colors;
    };
    return { css, node, primary: `hsl(${variable('--primary')})`, highlight: '#facc15' };
};

const contrastText = (hex: string): string => {
    const value = hex.replace('#', '');
    const full = value.length === 3 ? value.split('').map(c => c + c).join('') : value.slice(0, 6);
    const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#000000' : '#ffffff';
};

export interface MapView { originX: number; originY: number; scale: number }

export interface DrawMapOptions {
    width: number;
    height: number;
    pixelRatio: number;
    view: MapView;
    nodes: NodeBox[];
    index?: SpatialIndex<NodeBox>;
    routing: LineRouting;
    colors: ColorResolver;
    drawings?: Drawing[];
    boxAreas?: BoxArea[];
    background?: string;
    selectedIds?: ReadonlySet<string>;
    highlightedIds?: ReadonlySet<string>;
    text?: 'always' | 'never' | 'readable';
}

const STROKE = { thin: 1, medium: 2, thick: 4 } as const;
const FONT_SIZE = 14;
const MIN_READABLE_PX = 6;

const pathCache = new WeakMap<ResolvedConnection, Path2D>();
const pathOf = (route: ResolvedConnection): Path2D => {
    let path = pathCache.get(route);
    if (!path) {
        path = new Path2D(route.path);
        pathCache.set(route, path);
    }
    return path;
};

const firstLine = (text: string) => text.split('\n')[0].trim();

export const drawMap = (ctx: CanvasRenderingContext2D, options: DrawMapOptions): void => {
    const { width, height, pixelRatio, view, nodes, index, routing, colors, drawings = [], boxAreas = [], background, selectedIds, highlightedIds, text = 'readable' } = options;
    const { originX, originY, scale } = view;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);
    } else {
        ctx.clearRect(0, 0, width, height);
    }
    ctx.setTransform(pixelRatio * scale, 0, 0, pixelRatio * scale, pixelRatio * originX, pixelRatio * originY);

    const pad = 40 / scale;
    const viewBox: Box = {
        x1: -originX / scale - pad, y1: -originY / scale - pad,
        x2: (width - originX) / scale + pad, y2: (height - originY) / scale + pad,
    };
    const minWidth = 1 / scale;

    boxAreas.forEach((box) => {
        if (!boxesOverlap({ x1: box.x, y1: box.y, x2: box.x + box.width, y2: box.y + box.height }, viewBox)) return;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(box.x, box.y, box.width, box.height, 16);
        else ctx.rect(box.x, box.y, box.width, box.height);
        ctx.fillStyle = box.color;
        ctx.globalAlpha = 0.08;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.lineWidth = Math.max(1.5, minWidth);
        ctx.strokeStyle = box.color;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        if (box.label && FONT_SIZE * scale >= MIN_READABLE_PX) {
            ctx.font = `600 ${FONT_SIZE}px Inter, system-ui, sans-serif`;
            ctx.fillStyle = box.color;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(box.label, box.x + 12, box.y + 10);
        }
    });

    const groups = new Map<string, { color: string; width: number; dashed: boolean; path: Path2D }>();
    routing.connections.forEach((conn) => {
        const route = routing.routes.get(conn.id);
        if (!route || !boxesOverlap(route.box, viewBox)) return;
        const lineWidth = Math.max(STROKE[conn.thickness] ?? 2, minWidth);
        const dashed = linePatternOf(conn.type, conn.pattern) !== 'solid';
        const key = `${conn.color}|${lineWidth}|${dashed}`;
        let group = groups.get(key);
        if (!group) {
            group = { color: colors.css(conn.color), width: lineWidth, dashed, path: new Path2D() };
            groups.set(key, group);
        }
        group.path.addPath(pathOf(route));
    });
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    groups.forEach((group) => {
        ctx.strokeStyle = group.color;
        ctx.lineWidth = group.width;
        ctx.setLineDash(group.dashed ? [8, 4] : []);
        ctx.stroke(group.path);
    });
    ctx.setLineDash([]);

    drawings.forEach((drawing) => {
        if (drawing.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
        drawing.points.slice(1).forEach(point => ctx.lineTo(point.x, point.y));
        ctx.strokeStyle = drawing.color;
        ctx.lineWidth = Math.max(drawing.width ?? 3, minWidth);
        ctx.stroke();
    });

    const inView = index ? index.query(viewBox).sort((a, b) => a.order - b.order) : nodes.filter(box => boxesOverlap(box, viewBox));
    const showText = text === 'always' || (text === 'readable' && FONT_SIZE * scale >= MIN_READABLE_PX);
    ctx.font = `500 ${FONT_SIZE}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    inView.forEach(({ node, x1, y1, x2, y2 }) => {
        const w = x2 - x1;
        const h = y2 - y1;
        const nodeColors = colors.node(node);
        const isCircle = node.shape === 'circle' || (!node.shape && isRootNode(node));
        const radius = isCircle ? Math.min(w, h) / 2 : node.shape === 'pill' ? h / 2 : node.shape === 'rectangle' ? 2 : 12;

        ctx.beginPath();
        if (isCircle) ctx.ellipse(node.x, node.y, w / 2, h / 2, 0, 0, Math.PI * 2);
        else if (ctx.roundRect) ctx.roundRect(x1, y1, w, h, radius);
        else ctx.rect(x1, y1, w, h);
        ctx.fillStyle = nodeColors.fill;
        ctx.fill();
        ctx.lineWidth = Math.max(1, minWidth);
        ctx.strokeStyle = nodeColors.border;
        ctx.stroke();

        const ring = selectedIds?.has(node.id) ? colors.primary : highlightedIds?.has(node.id) ? colors.highlight : null;
        if (ring) {
            ctx.lineWidth = Math.max(3, 3 * minWidth);
            ctx.strokeStyle = ring;
            ctx.stroke();
        }

        if (showText) {
            const label = firstLine(node.text);
            if (!label) return;
            const fits = Math.max(1, Math.floor((w - 16) / (FONT_SIZE * 0.55)));
            ctx.fillStyle = nodeColors.text;
            ctx.fillText(label.length > fits ? `${label.slice(0, Math.max(1, fits - 1))}…` : label, node.x, node.y);
        }
    });
};
