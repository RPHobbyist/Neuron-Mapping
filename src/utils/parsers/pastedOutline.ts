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

import { createChildNode } from './parserUtils';

export const MAX_PASTED_TOPICS = 2000;

const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const BULLET_RE = /^(?:[-*+•]|\d+[.)])\s+/;
const FENCE_RE = /^(```|~~~)/;
const TAB_WIDTH = 4;
const BYTE_ORDER_MARK = new RegExp(`^${String.fromCharCode(0xfeff)}`);

interface Line {
    text: string;
    indent: number;
    heading?: number;
}

const indentOf = (line: string): number => {
    let width = 0;
    for (const char of line) {
        if (char === ' ') width += 1;
        else if (char === '\t') width += TAB_WIDTH - (width % TAB_WIDTH);
        else break;
    }
    return width;
};

export const parsePastedOutline = (content: string): MindMapNode[] => {
    const lines: Line[] = [];
    content.replace(BYTE_ORDER_MARK, '').split(/\r?\n/).forEach((raw) => {
        const trimmed = raw.trim();
        if (!trimmed || FENCE_RE.test(trimmed)) return;
        const heading = trimmed.match(HEADING_RE);
        if (heading) {
            lines.push({ text: heading[2].trim(), indent: 0, heading: heading[1].length });
        } else {
            lines.push({ text: trimmed.replace(BULLET_RE, '').trim(), indent: indentOf(raw) });
        }
    });
    const topics = lines.filter(line => line.text);
    if (topics.length === 0) return [];

    const indents = topics.filter(line => !line.heading && line.indent > 0).map(line => line.indent);
    const unit = indents.length > 0 ? indents.reduce((min, indent) => Math.min(min, indent)) : 1;
    const topIndent = topics.reduce((min, line) => (line.heading ? min : Math.min(min, line.indent)), Infinity);
    const topHeading = topics.reduce((min, line) => (line.heading ? Math.min(min, line.heading) : min), Infinity);

    const nodes: MindMapNode[] = [];
    const stack: { id: string; level: number }[] = [];
    let underHeading = -1;
    topics.forEach((line) => {
        const level = line.heading
            ? line.heading - topHeading
            : underHeading + 1 + Math.round((line.indent - (Number.isFinite(topIndent) ? topIndent : 0)) / unit);
        if (line.heading) underHeading = level;

        while (stack.length > 0 && stack[stack.length - 1].level >= level) stack.pop();
        const parent = stack[stack.length - 1];
        const topic = { ...createChildNode(line.text, parent?.id ?? '', stack.length), parentId: parent?.id ?? null };
        nodes.push(topic);
        stack.push({ id: topic.id, level });
    });
    return nodes;
};
