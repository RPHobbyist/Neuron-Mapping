import { memo, useMemo } from 'react';
import { MindMapNode, ConnectionStyle, LineThickness } from '@/types/mindmap';
import { DEFAULT_RELATION_TYPE, DEFAULT_RELATION_COLOR } from '@/lib/constants';

/**
 * ConnectionLines Component
 *
 * Renders SVG connection lines between mind map nodes.
 * Lines connect from edge to edge using anchor points.
 */

interface Props {
  nodes: MindMapNode[];
  zoom: number;
  connectionStyle?: ConnectionStyle;
  selectedLineId?: string | null;
  onLineSelect?: (lineId: string | null) => void;
  visibleLineIds?: Set<string>;
}

const STROKE: Record<LineThickness, number> = { thin: 1, medium: 2, thick: 4 };

// ============================================================================
// ANIMATION CONFIGURATION
// ============================================================================

const ANIMATION_CONFIG = {
  // Arrow Animation
  ARROW_SPACING: 50,           // Distance between arrows in pixels
  ARROW_EXTRA_COUNT: 4,        // Extra arrows for seamless coverage

  // Cross Animation
  CROSS_SPACING: 80,           // Distance between crosses in pixels
  CROSS_EXTRA_COUNT: 4,        // Extra crosses for seamless coverage

  // Upper bound on animated glyphs per line, regardless of length
  MAX_ANIMATED_GLYPHS: 400,

  // Dash Animation
  DASH_PATTERN: '10 5',        // Dash pattern (dash length, gap length)
} as const;

// ============================================================================
// NODE SIZE
// ============================================================================

function getSize(node: MindMapNode): { w: number; h: number } {
  if (node.measuredWidth && node.measuredHeight) {
    return { w: node.measuredWidth, h: node.measuredHeight };
  }
  if (node.width && node.height) {
    return { w: node.width, h: node.height };
  }
  if (node.id === 'root' || node.shape === 'circle') {
    return { w: 128, h: 128 }; // Matches w-32 (128px) exactly
  }
  // Matches typical auto-layout size: Text length * approx char width + padding
  return { w: Math.max(100, node.text.length * 8 + 48), h: 50 };
}

function isCircle(node: MindMapNode): boolean {
  return node.id === 'root' || node.shape === 'circle';
}

// ============================================================================
// EDGE ANCHORS
// ============================================================================

type Side = 'left' | 'right' | 'top' | 'bottom';

function getSides(parent: MindMapNode, child: MindMapNode): { from: Side; to: Side } {
  const dx = child.x - parent.x;
  const dy = child.y - parent.y;

  // A ~1:1 (45°) threshold instead of the old 0.3 one — that classified any
  // edge within ~73° of horizontal as "horizontal", so a typical wide/
  // moderate-height vertical-layout fan-out got left/right anchors and
  // rendered as a sideways bulge instead of dropping straight to the child.
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0 ? { from: 'right', to: 'left' } : { from: 'left', to: 'right' };
  }
  return dy > 0 ? { from: 'bottom', to: 'top' } : { from: 'top', to: 'bottom' };
}

function getAnchor(node: MindMapNode, side: Side): { x: number; y: number; side: Side } {
  const { w, h } = getSize(node);
  const hw = w / 2;
  const hh = h / 2;

  if (isCircle(node)) {
    switch (side) {
      case 'left': return { x: node.x - hw, y: node.y, side };
      case 'right': return { x: node.x + hw, y: node.y, side };
      case 'top': return { x: node.x, y: node.y - hh, side };
      case 'bottom': return { x: node.x, y: node.y + hh, side };
    }
  }

  switch (side) {
    case 'left': return { x: node.x - hw, y: node.y, side };
    case 'right': return { x: node.x + hw, y: node.y, side };
    case 'top': return { x: node.x, y: node.y - hh, side };
    case 'bottom': return { x: node.x, y: node.y + hh, side };
  }
}

// ============================================================================
// PATH GENERATORS
// ============================================================================

interface Anchor { x: number; y: number; side: Side }

// Calculate intersection point between a line (from node center to target) and the node's boundary
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

  const scaleX = halfW / Math.abs(dx);
  const scaleY = halfH / Math.abs(dy);

  const scale = Math.min(scaleX, scaleY);

  return {
    x: cx + dx * scale,
    y: cy + dy * scale
  };
}

