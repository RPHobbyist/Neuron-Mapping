import { memo, useMemo } from 'react';
import { MindMapNode, ConnectionStyle, LineThickness, Side } from '@/types/mindmap';
import { DEFAULT_RELATION_TYPE, DEFAULT_RELATION_COLOR } from '@/lib/constants';
import { IRREGULAR_SHAPE_PATHS, SHAPE_SVG_INSET } from '@/utils/shapePaths';
import { getAutoConnectionSides } from '@/utils/common';


interface Props {
  nodes: MindMapNode[];
  zoom: number;
  connectionStyle?: ConnectionStyle;
  selectedLineId?: string | null;
  onLineSelect?: (lineId: string | null) => void;
  visibleLineIds?: Set<string>;
}

const STROKE: Record<LineThickness, number> = { thin: 1, medium: 2, thick: 4 };


const ANIMATION_CONFIG = {
  ARROW_SPACING: 50,
  ARROW_EXTRA_COUNT: 4,

  CROSS_SPACING: 80,
  CROSS_EXTRA_COUNT: 4,

  MAX_ANIMATED_GLYPHS: 400,

  DASH_PATTERN: '10 5',
} as const;


function getSize(node: MindMapNode): { w: number; h: number } {
  if (node.measuredWidth && node.measuredHeight) {
    return { w: node.measuredWidth, h: node.measuredHeight };
  }
  if (node.width && node.height) {
    return { w: node.width, h: node.height };
  }
  if (node.id === 'root' || node.shape === 'circle') {
    return { w: 128, h: 128 };
  }
  return { w: Math.max(100, node.text.length * 8 + 48), h: 50 };
}

function isCircle(node: MindMapNode): boolean {
  return node.id === 'root' || node.shape === 'circle';
}


function coerceSide(v: unknown): Side | undefined {
  return v === 'left' || v === 'right' || v === 'top' || v === 'bottom' ? v : undefined;
}

const getSides = getAutoConnectionSides;

interface Point { x: number; y: number }

const PATH_SAMPLE_CACHE = new Map<string, Point[]>();

function samplePath(path: string): Point[] {
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

  PATH_SAMPLE_CACHE.set(path, points);
  return points;
}

function toRealPolygon(samples: Point[], w: number, h: number): Point[] {
  const inset = SHAPE_SVG_INSET;
  return samples.map(p => ({
    x: (p.x / 100 - 0.5) * w + (p.x / 100) * 2 * inset - inset,
    y: (p.y / 100 - 0.5) * h + (p.y / 100) * 2 * inset - inset,
  }));
}

