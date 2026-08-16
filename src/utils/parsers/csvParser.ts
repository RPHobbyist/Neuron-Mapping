import { MindMapNode } from '@/types/mindmap';
import { createRootNode, generateId, getColorByDepth, sanitizeText } from './parserUtils';

/**
 * Parse CSV content into mind map nodes.
 * First column of each row becomes the parent, remaining columns become children.
 */
export function parseCSV(content: string): MindMapNode[] {
    // Split on quote-aware row boundaries first — splitting on raw '\n' before
    // parsing quotes would tear a quoted field containing a literal newline
    // into two spurious rows.
    const lines = splitCsvRows(content).filter(l => l.trim());
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
            text: sanitizeText(rowText),
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
                text: sanitizeText(cellText),
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
 * Split raw CSV content into rows, tracking quote state across the whole
 * string so a newline inside a quoted field doesn't end the row early.
 */
function splitCsvRows(content: string): string[] {
    const rows: string[] = [];
    let current = '';
    let inQuote = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];

        if (char === '"') {
            inQuote = !inQuote;
            current += char;
        } else if ((char === '\n' || char === '\r') && !inQuote) {
            // Collapse \r\n and skip blank separators without losing empty rows
            if (char === '\r' && content[i + 1] === '\n') i++;
            rows.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    if (current.length > 0) rows.push(current);

    return rows;
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
