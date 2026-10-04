/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { MindMapNode } from '@/types/mindmap';
import { IRREGULAR_SHAPE_PATHS, SHAPE_SVG_INSET } from '@/utils/shapePaths';
import { getNodeDimensions, isRootNode } from '@/utils/common';

export function isCircle(node: MindMapNode): boolean {
  return node.shape === 'circle' || (!node.shape && isRootNode(node));
}

export interface Point { x: number; y: number }

const PATH_SAMPLE_CACHE = new Map<string, Point[]>();

export function samplePath(path: string, cache = true): Point[] {
  const cached = PATH_SAMPLE_CACHE.get(path);
  if (cached) return cached;

  const points: Point[] = [];
  let cur: Point = { x: 0, y: 0 };
  const STEPS = 12;

  const commands = path.match(/[MLQCZ][^MLQCZ]*/gi) || [];
  for (const cmd of commands) {
    const type = cmd[0];
    const nums = (cmd.slice(1).match(/-?\d*\.?\d+/g) || []).map(Number);

    if (type === 'M' || type === 'L') {
      cur = { x: nums[0], y: nums[1] };
      points.push(cur);
    } else if (type === 'Q') {
      const p1 = { x: nums[0], y: nums[1] };
      const p2 = { x: nums[2], y: nums[3] };
      for (let i = 1; i <= STEPS; i++) {
        const t = i / STEPS;
        const mt = 1 - t;
        points.push({
          x: mt * mt * cur.x + 2 * mt * t * p1.x + t * t * p2.x,
          y: mt * mt * cur.y + 2 * mt * t * p1.y + t * t * p2.y,
        });
      }
      cur = p2;
    } else if (type === 'C') {
      const p1 = { x: nums[0], y: nums[1] };
      const p2 = { x: nums[2], y: nums[3] };
      const p3 = { x: nums[4], y: nums[5] };
      for (let i = 1; i <= STEPS; i++) {
        const t = i / STEPS;
        const mt = 1 - t;
        points.push({
          x: mt * mt * mt * cur.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
          y: mt * mt * mt * cur.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
        });
      }
      cur = p3;
    }
  }

  if (cache) PATH_SAMPLE_CACHE.set(path, points);
  return points;
}

function toRealPolygon(samples: Point[], w: number, h: number): Point[] {
  const inset = SHAPE_SVG_INSET;
  return samples.map(p => ({
    x: (p.x / 100 - 0.5) * w + (p.x / 100) * 2 * inset - inset,
    y: (p.y / 100 - 0.5) * h + (p.y / 100) * 2 * inset - inset,
  }));
}

export function getShapePolygon(shape: string | undefined, w: number, h: number): Point[] | null {
  if (shape && shape in IRREGULAR_SHAPE_PATHS) {
    return toRealPolygon(samplePath(IRREGULAR_SHAPE_PATHS[shape]), w, h);
  }

  if (shape === 'parallelogram') {
    const halfW = w / 2;
    const halfH = h / 2;
    const shift = halfH * Math.tan(10 * Math.PI / 180);
    return [
      { x: -halfW + shift, y: -halfH },
      { x: halfW + shift, y: -halfH },
      { x: halfW - shift, y: halfH },
      { x: -halfW - shift, y: halfH },
    ];
  }

  return null;
}

export function polygonRayIntersection(dx: number, dy: number, poly: Point[]): Point | null {
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ex = b.x - a.x;
    const ey = b.y - a.y;

    const denom = -dx * ey + dy * ex;
    if (Math.abs(denom) < 1e-9) continue;

    const t = (-a.x * ey + a.y * ex) / denom;
    const s = (dx * a.y - dy * a.x) / denom;

    if (t > 0 && s >= 0 && s <= 1) {
      return { x: t * dx, y: t * dy };
    }
  }
  return null;
}

export function getEdgePoint(node: MindMapNode, target: { x: number; y: number }): { x: number; y: number } {
  const { w, h } = getNodeDimensions(node);
  const cx = node.x;
  const cy = node.y;
  const dx = target.x - cx;
  const dy = target.y - cy;

  if (dx === 0 && dy === 0) return { x: cx, y: cy };

  if (isCircle(node)) {
    const angle = Math.atan2(dy, dx);
    const radius = w / 2;
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius
    };
  }

  const halfW = w / 2;
  const halfH = h / 2;

  const poly = getShapePolygon(node.shape, w, h);
  if (poly) {
    const hit = polygonRayIntersection(dx, dy, poly);
    if (hit) return { x: cx + hit.x, y: cy + hit.y };
  }

  const scaleX = halfW / Math.abs(dx);
  const scaleY = halfH / Math.abs(dy);

  const scale = Math.min(scaleX, scaleY);

  return {
    x: cx + dx * scale,
    y: cy + dy * scale
  };
}
