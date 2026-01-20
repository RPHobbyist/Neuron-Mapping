import { MindMapNode, NodeColor } from '@/types/mindmap';
import { generateId } from '@/utils/common';

// Color palette for depth-based coloring
const colors: NodeColor[] = ['orange', 'blue', 'cyan', 'yellow', 'green', 'purple', 'pink', 'red', 'teal', 'grey'];

/**
 * Get color based on depth in the tree.
 */
export const getColorByDepth = (depth: number): NodeColor => colors[depth % colors.length];

/**
 * Create a root node with standard properties.
 */
export const createRootNode = (text: string): MindMapNode => ({
    id: generateId(),
    text,
    x: 0,
    y: 0,
    color: 'orange',
    parentId: null
});

/**
 * Create a child node with standard properties.
 */
export const createChildNode = (text: string, parentId: string, depth: number): MindMapNode => ({
    id: generateId(),
    text,
    x: 0,
    y: 0,
    color: getColorByDepth(depth),
    parentId
});

export { generateId };
