/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { z } from 'zod';

import { DETACHED_PARENT_ID } from '@/lib/constants';
import { generateId, sanitizeUrl, sanitizeImageUrl } from '@/utils/common';
import { sanitizeText } from '@/utils/parsers/parserUtils';
import { isConnectionStyle } from '@/utils/lineStyle';
import type { ConnectionStyle } from '@/types/mindmap';

export const ConnectionStyleSchema = z.custom<ConnectionStyle>(isConnectionStyle);
const optionalConnectionStyle = ConnectionStyleSchema.optional().catch(undefined);
const LINE_PATTERNS = ['solid', 'dashed', 'dotted'] as const;

const SIDES = ['left', 'right', 'top', 'bottom'] as const;
const THICKNESSES = ['thin', 'medium', 'thick'] as const;
const DIRECTIONS = ['forward', 'reverse'] as const;
const ANIMATION_TYPES = ['dash', 'arrow', 'cross'] as const;
const ARROW_DIRECTIONS = ['none', 'forward', 'reverse', 'both'] as const;
const SHAPES = ['rounded', 'rectangle', 'pill', 'diamond', 'hexagon', 'circle', 'parallelogram', 'isometric', 'cloud', 'iso-cube'] as const;
const STATUSES = ['backlog', 'planning', 'discussion', 'in-progress', 'review', 'blocked', 'done'] as const;
const FONTS = ['default', 'serif', 'mono', 'hand', 'display'] as const;
const TASKS = ['open', 'done'] as const;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
    z.enum(values).optional().catch(undefined);

const optionalBoolean = z.boolean().optional().catch(undefined);
const optionalString = z.string().optional().catch(undefined);
const optionalText = optionalString.transform(v => (v ? sanitizeText(v) : v));
const coordinate = z.number().finite().catch(0);
const optionalSize = z.number().finite().positive().optional().catch(undefined);
const optionalNumber = z.number().finite().optional().catch(undefined);
const id = z.string().min(1).catch(() => generateId());

const COLOR_RE = /^(#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|[a-z]+)$/i;
const color = z.string().trim().regex(COLOR_RE);
const optionalColor = color.optional().catch(undefined);

export const tolerantArray = <T extends z.ZodTypeAny>(item: T) =>
    z.array(z.unknown()).transform(entries => entries.flatMap((entry) => {
        const result = item.safeParse(entry);
        return result.success ? [result.data as z.output<T>] : [];
    }));

const tolerantStrings = z.array(z.unknown()).optional().catch(undefined).transform(entries =>
    entries?.filter((v): v is string => typeof v === 'string').map(sanitizeText).filter(Boolean));

export const RelationSchema = z.object({
    targetId: z.string().min(1),
    sourceId: optionalString,
    label: optionalText,
    type: optionalConnectionStyle,
    pattern: optionalEnum(LINE_PATTERNS),
    thickness: optionalEnum(THICKNESSES),
    color: optionalColor,
    animated: optionalBoolean,
    animationSpeed: optionalEnum(['slow', 'medium', 'fast'] as const),
    animationDirection: optionalEnum(DIRECTIONS),
    animationType: optionalEnum(ANIMATION_TYPES),
    arrowDirection: optionalEnum(ARROW_DIRECTIONS),
    sourceSide: optionalEnum(SIDES),
    targetSide: optionalEnum(SIDES),
}).passthrough();

export const TextRunSchema = z.object({
    text: z.string().catch('').transform(v => sanitizeText(v)),
    bold: optionalBoolean,
    italic: optionalBoolean,
    underline: optionalBoolean,
    strike: optionalBoolean,
    size: optionalSize,
    font: optionalEnum(FONTS),
});

export const MindMapNodeSchema = z.object({
    id,
    text: z.string().catch('').transform(v => sanitizeText(v)),
    x: coordinate,
    y: coordinate,
    color: color.catch('grey'),
    parentId: z.union([z.string(), z.null()]).optional().transform(v => v ?? null).catch(DETACHED_PARENT_ID),
    shape: optionalEnum(SHAPES),
    nodeAnimation: optionalEnum(['ring', 'snake', 'blink'] as const),
    lineType: optionalConnectionStyle,
    linePattern: optionalEnum(LINE_PATTERNS),
    lineThickness: optionalEnum(THICKNESSES),
    lineColor: optionalColor,
    lineLabel: optionalText,
    lineAnimated: optionalBoolean,
    lineGradient: optionalBoolean,
    lineTension: optionalNumber,
    lineAnimationDirection: optionalEnum(DIRECTIONS),
    lineAnimationType: optionalEnum(ANIMATION_TYPES),
    lineArrowDirection: optionalEnum(ARROW_DIRECTIONS),
    lineParentSide: optionalEnum(SIDES),
    lineChildSide: optionalEnum(SIDES),
    relations: tolerantArray(RelationSchema).optional().catch(undefined),
    width: optionalSize,
    height: optionalSize,
    measuredWidth: optionalSize,
    measuredHeight: optionalSize,
    image: optionalString.transform(v => sanitizeImageUrl(v)),
    icon: optionalString,
    iconStyle: optionalEnum(['plain', 'boxed'] as const),
    link: optionalString.transform(v => sanitizeUrl(v)),
    notes: optionalText,
    priority: z.enum(['high', 'medium', 'low']).nullable().optional().catch(undefined),
    status: z.enum(STATUSES).nullable().optional().catch(undefined),
    tags: tolerantStrings,
    task: optionalEnum(TASKS),
    dueDate: z.string().regex(DAY_RE).optional().catch(undefined),
    collapsed: optionalBoolean,
    textBold: optionalBoolean,
    textItalic: optionalBoolean,
    textUnderline: optionalBoolean,
    textStrike: optionalBoolean,
    textAlign: optionalEnum(['left', 'center', 'right'] as const),
    textHeading: optionalEnum(['h1', 'h2', 'h3'] as const),
    textList: optionalEnum(['bullet', 'numbered'] as const),
    textSize: optionalSize,
    textFont: optionalEnum(FONTS),
    textRuns: z.array(z.array(TextRunSchema)).optional().catch(undefined),
}).passthrough();

export const DrawingSchema = z.object({
    id,
    points: tolerantArray(z.object({ x: z.number().finite(), y: z.number().finite() })),
    color: color.catch('#ef4444'),
    width: optionalSize,
}).passthrough();

export const BoxAreaSchema = z.object({
    id,
    x: coordinate,
    y: coordinate,
    width: z.number().finite().positive().catch(120),
    height: z.number().finite().positive().catch(80),
    label: z.string().catch('Box Area').transform(v => sanitizeText(v)),
    color: color.catch('#6b7280'),
}).passthrough();
