/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import type { Unzipped } from 'fflate';

import { MindMapNode, NodePriority, NodeStatus } from '@/types/mindmap';
import { importedXml } from '@/lib/trustedTypes';
import { MAX_TOPIC_DEPTH, TopicRelation, TopicTree, childElement, childElements, topicTreesToNodes } from './topicTree';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_CONTENT_BYTES = 64 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp' };

type Json = Record<string, unknown>;
const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value);
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const text = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

const fromMarkers = (markerIds: string[]): { priority?: NodePriority; status?: NodeStatus } => {
    const result: { priority?: NodePriority; status?: NodeStatus } = {};
    for (const id of markerIds) {
        const priority = id.match(/^priority-(\d)$/)?.[1];
        if (priority && !result.priority) result.priority = priority === '1' ? 'high' : priority === '2' ? 'medium' : 'low';
        if (id === 'task-done') result.status = 'done';
        else if (id.startsWith('task-') && !result.status) result.status = 'in-progress';
    }
    return result;
};

const toBase64 = (bytes: Uint8Array): string => {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
};

const imageFrom = (src: string | undefined, files: Unzipped): string | undefined => {
    const path = src?.replace(/^xap:/, '');
    const bytes = path ? files[path] : undefined;
    const type = IMAGE_TYPES[path?.split('.').pop()?.toLowerCase() ?? ''];
    return bytes && type ? `data:${type};base64,${toBase64(bytes)}` : undefined;
};

const fromJson = (content: unknown, files: Unzipped): { trees: TopicTree[]; relations: TopicRelation[] } => {
    const relations: TopicRelation[] = [];
    const read = (topic: Json, depth: number): TopicTree => {
        const children = isObject(topic.children) ? topic.children : {};
        const topics = (value: unknown) => (depth < MAX_TOPIC_DEPTH ? list(value).filter(isObject).map(child => read(child, depth + 1)) : []);
        const notes = isObject(topic.notes) && isObject(topic.notes.plain) ? text(topic.notes.plain.content) : undefined;
        return {
            key: text(topic.id),
            text: text(topic.title) ?? '',
            notes,
            link: text(topic.href),
            tags: list(topic.labels).filter((label): label is string => typeof label === 'string'),
            ...fromMarkers(list(topic.markers).flatMap(marker => (isObject(marker) && typeof marker.markerId === 'string' ? [marker.markerId] : []))),
            image: isObject(topic.image) ? imageFrom(text(topic.image.src), files) : undefined,
            collapsed: topic.branch === 'folded',
            children: [...topics(children.attached), ...topics(children.summary), ...topics(children.callout)],
            detached: topics(children.detached),
        };
    };

    const trees = list(content).filter(isObject).flatMap((sheet) => {
        list(sheet.relationships).filter(isObject).forEach((relation) => {
            const from = text(relation.end1Id);
            const to = text(relation.end2Id);
            if (from && to) relations.push({ from, to, label: text(relation.title) });
        });
        return isObject(sheet.rootTopic) ? [read(sheet.rootTopic, 0)] : [];
    });
    return { trees, relations };
};

const fromXml = (content: string, files: Unzipped): { trees: TopicTree[]; relations: TopicRelation[] } => {
    const doc = new DOMParser().parseFromString(importedXml(content), 'text/xml');
    if (doc.getElementsByTagName('parsererror').length > 0) return { trees: [], relations: [] };
    const relations: TopicRelation[] = [];

    const read = (topic: Element, depth: number): TopicTree => {
        const groups = childElements(childElement(topic, 'children') ?? topic, 'topics');
        const topics = (type: string) => (depth < MAX_TOPIC_DEPTH
            ? groups.filter(group => (group.getAttribute('type') ?? 'attached') === type)
                .flatMap(group => childElements(group, 'topic').map(child => read(child, depth + 1)))
            : []);
        const notes = childElement(topic, 'notes');
        const image = childElement(topic, 'img');
        return {
            key: topic.getAttribute('id') ?? undefined,
            text: childElement(topic, 'title')?.textContent ?? '',
            notes: notes ? childElement(notes, 'plain')?.textContent ?? undefined : undefined,
            link: topic.getAttribute('xlink:href') ?? undefined,
            tags: childElements(childElement(topic, 'labels') ?? topic, 'label').map(label => label.textContent ?? ''),
            ...fromMarkers(childElements(childElement(topic, 'marker-refs') ?? topic, 'marker-ref').map(ref => ref.getAttribute('marker-id') ?? '')),
            image: image ? imageFrom(image.getAttribute('xhtml:src') ?? image.getAttribute('src') ?? undefined, files) : undefined,
            collapsed: topic.getAttribute('branch') === 'folded',
            children: [...topics('attached'), ...topics('summary'), ...topics('callout')],
            detached: topics('detached'),
        };
    };

    const trees = childElements(doc.documentElement, 'sheet').flatMap((sheet) => {
        childElements(childElement(sheet, 'relationships') ?? sheet, 'relationship').forEach((relation) => {
            const from = relation.getAttribute('end1');
            const to = relation.getAttribute('end2');
            if (from && to) relations.push({ from, to, label: childElement(relation, 'title')?.textContent ?? undefined });
        });
        const root = childElement(sheet, 'topic');
        return root ? [read(root, 0)] : [];
    });
    return { trees, relations };
};

export async function parseXMind(data: Uint8Array, title = 'Mind Map'): Promise<MindMapNode[]> {
    const { unzipSync, strFromU8 } = await import('fflate');
    let files: Unzipped;
    let contentTooLarge = false;
    try {
        files = unzipSync(data, {
            filter: (file) => {
                if (file.name === 'content.json' || file.name === 'content.xml') {
                    if (file.originalSize <= MAX_CONTENT_BYTES) return true;
                    contentTooLarge = true;
                    return false;
                }
                return /^(resources|attachments)\//.test(file.name) && file.originalSize <= MAX_IMAGE_BYTES;
            },
        });
    } catch {
        throw new Error('This file is not a valid XMind file.');
    }
    if (contentTooLarge) throw new Error('This XMind file is too large to open.');

    let content: { trees: TopicTree[]; relations: TopicRelation[] } = { trees: [], relations: [] };
    try {
        if (files['content.json']) content = fromJson(JSON.parse(strFromU8(files['content.json'])), files);
        else if (files['content.xml']) content = fromXml(strFromU8(files['content.xml']), files);
    } catch {
        throw new Error("This XMind file's content could not be read.");
    }
    return topicTreesToNodes(content.trees, content.relations, title);
}
