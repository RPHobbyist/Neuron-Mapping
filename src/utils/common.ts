import { MindMapNode } from '@/types/mindmap';

/**
 * Generate a unique ID for nodes and other entities.
 * Uses a combination of timestamp and random characters for uniqueness.
 */
export const generateId = (): string => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get all descendant node IDs for a given node (recursive).
 * Includes the node itself in the returned array.
 */
export const getDescendantIds = (nodeId: string, nodes: MindMapNode[]): string[] => {
    const children = nodes.filter(n => n.parentId === nodeId);
    return [nodeId, ...children.flatMap(child => getDescendantIds(child.id, nodes))];
};

/**
 * Get all ancestor node IDs for a given node (walking up the tree).
 * Does NOT include the node itself.
 */
export const getAncestorIds = (nodeId: string, nodes: MindMapNode[]): string[] => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.parentId) return [];
    return [node.parentId, ...getAncestorIds(node.parentId, nodes)];
};

/**
 * Find the root node of the tree.
 */
export const findRootNode = (nodes: MindMapNode[]): MindMapNode | undefined => {
    return nodes.find(n => n.parentId === null || n.parentId === undefined);
};

/**
 * Get direct children of a node.
 */
export const getChildren = (nodeId: string, nodes: MindMapNode[]): MindMapNode[] => {
    return nodes.filter(n => n.parentId === nodeId);
};

/**
 * Calculate the depth of a node in the tree.
 */
export const getNodeDepth = (nodeId: string, nodes: MindMapNode[]): number => {
    return getAncestorIds(nodeId, nodes).length;
};

/**
 * Check if a node is a leaf (has no children).
 */
export const isLeafNode = (nodeId: string, nodes: MindMapNode[]): boolean => {
    return !nodes.some(n => n.parentId === nodeId);
};

/**
 * Count total nodes in a subtree (including root).
 */
export const countSubtreeNodes = (nodeId: string, nodes: MindMapNode[]): number => {
    return getDescendantIds(nodeId, nodes).length;
};

/**
 * Clamp a value between min and max.
 */
export const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
};

/**
 * Linear interpolation between two values.
 */
export const lerp = (start: number, end: number, t: number): number => {
    return start + (end - start) * t;
};
