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
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(t => t.length > 2 && !stopWords.has(t));

    const inputTokens = tokenize(text);
    if (inputTokens.length === 0) return rootId;

    const tokenDocFreq = new Map<string, number>();
    const totalNodes = nodes.length;

    nodes.forEach(node => {
        const uniqueTokens = new Set(tokenize(node.text));
        uniqueTokens.forEach(token => {
            tokenDocFreq.set(token, (tokenDocFreq.get(token) || 0) + 1);
        });
    });

    let bestScore = -1;
    let bestNodeId = rootId;

    nodes.forEach(node => {
        if (node.id === rootId && nodes.length > 1) return;

        const nodeTokens = tokenize(node.text);
        if (nodeTokens.length === 0) return;

        let score = 0;

        inputTokens.forEach(inputToken => {
            if (nodeTokens.includes(inputToken)) {
                const df = tokenDocFreq.get(inputToken) || 0;
                if (df > 0) {
                    const idf = Math.log10(totalNodes / df);
                    score += (1 + idf) * 10;
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
        if (bestNode && bestNode.parentId && bestNode.parentId !== rootId) {
            return bestNode.parentId;
        }
    }

    return bestNodeId;
};
