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
import { parseTextFile } from './textParser';
import { parseMarkdown } from './markdownParser';
import { parseJSON } from './jsonParser';
import { parseCSV } from './csvParser';
import { parseXML } from './xmlParser';
import { parseNMM } from './nmmParser';
import { parseFreeMind } from './freemindParser';

export { parseTextFile } from './textParser';
export { parseMarkdown } from './markdownParser';
export { parseJSON } from './jsonParser';
export { parseCSV } from './csvParser';
export { parseXML } from './xmlParser';
export { parseNMM } from './nmmParser';
export { parseFreeMind } from './freemindParser';

export const SUPPORTED_EXTENSIONS = ['txt', 'md', 'markdown', 'json', 'csv', 'xml', 'opml', 'nmm', 'mm', 'xmind'] as const;
export type SupportedExtension = typeof SUPPORTED_EXTENSIONS[number];
export type TextExtension = Exclude<SupportedExtension, 'xmind'>;

export function isSupportedExtension(ext: string): ext is SupportedExtension {
    return SUPPORTED_EXTENSIONS.includes(ext.toLowerCase() as SupportedExtension);
}

export async function parseFile(file: File): Promise<MindMapNode[]> {
    const extension = getFileExtension(file.name);

    if (!extension || !isSupportedExtension(extension)) {
        throw new Error(`Unsupported file type: .${extension || 'unknown'}`);
    }

    if (extension === 'xmind') {
        const { parseXMind } = await import('./xmindParser');
        return parseXMind(new Uint8Array(await file.arrayBuffer()), getBaseName(file.name));
    }
    return parseContent(await file.text(), extension, getBaseName(file.name));
}

export function parseContent(rawContent: string, format: TextExtension, title?: string): MindMapNode[] {
    const content = rawContent.replace(/^\uFEFF/, '');
    switch (format) {
        case 'txt':
            return parseTextFile(content);
        case 'md':
        case 'markdown':
            return parseMarkdown(content, title);
        case 'json':
            return parseJSON(content);
        case 'csv':
            return parseCSV(content, title);
        case 'xml':
        case 'opml':
            return parseXML(content, title);
        case 'nmm':
            return parseNMM(content);
        case 'mm':
            return parseFreeMind(content, title);
        default:
            throw new Error(`Unsupported format: ${format}`);
    }
}

function getFileExtension(filename: string): string | undefined {
    return filename.split('.').pop()?.toLowerCase();
}

function getBaseName(filename: string): string | undefined {
    const base = filename.replace(/\.[^.]+$/, '').trim();
    return base || undefined;
}
