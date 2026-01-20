import { MindMapNode } from '@/types/mindmap';
import { createRootNode, generateId, getColorByDepth } from './parserUtils';

/**
 * Parse CSV content into mind map nodes.
 * First column of each row becomes the parent, remaining columns become children.
 */
export function parseCSV(content: string): MindMapNode[] {
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length === 0) return [];

    const nodes: MindMapNode[] = [];
    const rootId = generateId();

    nodes.push({
        ...createRootNode('CSV Import'),
        id: rootId
    });

    lines.forEach((line, rowIndex) => {
        const cells = parseCsvLine(line);
        if (cells.length === 0) return;

        // First cell becomes row node
        const rowId = generateId();
        const rowText = cells[0].replace(/^"|"$/g, '') || `Row ${rowIndex + 1}`;

        nodes.push({
            id: rowId,
            text: rowText,
            x: 0,
            y: 0,
            color: getColorByDepth(0),
            parentId: rootId
        });

        // Remaining cells become children
        for (let i = 1; i < cells.length; i++) {
            const cellText = cells[i].replace(/^"|"$/g, '');
            if (!cellText) continue;

            nodes.push({
                id: generateId(),
                text: cellText,
                x: 0,
                y: 0,
                color: getColorByDepth(1),
                parentId: rowId
            });
        }
    });

    return nodes;
}

/**
 * Parse a single CSV line, handling quoted values.
 */
function parseCsvLine(line: string): string[] {
    const cells: string[] = [];
    let current = '';
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            // Handle escaped quotes
            if (inQuote && line[i + 1] === '"') {
                current += '"';
                i++; // Skip next quote
            } else {
                inQuote = !inQuote;
            }
        } else if (char === ',' && !inQuote) {
            cells.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    // Add last cell
    cells.push(current.trim());

    return cells;
}
