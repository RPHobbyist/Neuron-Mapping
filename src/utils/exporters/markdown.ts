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

import { buildOutline, walkOutline } from './outline';

const escapeMarkdown = (text: string) => text.replace(/[\\`*_[\]~<]/g, '\\$&');

const escapeUrl = (url: string) => url.replace(/[\s()]/g, char => encodeURIComponent(char));

const inline = (node: MindMapNode): string => {
    const text = node.text.split('\n').map(escapeMarkdown).join('<br>');
    return node.link ? `[${text}](${escapeUrl(node.link)})` : text;
};

const notesLines = (notes: string | undefined, indent: string): string[] => {
    const text = notes?.replace(/\s+$/, '').replace(/^\s*\n/, '');
    if (!text) return [];
    return text.split('\n').map(line => (line.trim() ? `${indent}> ${line}` : `${indent}>`));
};

export const toMarkdown = (nodes: MindMapNode[]): string => {
    const lines: string[] = [];

    buildOutline(nodes).forEach((tree, i) => {
        if (i > 0) lines.push('');
        lines.push(`# ${inline(tree.node)}`);
        const notes = notesLines(tree.node.notes, '');
        if (notes.length > 0) lines.push('', ...notes);
        if (tree.children.length > 0) lines.push('');
        walkOutline(tree.children, (item, depth) => {
            const indent = '  '.repeat(depth);
            lines.push(`${indent}- ${inline(item.node)}`);
            lines.push(...notesLines(item.node.notes, `${indent}  `));
        });
    });
    return `${lines.join('\n')}\n`;
};
