import { MindMapNode } from '@/types/mindmap';
import { createRootNode, generateId, getColorByDepth, sanitizeText } from './parserUtils';

/**
 * Parse XML or OPML format.
 */
export function parseXML(content: string): MindMapNode[] {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, "text/xml");
        
        // Check for parse errors
        const parseError = xmlDoc.getElementsByTagName("parsererror");
        if (parseError.length > 0) {
            console.error('XML Parse Error', parseError[0].textContent);
            return [];
        }

        const nodes: MindMapNode[] = [];

        // Check for OPML structure
        const opmlBody = xmlDoc.querySelector('body');
        if (opmlBody) {
            return parseOPML(opmlBody);
        }

        const rootElement = xmlDoc.documentElement;
        if (!rootElement) return [];

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
                const text = child.getAttribute('text') || 
                            child.getAttribute('name') || 
                            child.getAttribute('title') || 
                            child.tagName;

                nodes.push({
                    id: nodeId,
                    text: sanitizeText(text),
                    x: 0,
                    y: 0,
                    color: getColorByDepth(depth),
                    parentId
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

/**
 * Dedicated OPML parser logic
 */
function parseOPML(body: Element): MindMapNode[] {
    const nodes: MindMapNode[] = [];
    const rootId = generateId();

    nodes.push({
        ...createRootNode('Mind Map'),
        id: rootId
    });

    const MAX_DEPTH = 50;
    const processOutline = (element: Element, parentId: string, depth: number) => {
        if (depth > MAX_DEPTH) return;
        Array.from(element.children).forEach(child => {
            if (child.tagName.toLowerCase() === 'outline') {
                const nodeId = generateId();
                const text = child.getAttribute('text') || 
                            child.getAttribute('title') || 
                            'Untitled';

                nodes.push({
                    id: nodeId,
                    text: sanitizeText(text),
                    x: 0,
                    y: 0,
                    color: getColorByDepth(depth),
                    parentId
                });

                processOutline(child, nodeId, depth + 1);
            }
        });
    };

    processOutline(body, rootId, 0);
    return nodes;
}
