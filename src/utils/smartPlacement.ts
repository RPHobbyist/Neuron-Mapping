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
import { findRootNode } from '@/utils/common';

export const findBestParent = (
    nodes: MindMapNode[],
    text: string,
    selectedNodeIds?: Set<string>
): string => {
    if (nodes.length === 0) return 'root';

    const rootId = findRootNode(nodes)?.id ?? nodes[0]?.id ?? '';

    if (selectedNodeIds && selectedNodeIds.size === 1) {
        return Array.from(selectedNodeIds)[0];
    }

    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'it', 'this', 'that']);

    const tokenize = (str: string) => str.toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, '')
        .split(/\s+/)
        .filter(t => t.length > 2 && !stopWords.has(t));

    const inputTokens = tokenize(text);
    if (inputTokens.length === 0) return rootId;

    const wordsOf = new Map(nodes.map(node => [node.id, {
        main: [...tokenize(node.text), ...(node.tags ?? []).flatMap(tokenize)],
        notes: tokenize(node.notes ?? ''),
    }]));

    const tokenDocFreq = new Map<string, number>();
    const totalNodes = nodes.length;

    wordsOf.forEach(({ main, notes }) => {
        new Set([...main, ...notes]).forEach(token => {
            tokenDocFreq.set(token, (tokenDocFreq.get(token) || 0) + 1);
        });
    });

    let bestScore = 0;
    let bestNodeId = rootId;

    nodes.forEach(node => {
        if (node.id === rootId && nodes.length > 1) return;

        const { main: nodeTokens, notes: noteTokens } = wordsOf.get(node.id)!;
        if (nodeTokens.length === 0 && noteTokens.length === 0) return;

        let score = 0;

        inputTokens.forEach(inputToken => {
            const inMain = nodeTokens.includes(inputToken);
            if (inMain || noteTokens.includes(inputToken)) {
                const df = tokenDocFreq.get(inputToken) || 0;
                if (df > 0) {
                    const idf = Math.log10(totalNodes / df);
                    score += (1 + idf) * (inMain ? 10 : 5);
                }
            }
            else if (nodeTokens.some(nt => nt.includes(inputToken) || inputToken.includes(nt))) {
                score += 1;
            }
        });

        if (score > bestScore) {
            bestScore = score;
            bestNodeId = node.id;
        }
    });

    if (bestScore > 0 && bestScore < 5) {
        const bestNode = nodes.find(n => n.id === bestNodeId);
        const parentExists = !!bestNode?.parentId && nodes.some(n => n.id === bestNode.parentId);
        if (bestNode && parentExists && bestNode.parentId !== rootId) {
            return bestNode.parentId!;
        }
    }

    return bestNodeId;
};
 