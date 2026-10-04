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
import { createRootNode, generateId, getColorByDepth, sanitizeText } from './parserUtils';

export function parseCSV(content: string, title = 'CSV Import'): MindMapNode[] {
    const rows = splitCsvRows(content)
        .map((line, index) => ({ line, rowNumber: index + 1 }))
        .filter(row => row.line.trim());
    if (rows.length === 0) return [];

    const nodes: MindMapNode[] = [];
    const rootId = generateId();

    nodes.push({
        ...createRootNode(title),
        id: rootId
    });

    const topicIdByKey = new Map<string, string>();
    const childKeysById = new Map<string, Set<string>>();
    const keyOf = (text: string) => text.trim().toLowerCase();
    const addNode = (text: string, parentId: string): string => {
        const id = generateId();
        nodes.push({ id, text: sanitizeText(text), x: 0, y: 0, color: getColorByDepth(0), parentId });
        if (!topicIdByKey.has(keyOf(text))) topicIdByKey.set(keyOf(text), id);
        return id;
    };
    let isOneTree = true;

    rows.forEach(({ line, rowNumber }, index) => {
        const cells = parseCsvLine(line).map(fromSpreadsheetCell);
        if (cells.length === 0) return;

        const rowText = cells[0].trim() ? cells[0] : `Row ${rowNumber}`;
        let rowId = topicIdByKey.get(keyOf(rowText));
        if (!rowId) {
            if (index > 0) isOneTree = false;
            rowId = addNode(rowText, rootId);
        }

        let childKeys = childKeysById.get(rowId);
        if (!childKeys) {
            childKeys = new Set();
            childKeysById.set(rowId, childKeys);
        }

        for (let i = 1; i < cells.length; i++) {
            const cellText = cells[i];
            if (!cellText.trim()) continue;

            const childKey = keyOf(cellText);
            if (childKeys.has(childKey)) continue;
            childKeys.add(childKey);
            addNode(cellText, rowId);
        }
    });

    const topics = isOneTree ? nodes.slice(1) : nodes;
    if (isOneTree) topics[0] = { ...topics[0], parentId: null };
    return colorByDepth(topics);
}

const fromSpreadsheetCell = (cell: string) => (/^'[=+\-@\t\r]/.test(cell) ? cell.slice(1) : cell);

function colorByDepth(nodes: MindMapNode[]): MindMapNode[] {
    const depthById = new Map<string, number>();
    return nodes.map((node) => {
        if (node.parentId === null) {
            depthById.set(node.id, -1);
            return { ...node, color: 'root' };
        }
        const depth = (depthById.get(node.parentId) ?? -1) + 1;
        depthById.set(node.id, depth);
        return { ...node, color: getColorByDepth(depth) };
    });
}

function splitCsvRows(content: string): string[] {
    const rows: string[] = [];
    let current = '';
    let inQuote = false;
    let atFieldStart = true;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];

        if (inQuote) {
            current += char;
            if (char === '"') {
                if (content[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuote = false;
                }
            }
        } else if (char === '"' && atFieldStart) {
            inQuote = true;
            atFieldStart = false;
            current += char;
        } else if (char === '\n' || char === '\r') {
            if (char === '\r' && content[i + 1] === '\n') i++;
            rows.push(current);
            current = '';
            atFieldStart = true;
        } else {
            current += char;
            if (char === ',') atFieldStart = true;
            else if (!/\s/.test(char)) atFieldStart = false;
        }
    }
    if (current.length > 0) rows.push(current);

    return rows;
}

function parseCsvLine(line: string): string[] {
    const cells: string[] = [];
    let chars: string[] = [];
    let quoted: boolean[] = [];
    let inQuote = false;
    let atFieldStart = true;

    const pushCell = () => {
        let start = 0;
        let end = chars.length;
        while (start < end && !quoted[start] && /\s/.test(chars[start])) start++;
        while (end > start && !quoted[end - 1] && /\s/.test(chars[end - 1])) end--;
        cells.push(chars.slice(start, end).join(''));
        chars = [];
        quoted = [];
    };

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (inQuote) {
            if (char !== '"') {
                chars.push(char);
                quoted.push(true);
            } else if (line[i + 1] === '"') {
                chars.push('"');
                quoted.push(true);
                i++;
            } else {
                inQuote = false;
            }
        } else if (char === '"' && atFieldStart) {
            inQuote = true;
            atFieldStart = false;
        } else if (char === ',') {
            pushCell();
            atFieldStart = true;
        } else {
            chars.push(char);
            quoted.push(false);
            if (!/\s/.test(char)) atFieldStart = false;
        }
    }

    pushCell();

    return cells;
}
 