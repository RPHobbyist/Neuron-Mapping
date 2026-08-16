import DOMPurify from 'dompurify';

import { generateId } from '@/utils/common';
import { MindMapNode, NodeColor } from '@/types/mindmap';

// Color palette for depth-based coloring
const colors: NodeColor[] = ['orange', 'blue', 'cyan', 'yellow', 'green', 'purple', 'pink', 'red', 'teal', 'grey'];

/**
 * Get color based on depth in the tree.
 */
export const getColorByDepth = (depth: number): NodeColor => colors[depth % colors.length];

/**
 * Sanitize text input to prevent XSS via imported files.
 */
export const sanitizeText = (text: string): string => {
    if (!text) return '';
    return DOMPurify.sanitize(text, { USE_PROFILES: { html: false } }); // Strip all HTML tags, only allow text
};

/**
 * Create a root node with standard properties.
 */
export const createRootNode = (text: string): MindMapNode => ({
    id: generateId(),
    text: sanitizeText(text),
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
    text: sanitizeText(text),
    x: 0,
    y: 0,
    color: getColorByDepth(depth),
    parentId
});

export { generateId };
