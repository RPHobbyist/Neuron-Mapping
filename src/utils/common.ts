import { MindMapNode } from '@/types/mindmap';

/**
 * Generate a unique ID for nodes and other entities.
 * Uses a combination of timestamp and random characters for uniqueness.
 */
export const generateId = (): string => {
    // Prefer crypto.randomUUID if available for better collision resistance
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
};

// data:image/<type>;base64,<payload> — restricted to raster formats FileReader.readAsDataURL()
// produces from an <input accept="image/*"> upload. svg+xml is intentionally excluded.
const DATA_IMAGE_URI_RE = /^data:image\/(png|jpe?g|gif|webp|bmp|x-icon);base64,[A-Za-z0-9+/]+=*$/;

/**
 * Given a hex background color, returns '#000000' or '#ffffff' — whichever
 * gives better text contrast — using the WCAG relative luminance formula.
 */
export const getContrastTextColor = (hexColor: string): string => {
    const hex = hexColor.replace('#', '');
    const normalized = hex.length === 3
        ? hex.split('').map((c) => c + c).join('')
        : hex;
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return '#ffffff';

    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.6 ? '#000000' : '#ffffff';
};

/**
 * Sanitize an uploaded node image. Accepts base64 data: image URIs (the format
 * FileReader produces) in addition to whatever sanitizeUrl already allows, since
 * sanitizeUrl's http/https/mailto/tel allow-list otherwise strips every uploaded image.
 */
export const sanitizeImageUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    const trimmed = url.trim();
    if (DATA_IMAGE_URI_RE.test(trimmed)) {
        return trimmed;
    }
    return sanitizeUrl(trimmed);
};

/**
 * Sanitize a URL to prevent javascript: and other dangerous protocols.
 * Also ensures it's a valid URL or a relative path.
 */
export const sanitizeUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;

    const trimmed = url.trim();

    // Allow relative paths starting with /
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
        return trimmed;
    }

    try {
        const parsed = new URL(trimmed);
        const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
        if (allowedProtocols.includes(parsed.protocol)) {
            return trimmed;
        }
    } catch (e) {
        // Not a valid absolute URL, check if it's a valid relative path without protocol
        if (/^[a-zA-Z0-9.\-_~+/?#&%=]+$/.test(trimmed) && !trimmed.includes(':')) {
            return trimmed;
        }
    }

    return undefined;
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
