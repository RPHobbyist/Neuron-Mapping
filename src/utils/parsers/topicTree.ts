/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { DETACHED_PARENT_ID } from '@/lib/constants';
import { MindMapNode, NodePriority, NodeStatus } from '@/types/mindmap';
import { sanitizeImageUrl, sanitizeUrl } from '@/utils/common';
import { createRootNode, generateId, getColorByDepth, sanitizeText } from './parserUtils';

export interface TopicTree {
    key?: string;
    text: string;
    notes?: string;
    link?: string;
    tags?: string[];
    priority?: NodePriority;
    status?: NodeStatus;
    image?: string;
    collapsed?: boolean;
    children: TopicTree[];
    detached?: TopicTree[];
}

export interface TopicRelation {
    from: string;
    to: string;
    label?: string;
}

export const MAX_TOPIC_DEPTH = 100;

export const topicTreesToNodes = (trees: TopicTree[], relations: TopicRelation[], title: string): MindMapNode[] => {
    if (trees.length === 0) return [];
    const nodes: MindMapNode[] = [];
    const idByKey = new Map<string, string>();

    const add = (topic: TopicTree, parentId: string | null, depth: number) => {
        const id = generateId();
        if (topic.key && !idByKey.has(topic.key)) idByKey.set(topic.key, id);
        const notes = topic.notes?.trim();
        const link = sanitizeUrl(topic.link);
        const image = sanitizeImageUrl(topic.image);
        const tags = topic.tags?.map(tag => sanitizeText(tag).trim()).filter(Boolean);
        nodes.push({
            id,
            text: sanitizeText(topic.text),
            x: 0,
            y: 0,
            color: parentId === null ? 'root' : getColorByDepth(Math.max(depth, 0)),
            parentId,
            ...(notes ? { notes: sanitizeText(notes) } : {}),
            ...(link ? { link } : {}),
            ...(image ? { image } : {}),
            ...(tags?.length ? { tags } : {}),
            ...(topic.priority ? { priority: topic.priority } : {}),
            ...(topic.status ? { status: topic.status } : {}),
            ...(topic.collapsed && topic.children.length > 0 && depth < MAX_TOPIC_DEPTH ? { collapsed: true } : {}),
        });
        if (depth >= MAX_TOPIC_DEPTH) return;
        topic.children.forEach(child => add(child, id, depth + 1));
        topic.detached?.forEach(child => add(child, DETACHED_PARENT_ID, 0));
    };

    if (trees.length === 1) {
        add(trees[0], null, -1);
    } else {
        const rootId = generateId();
        nodes.push({ ...createRootNode(title), id: rootId });
        trees.forEach(tree => add(tree, rootId, 0));
    }

    const byId = new Map(nodes.map(node => [node.id, node]));
    relations.forEach(({ from, to, label }) => {
        const source = byId.get(idByKey.get(from) ?? '');
        const targetId = idByKey.get(to);
        if (!source || !targetId || targetId === source.id || source.relations?.some(r => r.targetId === targetId)) return;
        const cleanLabel = label ? sanitizeText(label).trim() : '';
        source.relations = [...(source.relations ?? []), { targetId, ...(cleanLabel ? { label: cleanLabel } : {}) }];
    });

    return nodes;
};

const BLOCK_ELEMENTS = new Set(['p', 'div', 'li', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tr', 'table', 'pre', 'blockquote', 'body']);

export const htmlText = (element: Element): string => {
    const parts: string[] = [];
    const walk = (node: Node) => {
        if (node.nodeType === 3) {
            parts.push((node.nodeValue ?? '').replace(/\s+/g, ' '));
            return;
        }
        if (node.nodeType !== 1) return;
        const name = (node as Element).localName.toLowerCase();
        if (name === 'head' || name === 'style' || name === 'script') return;
        if (name === 'br') {
            parts.push('\n');
            return;
        }
        const block = BLOCK_ELEMENTS.has(name);
        if (block) parts.push('\n');
        node.childNodes.forEach(walk);
        if (block) parts.push('\n');
    };
    walk(element);
    return parts.join('')
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};

export const childElements = (element: Element, name: string): Element[] =>
    Array.from(element.children).filter(child => child.localName.toLowerCase() === name);

export const childElement = (element: Element, name: string): Element | undefined => childElements(element, name)[0];
