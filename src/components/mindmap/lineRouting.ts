/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useMemo, useRef } from 'react';

import { MindMapNode, ConnectionStyle, LineThickness, Side } from '@/types/mindmap';
import { DEFAULT_RELATION_TYPE, DEFAULT_RELATION_COLOR } from '@/lib/constants';
import { getAutoConnectionSides, getNodeDimensions, clamp } from '@/utils/common';
import { Point, isCircle, samplePath, getShapePolygon, polygonRayIntersection } from '@/utils/nodeOutline';
import { Box, SpatialIndex, boxesOverlap } from '@/utils/spatialIndex';

function coerceSide(v: unknown): Side | undefined {
  return v === 'left' || v === 'right' || v === 'top' || v === 'bottom' ? v : undefined;
}

const getSides = getAutoConnectionSides;

export function getAnchor(node: MindMapNode, side: Side): { x: number; y: number; side: Side } {
  const { w, h } = getNodeDimensions(node);
  const hw = w / 2;
  const hh = h / 2;

  if (!isCircle(node)) {
    const poly = getShapePolygon(node.shape, w, h);
    if (poly) {
      const dir = side === 'left' ? { x: -1, y: 0 }
        : side === 'right' ? { x: 1, y: 0 }
        : side === 'top' ? { x: 0, y: -1 }
        : { x: 0, y: 1 };
      const hit = polygonRayIntersection(dir.x, dir.y, poly);
      if (hit) return { x: node.x + hit.x, y: node.y + hit.y, side };
    }
  }

  switch (side) {
    case 'left': return { x: node.x - hw, y: node.y, side };
    case 'right': return { x: node.x + hw, y: node.y, side };
    case 'top': return { x: node.x, y: node.y - hh, side };
    case 'bottom': return { x: node.x, y: node.y + hh, side };
  }
}


export interface Anchor { x: number; y: number; side: Side }

const SIDE_DIR: Record<Side, Point> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
};

const isHorizontalSide = (side: Side) => side === 'left' || side === 'right';

const fmt = (n: number) => Math.round(n * 100) / 100;

const MIN_HANDLE = 24;

function handleLength(from: Anchor, to: Point, t: number): number {
  const dir = SIDE_DIR[from.side];
  const ahead = (to.x - from.x) * dir.x + (to.y - from.y) * dir.y;
  if (ahead < 0) return 6 * Math.sqrt(-ahead) + MIN_HANDLE;
  const minimum = Math.min(MIN_HANDLE, Math.hypot(to.x - from.x, to.y - from.y) / 3);
  return Math.max(ahead * t, minimum);
}

interface Route { path: string; mid: Point; controls?: Point[]; points?: Point[]; query?: Box }

function curved(a: Anchor, b: Anchor, t: number): Route {
  const da = SIDE_DIR[a.side];
  const db = SIDE_DIR[b.side];
  const la = handleLength(a, b, t);
  const lb = handleLength(b, a, t);
  const c1 = { x: a.x + da.x * la, y: a.y + da.y * la };
  const c2 = { x: b.x + db.x * lb, y: b.y + db.y * lb };
  return {
    path: `M ${fmt(a.x)} ${fmt(a.y)} C ${fmt(c1.x)} ${fmt(c1.y)}, ${fmt(c2.x)} ${fmt(c2.y)}, ${fmt(b.x)} ${fmt(b.y)}`,
    mid: { x: (a.x + 3 * c1.x + 3 * c2.x + b.x) / 8, y: (a.y + 3 * c1.y + 3 * c2.y + b.y) / 8 },
    controls: [c1, c2],
  };
}

interface Rect { x1: number; y1: number; x2: number; y2: number; id?: string }

type IgnoredIds = readonly [string, string];

interface LaneAdjustment { split: number; rank: number; count: number }

const OBSTACLE_CLEARANCE = 14;
const LANE_SPACING = 18;
const MAX_GROUP_SPREAD = 96;
const MIN_LEG = 18;
const OBSTACLE_LANE_NUDGE = 6;
const ELBOW_STUB = 20;
const ELBOW_RADIUS = 10;

function getNodeRect(node: MindMapNode): Rect {
  const { w, h } = getNodeDimensions(node);
  return { x1: node.x - w / 2, y1: node.y - h / 2, x2: node.x + w / 2, y2: node.y + h / 2, id: node.id };
}

