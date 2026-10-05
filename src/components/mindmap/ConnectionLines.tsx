/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { memo, useMemo, useRef } from 'react';
import { ConnectionStyle, MindMapNode, LineThickness, Side } from '@/types/mindmap';
import { Box, boxesOverlap } from '@/utils/spatialIndex';
import { readableTextOn } from '@/utils/common';

import {
  Anchor, LineRouting, arrowheadAt, lineShapeOf, clipPolyline, getAnchor, getDash, pathLength, resolveArrowDirection, resolveConnection, routePolyline,
  trimPolyline, useVisualConnections, type ResolvedConnection,
} from './lineRouting';
import type { Point } from '@/utils/nodeOutline';

export type { LineRouting, ResolvedConnection, VisualConnection } from './lineRouting';


interface Props {
  routing: LineRouting;
  selectedLineId?: string | null;
  onLineSelect?: (lineId: string | null) => void;
  visibleLineIds?: Set<string>;
  viewBox?: Box;
}

const STROKE: Record<LineThickness, number> = { thin: 1, medium: 2, thick: 4 };


const ANIMATION_CONFIG = {
  ARROW_SPACING: 50,

  CROSS_SPACING: 80,
  CROSS_EXTRA_COUNT: 4,

  MAX_ANIMATED_GLYPHS: 400,

  DASH_PATTERN: '10 5',
} as const;


const LINE_MARGIN = 60;

const ARROWHEAD_BASE = 2;
const ARROWHEAD_PER_STROKE = 5;

const LABEL_FONT_SIZE = 12;
const LABEL_HEIGHT = 20;
const LABEL_PADDING_X = 8;

let labelContext: CanvasRenderingContext2D | null | undefined;
const labelWidths = new Map<string, number>();

function measureLabel(text: string): number {
  const cached = labelWidths.get(text);
  if (cached !== undefined) return cached;
  if (labelContext === undefined) {
    labelContext = document.createElement('canvas').getContext('2d');
    if (labelContext) labelContext.font = `500 ${LABEL_FONT_SIZE}px ${getComputedStyle(document.body).fontFamily}`;
  }
  const width = labelContext ? labelContext.measureText(text).width : text.length * LABEL_FONT_SIZE * 0.6;
  if (document.fonts && document.fonts.status !== 'loaded') return width;
  if (labelWidths.size > 500) labelWidths.clear();
  labelWidths.set(text, width);
  return width;
}

interface ArrowGeometry {
  points: Point[];
  d: string;
  heads: { x: number; y: number; angle: number; size: number; fill: string }[];
}

