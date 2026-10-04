/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { MAX_ARCHIVE_FILE_SIZE, MAX_FILE_SIZE, MAX_MAP_FILE_SIZE } from '@/lib/constants';
import { BoxArea, ConnectionStyle, Drawing, MindMapNode } from '@/types/mindmap';
import { loadFromFile } from '@/utils/exportUtils';
import { parseFile } from '@/utils/parsers';

export class ImportFileError extends Error {}

export interface ImportedFile {
    nodes: MindMapNode[];
    name?: string;
    connectionStyle?: ConnectionStyle;
    drawings?: Drawing[];
    boxAreas?: BoxArea[];
    isMapFile: boolean;
}

export const maxImportSize = (fileName: string): number => {
    if (/\.nmm$/i.test(fileName)) return MAX_MAP_FILE_SIZE;
    if (/\.xmind$/i.test(fileName)) return MAX_ARCHIVE_FILE_SIZE;
    return MAX_FILE_SIZE;
};

export const readImportFile = async (file: File): Promise<ImportedFile> => {
    const maxSize = maxImportSize(file.name);
    if (file.size > maxSize) {
        throw new ImportFileError(`File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
    }

    if (/\.nmm$/i.test(file.name)) {
        const data = await loadFromFile(file);
        return { ...data, isMapFile: true };
    }

    const nodes = await parseFile(file);
    if (nodes.length === 0) throw new ImportFileError('No valid content found in file');
    return { nodes, name: file.name.replace(/\.[^.]+$/, '').trim() || undefined, isMapFile: false };
};
