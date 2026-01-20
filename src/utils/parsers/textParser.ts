import { MindMapNode } from '@/types/mindmap';
import { createRootNode, createChildNode, generateId } from './parserUtils';

/**
 * Parse indented text file with robust indent detection.
 */
export function parseTextFile(content: string): MindMapNode[] {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const nodes: MindMapNode[] = [];
    const rootId = generateId();

    // Create root from first line
    nodes.push({
        ...createRootNode(lines[0].trim()),
        id: rootId
    });

    // Detect indentation unit from first indented line
    const indentUnit = detectIndentUnit(lines);
    const stack: StackItem[] = [{ id: rootId, level: 0 }];

    // Process remaining lines
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const text = line.trim();
        const indent = getIndentLength(line);
        const level = Math.round(indent / indentUnit);

        // Find parent by walking back the stack
        while (stack.length > 1 && stack[stack.length - 1].level >= level) {
            stack.pop();
        }

        // Safety: ensure stack has at least root
        if (stack.length === 0) {
            stack.push({ id: rootId, level: 0 });
        }

        const parent = stack[stack.length - 1];
        const node = createChildNode(text, parent.id, stack.length - 1);
        nodes.push(node);

        stack.push({ id: node.id, level });
    }

    return nodes;
}

interface StackItem {
    id: string;
    level: number;
}

function detectIndentUnit(lines: string[]): number {
    for (let i = 1; i < lines.length; i++) {
        const indentMatch = lines[i].match(/^\s+/);
        if (indentMatch) {
            return indentMatch[0].length;
        }
    }
    return 2; // Default fallback
}

function getIndentLength(line: string): number {
    const match = line.match(/^\s*/);
    return match ? match[0].length : 0;
}
