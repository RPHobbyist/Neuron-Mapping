import { MindMapNode } from '@/types/mindmap';
import { createRootNode, createChildNode, generateId } from './parserUtils';
import { parseTextFile } from './textParser';

/**
 * Parse Markdown file with headers and lists hierarchy.
 * Falls back to text parser if no valid markdown structure found.
 */
export function parseMarkdown(content: string): MindMapNode[] {
    const lines = content.split('\n');

    // Filter to headers and list items only
    const validLines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && (
            trimmed.startsWith('#') ||
            /^[-*+]\s/.test(trimmed) ||
            /^\d+\.\s/.test(trimmed)
        );
    });

    // Fallback to text parser if no markdown structure
    if (validLines.length === 0) {
        return parseTextFile(content);
    }

    const nodes: MindMapNode[] = [];
    const rootId = generateId();

    // Extract root text from first line
    const rootText = extractText(validLines[0]);
    nodes.push({
        ...createRootNode(rootText),
        id: rootId
    });

    const stack: StackItem[] = [{ id: rootId, level: 0, type: 'root' }];

    for (let i = 1; i < validLines.length; i++) {
        const line = validLines[i];
        const parsed = parseLine(line, stack);

        if (!parsed.text) continue;

        // Find parent by popping items >= current level
        while (stack.length > 1 && stack[stack.length - 1].level >= parsed.level) {
            stack.pop();
        }

        const parent = stack[stack.length - 1];
        const node = createChildNode(parsed.text, parent.id, stack.length - 1);
        nodes.push(node);

        stack.push({ id: node.id, level: parsed.level, type: parsed.type });
    }

    return nodes;
}

interface StackItem {
    id: string;
    level: number;
    type: 'root' | 'header' | 'list';
}

interface ParsedLine {
    text: string;
    level: number;
    type: 'header' | 'list';
}

function parseLine(line: string, stack: StackItem[]): ParsedLine {
    const trimmed = line.trim();

    // Headers: # H1, ## H2, etc.
    if (trimmed.startsWith('#')) {
        const match = trimmed.match(/^(#+)\s+(.*)/);
        if (match) {
            return {
                text: match[2],
                level: match[1].length,
                type: 'header'
            };
        }
    }

    // List items: calculate level based on indent + parent header
    const indentMatch = line.match(/^\s*/);
    const indent = indentMatch ? indentMatch[0].length : 0;
    const indentLevel = Math.floor(indent / 2);

    // Find the last header level in the stack
    let headerBase = 0;
    for (let j = stack.length - 1; j >= 0; j--) {
        if (stack[j].type === 'header' || stack[j].type === 'root') {
            headerBase = stack[j].level;
            break;
        }
    }

    // List items are children of the current header context
    const level = headerBase + 1 + indentLevel;
    const text = trimmed.replace(/^[-*+\d.]+\s+/, '');

    return { text, level, type: 'list' };
}

function extractText(line: string): string {
    return line.replace(/^[#\-*+\d.]+\s+/, '').trim();
}
