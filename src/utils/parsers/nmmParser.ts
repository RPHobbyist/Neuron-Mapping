import { MindMapNode } from '@/types/mindmap';
import { z } from 'zod';
import { MindMapNodeSchema as NodeSchema } from '@/lib/schemas';
import { generateId } from '@/utils/common';

const MindMapFileSchema = z.object({
    nodes: z.array(NodeSchema),
});

function remapNodeIds(nodes: MindMapNode[]): MindMapNode[] {
    const idMap = new Map<string, string>();
    nodes.forEach(n => idMap.set(n.id, generateId()));

    return nodes.map(n => ({
        ...n,
        id: idMap.get(n.id)!,
        parentId: n.parentId ? (idMap.get(n.parentId) ?? n.parentId) : n.parentId,
        relations: n.relations?.map(r => ({
            ...r,
            targetId: idMap.get(r.targetId) ?? r.targetId,
            sourceId: r.sourceId ? (idMap.get(r.sourceId) ?? r.sourceId) : r.sourceId,
        })),
    }));
}

export function parseNMM(content: string): MindMapNode[] {
    try {
        const parsed = JSON.parse(content);
        const data = MindMapFileSchema.parse(parsed);
        return remapNodeIds(data.nodes as MindMapNode[]);
    } catch (error) {
        console.error('NMM Parse Error:', error);
        try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
                return remapNodeIds(z.array(NodeSchema).parse(parsed) as MindMapNode[]);
            }
        } catch (e) {
        }
        return [];
    }
}
