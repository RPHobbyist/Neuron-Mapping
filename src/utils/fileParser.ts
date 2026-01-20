import { MindMapNode, NodeColor } from '@/types/mindmap';

const generateId = () => Math.random().toString(36).substr(2, 9);

const colors: NodeColor[] = ['orange', 'blue', 'cyan', 'yellow', 'green', 'purple', 'pink', 'red', 'teal', 'grey'];
const getColor = (depth: number): NodeColor => colors[depth % colors.length];

export async function parseFile(file: File): Promise<MindMapNode[]> {
    const content = await file.text();
    const extension = file.name.split('.').pop()?.toLowerCase();

    switch (extension) {
        case 'txt':
            return parseTextFile(content);
        case 'md':
        case 'markdown':
            return parseMarkdown(content);
        case 'json':
            return parseJSON(content);
        case 'csv':
            return parseCSV(content);
        case 'xml':
        case 'opml':
            return parseXML(content);
        default:
            throw new Error(`Unsupported file type: .${extension}`);
    }
}

// Parse indented text file (robust indent detection)
function parseTextFile(content: string): MindMapNode[] {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const nodes: MindMapNode[] = [];
    const rootId = generateId();

    // Create root node from first line (assuming title or first item)
    nodes.push({
        id: rootId,
        text: lines[0].trim(),
        x: 0,
        y: 0,
        color: 'orange',
        parentId: null
    });

    // Detect indentation unit from first indented line
    let indentUnit = 0;
    for (let i = 1; i < lines.length; i++) {
        const indentMatch = lines[i].match(/^\s+/);
        if (indentMatch) {
            indentUnit = indentMatch[0].length;
            break;
        }
    }
    if (indentUnit === 0) indentUnit = 2; // Default fallback

    const stack: { id: string; level: number }[] = [{ id: rootId, level: 0 }];

    // Process remaining lines
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const text = line.trim();
        const indentMatch = line.match(/^\s*/);
        const indent = indentMatch ? indentMatch[0].length : 0;

        // Calculate level based on indentation unit
        // If mixed tabs/spaces, this might be imperfect but decent heuristic
        const level = Math.round(indent / indentUnit);

        // Find parent: parent must have level < current level
        // But strictly, parent should be level - 1?
        // Let's support skipping levels by taking the last item with level < current
        while (stack.length > 1 && stack[stack.length - 1].level >= level) {
            stack.pop();
        }

        // Safety check if we popped everything (shouldn't happen if level > 0)
        // If level 0 (root sibling?), treat as child of root? Or separate tree?
        // We'll enforce single root for now by keeping stack[0]
        if (stack.length === 0) stack.push({ id: rootId, level: 0 });

        const parent = stack[stack.length - 1];
        const nodeId = generateId();

        nodes.push({
            id: nodeId,
            text,
            x: 0,
            y: 0,
            color: getColor(stack.length - 1),
            parentId: parent.id
        });

        stack.push({ id: nodeId, level: level + 1 }); // Push actual level relative to hierarchy? 
        // Actually, let's store the 'indent level' of this node
        stack[stack.length - 1].level = level; // Fix level in stack
    }

    return nodes;
}