function ConnectionLinesBase({
  routing,
  selectedLineId,
  onLineSelect,
  visibleLineIds,
  viewBox,
}: Props) {
  const { connections, routes } = routing;

  const shown = useMemo(() => connections.filter((conn) => {
    if (visibleLineIds && !visibleLineIds.has(conn.id)) return false;
    if (!viewBox || conn.id === selectedLineId) return true;
    const { box } = routes.get(conn.id)!;
    return boxesOverlap({ x1: box.x1 - LINE_MARGIN, y1: box.y1 - LINE_MARGIN, x2: box.x2 + LINE_MARGIN, y2: box.y2 + LINE_MARGIN }, viewBox);
  }), [connections, routes, visibleLineIds, viewBox, selectedLineId]);

  const arrowCache = useRef(new WeakMap<ResolvedConnection, { key: string; value: ArrowGeometry }>());

  const arrowGeometry = useMemo(() => {
    const geometry = new Map<string, ArrowGeometry>();
    shown.forEach((conn) => {
      const arrowDir = conn.animated && conn.animationType === 'arrow' ? 'none' : resolveArrowDirection(conn);
      if (arrowDir === 'none') return;
      const route = routes.get(conn.id)!;
      const key = `${arrowDir}|${conn.thickness}|${conn.color}|${conn.startColor ?? ''}`;
      const cached = arrowCache.current.get(route);
      if (cached && cached.key === key) {
        geometry.set(conn.id, cached.value);
        return;
      }
      const atStart = arrowDir === 'reverse' || arrowDir === 'both';
      const atEnd = arrowDir === 'forward' || arrowDir === 'both';
      const size = ARROWHEAD_BASE + ARROWHEAD_PER_STROKE * STROKE[conn.thickness];
      const full = routePolyline(route, 3);
      const heads = [
        ...(atStart ? [{ ...arrowheadAt(full, false, size), size, fill: conn.startColor ?? conn.color }] : []),
        ...(atEnd ? [{ ...arrowheadAt(full, true, size), size, fill: conn.color }] : []),
      ];
      const points = trimPolyline(full, atStart ? size / 2 : 0, atEnd ? size / 2 : 0);
      const value = { points, d: `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`, heads };
      arrowCache.current.set(route, { key, value });
      geometry.set(conn.id, value);
    });
    return geometry;
  }, [shown, routes]);

  const dashedParts = useMemo(() => {
    const parts = new Map<string, { runs: { d: string; offset: number }[] }>();
    if (!viewBox) return parts;
    const clip = { x1: viewBox.x1 - LINE_MARGIN, y1: viewBox.y1 - LINE_MARGIN, x2: viewBox.x2 + LINE_MARGIN, y2: viewBox.y2 + LINE_MARGIN };
    shown.forEach((conn) => {
      const pattern = conn.animated && conn.animationType === 'dash' ? ANIMATION_CONFIG.DASH_PATTERN : getDash(conn.type, conn.pattern);
      if (!pattern) return;
      const route = routes.get(conn.id)!;
      const { box } = route;
      if (box.x1 >= clip.x1 && box.y1 >= clip.y1 && box.x2 <= clip.x2 && box.y2 <= clip.y2) return;
      const period = pattern.split(/\s+/).map(Number).reduce((sum, n) => sum + n, 0) || 1;
      const runs = clipPolyline(arrowGeometry.get(conn.id)?.points ?? routePolyline(route, 8), clip);
      parts.set(conn.id, {
        runs: runs.map(run => ({
          d: `M ${run.points.map(p => `${p.x} ${p.y}`).join(' L ')}`,
          offset: run.start % period,
        })),
      });
    });
    return parts;
  }, [shown, routes, viewBox, arrowGeometry]);

  const SIZE = 10000;
  const OFF = SIZE / 2;

  return (
    <svg
      className="absolute pointer-events-none overflow-visible"
      style={{ left: -OFF, top: -OFF, width: SIZE, height: SIZE }}
    >
      <g transform={`translate(${OFF}, ${OFF})`}>
        {shown.map((conn) => {
          const { id, type, color, startColor, thickness, animated, animationType, animationDirection } = conn;
          const safeId = id.replace(/::/g, '_');

          const width = STROKE[thickness];
          const dash = getDash(type, conn.pattern);
          const { path, a, b, mid } = routes.get(id)!;
          const sel = selectedLineId === id;
          const arrows = arrowGeometry.get(id);

          const { x: mx, y: my } = mid;

          return (
            <g key={id}>
              <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                vectorEffect="non-scaling-stroke"
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
              {startColor && (
                <defs>
                  <linearGradient id={`gradient-${safeId}`} gradientUnits="userSpaceOnUse" x1={a.x} y1={a.y} x2={b.x} y2={b.y}>
                    <stop offset="0" stopColor={startColor} />
                    <stop offset="1" stopColor={color} />
                  </linearGradient>
                </defs>
              )}
              {(dashedParts.get(id)?.runs ?? [{ d: arrows?.d ?? path, offset: 0 }]).map((run, index) => {
                return (
                  <path
                    key={index}
                    id={index === 0 ? `path-${safeId}` : undefined}
                    d={run.d}
                    fill="none"
                    stroke={startColor ? `url(#gradient-${safeId})` : color}
                    strokeWidth={width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={(animated && animationType === 'dash') ? ANIMATION_CONFIG.DASH_PATTERN : dash}
                    strokeDashoffset={run.offset || undefined}
                    className={animated && animationType === 'dash' ? (animationDirection === 'reverse' ? 'flow-reverse' : 'flow') : undefined}
                    style={animated ? { willChange: 'stroke-dashoffset' } : undefined}
                  />
                );
              })}

              {arrows?.heads.map((head, index) => (
                <path
                  key={`head-${index}`}
                  d="M 0 0 L 10 5 L 0 10 Q 4 5 0 0"
                  fill={head.fill}
                  transform={`translate(${head.x} ${head.y}) rotate(${head.angle}) scale(${head.size / 10}) translate(-10 -5)`}
                />
              ))}

              {animated && animationType === 'arrow' && (() => {
                const points = routePolyline(routes.get(id)!, 4);
                let lineLength = 0;
                for (let i = 1; i < points.length; i++) {
                  lineLength += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
                }
                if (lineLength < 1) return null;
                const spacing = ANIMATION_CONFIG.ARROW_SPACING;
                const arrowCount = Math.min(ANIMATION_CONFIG.MAX_ANIMATED_GLYPHS, Math.max(1, Math.floor(lineLength / spacing)));
                const reverse = animationDirection === 'reverse';
                const half = 3 + width;

                return (
                  <g fill={color} style={{ pointerEvents: 'none' }}>
                    {Array.from({ length: arrowCount }, (_, i) => {
                      const from = (i * spacing) / lineLength;
                      const to = Math.min(1, ((i + 1) * spacing) / lineLength);
                      return (
                        <path key={i} d={`M ${-half} ${-half} L ${half} 0 L ${-half} ${half} Z`}>
                          <animateMotion
                            path={path}
                            dur="1s"
                            repeatCount="indefinite"
                            calcMode="linear"
                            keyPoints={reverse ? `${to};${from}` : `${from};${to}`}
                            keyTimes="0;1"
                            rotate={reverse ? 'auto-reverse' : 'auto'}
                          />
                        </path>
                      );
                    })}
                  </g>
                );
              })()}

              {animated && animationType === 'cross' && (() => {
                const lineLength = lineShapeOf(type) === 'orthogonal' ? pathLength(path) : Math.hypot(b.x - a.x, b.y - a.y);
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

              {conn.label && (() => {
                const labelWidth = measureLabel(conn.label) + LABEL_PADDING_X * 2;
                return (
                  <g transform={`translate(${mx}, ${my})`} style={{ pointerEvents: 'none' }}>
                    <rect
                      x={-labelWidth / 2}
                      y={-LABEL_HEIGHT / 2}
                      width={labelWidth}
                      height={LABEL_HEIGHT}
                      rx={LABEL_HEIGHT / 2}
                      fill={color}
                      strokeWidth={1.5}
                      style={{ stroke: 'hsl(var(--canvas-bg))' }}
                    />
                    <text
                      x="0" y="0"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={readableTextOn(color)}
                      fontSize={LABEL_FONT_SIZE}
                      fontWeight="500"
                    >
                      {conn.label}
                    </text>
                  </g>
                );
              })()}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export const ConnectionLines = memo(ConnectionLinesBase);


interface ConnectionDotsProps {
  routing: LineRouting;
  visibleLineIds?: Set<string>;
  viewBox?: Box;
}

function ConnectionDotsBase({ routing, visibleLineIds, viewBox }: ConnectionDotsProps) {
  const { connections, routes } = routing;

  const SIZE = 10000;
  const OFF = SIZE / 2;

  return (
    <svg
      className="absolute pointer-events-none overflow-visible"
      style={{ left: -OFF, top: -OFF, width: SIZE, height: SIZE, zIndex: 5 }}
    >
      <g transform={`translate(${OFF}, ${OFF})`}>
        {connections.map((conn) => {
          if (visibleLineIds && !visibleLineIds.has(conn.id)) return null;
          const route = routes.get(conn.id);
          if (!route) return null;
          if (viewBox && !boxesOverlap(route.box, viewBox)) return null;

          const { a: start, b: end } = route;
          const arrowDir = conn.animated && conn.animationType === 'arrow' ? 'none' : resolveArrowDirection(conn);
          const r = 2.5 + STROKE[conn.thickness] * 0.6;
          const dotStyle = { fill: conn.color, stroke: 'hsl(var(--canvas-bg))' };

          return (
            <g key={conn.id}>
              {arrowDir !== 'reverse' && arrowDir !== 'both' && (
                <circle cx={start.x} cy={start.y} r={r} strokeWidth={1.5} style={dotStyle} />
              )}
              {arrowDir !== 'forward' && arrowDir !== 'both' && (
                <circle cx={end.x} cy={end.y} r={r} strokeWidth={1.5} style={dotStyle} />
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export const ConnectionDots = memo(ConnectionDotsBase);


interface ConnectionHandlesProps {
  nodes: MindMapNode[];
  zoom: number;
  connectionStyle?: ConnectionStyle;
  selectedLineId?: string | null;
  visibleLineIds?: Set<string>;
  onSetConnectionSide?: (connectionId: string, endpoint: 'from' | 'to', side: Side | null) => void;
  onEndpointDragStart?: (connectionId: string, endpoint: 'from' | 'to', e: React.PointerEvent) => void;
  routing?: LineRouting;
  onDeleteLine?: (connectionId: string) => void;
}

const SIDES: Side[] = ['left', 'right', 'top', 'bottom'];

const DELETE_BUTTON_RADIUS = 11;

function ConnectionHandlesBase({
  nodes,
  zoom,
  connectionStyle = 'curved',
  selectedLineId,
  visibleLineIds,
  onSetConnectionSide,
  onEndpointDragStart,
  routing,
  onDeleteLine,
}: ConnectionHandlesProps) {
  const connections = useVisualConnections(nodes, connectionStyle);
  const conn = connections.find(c => c.id === selectedLineId);
  const pressRef = useRef<{ x: number; y: number } | null>(null);

  if (!conn) return null;
  if (visibleLineIds && !visibleLineIds.has(conn.id)) return null;

  const resolved = resolveConnection(conn.p, conn.c, conn.type, conn.tension, conn.fromOverride, conn.toOverride);
  const { a: fromAnchor, b: toAnchor } = resolved;
  const mid = routing?.routes.get(conn.id)?.mid ?? resolved.mid;
  const deleteY = mid.y - (conn.label ? LABEL_HEIGHT / 2 + (DELETE_BUTTON_RADIUS + 4) / zoom : 0);

  const renderDots = (node: MindMapNode, pinnedSide: Side | undefined, currentSide: Side, endpoint: 'from' | 'to') =>
    SIDES.filter(side => !onEndpointDragStart || side !== currentSide).map(side => {
      const { x, y } = getAnchor(node, side);
      const active = pinnedSide === side;
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
            <title>{active ? 'Pinned to this side. Click to unpin' : `Move this end to the ${side} side`}</title>
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
        </g>
      );
    });

  const renderEndpoint = (anchor: Anchor, pinned: boolean, endpoint: 'from' | 'to') => (
    <g key={`end-${endpoint}`}>
      <circle
        cx={anchor.x}
        cy={anchor.y}
        r={8 / zoom}
        fill={pinned ? '#f97316' : 'white'}
        stroke="#f97316"
        strokeWidth={2.5 / zoom}
        style={{ cursor: 'grab', pointerEvents: 'all' }}
        onMouseDown={e => e.stopPropagation()}
        onPointerDown={e => {
          e.stopPropagation();
          pressRef.current = { x: e.clientX, y: e.clientY };
          onEndpointDragStart?.(conn.id, endpoint, e);
        }}
        onClick={e => {
          e.stopPropagation();
          const press = pressRef.current;
          pressRef.current = null;
          if (!press || Math.hypot(e.clientX - press.x, e.clientY - press.y) > 3) return;
          onSetConnectionSide?.(conn.id, endpoint, pinned ? null : anchor.side);
        }}
      >
        <title>
          {pinned
            ? 'Pinned to this side. Click to unpin, or drag to connect this end to another block'
            : 'Click to pin this end to this side, or drag to connect it to another block'}
        </title>
      </circle>
      {pinned && (
        <circle cx={anchor.x} cy={anchor.y} r={2.5 / zoom} fill="white" style={{ pointerEvents: 'none' }} />
      )}
    </g>
  );

  const SIZE = 10000;
  const OFF = SIZE / 2;

  return (
    <svg
      className="absolute pointer-events-none overflow-visible"
      style={{ left: -OFF, top: -OFF, width: SIZE, height: SIZE, zIndex: 6 }}
    >
      <g transform={`translate(${OFF}, ${OFF})`}>
        {renderDots(conn.p, conn.fromOverride, fromAnchor.side, 'from')}
        {renderDots(conn.c, conn.toOverride, toAnchor.side, 'to')}
        {onEndpointDragStart && (
          <>
            {renderEndpoint(fromAnchor, !!conn.fromOverride, 'from')}
            {renderEndpoint(toAnchor, !!conn.toOverride, 'to')}
          </>
        )}
        {onDeleteLine && (
          <g
            transform={`translate(${mid.x} ${deleteY}) scale(${1 / zoom})`}
            role="button"
            aria-label="Delete this line"
            data-testid="delete-line"
            style={{ cursor: 'pointer', pointerEvents: 'all' }}
            onMouseDown={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDeleteLine(conn.id); }}
          >
            <title>Delete this line (Delete)</title>
            <circle r={DELETE_BUTTON_RADIUS} fill="white" stroke="#ef4444" strokeWidth={1.5} />
            <g
              transform="translate(-7 -7) scale(0.5833)"
              fill="none"
              stroke="#ef4444"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
            </g>
          </g>
        )}
      </g>
    </svg>
  );
}

export const ConnectionHandles = memo(ConnectionHandlesBase);
 