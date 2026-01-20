import { MindMapNode } from '@/types/mindmap';
import { createRootNode, createChildNode, generateId, getColorByDepth } from './parserUtils';

/**
 * Parse JSON content recursively into mind map nodes.
 */
export function parseJSON(content: string): MindMapNode[] {
    try {
        const data = JSON.parse(content);
        const nodes: MindMapNode[] = [];
        const rootId = generateId();

        // Determine root label
        const rootName = Array.isArray(data)
            ? 'Array'
            : (typeof data === 'object' && data !== null)
                ? 'Root'
                : 'Value';

        nodes.push({
            ...createRootNode(rootName),
            id: rootId
        });

        processValue(data, rootId, 0, nodes);
        return nodes;
    } catch (error) {
        console.error('JSON Parse Error:', error);
        return [];
    }
}

function processValue(value: unknown, parentId: string, depth: number, nodes: MindMapNode[]): void {
    if (Array.isArray(value)) {
        processArray(value, parentId, depth, nodes);
    } else if (typeof value === 'object' && value !== null) {
        processObject(value as Record<string, unknown>, parentId, depth, nodes);
    }
}

function processArray(arr: unknown[], parentId: string, depth: number, nodes: MindMapNode[]): void {
    arr.forEach((item, index) => {
        const isLeaf = typeof item !== 'object' || item === null;
        const nodeId = generateId();

        nodes.push({
            id: nodeId,
            text: isLeaf ? String(item) : `[${index}]`,
            x: 0,
            y: 0,
            color: getColorByDepth(depth),
            parentId
        });

        if (!isLeaf) {
            processValue(item, nodeId, depth + 1, nodes);
        }
    });
}

function processObject(obj: Record<string, unknown>, parentId: string, depth: number, nodes: MindMapNode[]): void {
    Object.entries(obj).forEach(([key, value]) => {
        const nodeId = generateId();

        nodes.push({
            id: nodeId,
            text: key,
            x: 0,
            y: 0,
            color: getColorByDepth(depth),
            parentId
        });

        if (typeof value === 'object' && value !== null) {
            processValue(value, nodeId, depth + 1, nodes);
        } else {
            // Create leaf node for primitive values
            const leafId = generateId();
            nodes.push({
                id: leafId,
                text: String(value),
                x: 0,
                y: 0,
                color: getColorByDepth(depth + 1),
                parentId: nodeId
            });
        }
    });
}