// Parse Markdown file (Headers + Lists hierarchy)
function parseMarkdown(content: string): MindMapNode[] {
    const lines = content.split('\n');
    const nodes: MindMapNode[] = [];

    // Filter useful lines
    const validLines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && (
            trimmed.startsWith('#') ||
            /^[-*+]\s/.test(trimmed) ||
            /^\d+\.\s/.test(trimmed)
        );
    });

    if (validLines.length === 0) return parseTextFile(content);

    const rootId = generateId();
    // Use filename or first header as root? 
    // We'll trust the first valid line is root-ish.
    const firstLine = validLines[0];
    const firstText = firstLine.replace(/^[#\-*+\d.]+\s+/, '').trim();

    nodes.push({
        id: rootId,
        text: firstText,
        x: 0,
        y: 0,
        color: 'orange',
        parentId: null
    });

    const stack: { id: string; level: number }[] = [{ id: rootId, level: 0 }];

    for (let i = 1; i < validLines.length; i++) {
        const line = validLines[i];
        const trimmed = line.trim();
        let level = 0;
        let text = '';

        if (trimmed.startsWith('#')) {
            const match = trimmed.match(/^(#+)\s+(.*)/);
            if (match) {
                // H1 = level 1, H2 = level 2... 
                // But H1 is usually title. If we already created root (level 0),
                // H1 should be child (level 1).
                level = match[1].length;
                text = match[2];
            }
        } else {
            // Lists: Calculate level based on indent + list type
            const indentMatch = line.match(/^\s*/);
            const indent = indentMatch ? indentMatch[0].length : 0;
            const indentLevel = Math.floor(indent / 2); // Assume 2 spaces per level

            // Base level for lists should be deeper than headers?
            // If H2 is active, list should be child of H2.
            // Heuristic: Lists start at "current header level + 1" + indentation
            // But we don't know "current header level" easily without state.
            // Let's simplify: normalize levels.
            // H1=1, H2=2, H3=3.
            // List item (0 indent) under H2 -> effectively level 3?
            level = 10 + indentLevel; // Use high number to distinguish? No, mixing is hard.

            // Revised approach: Stack contains mixed types.
            // Logic:
            // Header level N.
            // List level M.
            // We need a unified "depth score".
            // H1=1, H2=2, H3=3, H4=4
            // Top list (- item) = 5?
            // Indented list (  - item) = 6?

            // Problem: H2 -> - Item -> H2 (sibling).
            // If we treat list as depth 5, H2 (depth 2) will pop it. Correct.
            // H2 -> - Item -> H3 (child of H2).
            // H3 is depth 3. List is depth 5. 3 < 5. List pops? No.
            // We want H3 to be sibling of Item? Or parent? usually headers structure lists.
            // Let's assume lists are always children of the preceding header.
            // So we take the last header's level + 1 + listIndent

            // Find last header level in stack
            const lastHeaderLevel = 0;
            // This is tricky without scanning back. 
            // Alternative: Assign high base for lists.
            level = 99 + indentLevel; // Lists are always leaf-ish relative to headers?

            // Wait, standard markdown:
            // # Title
            // - Item 1
            //   - Item 2
            // ## Section
            // - Item 3

            // Stack: [Root, H1, Item1, Item2]
            // Section (H2) comes. H2 < Item2? If Item2 is "level 100", yes H2 pops it.
            // H2 < Item1? Yes.
            // H2 < H1? No (2 > 1). So H2 becomes child of H1. Correct.
            // But what if H2 is sibling of H1?
            // H1 (level 1). H2 (level 2).
            // If we parse H1 as level 1, H2 as level 2.
            // Stack: [Root(0), H1(1)].
            // H2(2) -> [Root, H1, H2]? No, H2 should be child of H1? 
            // Normally H1 and H2 are siblings if they are top level.
            // But in Mind Map, we need a single root.
            // If implicit root is "Document", then H1 and H2 are children.

            // If file starts with H1, that's root.
            // Then H2 is child of H1.
            // Then H2 sibling is child of H1.

            // Let's try: Header Level is the level.
            // List items: always deeper than the deepest header currently in stack.
            // Calculate "effective level" = current_header_level + 1 + list_indent.

            // Retrieve deepst header level from stack
            let headerBase = 0;
            for (let j = stack.length - 1; j >= 0; j--) {
                if (stack[j].level < 10) { // Headers are < 10
                    headerBase = stack[j].level;
                    break;
                }
            }
            // If no header found (just lists), base is 0.

            level = (headerBase || 0) + 1 + indentLevel;

            text = trimmed.replace(/^[-*+\d.]+\s+/, '');

            // Only for headers, ensure level is mapped significantly
            // H1=1, H2=2... is fine.
        }

        if (!text) continue;

        // Find parent
        while (stack.length > 1 && stack[stack.length - 1].level >= level) {
            stack.pop();
        }

        const parent = stack[stack.length - 1];
        const nodeId = generateId();

        nodes.push({
            id: nodeId,
            text,
            x: 0,
            y: 0,
            color: getColor(stack.length - 1),
            parentId: parent.id
        });

        stack.push({ id: nodeId, level });
    }

    return nodes;
}

// Parse JSON (recurisve)
function parseJSON(content: string): MindMapNode[] {
    try {
        const data = JSON.parse(content);
        const nodes: MindMapNode[] = [];
        const rootId = generateId();

        const rootName = Array.isArray(data) ? 'Array' : (typeof data === 'object' ? 'Root' : 'Value');

        nodes.push({
            id: rootId,
            text: rootName,
            x: 0,
            y: 0,
            color: 'orange',
            parentId: null
        });

        const processItem = (item: unknown, parentId: string, depth: number) => {
            if (Array.isArray(item)) {
                item.forEach((val, index) => {
                    const nodeId = generateId();
                    const isLeaf = typeof val !== 'object' || val === null;
                    nodes.push({
                        id: nodeId,
                        text: isLeaf ? String(val) : `[${index}]`,
                        x: 0,
                        y: 0,
                        color: getColor(depth),
                        parentId: parentId
                    });
                    if (!isLeaf) processItem(val, nodeId, depth + 1);
                });
            } else if (typeof item === 'object' && item !== null) {
                Object.entries(item).forEach(([key, value]) => {
                    const nodeId = generateId();
                    nodes.push({
                        id: nodeId,
                        text: key,
                        x: 0,
                        y: 0,
                        color: getColor(depth),
                        parentId: parentId
                    });
                    if (typeof value === 'object' && value !== null) {
                        processItem(value, nodeId, depth + 1);
                    } else {
                        const leafId = generateId();
                        nodes.push({
                            id: leafId,
                            text: String(value),
                            x: 0,
                            y: 0,
                            color: getColor(depth + 1),
                            parentId: nodeId
                        });
                    }
                });
            }
        };

        processItem(data, rootId, 0);
        return nodes;
    } catch (e) {
        console.error('JSON Parse Error', e);
        return [];
    }
}

// Parse CSV
function parseCSV(content: string): MindMapNode[] {
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length === 0) return [];
    const nodes: MindMapNode[] = [];
    const rootId = generateId();

    nodes.push({
        id: rootId,
        text: 'CSV Import',
        x: 0,
        y: 0,
        color: 'orange',
        parentId: null
    });

    lines.forEach((line, index) => {
        // Handle quoted CSV cells basic support
        const cells: string[] = [];
        let inQuote = false;
        let current = '';
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') inQuote = !inQuote;
            else if (char === ',' && !inQuote) {
                cells.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        cells.push(current.trim());

        if (cells.length === 0) return;

        const rowId = generateId();
        nodes.push({
            id: rowId,
            text: cells[0].replace(/^"|"$/g, '') || `Row ${index + 1}`,
            x: 0,
            y: 0,
            color: getColor(0),
            parentId: rootId
        });

        for (let i = 1; i < cells.length; i++) {
            if (!cells[i]) continue;
            const cellId = generateId();
            nodes.push({
                id: cellId,
                text: cells[i].replace(/^"|"$/g, ''),
                x: 0,
                y: 0,
                color: getColor(1),
                parentId: rowId
            });
        }
    });

    return nodes;
}

// Parse XML/OPML
function parseXML(content: string): MindMapNode[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, "text/xml");
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
        id: rootId,
        text: rootElement.tagName,
        x: 0,
        y: 0,
        color: 'orange',
        parentId: null
    });

    const processNode = (xmlNode: Element, parentId: string, depth: number) => {
        Array.from(xmlNode.children).forEach(child => {
            const nodeId = generateId();
            // Prefer 'text', 'name', 'title' attributes if available, else tagName
            const text = child.getAttribute('text') || child.getAttribute('name') || child.getAttribute('title') || child.tagName;

            nodes.push({
                id: nodeId,
                text: text,
                x: 0,
                y: 0,
                color: getColor(depth),
                parentId: parentId
            });

            if (child.children.length > 0) {
                processNode(child, nodeId, depth + 1);
            } else if (child.textContent && child.textContent.trim()) {
                const content = child.textContent.trim();
                // If content is just whitespace/newlines ignore
                if (content.length > 0) {
                    const textId = generateId();
                    nodes.push({
                        id: textId,
                        text: content,
                        x: 0,
                        y: 0,
                        color: getColor(depth + 1),
                        parentId: nodeId
                    });
                }
            }
        });
    };

    processNode(rootElement, rootId, 0);
    return nodes;
}

// Dedicated OPML parser
function parseOPML(body: Element): MindMapNode[] {
    const nodes: MindMapNode[] = [];
    const rootId = generateId();

    // Create logic root
    nodes.push({
        id: rootId,
        text: 'Mind Map',
        x: 0,
        y: 0,
        color: 'orange',
        parentId: null
    });

    const processOutline = (element: Element, parentId: string, depth: number) => {
        Array.from(element.children).forEach(child => {
            if (child.tagName.toLowerCase() === 'outline') {
                const nodeId = generateId();
                const text = child.getAttribute('text') || child.getAttribute('title') || 'Untitled';

                nodes.push({
                    id: nodeId,
                    text: text,
                    x: 0,
                    y: 0,
                    color: getColor(depth),
                    parentId: parentId
                });

                processOutline(child, nodeId, depth + 1);
            }
        });
    };

    processOutline(body, rootId, 0);
    return nodes;
}
