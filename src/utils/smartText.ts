/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { MindMapNode, NodeTask } from '@/types/mindmap';

import { addTag } from './tags';

export interface SmartText {
    text: string;
    tags: string[];
    task?: NodeTask;
    priority?: 'high';
}

const TASK_BOX_RE = /^\s*(?:-\s*)?\[([ xX]?)\]\s*/;
const TAG_RE = /(^|\s)#(\p{L}[\p{L}\p{N}_-]*)/gu;
const HIGH_PRIORITY_RE = /(^|\s)!!(?=\s|$)/g;

export const parseSmartText = (input: string): SmartText => {
    let text = input;
    let task: NodeTask | undefined;
    const box = text.match(TASK_BOX_RE);
    if (box) {
        task = box[1].toLowerCase() === 'x' ? 'done' : 'open';
        text = text.slice(box[0].length);
    }

    const tags: string[] = [];
    text = text.replace(TAG_RE, (_match, before: string, tag: string) => {
        tags.push(tag);
        return before;
    });

    let priority: 'high' | undefined;
    text = text.replace(HIGH_PRIORITY_RE, (_match, before: string) => {
        priority = 'high';
        return before;
    });

    if (tags.length > 0 || priority) {
        text = text.split('\n').map(line => line.replace(/[ \t]{2,}/g, ' ').trim()).join('\n');
    }
    return { text: text.trim() === '' ? '' : text, tags, task, priority };
};

export const withSmartText = (node: MindMapNode): MindMapNode => {
    const smart = parseSmartText(node.text);
    if (smart.text === node.text || !smart.text) return node;
    const tags = smart.tags.reduce<string[] | undefined>((all, tag) => addTag(all, tag), node.tags);
    return {
        ...node,
        text: smart.text,
        textRuns: undefined,
        ...(tags !== node.tags ? { tags } : {}),
        ...(smart.task ? { task: smart.task } : {}),
        ...(smart.priority ? { priority: smart.priority } : {}),
    };
};
