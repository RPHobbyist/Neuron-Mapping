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

import { buildOutline, OutlineItem } from './exporters/outline';

export const computeNumbering = (nodes: MindMapNode[]): Map<string, string> => {
    const numbers = new Map<string, string>();
    const root = buildOutline(nodes).find(item => item.node.parentId === null);
    const number = (items: OutlineItem[], prefix: string) => items.forEach((item, i) => {
        const label = prefix ? `${prefix}.${i + 1}` : `${i + 1}`;
        numbers.set(item.node.id, label);
        number(item.children, label);
    });
    if (root) number(root.children, '');
    return numbers;
};
