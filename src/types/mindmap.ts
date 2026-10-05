/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

export type NodeColor = 'teal' | 'purple' | 'orange' | 'pink' | 'blue' | 'green' | 'red' | 'cyan' | 'yellow' | 'grey' | 'lime' | 'indigo' | 'root';

export type NodeShape = 'rounded' | 'rectangle' | 'pill' | 'diamond' | 'hexagon' | 'circle' | 'parallelogram' | 'isometric' | 'cloud';

export type LineShape = 'curved' | 'orthogonal' | 'straight';

export type LinePattern = 'solid' | 'dashed' | 'dotted';

export type ConnectionStyle =
  | 'dashed' | 'dotted' | 'arrow'
  | `${LineShape}${'' | '-dashed' | '-dotted'}${'' | '-arrow'}`;

export type LineThickness = 'thin' | 'medium' | 'thick';

export type Side = 'left' | 'right' | 'top' | 'bottom';

export interface Relation {
  targetId: string;
  sourceId?: string;
  label?: string;
  type?: ConnectionStyle;
  pattern?: LinePattern;
  thickness?: LineThickness;
  color?: string;
  animated?: boolean;
  animationSpeed?: 'slow' | 'medium' | 'fast';
  animationDirection?: 'forward' | 'reverse';
  animationType?: 'dash' | 'arrow' | 'cross';
  arrowDirection?: 'none' | 'forward' | 'reverse' | 'both';
  sourceSide?: Side;
  targetSide?: Side;
}

export type NodePriority = 'high' | 'medium' | 'low' | null;

export type NodeStatus = 'backlog' | 'planning' | 'discussion' | 'in-progress' | 'review' | 'blocked' | 'done' | null;

export type NodeTask = 'open' | 'done';

export type NodeAnimation = 'ring' | 'snake' | 'blink';

export type TextAlign = 'left' | 'center' | 'right';

export type TextHeading = 'h1' | 'h2' | 'h3';

export type TextList = 'bullet' | 'numbered';

export type TextFont = 'default' | 'serif' | 'mono' | 'hand' | 'display';

export interface TextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  size?: number;
  font?: TextFont;
}

export interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  color: NodeColor;
  parentId: string | null;
  shape?: NodeShape;
  nodeAnimation?: NodeAnimation;
  lineType?: ConnectionStyle;
  linePattern?: LinePattern;
  lineThickness?: LineThickness;
  lineColor?: string;
  lineLabel?: string;
  lineAnimated?: boolean;
  lineGradient?: boolean;
  lineTension?: number;
  lineAnimationDirection?: 'forward' | 'reverse';
  lineAnimationType?: 'dash' | 'arrow' | 'cross';
  lineArrowDirection?: 'none' | 'forward' | 'reverse' | 'both';
  lineParentSide?: Side;
  lineChildSide?: Side;
  relations?: Relation[];
  width?: number;
  height?: number;
  measuredWidth?: number;
  measuredHeight?: number;

  image?: string;
  icon?: string;
  iconStyle?: 'plain' | 'boxed';
  link?: string;
  notes?: string;

  priority?: NodePriority;
  status?: NodeStatus;
  tags?: string[];
  task?: NodeTask;
  dueDate?: string;
  collapsed?: boolean;

  textBold?: boolean;
  textItalic?: boolean;
  textUnderline?: boolean;
  textStrike?: boolean;
  textAlign?: TextAlign;
  textHeading?: TextHeading;
  textList?: TextList;
  textSize?: number;
  textFont?: TextFont;
  textRuns?: TextRun[][];
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface SavedMindMap {
  id: string;
  name: string;
  nodes: MindMapNode[];
  connectionStyle: ConnectionStyle;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  drawings?: Drawing[];
  boxAreas?: BoxArea[];
  viewport?: Viewport;
  schemaVersion?: number;
}

export interface Drawing {

  id: string;
  points: { x: number, y: number }[];
  color: string;
  width?: number;
}

export interface BoxArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: string;
}
 