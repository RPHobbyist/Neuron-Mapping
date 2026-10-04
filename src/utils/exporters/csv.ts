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

const FORMULA_START = /^[=+\-@\t\r]/;

const cell = (text: string): string => {
    const value = FORMULA_START.test(text) ? `'${text}` : text;
    return /[",\r\n]|^\s|\s$/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
};

export const toCSV = (nodes: MindMapNode[]): string => {
    const rows: string[] = [];
    walkOutline(buildOutline(nodes), (item, depth) => {
        if (item.children.length > 0 || depth === 0) {
            rows.push([item.node, ...item.children.map(child => child.node)].map(node => cell(node.text)).join(','));
        }
    });
    return `\uFEFF${rows.join('\r\n')}\r\n`;
};
