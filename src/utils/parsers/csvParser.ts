import { MindMapNode } from '@/types/mindmap';
import { createRootNode, generateId, getColorByDepth, sanitizeText } from './parserUtils';

export function parseCSV(content: string): MindMapNode[] {
    const lines = splitCsvRows(content).filter(l => l.trim());
    if (lines.length === 0) return [];

    const nodes: MindMapNode[] = [];
    const rootId = generateId();

    nodes.push({
        ...createRootNode('CSV Import'),
        id: rootId
    });

    const rowIdByText = new Map<string, string>();
    const childKeysByRowId = new Map<string, Set<string>>();

    lines.forEach((line, rowIndex) => {
        const cells = parseCsvLine(line);
        if (cells.length === 0) return;

        const rowText = cells[0].replace(/^"|"$/g, '') || `Row ${rowIndex + 1}`;
        const rowKey = rowText.trim().toLowerCase();

        let rowId = rowIdByText.get(rowKey);
        if (!rowId) {
            rowId = generateId();
            rowIdByText.set(rowKey, rowId);
            nodes.push({
                id: rowId,
                text: sanitizeText(rowText),
                x: 0,
                y: 0,
                color: getColorByDepth(0),
                parentId: rootId
            });
        }

        let childKeys = childKeysByRowId.get(rowId);
        if (!childKeys) {
            childKeys = new Set();
            childKeysByRowId.set(rowId, childKeys);
        }

        for (let i = 1; i < cells.length; i++) {
            const cellText = cells[i].replace(/^"|"$/g, '');
            if (!cellText) continue;

            const childKey = cellText.trim().toLowerCase();
            if (childKeys.has(childKey)) continue;
            childKeys.add(childKey);

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

function parseCsvLine(line: string): string[] {
    const cells: string[] = [];
    let current = '';
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuote && line[i + 1] === '"') {
                current += '"';
                i++;
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

    cells.push(current.trim());

    return cells;
}
 