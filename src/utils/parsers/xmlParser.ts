import { MindMapNode } from '@/types/mindmap';
import { createRootNode, generateId, getColorByDepth } from './parserUtils';

/**
 * Parse XML content into mind map nodes.
 * Automatically detects and handles OPML format.
 */
export function parseXML(content: string): MindMapNode[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, 'text/xml');

    // Check for parse errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
        console.error('XML Parse Error:', parseError.textContent);
        return [];
    }

    // Check for OPML structure
    const opmlBody = xmlDoc.querySelector('body');
    if (opmlBody) {
        return parseOPML(opmlBody);
    }

    // Generic XML parsing
    return parseGenericXML(xmlDoc);
}

/**
 * Parse generic XML document.
 */
function parseGenericXML(xmlDoc: Document): MindMapNode[] {
    const nodes: MindMapNode[] = [];
    const rootElement = xmlDoc.documentElement;

    if (!rootElement) return [];

    const rootId = generateId();
    nodes.push({
        ...createRootNode(rootElement.tagName),
        id: rootId
    });

    processXmlNode(rootElement, rootId, 0, nodes);
    return nodes;
}

function processXmlNode(element: Element, parentId: string, depth: number, nodes: MindMapNode[]): void {
    Array.from(element.children).forEach(child => {
        const nodeId = generateId();

        // Prefer semantic attributes for text
        const text = child.getAttribute('text')
            || child.getAttribute('name')
            || child.getAttribute('title')
            || child.tagName;

        nodes.push({
            id: nodeId,
            text,
            x: 0,
            y: 0,
            color: getColorByDepth(depth),
            parentId
        });

        if (child.children.length > 0) {
            processXmlNode(child, nodeId, depth + 1, nodes);
        } else {
            // Check for text content
            const textContent = child.textContent?.trim();
            if (textContent && textContent.length > 0 && textContent !== text) {
                nodes.push({
                    id: generateId(),
                    text: textContent,
                    x: 0,
                    y: 0,
                    color: getColorByDepth(depth + 1),
                    parentId: nodeId
                });
            }
        }
    });
}

/**
 * Parse OPML format (commonly used for outlines).
 */
function parseOPML(body: Element): MindMapNode[] {
    const nodes: MindMapNode[] = [];
    const rootId = generateId();

    nodes.push({
        ...createRootNode('Mind Map'),
        id: rootId
    });

    processOutline(body, rootId, 0, nodes);
    return nodes;
}

function processOutline(element: Element, parentId: string, depth: number, nodes: MindMapNode[]): void {
    Array.from(element.children).forEach(child => {
        if (child.tagName.toLowerCase() !== 'outline') return;

        const nodeId = generateId();
        const text = child.getAttribute('text')
            || child.getAttribute('title')
            || 'Untitled';

        nodes.push({
            id: nodeId,
            text,
            x: 0,
            y: 0,
            color: getColorByDepth(depth),
            parentId
        });

        processOutline(child, nodeId, depth + 1, nodes);
    });
}
