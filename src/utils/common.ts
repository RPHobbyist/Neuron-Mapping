import { MindMapNode } from '@/types/mindmap';

export const generateId = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
};

const DATA_IMAGE_URI_RE = /^data:image\/(png|jpe?g|gif|webp|bmp|x-icon);base64,[A-Za-z0-9+/]+=*$/;

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

export const sanitizeImageUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    const trimmed = url.trim();
    if (DATA_IMAGE_URI_RE.test(trimmed)) {
        return trimmed;
    }
    return sanitizeUrl(trimmed);
};

export const sanitizeUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;

    const trimmed = url.trim();

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
        if (/^[a-zA-Z0-9.\-_~+/?#&%=]+$/.test(trimmed) && !trimmed.includes(':')) {
            return trimmed;
        }
    }

    return undefined;
};


export const getDescendantIds = (nodeId: string, nodes: MindMapNode[]): string[] => {
    const children = nodes.filter(n => n.parentId === nodeId);
    return [nodeId, ...children.flatMap(child => getDescendantIds(child.id, nodes))];
};

export const findRootNode = (nodes: MindMapNode[]): MindMapNode | undefined => {
    return nodes.find(n => n.parentId === null || n.parentId === undefined);
};

export const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
};

export const lerp = (start: number, end: number, t: number): number => {
    return start + (end - start) * t;
};

 