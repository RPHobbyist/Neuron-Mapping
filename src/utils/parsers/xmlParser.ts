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
import { createRootNode, generateId, getColorByDepth, sanitizeText } from './parserUtils';
import { importedXml } from '@/lib/trustedTypes';

const LABEL_ATTRIBUTES = ['text', 'name', 'title'];

export function parseXML(content: string, title = 'Mind Map'): MindMapNode[] {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(importedXml(content), "text/xml");
        
        const parseError = xmlDoc.getElementsByTagName("parsererror");
        if (parseError.length > 0) {
            console.error('XML Parse Error', parseError[0].textContent);
            return [];
        }

        const nodes: MindMapNode[] = [];

        const rootElement = xmlDoc.documentElement;
        if (!rootElement) return [];

        if (rootElement.tagName.toLowerCase() === 'opml') {
            const children = Array.from(rootElement.children);
            const body = children.find(el => el.tagName.toLowerCase() === 'body');
            const head = children.find(el => el.tagName.toLowerCase() === 'head');
            const opmlTitle = Array.from(head?.children ?? []).find(el => el.tagName.toLowerCase() === 'title')?.textContent?.trim();
            return body ? parseOPML(body, opmlTitle || title) : [];
        }

        const rootId = generateId();
        nodes.push({
            ...createRootNode(rootElement.tagName),
            id: rootId
        });

        const MAX_DEPTH = 50;
        const processNode = (xmlNode: Element, parentId: string, depth: number) => {
            if (depth > MAX_DEPTH) return;
            Array.from(xmlNode.children).forEach(child => {
                const nodeId = generateId();
                const labelAttribute = LABEL_ATTRIBUTES.find(name => child.getAttribute(name));
                const text = labelAttribute ? child.getAttribute(labelAttribute)! : child.tagName;

                nodes.push({
                    id: nodeId,
                    text: sanitizeText(text),
                    x: 0,
                    y: 0,
                    color: getColorByDepth(depth),
                    parentId
                });

                Array.from(child.attributes).forEach(attr => {
                    if (attr.name === labelAttribute || !attr.value.trim()) return;
                    nodes.push({
                        id: generateId(),
                        text: sanitizeText(`${attr.name}: ${attr.value}`),
                        x: 0,
                        y: 0,
                        color: getColorByDepth(depth + 1),
                        parentId: nodeId
                    });
                });

                if (child.children.length > 0) {
                    processNode(child, nodeId, depth + 1);
                } else if (child.textContent && child.textContent.trim()) {
                    const contentStr = child.textContent.trim();
                    if (contentStr.length > 0) {
                        const textId = generateId();
                        nodes.push({
                            id: textId,
                            text: sanitizeText(contentStr),
                            x: 0,
                            y: 0,
                            color: getColorByDepth(depth + 1),
                            parentId: nodeId
                        });
                    }
                }
            });
        };

        processNode(rootElement, rootId, 0);
        return nodes;
    } catch (e) {
        console.error('XML Parse Error', e);
        return [];
    }
}

const outlinesOf = (element: Element) =>
    Array.from(element.children).filter(child => child.tagName.toLowerCase() === 'outline');

const outlineContent = (outline: Element): Pick<MindMapNode, 'text' | 'notes' | 'link'> => {
    const notes = outline.getAttribute('_note')?.trim();
    const link = sanitizeUrl(outline.getAttribute('url') || outline.getAttribute('htmlUrl') || undefined);
    return {
        text: sanitizeText(outline.getAttribute('text') || outline.getAttribute('title') || 'Untitled'),
        ...(notes ? { notes: sanitizeText(notes) } : {}),
        ...(link ? { link } : {}),
    };
};

function parseOPML(body: Element, title: string): MindMapNode[] {
    const nodes: MindMapNode[] = [];
    const rootId = generateId();
    const tops = outlinesOf(body);
    const singleTop = tops.length === 1 ? tops[0] : null;

    nodes.push({
        ...createRootNode(title),
        ...(singleTop ? outlineContent(singleTop) : {}),
        id: rootId
    });

    const MAX_DEPTH = 50;
    const processOutline = (element: Element, parentId: string, depth: number) => {
        if (depth > MAX_DEPTH) return;
        outlinesOf(element).forEach(child => {
            const nodeId = generateId();
            nodes.push({
                id: nodeId,
                ...outlineContent(child),
                x: 0,
                y: 0,
                color: getColorByDepth(depth),
                parentId
            });

            processOutline(child, nodeId, depth + 1);
        });
    };

    processOutline(singleTop ?? body, rootId, 0);
    return nodes;
}
 