function avoidVerticalX(x: number, yLo: number, yHi: number, obstacles: Rect[], laneNudge = 0, ignore?: IgnoredIds): number {
  let left = Infinity, right = -Infinity, hit = false;
  for (const r of obstacles) {
    if (ignore && (r.id === ignore[0] || r.id === ignore[1])) continue;
    if (x > r.x1 && x < r.x2 && yHi > r.y1 && yLo < r.y2) {
      hit = true;
      left = Math.min(left, r.x1);
      right = Math.max(right, r.x2);
    }
  }
  if (!hit) return x;
  const leftX = left - OBSTACLE_CLEARANCE;
  const rightX = right + OBSTACLE_CLEARANCE;
  return (Math.abs(x - leftX) <= Math.abs(x - rightX) ? leftX : rightX) + laneNudge;
}

type ObstacleFinder = (box: Box) => Rect[];

function laneNudgeFor(lane: LaneAdjustment | undefined): number {
  if (!lane || lane.count <= 1) return 0;
  return (lane.rank - (lane.count - 1) / 2) * OBSTACLE_LANE_NUDGE;
}

const flipPoint = (p: Point): Point => ({ x: p.y, y: p.x });
const flipRect = (r: Rect): Rect => ({ x1: r.y1, y1: r.x1, x2: r.y2, y2: r.x2, id: r.id });
const FLIP_SIDE: Record<Side, Side> = { left: 'top', right: 'bottom', top: 'left', bottom: 'right' };
const flipAnchor = (a: Anchor): Anchor => ({ ...flipPoint(a), side: FLIP_SIDE[a.side] });

interface Elbow { points: Point[]; query?: Box }

function horizontalElbow(a: Anchor, b: Anchor, pRect: Rect, cRect: Rect, t: number, findObstacles: ObstacleFinder, lane?: LaneAdjustment, ignore?: IgnoredIds): Elbow {
  const da = SIDE_DIR[a.side].x;
  const db = SIDE_DIR[b.side].x;
  const aOut = { x: a.x + da * ELBOW_STUB, y: a.y };
  const bOut = { x: b.x + db * ELBOW_STUB, y: b.y };

  if ((bOut.x - aOut.x) * da >= 0 && (aOut.x - bOut.x) * db >= 0) {
    const rawMx = lane ? lane.split : a.x + (b.x - a.x) * t;
    const yLo = Math.min(a.y, b.y), yHi = Math.max(a.y, b.y);
    const query = { x1: rawMx, y1: yLo, x2: rawMx, y2: yHi };
    const mx = avoidVerticalX(rawMx, yLo, yHi, findObstacles(query), laneNudgeFor(lane), ignore);
    return { points: [a, { x: mx, y: a.y }, { x: mx, y: b.y }, b], query };
  }

  if (da === db) {
    const x = da > 0 ? Math.max(aOut.x, bOut.x) : Math.min(aOut.x, bOut.x);
    return { points: [a, { x, y: a.y }, { x, y: b.y }, b] };
  }

  let crossY: number;
  if (cRect.y1 - pRect.y2 >= ELBOW_STUB) crossY = (pRect.y2 + cRect.y1) / 2;
  else if (pRect.y1 - cRect.y2 >= ELBOW_STUB) crossY = (cRect.y2 + pRect.y1) / 2;
  else {
    const above = Math.min(pRect.y1, cRect.y1) - ELBOW_STUB;
    const below = Math.max(pRect.y2, cRect.y2) + ELBOW_STUB;
    const middle = (a.y + b.y) / 2;
    crossY = Math.abs(middle - above) <= Math.abs(middle - below) ? above : below;
  }
  return { points: [a, aOut, { x: aOut.x, y: crossY }, { x: bOut.x, y: crossY }, bOut, b] };
}

function mixedElbow(h: Anchor, v: Anchor): Point[] {
  const dh = SIDE_DIR[h.side].x;
  const dv = SIDE_DIR[v.side].y;
  if ((v.x - h.x) * dh > 0 && (h.y - v.y) * dv > 0) return [h, { x: v.x, y: h.y }, v];
  const hOut = { x: h.x + dh * ELBOW_STUB, y: h.y };
  const vOut = { x: v.x, y: v.y + dv * ELBOW_STUB };
  return [h, hOut, { x: hOut.x, y: vOut.y }, vOut, v];
}

