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

import {
  Anchor, LineRouting, clipPolyline, getAnchor, getDash, pathLength, resolveArrowDirection, resolveConnection, routePolyline,
  useVisualConnections,
} from './lineRouting';

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
  ARROW_EXTRA_COUNT: 4,

  CROSS_SPACING: 80,
  CROSS_EXTRA_COUNT: 4,

  MAX_ANIMATED_GLYPHS: 400,

  DASH_PATTERN: '10 5',
} as const;


const LINE_MARGIN = 60;

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

  const dashedParts = useMemo(() => {
    const parts = new Map<string, { runs: { d: string; offset: number }[]; hasStart: boolean; hasEnd: boolean }>();
    if (!viewBox) return parts;
    const clip = { x1: viewBox.x1 - LINE_MARGIN, y1: viewBox.y1 - LINE_MARGIN, x2: viewBox.x2 + LINE_MARGIN, y2: viewBox.y2 + LINE_MARGIN };
    shown.forEach((conn) => {
      const pattern = conn.animated && conn.animationType === 'dash' ? ANIMATION_CONFIG.DASH_PATTERN : getDash(conn.type);
      if (!pattern) return;
      const route = routes.get(conn.id)!;
      const { box } = route;
      if (box.x1 >= clip.x1 && box.y1 >= clip.y1 && box.x2 <= clip.x2 && box.y2 <= clip.y2) return;
      const period = pattern.split(/\s+/).map(Number).reduce((sum, n) => sum + n, 0) || 1;
      const runs = clipPolyline(routePolyline(route, 8), clip);
      const lastRun = runs[runs.length - 1];
      const last = lastRun?.points[lastRun.points.length - 1];
      parts.set(conn.id, {
        runs: runs.map(run => ({
          d: `M ${run.points.map(p => `${p.x} ${p.y}`).join(' L ')}`,
          offset: run.start % period,
        })),
        hasStart: runs[0]?.start === 0,
        hasEnd: !!last && Math.hypot(last.x - route.b.x, last.y - route.b.y) < 0.5,
      });
    });
    return parts;
  }, [shown, routes, viewBox]);

  const SIZE = 10000;
  const OFF = SIZE / 2;

  return (
    <svg
      className="absolute pointer-events-none overflow-visible"
      style={{ left: -OFF, top: -OFF, width: SIZE, height: SIZE }}
    >
      <defs>
        {shown.filter(conn => conn.animationType === 'arrow' || resolveArrowDirection(conn) !== 'none').flatMap((conn) => {
          const safeMarkerId = conn.id.replace(/::/g, '_');
          const heads = conn.startColor
            ? [{ id: `arrow-${safeMarkerId}`, fill: conn.color }, { id: `arrow-start-${safeMarkerId}`, fill: conn.startColor }]
            : [{ id: `arrow-${safeMarkerId}`, fill: conn.color }];
          return heads.map(head => (
            <marker
              key={head.id}
              id={head.id}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 Q 4 5 0 0" fill={head.fill} />
            </marker>
          ));
        })}
      </defs>
      <g transform={`translate(${OFF}, ${OFF})`}>
        {shown.map((conn) => {
          const { id, type, color, startColor, thickness, animated, animationType, animationDirection } = conn;
          const safeId = id.replace(/::/g, '_');

          const width = STROKE[thickness];
          const dash = getDash(type);
          const { path, a, b, mid } = routes.get(id)!;
          const sel = selectedLineId === id;

          const arrowDir = animated && animationType === 'arrow' ? 'none' : resolveArrowDirection(conn);
          const showEndArrow = arrowDir === 'forward' || arrowDir === 'both';
          const showStartArrow = arrowDir === 'reverse' || arrowDir === 'both';

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
              {(dashedParts.get(id)?.runs ?? [{ d: path, offset: 0 }]).map((run, index, runs) => {
                const part = dashedParts.get(id);
                const isFirst = index === 0;
                const isLast = index === runs.length - 1;
                return (
                  <path
                    key={index}
                    id={isFirst ? `path-${safeId}` : undefined}
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
                    markerEnd={showEndArrow && isLast && (!part || part.hasEnd) ? `url(#arrow-${safeId})` : undefined}
                    markerStart={showStartArrow && isFirst && (!part || part.hasStart) ? `url(#arrow-${startColor ? 'start-' : ''}${safeId})` : undefined}
                  />
                );
              })}

              {animated && animationType === 'arrow' && (() => {
                const lineLength = type === 'orthogonal' ? pathLength(path) : Math.hypot(b.x - a.x, b.y - a.y);
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
                const lineLength = type === 'orthogonal' ? pathLength(path) : Math.hypot(b.x - a.x, b.y - a.y);
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
                    strokeWidth="4"
                    strokeLinejoin="round"
                    fontSize="12"
                    fontWeight="500"
                    style={{ pointerEvents: 'none', stroke: 'hsl(var(--canvas-bg))' }}
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
}

const SIDES: Side[] = ['left', 'right', 'top', 'bottom'];

function ConnectionHandlesBase({
  nodes,
  zoom,
  connectionStyle = 'curved',
  selectedLineId,
  visibleLineIds,
  onSetConnectionSide,
  onEndpointDragStart,
}: ConnectionHandlesProps) {
  const connections = useVisualConnections(nodes, connectionStyle);
  const conn = connections.find(c => c.id === selectedLineId);
  const pressRef = useRef<{ x: number; y: number } | null>(null);

  if (!conn) return null;
  if (visibleLineIds && !visibleLineIds.has(conn.id)) return null;

  const { a: fromAnchor, b: toAnchor } = resolveConnection(conn.p, conn.c, conn.type, conn.tension, conn.fromOverride, conn.toOverride);

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
      </g>
    </svg>
  );
}

export const ConnectionHandles = memo(ConnectionHandlesBase);
 