// Updated path generators
function curved(a: Anchor, b: Anchor, t: number): string {
  // Canva-style smart curve: Distance is based on the primary axis of travel
  // to avoid excessive bulging when nodes are far apart in one dimension but close in the other.

  let dist = 0;

  // If connecting horizontally (side-to-side)
  if ((a.side === 'left' || a.side === 'right') && (b.side === 'left' || b.side === 'right')) {
    dist = Math.abs(b.x - a.x) * t;
  }
  // If connecting vertically (top-to-bottom)
  else if ((a.side === 'top' || a.side === 'bottom') && (b.side === 'top' || b.side === 'bottom')) {
    dist = Math.abs(b.y - a.y) * t;
  }
  // Mixed connection (corner to side etc.) - fallback to max distance
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

function makePath(p: MindMapNode, c: MindMapNode, style: ConnectionStyle, tension: number): string {
  const base = style === 'dashed' || style === 'dotted' ? 'curved' : style;

  if (base === 'straight') {
    const start = getIntersection(p, { x: c.x, y: c.y });
    const end = getIntersection(c, { x: p.x, y: p.y });
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  const { from, to } = getSides(p, c);
  const a = getAnchor(p, from);
  const b = getAnchor(c, to);

  switch (base) {
    case 'orthogonal': return orthogonal(a, b, tension);
    // 'arrow' falls through to default (curved)
    default: return curved(a, b, tension);
  }
}

function getDash(s: ConnectionStyle): string | undefined {
  // '0 8' with round linecap produces dots
  return s === 'dashed' ? '8 4' : s === 'dotted' ? '0 8' : undefined;
}

// Resolves the effective arrowhead placement for a connection. When the
// user hasn't explicitly chosen a direction, this preserves the historical
// defaults: relations and the 'arrow' line type get an arrowhead pointing
// at the target/child end; every other line type has none.
function resolveArrowDirection(conn: {
  arrowDirection?: 'none' | 'forward' | 'reverse' | 'both';
  isRelation?: boolean;
  type: ConnectionStyle;
}): 'none' | 'forward' | 'reverse' | 'both' {
  if (conn.arrowDirection) return conn.arrowDirection;
  return conn.isRelation || conn.type === 'arrow' ? 'forward' : 'none';
}

// ============================================================================
// COMPONENT
// ============================================================================

function ConnectionLinesBase({
  nodes,
  zoom,
  connectionStyle = 'curved',
  selectedLineId,
  onLineSelect,
  visibleLineIds,
}: Props) {

  // Normalized connection object with all style props resolved
  interface VisualConnection {
    id: string;
    p: MindMapNode;
    c: MindMapNode;
    label?: string;
    isRelation?: boolean;
    // Resolved styles
    type: ConnectionStyle;
    color: string;
    thickness: LineThickness;
    animated: boolean;
    animationType?: 'dash' | 'arrow' | 'cross';
    animationDirection?: 'forward' | 'reverse'; // Added prop
    tension: number;
    arrowDirection?: 'none' | 'forward' | 'reverse' | 'both';
  }

  // Built once per render instead of nodes.find() inside the loops below —
  // on a large map that O(n) lookup inside an O(n) walk was effectively
  // O(n^2) per render, and this component re-renders on every pan/drag frame.
  const nodeById = useMemo(() => {
    const map = new Map<string, MindMapNode>();
    nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [nodes]);

  const connections = useMemo(() => {
    const result: VisualConnection[] = [];

    // 1. Hierarchy Connections
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
        // Resolve Props from Child Node's line settings
        type: c.lineType || connectionStyle,
        color: c.lineColor || '#9ca3af', // Default to neutral gray (gray-400) if no specific line color
        thickness: c.lineThickness || 'medium',
        animated: !!c.lineAnimated,
        animationType: c.lineAnimationType || (c.lineAnimated ? 'dash' : undefined), // Fallback to dash if animated
        animationDirection: c.lineAnimationDirection, // Map direction
        tension: c.lineTension ?? 0.5,
        arrowDirection: c.lineArrowDirection,
      });
    });

    // 2. Relation Connections
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
          // Resolve Props from the Relation object — falls back to the same
          // shared defaults addRelation() now writes at creation time, so a
          // relation's line and its own properties panel never disagree.
          type: r.type || DEFAULT_RELATION_TYPE,
          color: r.color || DEFAULT_RELATION_COLOR,
          thickness: r.thickness || 'medium',
          animated: !!r.animated,
          animationType: r.animationType || (r.animated ? 'dash' : undefined), // Fallback
          animationDirection: r.animationDirection, // Map direction
          tension: 0.5,
          arrowDirection: r.arrowDirection,
        });
      });
    });

    return result;
  }, [nodes, nodeById, connectionStyle]);

  // Large SVG canvas centered at (0,0) with offset. overflow: visible so
  // connections to nodes further than ±OFF model units from center (reachable
  // on wide auto-layouts, or after dragging a node far out) aren't invisibly
  // clipped by the SVG's own bounds while the node itself stays on screen.
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
          const { p, c, id, type, color, thickness, animated, animationType, animationDirection, tension, isRelation } = conn;
          // Create a safe ID for SVG element references (colons break URL fragment references)
          const safeId = id.replace(/::/g, '_');

          // Play Mode Visibility Check — Play Mode's sequence only walks the
          // parent/child hierarchy, so relations (cross-links) never appear
          // in visibleLineIds. Without this exemption every relation line
          // would stay hidden for the entire playback instead of just being
          // shown throughout, as a cross-link isn't part of the reveal order.
          if (visibleLineIds && !isRelation && !visibleLineIds.has(id)) {
            return null;
          }

          const width = STROKE[thickness];
          const dash = getDash(type);
          const path = makePath(p, c, type, tension);
          const sel = selectedLineId === id;

          // Arrowhead suppression when the "moving arrow" animation is
          // active mirrors the old behavior: the animated glyphs already
          // convey direction, so a static marker on top would be redundant.
          const arrowDir = animated && animationType === 'arrow' ? 'none' : resolveArrowDirection(conn);
          const showEndArrow = arrowDir === 'forward' || arrowDir === 'both';
          const showStartArrow = arrowDir === 'reverse' || arrowDir === 'both';

          // Debug points calculation
          const { from, to } = getSides(p, c);
          const a = getAnchor(p, from);
          const b = getAnchor(c, to);

          // Calculate label position (midpoint approx)
          // For cubic bezier (approx middle)
          let mx = (a.x + b.x) / 2;
          let my = (a.y + b.y) / 2;

          if (type === 'orthogonal') {
            // Improve midpoint for orthogonal
            if (from === 'left' || from === 'right') {
              const midX = a.x + (b.x - a.x) * tension;
              mx = midX;
              my = (a.y + b.y) / 2; // Vertical middle of the step
            } else {
              const midY = a.y + (b.y - a.y) * tension;
              mx = (a.x + b.x) / 2;
              my = midY;
            }
          }

          // Determine label text
          const labelText = conn.label;
          // If no specific label, check if it's a relation with a label
          // Currently our structure 'conn' has { p, c, id, label }. check data prep below.

          return (
            <g key={id}>
              {/* Hit area — width compensated for zoom so it stays a
                  constant ~20 screen px; otherwise it shrinks in the
                  content's local coordinate space and lines become nearly
                  unclickable when zoomed out. */}
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
                id={`path-${safeId}`} // ID needed for textPath reference
                d={path}
                fill="none"
                stroke={color}
                strokeWidth={width}
                strokeLinecap="round"
                strokeLinejoin="round"
                // Prioritize animation pattern if dash animation is active to ensure smooth flow (matches CSS keyframes)
                strokeDasharray={(animated && animationType === 'dash') ? ANIMATION_CONFIG.DASH_PATTERN : dash}
                className={animated && animationType === 'dash' ? (animationDirection === 'reverse' ? 'flow-reverse' : 'flow') : undefined}
                style={animated ? { willChange: 'stroke-dashoffset' } : undefined}
                markerEnd={showEndArrow ? `url(#arrow-${safeId})` : undefined}
                markerStart={showStartArrow ? `url(#arrow-${safeId})` : undefined}
              />

              {/* Arrow Animation - Seamless Loop Fix with Absolute Positioning */}
              {animated && animationType === 'arrow' && (() => {
                // Straight-line distance under-covers orthogonal/curved paths
                // (the actual rendered path is longer), leaving a visible gap
                // with no arrows before the arrowhead. The orthogonal path's
                // length is exactly |dx| + |dy| regardless of tension — its
                // two segments along each axis always sum to the full delta.
                const lineLength = type === 'orthogonal'
                  ? Math.abs(b.x - a.x) + Math.abs(b.y - a.y)
                  : Math.hypot(b.x - a.x, b.y - a.y);
                const spacing = ANIMATION_CONFIG.ARROW_SPACING;
                // Add extra arrows for buffer at both ends, capped so a very
                // long line can't render thousands of elements.
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
                      {/* Use absolute 'x' positioning to ensure exact spacing independent of character width */}
                      {Array.from({ length: arrowCount }, (_, i) => (
                        <tspan key={i} x={(i - 1) * spacing}>
                          {arrow}
                        </tspan>
                      ))}
                    </textPath>
                  </text>
                );
              })()}

              {/* Cross Animation - Similar to Arrow */}
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

              {/* Label */}
              {conn.label && (
                <g transform={`translate(${mx}, ${my})`}>
                  {/* Halo for readability */}
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
                  {/* Actual Text */}
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

// The `.flow` / `.flow-reverse` dash-scroll animation classes used above are
// defined once, globally, in src/index.css — this used to carry its own
// duplicate (and, being an unlayered inline <style>, one that silently
// overrode the real stylesheet).
export const ConnectionLines = memo(ConnectionLinesBase);
