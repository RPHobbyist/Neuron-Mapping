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

// eslint-disable-next-line no-control-regex
const INVALID_XML_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;

const escapeAttribute = (value: string) => value
    .replace(INVALID_XML_CHARS, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\t/g, '&#9;')
    .replace(/\n/g, '&#10;')
    .replace(/\r/g, '&#13;');

const escapeText = (value: string) => value
    .replace(INVALID_XML_CHARS, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export const toOPML = (nodes: MindMapNode[], title: string): string => {
    const lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<opml version="2.0">',
        '  <head>',
        `    <title>${escapeText(title)}</title>`,
        '  </head>',
        '  <body>',
    ];
    walkOutline(buildOutline(nodes), (item, depth) => {
        const indent = '  '.repeat(depth + 2);
        const { text, notes, link } = item.node;
        const attributes = [`text="${escapeAttribute(text)}"`];
        if (notes?.trim()) attributes.push(`_note="${escapeAttribute(notes)}"`);
        if (link) attributes.push('type="link"', `url="${escapeAttribute(link)}"`);
        lines.push(`${indent}<outline ${attributes.join(' ')}${item.children.length === 0 ? '/' : ''}>`);
    }, 0, (item, depth) => {
        if (item.children.length > 0) lines.push(`${'  '.repeat(depth + 2)}</outline>`);
    });
    lines.push('  </body>', '</opml>');
    return `${lines.join('\n')}\n`;
};