function elbowPoints(a: Anchor, b: Anchor, pRect: Rect, cRect: Rect, t: number, findObstacles: ObstacleFinder, lane?: LaneAdjustment, ignore?: IgnoredIds): Elbow {
  const aH = isHorizontalSide(a.side);
  const bH = isHorizontalSide(b.side);
  if (aH && bH) return horizontalElbow(a, b, pRect, cRect, t, findObstacles, lane, ignore);
  if (!aH && !bH) {
    const flippedFinder: ObstacleFinder = (box) => findObstacles(flipRect(box)).map(flipRect);
    const flipped = horizontalElbow(flipAnchor(a), flipAnchor(b), flipRect(pRect), flipRect(cRect), t, flippedFinder, lane, ignore);
    return { points: flipped.points.map(flipPoint), query: flipped.query && flipRect(flipped.query) };
  }
  return { points: aH ? mixedElbow(a, b) : mixedElbow(b, a).reverse() };
}

function simplifyPolyline(points: Point[]): Point[] {
  const out: Point[] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (last && Math.abs(last.x - p.x) < 0.5 && Math.abs(last.y - p.y) < 0.5) continue;
    if (out.length >= 2) {
      const prev = out[out.length - 2];
      const cross = (last.x - prev.x) * (p.y - last.y) - (last.y - prev.y) * (p.x - last.x);
      if (Math.abs(cross) < 0.5) out.pop();
    }
    out.push(p);
  }
  return out;
}

