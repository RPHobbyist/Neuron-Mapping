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

import { buildOutline, OutlineItem, walkOutline } from './outline';
import { toText } from './text';

const escapeHtml = (text: string) => text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const toHtmlList = (items: OutlineItem[]): string => {
    const parts = ['<ul>'];
    walkOutline(items, (item) => {
        parts.push(`<li>${escapeHtml(item.node.text.replace(/\s*\n\s*/g, ' ').trim())}`);
        if (item.children.length > 0) parts.push('<ul>');
    }, 0, (item) => {
        parts.push(item.children.length > 0 ? '</ul></li>' : '</li>');
    });
    parts.push('</ul>');
    return parts.join('');
};

export const toClipboardOutline = (nodes: MindMapNode[]): { text: string; html: string } => {
    const outline = buildOutline(nodes);
    return { text: toText(nodes).trimEnd(), html: toHtmlList(outline) };
};

