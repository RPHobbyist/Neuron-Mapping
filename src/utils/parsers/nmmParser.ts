import { MindMapNode } from '@/types/mindmap';
import { z } from 'zod';
import { sanitizeUrl } from '@/utils/common';

// Re-use NodeSchema from exportUtils for consistency
const NodeSchema = z.object({
    id: z.string(),
    text: z.string(),
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
    relations: z.array(z.unknown()).optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    measuredWidth: z.number().optional(),
    measuredHeight: z.number().optional(),
    image: z.string().optional().transform(v => sanitizeUrl(v)),
    icon: z.string().optional(),
    iconStyle: z.string().optional(),
    link: z.string().optional().transform(v => sanitizeUrl(v)),
    notes: z.string().optional(),
    priority: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
});

const MindMapFileSchema = z.object({
    nodes: z.array(NodeSchema),
});

/**
 * Parse .nmm (Neuron Mind Map) JSON content.
 * Extracts the 'nodes' array for use in the mind map canvas.
 */
export function parseNMM(content: string): MindMapNode[] {
    try {
        const parsed = JSON.parse(content);
        const data = MindMapFileSchema.parse(parsed);
        return data.nodes as MindMapNode[];
    } catch (error) {
        console.error('NMM Parse Error:', error);
        // Fallback: If it's a valid JSON array of nodes, return it
        try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
                return parsed as MindMapNode[];
            }
        } catch (e) {
            // Ignore fallback error
        }
        return [];
    }
}
