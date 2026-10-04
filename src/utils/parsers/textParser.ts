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
import { createRootNode, createChildNode, generateId } from './parserUtils';

export function parseTextFile(content: string): MindMapNode[] {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const nodes: MindMapNode[] = [];
    const rootId = generateId();

    nodes.push({
        ...createRootNode(lines[0].trim()),
        id: rootId
    });

    const indentUnit = detectIndentUnit(lines);
    const stack: StackItem[] = [{ id: rootId, level: 0 }];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const text = line.trim();
        const indent = getIndentLength(line);
        const level = Math.round(indent / indentUnit);

        while (stack.length > 1 && stack[stack.length - 1].level >= level) {
            stack.pop();
        }

        const parent = stack[stack.length - 1];
        const node = createChildNode(text, parent.id, stack.length - 1);
        nodes.push(node);

        stack.push({ id: node.id, level });
    }

    return nodes;
}

interface StackItem {
    id: string;
    level: number;
}

const TAB_WIDTH = 4;

function detectIndentUnit(lines: string[]): number {
    const indents = lines.slice(1).map(getIndentLength).filter(indent => indent > 0);
    return indents.length > 0 ? indents.reduce((min, indent) => Math.min(min, indent)) : 2;
}

function getIndentLength(line: string): number {
    let width = 0;
    for (const char of line) {
        if (char === ' ') width += 1;
        else if (char === '\t') width += TAB_WIDTH - (width % TAB_WIDTH);
        else break;
    }
    return width;
}
 