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
import { sanitizeUrl } from '@/utils/common';
import { createRootNode, createChildNode, generateId } from './parserUtils';
import { parseTextFile } from './textParser';

interface ParsedItem {
    text: string;
    level: number;
    link?: string;
    noteLines: string[];
}

const HEADING_RE = /^(#{1,6})(?:\s+(.*))?$/;
const LIST_ITEM_RE = /^([-*+]|\d+[.)])(\s+|$)/;
const FENCE_RE = /^(```|~~~)/;
const QUOTE_RE = /^\s*>\s?/;
const THEMATIC_BREAK_RE = /^([-*_])(\s*\1){2,}$/;
const LINK_RE = /(^|[^!])\[([^\]]+)\]\(\s*((?:[^()\s]|\([^()\s]*\))+)(?:\s+"[^"]*")?\s*\)/;

export function parseMarkdown(content: string, title = 'Mind Map'): MindMapNode[] {
    const items = parseItems(content);
    if (items.length === 0) {
        return parseTextFile(content);
    }

    const topLevel = items.reduce((min, item) => Math.min(min, item.level), Infinity);
    const hasSingleTop = items[0].level === topLevel && items.filter(item => item.level === topLevel).length === 1;

    const nodes: MindMapNode[] = [];
    const rootId = generateId();
    const withContent = (node: MindMapNode, item: ParsedItem): MindMapNode => {
        const notes = joinNotes(item.noteLines);
        return { ...node, ...(item.link ? { link: item.link } : {}), ...(notes ? { notes } : {}) };
    };

    const root = { ...createRootNode(hasSingleTop ? items[0].text : title), id: rootId };
    nodes.push(hasSingleTop ? withContent(root, items[0]) : root);

    const stack = [{ id: rootId, level: hasSingleTop ? topLevel : topLevel - 1 }];
    for (const item of hasSingleTop ? items.slice(1) : items) {
        while (stack.length > 1 && stack[stack.length - 1].level >= item.level) {
            stack.pop();
        }
        const parent = stack[stack.length - 1];
        const node = withContent(createChildNode(item.text, parent.id, stack.length - 1), item);
        nodes.push(node);
        stack.push({ id: node.id, level: item.level });
    }

    return nodes;
}

function parseItems(content: string): ParsedItem[] {
    const items: ParsedItem[] = [];
    let current: ParsedItem | null = null;
    let headingLevel = 0;
    let fenceIndent: number | null = null;
    let continuesItem = false;

    for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        const indent = (line.match(/^[ \t]*/)?.[0] ?? '').replace(/\t/g, '  ').length;

        if (fenceIndent !== null || FENCE_RE.test(trimmed)) {
            if (fenceIndent === null) fenceIndent = indent;
            else if (FENCE_RE.test(trimmed)) fenceIndent = null;
            current?.noteLines.push(line.replace(/\t/g, '  ').slice(Math.min(indent, fenceIndent ?? indent)));
            continuesItem = false;
            continue;
        }
        if (!trimmed || THEMATIC_BREAK_RE.test(trimmed)) {
            current?.noteLines.push('');
            continuesItem = false;
            continue;
        }

        const heading = trimmed.match(HEADING_RE);
        if (heading) {
            headingLevel = heading[1].length;
            current = parseItem(heading[2] ?? '', headingLevel) ?? emptyItem(headingLevel);
            items.push(current);
            continuesItem = false;
            continue;
        }

        if (LIST_ITEM_RE.test(trimmed)) {
            const text = trimmed.replace(LIST_ITEM_RE, '').replace(/^\[[ xX]\]\s*/, '');
            const level = headingLevel + 1 + Math.floor(indent / 2);
            current = parseItem(text, level) ?? emptyItem(level);
            items.push(current);
            continuesItem = current.text !== '';
            continue;
        }

        if (!current) continue;
        if (QUOTE_RE.test(line)) {
            current.noteLines.push(line.replace(QUOTE_RE, ''));
            continuesItem = false;
        } else if (continuesItem) {
            const more = parseItem(trimmed, current.level);
            if (more) current.text = `${current.text} ${more.text}`;
        } else {
            current.noteLines.push(trimmed);
        }
    }

    return items;
}

const emptyItem = (level: number): ParsedItem => ({ text: '', level, noteLines: [] });

function parseItem(raw: string, level: number): ParsedItem | null {
    const escaped: string[] = [];
    const restore = (value: string) => value.replace(/\uE000(\d+)\uE001/g, (_, index: string) => escaped[Number(index)]);
    const protectedText = raw.replace(/\\([\\`*_{}[\]()#+\-.!~|<>])/g, (_, char: string) => `\uE000${escaped.push(char) - 1}\uE001`);

    const text = restore(stripInlineMarkdown(protectedText).replace(/<br\s*\/?>/gi, '\n'));
    if (!text) return null;
    const link = protectedText.match(LINK_RE)?.[3];
    const safeLink = link ? sanitizeUrl(restore(link)) : undefined;
    return { text, level, ...(safeLink ? { link: safeLink } : {}), noteLines: [] };
}

function joinNotes(lines: string[]): string {
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\s+$/g, '');
}

function stripInlineMarkdown(text: string): string {
    return text
        .replace(/!?\[([^\]]+)\]\((?:[^()]|\([^()]*\))*\)/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\*\*(?=\S)(.+?)(?<=\S)\*\*/g, '$1')
        .replace(/\*(?=\S)(.+?)(?<=\S)\*/g, '$1')
        .replace(/(^|[^\p{L}\p{N}_])__(?=\S)(.+?)(?<=\S)__(?![\p{L}\p{N}_])/gu, '$1$2')
        .replace(/(^|[^\p{L}\p{N}_])_(?=\S)(.+?)(?<=\S)_(?![\p{L}\p{N}_])/gu, '$1$2')
        .replace(/~~(.+?)~~/g, '$1')
        .trim();
}
