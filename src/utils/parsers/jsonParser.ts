import { MindMapNode } from '@/types/mindmap';
import { createRootNode, createChildNode, generateId, getColorByDepth, sanitizeText } from './parserUtils';

export function parseJSON(content: string): MindMapNode[] {
    try {
        const data = JSON.parse(content);
        const nodes: MindMapNode[] = [];
        const rootId = generateId();

        const rootShape = getTreeNodeShape(data);

        const rootName = rootShape
            ? rootShape.label
            : Array.isArray(data)
                ? 'Array'
                : (typeof data === 'object' && data !== null)
                    ? 'Root'
                    : 'Value';

        nodes.push({
            ...createRootNode(rootName),
            id: rootId
        });

        if (rootShape) {
            processArray(rootShape.children, rootId, 0, nodes);
        } else {
            processValue(data, rootId, 0, nodes);
        }
        return nodes;
    } catch (error) {
        console.error('JSON Parse Error:', error);
        return [];
    }
}

const MAX_DEPTH = 50;

const TREE_LABEL_KEYS = ['text', 'name', 'title', 'label'];
const TREE_CHILDREN_KEYS = ['children', 'items', 'nodes'];

function getTreeNodeShape(value: unknown): { label: string; children: unknown[] } | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    const obj = value as Record<string, unknown>;

    const labelKey = TREE_LABEL_KEYS.find(key => typeof obj[key] === 'string');
    if (!labelKey) return null;

    const childrenKey = TREE_CHILDREN_KEYS.find(key => Array.isArray(obj[key]));
    return {
        label: obj[labelKey] as string,
        children: childrenKey ? (obj[childrenKey] as unknown[]) : []
    };
}

function processValue(value: unknown, parentId: string, depth: number, nodes: MindMapNode[]): void {
    if (depth > MAX_DEPTH) return;
    if (Array.isArray(value)) {
        processArray(value, parentId, depth, nodes);
    } else if (typeof value === 'object' && value !== null) {
        processObject(value as Record<string, unknown>, parentId, depth, nodes);
    }
}

function processArray(arr: unknown[], parentId: string, depth: number, nodes: MindMapNode[]): void {
    if (depth > MAX_DEPTH) return;
    arr.forEach((item, index) => {
        const shape = getTreeNodeShape(item);
        if (shape) {
            const nodeId = generateId();
            nodes.push({
                id: nodeId,
                text: sanitizeText(shape.label),
                x: 0,
                y: 0,
                color: getColorByDepth(depth),
                parentId
            });
            if (shape.children.length > 0) {
                processArray(shape.children, nodeId, depth + 1, nodes);
            }
            return;
        }

        const isLeaf = typeof item !== 'object' || item === null;
        const nodeId = generateId();

        nodes.push({
            id: nodeId,
            text: sanitizeText(isLeaf ? String(item) : `[${index}]`),
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
            text: sanitizeText(key),
            x: 0,
            y: 0,
            color: getColorByDepth(depth),
            parentId
        });

        if (typeof value === 'object' && value !== null) {
            processValue(value, nodeId, depth + 1, nodes);
        } else {
            const leafId = generateId();
            nodes.push({
                id: leafId,
                text: sanitizeText(String(value)),
                x: 0,
                y: 0,
                color: getColorByDepth(depth + 1),
                parentId: nodeId
            });
        }
    });
}
