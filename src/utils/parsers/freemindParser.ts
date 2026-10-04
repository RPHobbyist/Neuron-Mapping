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
import { importedXml } from '@/lib/trustedTypes';
import { MAX_TOPIC_DEPTH, TopicRelation, TopicTree, childElement, childElements, htmlText, topicTreesToNodes } from './topicTree';

const typeOf = (element: Element) => (element.getAttribute('TYPE') ?? '').toUpperCase();

export function parseFreeMind(content: string, title = 'Mind Map'): MindMapNode[] {
    const doc = new DOMParser().parseFromString(importedXml(content), 'text/xml');
    if (doc.getElementsByTagName('parsererror').length > 0) return [];
    const map = doc.documentElement;
    if (!map || map.localName.toLowerCase() !== 'map') return [];

    const relations: TopicRelation[] = [];
    let unnamed = 0;

    const read = (element: Element, depth: number): TopicTree => {
        const richContent = childElements(element, 'richcontent');
        const richText = richContent.find(rc => typeOf(rc) === 'NODE');
        const richNote = richContent.find(rc => typeOf(rc) === 'NOTE');
        const hookNote = childElements(element, 'hook')
            .find(hook => /NodeNote/i.test(hook.getAttribute('NAME') ?? ''));
        const attributes = childElements(element, 'attribute')
            .map(attribute => `${attribute.getAttribute('NAME') ?? ''}: ${attribute.getAttribute('VALUE') ?? ''}`);
        const note = richNote ? htmlText(richNote) : hookNote ? childElement(hookNote, 'text')?.textContent?.trim() : '';
        const notes = [note, attributes.join('\n')].filter(Boolean).join('\n\n');

        const key = element.getAttribute('ID') ?? `unnamed-${unnamed++}`;
        childElements(element, 'arrowlink').forEach((arrow) => {
            const to = arrow.getAttribute('DESTINATION');
            const label = arrow.getAttribute('MIDDLE_LABEL') || arrow.getAttribute('SOURCE_LABEL') || arrow.getAttribute('TARGET_LABEL') || undefined;
            if (to) relations.push({ from: key, to, label });
        });

        return {
            key,
            text: element.getAttribute('TEXT')
                ?? (richText ? htmlText(richText).replace(/\n{2,}/g, '\n') : null)
                ?? element.getAttribute('LOCALIZED_TEXT')
                ?? '',
            notes,
            link: element.getAttribute('LINK') ?? undefined,
            collapsed: element.getAttribute('FOLDED') === 'true',
            children: depth < MAX_TOPIC_DEPTH ? childElements(element, 'node').map(child => read(child, depth + 1)) : [],
        };
    };

    return topicTreesToNodes(childElements(map, 'node').map(node => read(node, 0)), relations, title);
}
