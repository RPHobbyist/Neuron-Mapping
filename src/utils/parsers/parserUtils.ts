import DOMPurify from 'dompurify';

import { generateId } from '@/utils/common';
import { MindMapNode, NodeColor } from '@/types/mindmap';

const colors: NodeColor[] = ['orange', 'blue', 'cyan', 'yellow', 'green', 'purple', 'pink', 'red', 'teal', 'grey'];

export const getColorByDepth = (depth: number): NodeColor => colors[depth % colors.length];

export const sanitizeText = (text: string): string => {
    if (!text) return '';
    return DOMPurify.sanitize(text, { USE_PROFILES: { html: false } });
};

export const createRootNode = (text: string): MindMapNode => ({
    id: generateId(),
    text: sanitizeText(text),
    x: 0,
    y: 0,
    color: 'root',
    parentId: null
});

export const createChildNode = (text: string, parentId: string, depth: number): MindMapNode => ({
    id: generateId(),
    text: sanitizeText(text),
    x: 0,
    y: 0,
    color: getColorByDepth(depth),
    parentId
});

export { generateId };
 