
import { MindMapNode } from '@/types/mindmap';
import { parseTextFile } from './textParser';
import { parseMarkdown } from './markdownParser';
import { parseJSON } from './jsonParser';
import { parseCSV } from './csvParser';
import { parseXML } from './xmlParser';
import { parseNMM } from './nmmParser';

export { parseTextFile } from './textParser';
export { parseMarkdown } from './markdownParser';
export { parseJSON } from './jsonParser';
export { parseCSV } from './csvParser';
export { parseXML } from './xmlParser';
export { parseNMM } from './nmmParser';

export const SUPPORTED_EXTENSIONS = ['txt', 'md', 'markdown', 'json', 'csv', 'xml', 'opml', 'nmm'] as const;
export type SupportedExtension = typeof SUPPORTED_EXTENSIONS[number];

export function isSupportedExtension(ext: string): ext is SupportedExtension {
    return SUPPORTED_EXTENSIONS.includes(ext.toLowerCase() as SupportedExtension);
}

export async function parseFile(file: File): Promise<MindMapNode[]> {
    const content = await file.text();
    const extension = getFileExtension(file.name);

    if (!extension || !isSupportedExtension(extension)) {
        throw new Error(`Unsupported file type: .${extension || 'unknown'}`);
    }

    return parseContent(content, extension);
}

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
            throw new Error(`Unsupported format: ${format}`);
    }
}

function getFileExtension(filename: string): string | undefined {
    return filename.split('.').pop()?.toLowerCase();
}
 