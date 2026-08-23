import { z } from 'zod';

import { sanitizeUrl, sanitizeImageUrl } from '@/utils/common';
import { sanitizeText } from '@/utils/parsers/parserUtils';

export const ConnectionStyleSchema = z.enum(['curved', 'straight', 'orthogonal', 'dashed', 'dotted', 'arrow']);

export const RelationSchema = z.object({
    targetId: z.string(),
    sourceId: z.string().optional(),
    label: z.string().optional().transform(v => v ? sanitizeText(v) : v),
    type: z.string().optional(),
    thickness: z.string().optional(),
    color: z.string().optional(),
    animated: z.boolean().optional(),
    animationSpeed: z.string().optional(),
    animationDirection: z.string().optional(),
    animationType: z.string().optional(),
    arrowDirection: z.string().optional(),
    sourceSide: z.string().optional(),
    targetSide: z.string().optional(),
});

export const MindMapNodeSchema = z.object({
    id: z.string(),
    text: z.string().transform(v => sanitizeText(v)),
    x: z.number(),
    y: z.number(),
    color: z.string(),
    parentId: z.string().nullable(),
    shape: z.string().optional(),
    nodeAnimation: z.string().optional(),
    lineType: z.string().optional(),
    lineThickness: z.string().optional(),
    lineColor: z.string().optional(),
    lineLabel: z.string().optional(),
    lineAnimated: z.boolean().optional(),
    lineDouble: z.boolean().optional(),
    lineGradient: z.boolean().optional(),
    lineTension: z.number().optional(),
    lineAnimationDirection: z.string().optional(),
    lineAnimationType: z.string().optional(),
    lineArrowDirection: z.string().optional(),
    lineParentSide: z.string().optional(),
    lineChildSide: z.string().optional(),
    relations: z.array(RelationSchema).optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    measuredWidth: z.number().optional(),
    measuredHeight: z.number().optional(),
    image: z.string().optional().transform(v => sanitizeImageUrl(v)),
    icon: z.string().optional(),
    iconStyle: z.string().optional(),
    link: z.string().optional().transform(v => sanitizeUrl(v)),
    notes: z.string().optional().transform(v => v ? sanitizeText(v) : v),
    priority: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
}).passthrough();

export const DrawingSchema = z.object({
    id: z.string(),
    points: z.array(z.object({
        x: z.number(),
        y: z.number(),
    })),
    color: z.string(),
});
 