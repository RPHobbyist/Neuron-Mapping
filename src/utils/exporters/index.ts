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
import { buildExportFileName, downloadBlob } from '@/utils/exportUtils';

import { toCSV } from './csv';
import { toMarkdown } from './markdown';
import { toOPML } from './opml';
import { toText } from './text';

export { buildOutline } from './outline';
export { toCSV, toMarkdown, toOPML, toText };

export type OutlineFormat = 'md' | 'opml' | 'txt' | 'csv';

export const OUTLINE_FORMATS: { format: OutlineFormat; name: string; hint: string }[] = [
    { format: 'md', name: 'Markdown', hint: 'Headings, lists, notes and links' },
    { format: 'opml', name: 'OPML', hint: 'For other outliner apps' },
    { format: 'txt', name: 'Plain text', hint: 'Topics indented with tabs' },
    { format: 'csv', name: 'CSV', hint: 'For spreadsheets' },
];

const FORMATS: Record<OutlineFormat, { type: string; build: (nodes: MindMapNode[], mapName: string) => string }> = {
    md: { type: 'text/markdown', build: toMarkdown },
    opml: { type: 'text/x-opml', build: toOPML },
    txt: { type: 'text/plain', build: toText },
    csv: { type: 'text/csv', build: toCSV },
};

export const exportOutline = (nodes: MindMapNode[], mapName: string, format: OutlineFormat): void => {
    const { type, build } = FORMATS[format];
    const blob = new Blob([build(nodes, mapName)], { type: `${type};charset=utf-8` });
    downloadBlob(blob, buildExportFileName(mapName, format));
};
