/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

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
            processShapeContents(rootShape, rootId, 0, nodes);
        } else if (typeof data === 'object' && data !== null) {
            processValue(data, rootId, 0, nodes);
        } else {
            nodes.push(createChildNode(String(data), rootId, 0));
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

interface TreeNodeShape {
    label: string;
    children: unknown[] | null;
    rest: Record<string, unknown>;
}

function getTreeNodeShape(value: unknown): TreeNodeShape | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    const obj = value as Record<string, unknown>;

    const labelKey = TREE_LABEL_KEYS.find(key => typeof obj[key] === 'string');
    if (!labelKey) return null;

    const childrenKey = TREE_CHILDREN_KEYS.find(key => Array.isArray(obj[key]));
    const rest = Object.fromEntries(Object.entries(obj).filter(([key]) => key !== labelKey));
    return {
        label: obj[labelKey] as string,
        children: childrenKey ? (obj[childrenKey] as unknown[]) : null,
        rest,
    };
}

function processShapeContents(shape: TreeNodeShape, nodeId: string, depth: number, nodes: MindMapNode[]): void {
    if (shape.children) {
        processArray(shape.children, nodeId, depth, nodes);
    } else if (Object.keys(shape.rest).length > 0) {
        processObject(shape.rest, nodeId, depth, nodes);
    }
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
            processShapeContents(shape, nodeId, depth + 1, nodes);
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
 