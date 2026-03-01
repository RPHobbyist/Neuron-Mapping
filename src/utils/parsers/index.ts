/**
 * File Parser Module
 * 
 * Main entry point for parsing various file formats into MindMapNode arrays.
 * Delegates to format-specific parsers based on file extension.
 */

import { MindMapNode } from '@/types/mindmap';
import { parseTextFile } from './textParser';
import { parseMarkdown } from './markdownParser';
import { parseJSON } from './jsonParser';
import { parseCSV } from './csvParser';
import { parseXML } from './xmlParser';
import { parseNMM } from './nmmParser';

// Re-export individual parsers for direct access
export { parseTextFile } from './textParser';
export { parseMarkdown } from './markdownParser';
export { parseJSON } from './jsonParser';
export { parseCSV } from './csvParser';
export { parseXML } from './xmlParser';
export { parseNMM } from './nmmParser';

/**
 * Supported file extensions
 */
export const SUPPORTED_EXTENSIONS = ['txt', 'md', 'markdown', 'json', 'csv', 'xml', 'opml', 'nmm'] as const;
export type SupportedExtension = typeof SUPPORTED_EXTENSIONS[number];

/**
 * Check if a file extension is supported.
 */
export function isSupportedExtension(ext: string): ext is SupportedExtension {
    return SUPPORTED_EXTENSIONS.includes(ext.toLowerCase() as SupportedExtension);
}

/**
 * Parse a file into mind map nodes.
 * Automatically detects format from file extension.
 * 
 * @throws Error if file type is unsupported
 */
export async function parseFile(file: File): Promise<MindMapNode[]> {
    const content = await file.text();
    const extension = getFileExtension(file.name);

    if (!extension || !isSupportedExtension(extension)) {
        throw new Error(`Unsupported file type: .${extension || 'unknown'}`);
    }

    return parseContent(content, extension);
}

/**
 * Parse content string with explicit format.
 */
export function parseContent(content: string, format: SupportedExtension): MindMapNode[] {
    switch (format) {
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
        case 'nmm':
            return parseNMM(content);
        default:
            // TypeScript ensures exhaustiveness, but just in case
            throw new Error(`Unsupported format: ${format}`);
    }
}

/**
 * Get file extension from filename.
 */
function getFileExtension(filename: string): string | undefined {
    return filename.split('.').pop()?.toLowerCase();
}
