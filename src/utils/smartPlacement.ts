import { MindMapNode } from '@/types/mindmap';

/**
 * Finds the best parent node for a new node based on text similarity.
 * Uses a TF-IDF style analysis to weight unique keywords higher than common ones.
 * 
 * @param nodes List of existing mind map nodes
 * @param text The text of the new node being added
 * @param selectedNodeIds Currently selected node IDs (optional context)
 * @returns The ID of the best parent node
 */
export const findBestParent = (
    nodes: MindMapNode[],
    text: string,
    selectedNodeIds?: Set<string>
): string => {
    if (nodes.length === 0) return 'root';

    // 1. If exactly one node is selected, default to that (user intent usually overrides AI)
    if (selectedNodeIds && selectedNodeIds.size === 1) {
        return Array.from(selectedNodeIds)[0];
    }

    // 2. Pre-process Input
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'it', 'this', 'that']);

    const tokenize = (str: string) => str.toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/)
        .filter(t => t.length > 2 && !stopWords.has(t));

    const inputTokens = tokenize(text);
    if (inputTokens.length === 0) return 'root';

    // 3. Analyze Mind Map (TF-IDF Preparation)
    // Calculate Document Frequency (DF) for each token across all nodes
    const tokenDocFreq = new Map<string, number>();
    const totalNodes = nodes.length;

    nodes.forEach(node => {
        const uniqueTokens = new Set(tokenize(node.text));
        uniqueTokens.forEach(token => {
            tokenDocFreq.set(token, (tokenDocFreq.get(token) || 0) + 1);
        });
    });

    let bestScore = -1;
    let bestNodeId = 'root';

    // 4. Score Each Node
    nodes.forEach(node => {
        if (node.id === 'root' && nodes.length > 1) return; // Try to avoid root

        const nodeTokens = tokenize(node.text);
        if (nodeTokens.length === 0) return;

        let score = 0;

        inputTokens.forEach(inputToken => {
            // Check for exact match
            if (nodeTokens.includes(inputToken)) {
                // Weight by IDF: Common words add little score, rare words add huge score.
                const df = tokenDocFreq.get(inputToken) || 0;
                if (df > 0) {
                    const idf = Math.log10(totalNodes / df);
                    score += (1 + idf) * 10; // Base score + rarity bonus
                }
            }
            // Partial match (substring) - Lower weight
            else if (nodeTokens.some(nt => nt.includes(inputToken) || inputToken.includes(nt))) {
                score += 1;
            }
        });

        if (score > bestScore) {
            bestScore = score;
            bestNodeId = node.id;
        }
    });

    // 5. Fallback Analysis / Sibling Heuristic
    // If the best match is weak (score close to 0), check if the best node has a parent.
    // This allows creating siblings instead of children for weak matches.
    if (bestScore > 0 && bestScore < 5) {
        const bestNode = nodes.find(n => n.id === bestNodeId);
        if (bestNode && bestNode.parentId && bestNode.parentId !== 'root') {
            return bestNode.parentId;
        }
    }

    return bestNodeId;
};
