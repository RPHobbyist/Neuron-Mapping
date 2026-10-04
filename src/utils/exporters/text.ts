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

export const toText = (nodes: MindMapNode[]): string => {
    const lines: string[] = [];
    walkOutline(buildOutline(nodes), (item, depth) => {
        lines.push(`${'\t'.repeat(depth)}${item.node.text.replace(/\s*\n\s*/g, ' ').trim()}`);
    });
    return `${lines.join('\n')}\n`;
};