function getShapePolygon(shape: string | undefined, w: number, h: number): Point[] | null {
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

function polygonRayIntersection(dx: number, dy: number, poly: Point[]): Point | null {
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

function getAnchor(node: MindMapNode, side: Side): { x: number; y: number; side: Side } {
  const { w, h } = getSize(node);
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


interface Anchor { x: number; y: number; side: Side }

function getIntersection(node: MindMapNode, target: { x: number; y: number }): { x: number; y: number } {
  const { w, h } = getSize(node);
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

function curved(a: Anchor, b: Anchor, t: number): string {

  let dist = 0;

  if ((a.side === 'left' || a.side === 'right') && (b.side === 'left' || b.side === 'right')) {
    dist = Math.abs(b.x - a.x) * t;
  }
  else if ((a.side === 'top' || a.side === 'bottom') && (b.side === 'top' || b.side === 'bottom')) {
    dist = Math.abs(b.y - a.y) * t;
  }
  else {
    dist = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * t;
  }

  let ax = a.x, ay = a.y, bx = b.x, by = b.y;
  if (a.side === 'right') ax += dist;
  if (a.side === 'left') ax -= dist;
  if (a.side === 'bottom') ay += dist;
  if (a.side === 'top') ay -= dist;
  if (b.side === 'left') bx -= dist;
  if (b.side === 'right') bx += dist;
  if (b.side === 'top') by -= dist;
  if (b.side === 'bottom') by += dist;

  return `M ${a.x} ${a.y} C ${ax} ${ay}, ${bx} ${by}, ${b.x} ${b.y}`;
}

function orthogonal(a: Anchor, b: Anchor, t: number): string {
  if (a.side === 'left' || a.side === 'right') {
    const mx = a.x + (b.x - a.x) * t;
    return `M ${a.x} ${a.y} L ${mx} ${a.y} L ${mx} ${b.y} L ${b.x} ${b.y}`;
  }
  const my = a.y + (b.y - a.y) * t;
  return `M ${a.x} ${a.y} L ${a.x} ${my} L ${b.x} ${my} L ${b.x} ${b.y}`;
}

interface ResolvedConnection { path: string; a: Anchor; b: Anchor; from: Side; to: Side }

function resolveConnection(
  p: MindMapNode,
  c: MindMapNode,
  style: ConnectionStyle,
  tension: number,
  fromOverride?: Side,
  toOverride?: Side,
): ResolvedConnection {
  const base = style === 'dashed' || style === 'dotted' ? 'curved' : style;
  const auto = getSides(p, c);
  const from = fromOverride ?? auto.from;
  const to = toOverride ?? auto.to;

  if (base === 'straight') {
    const a: Anchor = fromOverride ? getAnchor(p, from) : { ...getIntersection(p, { x: c.x, y: c.y }), side: from };
    const b: Anchor = toOverride ? getAnchor(c, to) : { ...getIntersection(c, { x: p.x, y: p.y }), side: to };
    return { path: `M ${a.x} ${a.y} L ${b.x} ${b.y}`, a, b, from, to };
  }

  const a = getAnchor(p, from);
  const b = getAnchor(c, to);
  const path = base === 'orthogonal' ? orthogonal(a, b, tension) : curved(a, b, tension);
  return { path, a, b, from, to };
}

function getDash(s: ConnectionStyle): string | undefined {
  return s === 'dashed' ? '8 4' : s === 'dotted' ? '0 8' : undefined;
}

function resolveArrowDirection(conn: {
  arrowDirection?: 'none' | 'forward' | 'reverse' | 'both';
  isRelation?: boolean;
  type: ConnectionStyle;
}): 'none' | 'forward' | 'reverse' | 'both' {
  if (conn.arrowDirection) return conn.arrowDirection;
  return conn.isRelation || conn.type === 'arrow' ? 'forward' : 'none';
}


interface VisualConnection {
  id: string;
  p: MindMapNode;
  c: MindMapNode;
  label?: string;
  isRelation?: boolean;
  type: ConnectionStyle;
  color: string;
  thickness: LineThickness;
  animated: boolean;
  animationType?: 'dash' | 'arrow' | 'cross';
  animationDirection?: 'forward' | 'reverse';
  tension: number;
  arrowDirection?: 'none' | 'forward' | 'reverse' | 'both';
  fromOverride?: Side;
  toOverride?: Side;
}

function useVisualConnections(nodes: MindMapNode[], connectionStyle: ConnectionStyle): VisualConnection[] {
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
        color: c.lineColor || '#9ca3af',
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


function ConnectionLinesBase({
  nodes,
  zoom,
  connectionStyle = 'curved',
  selectedLineId,
  onLineSelect,
  visibleLineIds,
}: Props) {

  const connections = useVisualConnections(nodes, connectionStyle);

  const SIZE = 10000;
  const OFF = SIZE / 2;

  return (
    <svg
      className="absolute pointer-events-none overflow-visible"
      style={{ left: -OFF, top: -OFF, width: SIZE, height: SIZE }}
    >
      <defs>
        {connections.filter(conn => conn.animationType === 'arrow' || resolveArrowDirection(conn) !== 'none').map((conn) => {
          const safeMarkerId = conn.id.replace(/::/g, '_');
          return (
            <marker
              key={`marker-${safeMarkerId}`}
              id={`arrow-${safeMarkerId}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 Q 4 5 0 0" fill={conn.color} />
            </marker>
          );
        })}
      </defs>
      <g transform={`translate(${OFF}, ${OFF})`}>
        {connections.map((conn) => {
          const { p, c, id, type, color, thickness, animated, animationType, animationDirection, tension, isRelation, fromOverride, toOverride } = conn;
          const safeId = id.replace(/::/g, '_');

          if (visibleLineIds && !isRelation && !visibleLineIds.has(id)) {
            return null;
          }

          const width = STROKE[thickness];
          const dash = getDash(type);
          const { path, a, b, from } = resolveConnection(p, c, type, tension, fromOverride, toOverride);
          const sel = selectedLineId === id;

          const arrowDir = animated && animationType === 'arrow' ? 'none' : resolveArrowDirection(conn);
          const showEndArrow = arrowDir === 'forward' || arrowDir === 'both';
          const showStartArrow = arrowDir === 'reverse' || arrowDir === 'both';

          let mx = (a.x + b.x) / 2;
          let my = (a.y + b.y) / 2;

          if (type === 'orthogonal') {
            if (from === 'left' || from === 'right') {
              const midX = a.x + (b.x - a.x) * tension;
              mx = midX;
              my = (a.y + b.y) / 2;
            } else {
              const midY = a.y + (b.y - a.y) * tension;
              mx = (a.x + b.x) / 2;
              my = midY;
            }
          }

          const labelText = conn.label;

          return (
            <g key={id}>
              <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth={20 / zoom}
                style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                onClick={e => { e.stopPropagation(); onLineSelect?.(id); }}
              />
              {sel && (
                <path
                  d={path}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={width + 6}
                  strokeLinecap="round"
                  opacity={0.4}
                />
              )}
              <path
                id={`path-${safeId}`}
                d={path}
                fill="none"
                stroke={color}
                strokeWidth={width}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={(animated && animationType === 'dash') ? ANIMATION_CONFIG.DASH_PATTERN : dash}
                className={animated && animationType === 'dash' ? (animationDirection === 'reverse' ? 'flow-reverse' : 'flow') : undefined}
                style={animated ? { willChange: 'stroke-dashoffset' } : undefined}
                markerEnd={showEndArrow ? `url(#arrow-${safeId})` : undefined}
                markerStart={showStartArrow ? `url(#arrow-${safeId})` : undefined}
              />

              {animated && animationType === 'arrow' && (() => {
                const lineLength = type === 'orthogonal'
                  ? Math.abs(b.x - a.x) + Math.abs(b.y - a.y)
                  : Math.hypot(b.x - a.x, b.y - a.y);
                const spacing = ANIMATION_CONFIG.ARROW_SPACING;
                const arrowCount = Math.min(
                  ANIMATION_CONFIG.MAX_ANIMATED_GLYPHS,
                  Math.ceil(lineLength / spacing) + ANIMATION_CONFIG.ARROW_EXTRA_COUNT
                );
                const arrow = animationDirection === 'reverse' ? "◀" : "▶";

                return (
                  <text
                    fontSize="12"
                    fill={color}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                    dominantBaseline="central"
                    textAnchor="start"
                  >
                    <textPath href={`#path-${safeId}`} startOffset="0" spacing="auto">
                      <animate
                        attributeName="startOffset"
                        from="0"
                        to={animationDirection === 'reverse' ? '-50' : '50'}
                        dur="1s"
                        repeatCount="indefinite"
                      />
                      {Array.from({ length: arrowCount }, (_, i) => (
                        <tspan key={i} x={(i - 1) * spacing}>
                          {arrow}
                        </tspan>
                      ))}
                    </textPath>
                  </text>
                );
              })()}

              {animated && animationType === 'cross' && (() => {
                const lineLength = type === 'orthogonal'
                  ? Math.abs(b.x - a.x) + Math.abs(b.y - a.y)
                  : Math.hypot(b.x - a.x, b.y - a.y);
                const spacing = ANIMATION_CONFIG.CROSS_SPACING;
                const crossCount = Math.min(
                  ANIMATION_CONFIG.MAX_ANIMATED_GLYPHS,
                  Math.ceil(lineLength / spacing) + ANIMATION_CONFIG.CROSS_EXTRA_COUNT
                );

                return (
                  <text
                    fontSize="18"
                    fill={color}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                    dominantBaseline="middle"
                    textAnchor="start"
                  >
                    <textPath href={`#path-${safeId}`} startOffset="0" spacing="auto">
                      <animate
                        attributeName="startOffset"
                        from="0"
                        to={animationDirection === 'reverse' ? '-80' : '80'}
                        dur="1s"
                        repeatCount="indefinite"
                      />
                      {Array.from({ length: crossCount }, (_, i) => (
                        <tspan key={i} x={(i - 1) * spacing} dy={0}>
                          ×
                        </tspan>
                      ))}
                    </textPath>
                  </text>
                );
              })()}

              {conn.label && (
                <g transform={`translate(${mx}, ${my})`}>
                  <text
                    x="0" y="4"
                    textAnchor="middle"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinejoin="round"
                    fontSize="12"
                    fontWeight="500"
                    style={{ pointerEvents: 'none' }}
                  >
                    {conn.label}
                  </text>
                  <text
                    x="0" y="4"
                    textAnchor="middle"
                    fill={color}
                    fontSize="12"
                    fontWeight="500"
                    style={{ pointerEvents: 'none' }}
                  >
                    {conn.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export const ConnectionLines = memo(ConnectionLinesBase);


interface ConnectionHandlesProps {
  nodes: MindMapNode[];
  zoom: number;
  connectionStyle?: ConnectionStyle;
  selectedLineId?: string | null;
  visibleLineIds?: Set<string>;
  onSetConnectionSide?: (connectionId: string, endpoint: 'from' | 'to', side: Side | null) => void;
}

const SIDES: Side[] = ['left', 'right', 'top', 'bottom'];

function ConnectionHandlesBase({
  nodes,
  zoom,
  connectionStyle = 'curved',
  selectedLineId,
  visibleLineIds,
  onSetConnectionSide,
}: ConnectionHandlesProps) {
  const connections = useVisualConnections(nodes, connectionStyle);
  const conn = connections.find(c => c.id === selectedLineId);

  if (!conn) return null;
  if (visibleLineIds && !conn.isRelation && !visibleLineIds.has(conn.id)) return null;

  const renderDots = (node: MindMapNode, activeSide: Side | undefined, endpoint: 'from' | 'to') =>
    SIDES.map(side => {
      const { x, y } = getAnchor(node, side);
      const active = activeSide === side;
      return (
        <g key={`${endpoint}-${side}`}>
          <circle
            cx={x}
            cy={y}
            r={10 / zoom}
            fill="transparent"
            style={{ cursor: 'pointer', pointerEvents: 'all' }}
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onSetConnectionSide?.(conn.id, endpoint, active ? null : side); }}
          >
            <title>{active ? 'Manually pinned — click to clear' : `Pin this side to ${side}`}</title>
          </circle>
          <circle
            cx={x}
            cy={y}
            r={(active ? 6 : 5) / zoom}
            fill={active ? '#3b82f6' : 'white'}
            stroke="#3b82f6"
            strokeWidth={1.5 / zoom}
            style={{ pointerEvents: 'none' }}
          />
          {active && (
            <path
              d={`M ${x - 2.5 / zoom} ${y - 2.5 / zoom} L ${x + 2.5 / zoom} ${y + 2.5 / zoom} M ${x - 2.5 / zoom} ${y + 2.5 / zoom} L ${x + 2.5 / zoom} ${y - 2.5 / zoom}`}
              stroke="white"
              strokeWidth={1.2 / zoom}
              style={{ pointerEvents: 'none' }}
            />
          )}
        </g>
      );
    });

  const SIZE = 10000;
  const OFF = SIZE / 2;

  return (
    <svg
      className="absolute pointer-events-none overflow-visible"
      style={{ left: -OFF, top: -OFF, width: SIZE, height: SIZE, zIndex: 6 }}
    >
      <g transform={`translate(${OFF}, ${OFF})`}>
        {renderDots(conn.p, conn.fromOverride, 'from')}
        {renderDots(conn.c, conn.toOverride, 'to')}
      </g>
    </svg>
  );
}

export const ConnectionHandles = memo(ConnectionHandlesBase);
 