function roundedPolylinePath(points: Point[], radius: number): string {
  let d = `M ${fmt(points[0].x)} ${fmt(points[0].y)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const next = points[i + 1];
    const inLen = Math.hypot(cur.x - prev.x, cur.y - prev.y);
    const outLen = Math.hypot(next.x - cur.x, next.y - cur.y);
    const r = Math.min(radius, inLen / 2, outLen / 2);
    const start = { x: cur.x + ((prev.x - cur.x) / inLen) * r, y: cur.y + ((prev.y - cur.y) / inLen) * r };
    const end = { x: cur.x + ((next.x - cur.x) / outLen) * r, y: cur.y + ((next.y - cur.y) / outLen) * r };
    d += ` L ${fmt(start.x)} ${fmt(start.y)} Q ${fmt(cur.x)} ${fmt(cur.y)} ${fmt(end.x)} ${fmt(end.y)}`;
  }
  const last = points[points.length - 1];
  return `${d} L ${fmt(last.x)} ${fmt(last.y)}`;
}

function polylineMidpoint(points: Point[]): Point {
  const lengths = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  let remaining = lengths.reduce((sum, l) => sum + l, 0) / 2;
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] && lengths[i] > 0) {
      const f = remaining / lengths[i];
      return { x: points[i].x + (points[i + 1].x - points[i].x) * f, y: points[i].y + (points[i + 1].y - points[i].y) * f };
    }
    remaining -= lengths[i];
  }
  return points[points.length - 1];
}

function orthogonal(p: MindMapNode, c: MindMapNode, a: Anchor, b: Anchor, t: number, findObstacles: ObstacleFinder, lane?: LaneAdjustment): Route {
  const elbow = elbowPoints(a, b, getNodeRect(p), getNodeRect(c), t, findObstacles, lane, [p.id, c.id]);
  const points = simplifyPolyline(elbow.points);
  return { path: roundedPolylinePath(points, ELBOW_RADIUS), mid: polylineMidpoint(points), points, query: elbow.query };
}

export interface ResolvedConnection {
  path: string;
  controls?: Point[];
  a: Anchor;
  b: Anchor;
  from: Side;
  to: Side;
  mid: Point;
  box: Box;
  query?: Box;
}

const NO_OBSTACLES: ObstacleFinder = () => [];

const boxAround = (points: { x: number; y: number }[]): Box => {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  points.forEach((p) => {
    x1 = Math.min(x1, p.x); y1 = Math.min(y1, p.y);
    x2 = Math.max(x2, p.x); y2 = Math.max(y2, p.y);
  });
  return { x1, y1, x2, y2 };
};

export function resolveConnection(
  p: MindMapNode,
  c: MindMapNode,
  style: ConnectionStyle,
  tension: number,
  fromOverride?: Side,
  toOverride?: Side,
  findObstacles: ObstacleFinder = NO_OBSTACLES,
  laneAdjustment?: LaneAdjustment,
): ResolvedConnection {
  const base = style === 'dashed' || style === 'dotted' ? 'curved' : style;
  const auto = getSides(p, c);
  const from = fromOverride ?? auto.from;
  const to = toOverride ?? auto.to;

  const a = getAnchor(p, from);
  const b = getAnchor(c, to);

  if (base === 'straight') {
    return { path: `M ${fmt(a.x)} ${fmt(a.y)} L ${fmt(b.x)} ${fmt(b.y)}`, a, b, from, to, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, box: boxAround([a, b]) };
  }

  if (base === 'orthogonal') {
    const { path, mid, points = [a, b], query } = orthogonal(p, c, a, b, tension, findObstacles, laneAdjustment);
    return { path, a, b, from, to, mid, box: boxAround(points), query };
  }

  const { path, mid, controls = [] } = curved(a, b, tension);
  return { path, a, b, from, to, mid, controls, box: boxAround([a, b, ...controls]) };
}

export function pathLength(path: string): number {
  const pts = samplePath(path, false);
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return len;
}

export function getDash(s: ConnectionStyle): string | undefined {
  return s === 'dashed' ? '8 4' : s === 'dotted' ? '0 8' : undefined;
}

export function resolveArrowDirection(conn: {
  arrowDirection?: 'none' | 'forward' | 'reverse' | 'both';
  isRelation?: boolean;
  type: ConnectionStyle;
}): 'none' | 'forward' | 'reverse' | 'both' {
  if (conn.arrowDirection) return conn.arrowDirection;
  return conn.isRelation || conn.type === 'arrow' ? 'forward' : 'none';
}


const blockColor = (node: MindMapNode): string => (node.color?.startsWith('#')
  ? node.color
  : `hsl(var(--node-${node.color === 'root' ? 'black' : node.color || 'orange'}-border))`);

export interface VisualConnection {
  id: string;
  p: MindMapNode;
  c: MindMapNode;
  label?: string;
  isRelation?: boolean;
  type: ConnectionStyle;
  color: string;
  startColor?: string;
  thickness: LineThickness;
  animated: boolean;
  animationType?: 'dash' | 'arrow' | 'cross';
  animationDirection?: 'forward' | 'reverse';
  tension: number;
  arrowDirection?: 'none' | 'forward' | 'reverse' | 'both';
  fromOverride?: Side;
  toOverride?: Side;
}

export function useVisualConnections(nodes: MindMapNode[], connectionStyle: ConnectionStyle): VisualConnection[] {
  const nodeById = useMemo(() => {
    const map = new Map<string, MindMapNode>();
    nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [nodes]);

  return useMemo(() => {
    const result: VisualConnection[] = [];

    nodes.forEach(c => {
      if (!c.parentId) return;
      const p = nodeById.get(c.parentId);
      if (!p) return;

      result.push({
        id: `${p.id}::${c.id}`,
        p,
        c,
        label: c.lineLabel,
        isRelation: false,
        type: c.lineType || p.lineType || connectionStyle,
        color: c.lineColor || (c.lineGradient ? blockColor(c) : '#9ca3af'),
        startColor: c.lineGradient ? blockColor(p) : undefined,
        thickness: c.lineThickness || 'medium',
        animated: !!c.lineAnimated,
        animationType: c.lineAnimationType || (c.lineAnimated ? 'dash' : undefined),
        animationDirection: c.lineAnimationDirection,
        tension: c.lineTension ?? 0.5,
        arrowDirection: c.lineArrowDirection,
        fromOverride: coerceSide(c.lineParentSide),
        toOverride: coerceSide(c.lineChildSide),
      });
    });

    nodes.forEach(n => {
      (n.relations || []).forEach(r => {
        const t = nodeById.get(r.targetId);
        if (!t) return;

        result.push({
          id: `rel::${n.id}::${t.id}`,
          p: n,
          c: t,
          label: r.label,
          isRelation: true,
          type: r.type || DEFAULT_RELATION_TYPE,
          color: r.color || DEFAULT_RELATION_COLOR,
          thickness: r.thickness || 'medium',
          animated: !!r.animated,
          animationType: r.animationType || (r.animated ? 'dash' : undefined),
          animationDirection: r.animationDirection,
          tension: 0.5,
          arrowDirection: r.arrowDirection,
          fromOverride: coerceSide(r.sourceSide),
          toOverride: coerceSide(r.targetSide),
        });
      });
    });

    return result;
  }, [nodes, nodeById, connectionStyle]);
}

interface LaneMember {
  id: string;
  a: Anchor;
  b: Anchor;
  parentId: string;
  childId: string;
  from: Side;
  to: Side;
  tension: number;
}

function applyLaneSplits(group: LaneMember[], result: Map<string, LaneAdjustment>): void {
  const isHorizontal = group[0].from === 'left' || group[0].from === 'right';

  const ranked = group
    .map(m => ({
      m,
      raw: isHorizontal ? m.a.x + (m.b.x - m.a.x) * m.tension : m.a.y + (m.b.y - m.a.y) * m.tension,
      rankKey: isHorizontal ? m.b.y : m.b.x,
    }))
    .sort((x, y) => x.rankKey - y.rankKey);

  const count = ranked.length;
  const center = ranked.reduce((sum, w) => sum + w.raw, 0) / count;
  const spacing = Math.min(LANE_SPACING, MAX_GROUP_SPREAD / (count - 1));

  ranked.forEach(({ m }, rank) => {
    const desired = center + (rank - (count - 1) / 2) * spacing;
    const loAnchor = isHorizontal ? m.a.x : m.a.y;
    const hiAnchor = isHorizontal ? m.b.x : m.b.y;
    const dir = hiAnchor >= loAnchor ? 1 : -1;
    const lo = loAnchor + dir * MIN_LEG;
    const hi = hiAnchor - dir * MIN_LEG;
    const split = clamp(desired, Math.min(lo, hi), Math.max(lo, hi));
    result.set(m.id, { split, rank, count });
  });
}

function computeOrthogonalLaneSplits(connections: VisualConnection[]): Map<string, LaneAdjustment> {
  const resolved: LaneMember[] = connections
    .filter(conn => conn.type === 'orthogonal')
    .map(conn => {
      const auto = getSides(conn.p, conn.c);
      const from = conn.fromOverride ?? auto.from;
      const to = conn.toOverride ?? auto.to;
      return {
        id: conn.id,
        a: getAnchor(conn.p, from),
        b: getAnchor(conn.c, to),
        parentId: conn.p.id,
        childId: conn.c.id,
        from,
        to,
        tension: conn.tension,
      };
    });

  const result = new Map<string, LaneAdjustment>();
  const assigned = new Set<string>();

  const fromGroups = new Map<string, LaneMember[]>();
  resolved.forEach(m => {
    const key = `from:${m.parentId}:${m.from}`;
    const group = fromGroups.get(key);
    if (group) group.push(m); else fromGroups.set(key, [m]);
  });
  fromGroups.forEach(group => {
    if (group.length < 2) return;
    applyLaneSplits(group, result);
    group.forEach(m => assigned.add(m.id));
  });

  const toGroups = new Map<string, LaneMember[]>();
  resolved.forEach(m => {
    if (assigned.has(m.id)) return;
    const axis = m.from === 'left' || m.from === 'right' ? 'x' : 'y';
    const key = `to:${m.childId}:${m.to}:${axis}`;
    const group = toGroups.get(key);
    if (group) group.push(m); else toGroups.set(key, [m]);
  });
  toGroups.forEach(group => {
    if (group.length < 2) return;
    applyLaneSplits(group, result);
  });

  return result;
}


const sameLane = (a?: LaneAdjustment, b?: LaneAdjustment) =>
  a === b || (!!a && !!b && a.split === b.split && a.rank === b.rank && a.count === b.count);

function changedNodeBoxes(before: MindMapNode[] | null, after: MindMapNode[]): Rect[] {
  if (!before || before === after) return [];
  const previous = new Map(before.map(n => [n.id, n]));
  const boxes: Rect[] = [];
  after.forEach((node) => {
    const old = previous.get(node.id);
    previous.delete(node.id);
    if (old === node) return;
    if (old) boxes.push(getNodeRect(old));
    boxes.push(getNodeRect(node));
  });
  previous.forEach(old => boxes.push(getNodeRect(old)));
  return boxes;
}

interface CachedRoute {
  p: MindMapNode;
  c: MindMapNode;
  type: ConnectionStyle;
  tension: number;
  fromOverride?: Side;
  toOverride?: Side;
  lane?: LaneAdjustment;
  route: ResolvedConnection;
}

function useConnectionRoutes(nodes: MindMapNode[], connections: VisualConnection[], lanes: Map<string, LaneAdjustment>): Map<string, ResolvedConnection> {
  const cacheRef = useRef<{ nodes: MindMapNode[]; entries: Map<string, CachedRoute> } | null>(null);

  return useMemo(() => {
    const previous = cacheRef.current;
    const changed = changedNodeBoxes(previous?.nodes ?? null, nodes);
    const changedIndex = changed.length > 32 ? new SpatialIndex(changed) : null;
    const touchesChange = (box: Box) => (changedIndex ? changedIndex.any(box) : changed.some(r => boxesOverlap(r, box)));

    let obstacles: SpatialIndex<Rect> | null = null;
    const findObstacles: ObstacleFinder = (box) => {
      obstacles ??= new SpatialIndex(nodes.map(getNodeRect));
      return obstacles.query(box);
    };

    const entries = new Map<string, CachedRoute>();
    const routes = new Map<string, ResolvedConnection>();
    connections.forEach((conn) => {
      const { id, p, c, type, tension, fromOverride, toOverride } = conn;
      const lane = lanes.get(id);
      const cached = previous?.entries.get(id);
      const reusable = !!cached && cached.p === p && cached.c === c && cached.type === type && cached.tension === tension
        && cached.fromOverride === fromOverride && cached.toOverride === toOverride && sameLane(cached.lane, lane)
        && !(cached.route.query && touchesChange(cached.route.query));
      const route = reusable
        ? cached.route
        : resolveConnection(p, c, type, tension, fromOverride, toOverride, type === 'orthogonal' ? findObstacles : NO_OBSTACLES, lane);
      entries.set(id, { p, c, type, tension, fromOverride, toOverride, lane, route });
      routes.set(id, route);
    });
    cacheRef.current = { nodes, entries };
    return routes;
  }, [nodes, connections, lanes]);
}

export interface LineRouting {
  connections: VisualConnection[];
  routes: Map<string, ResolvedConnection>;
}

export function useLineRouting(nodes: MindMapNode[], connectionStyle: ConnectionStyle = 'curved'): LineRouting {
  const connections = useVisualConnections(nodes, connectionStyle);
  const orthogonalLaneSplits = useMemo(() => computeOrthogonalLaneSplits(connections), [connections]);
  const routes = useConnectionRoutes(nodes, connections, orthogonalLaneSplits);
  return useMemo(() => ({ connections, routes }), [connections, routes]);
}

export function routePolyline(route: ResolvedConnection, step: number): Point[] {
  const { a, b, controls } = route;
  if (controls) {
    const [c1, c2] = controls;
    const roughLength = Math.hypot(c1.x - a.x, c1.y - a.y) + Math.hypot(c2.x - c1.x, c2.y - c1.y) + Math.hypot(b.x - c2.x, b.y - c2.y);
    const segments = Math.min(4096, Math.max(12, Math.ceil(roughLength / step)));
    const points: Point[] = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const mt = 1 - t;
      points.push({
        x: mt * mt * mt * a.x + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t * t * t * b.x,
        y: mt * mt * mt * a.y + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t * t * t * b.y,
      });
    }
    return points;
  }
  return samplePath(route.path, false);
}

export interface ClippedRun {
  points: Point[];
  start: number;
}

export function clipPolyline(points: Point[], box: Box): ClippedRun[] {
  const runs: ClippedRun[] = [];
  let current: ClippedRun | null = null;
  let distance = 0;
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1];
    const q = points[i];
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const length = Math.hypot(dx, dy);
    let t0 = 0, t1 = 1;
    const edges: [number, number][] = [[-dx, p.x - box.x1], [dx, box.x2 - p.x], [-dy, p.y - box.y1], [dy, box.y2 - p.y]];
    let inside = true;
    for (const [pe, qe] of edges) {
      if (pe === 0) {
        if (qe < 0) { inside = false; break; }
      } else {
        const r = qe / pe;
        if (pe < 0) t0 = Math.max(t0, r); else t1 = Math.min(t1, r);
      }
    }
    if (inside && t0 <= t1) {
      const from = { x: p.x + dx * t0, y: p.y + dy * t0 };
      const to = { x: p.x + dx * t1, y: p.y + dy * t1 };
      if (!current || t0 > 0) {
        current = { points: [from], start: distance + length * t0 };
        runs.push(current);
      }
      current.points.push(to);
      if (t1 < 1) current = null;
    } else {
      current = null;
    }
    distance += length;
  }
  return runs;
}
