/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { z } from 'zod';

import { BoxArea, ConnectionStyle, Drawing, MindMapNode, SavedMindMap, Viewport } from '@/types/mindmap';
import { Template } from '@/types/templates';
import { repairNodeLinks } from '@/utils/mapIntegrity';

import { BoxAreaSchema, ConnectionStyleSchema, DrawingSchema, MindMapNodeSchema, tolerantArray } from './schemas';

export const DOCUMENT_SCHEMA_VERSION = 1;

type DocumentMigration = (doc: Record<string, unknown>) => Record<string, unknown>;
const MIGRATIONS: Record<number, DocumentMigration> = {};

export const migrateDocument = (raw: unknown): unknown => {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return raw;
    let doc = raw as Record<string, unknown>;
    const from = typeof doc.schemaVersion === 'number' ? doc.schemaVersion : 1;
    for (let version = from; version < DOCUMENT_SCHEMA_VERSION; version++) {
        const step = MIGRATIONS[version];
        if (step) doc = step(doc);
    }
    return doc;
};

export const FILE_FORMAT_VERSION = '1.1';
const FILE_VERSION_RE = /^(\d+)\.\d+$/;

export const isSupportedFileVersion = (version: unknown): boolean => {
    const match = typeof version === 'string' ? FILE_VERSION_RE.exec(version) : null;
    return !!match && Number(match[1]) === 1;
};

export class UnsupportedFileVersionError extends Error {}

export interface AutoSaveData {
    nodes: MindMapNode[];
    connectionStyle: ConnectionStyle;
    drawings?: Drawing[];
    boxAreas?: BoxArea[];
    viewport?: Viewport;
    lastModified: number;
    mapId?: string;
    name?: string;
    templateId?: string;
    schemaVersion?: number;
}

export interface SnapshotRecord {
    id: string;
    name: string;
    timestamp: number;
    nodes: MindMapNode[];
    connectionStyle?: ConnectionStyle;
    drawings?: Drawing[];
    boxAreas?: BoxArea[];
    auto?: boolean;
    thumbnail?: string;
    schemaVersion?: number;
}

export interface NeuronMindMapFile {
    version: string;
    name: string;
    nodes: MindMapNode[];
    connectionStyle?: ConnectionStyle;
    createdAt: string;
    updatedAt: string;
    drawings?: Drawing[];
    boxAreas?: BoxArea[];
}

const mapContent = {
    nodes: tolerantArray(MindMapNodeSchema),
    drawings: tolerantArray(DrawingSchema).optional().catch(undefined),
    boxAreas: tolerantArray(BoxAreaSchema).optional().catch(undefined),
};

const optionalString = z.string().optional().catch(undefined);

const optionalViewport = z.object({
    x: z.number().finite(),
    y: z.number().finite(),
    zoom: z.number().finite().positive(),
}).optional().catch(undefined);

const SavedMapSchema = z.object({
    ...mapContent,
    viewport: optionalViewport,
    id: z.string().min(1),
    name: z.string().catch('Untitled map'),
    connectionStyle: ConnectionStyleSchema.catch('curved'),
    templateId: optionalString,
    createdAt: z.string().catch(''),
    updatedAt: z.string().catch(''),
    thumbnail: optionalString,
});

const AutoSaveSchema = z.object({
    ...mapContent,
    viewport: optionalViewport,
    connectionStyle: ConnectionStyleSchema.catch('curved'),
    lastModified: z.number().finite().catch(0),
    mapId: optionalString,
    name: optionalString,
    templateId: optionalString,
});

const SnapshotSchema = z.object({
    ...mapContent,
    id: z.string().min(1),
    name: z.string().catch('Snapshot'),
    timestamp: z.number().finite().catch(0),
    connectionStyle: ConnectionStyleSchema.optional().catch(undefined),
    auto: z.boolean().optional().catch(undefined),
    thumbnail: optionalString,
}).passthrough();

const CustomTemplateSchema = z.object({
    ...mapContent,
    id: z.string().min(1),
    name: z.string().catch('Untitled Template'),
    category: z.string().catch('my-templates'),
    description: z.string().catch(''),
    tags: z.array(z.string()).optional().catch(undefined),
    connectionStyle: ConnectionStyleSchema.optional().catch(undefined),
    isCustom: z.boolean().optional().catch(undefined),
});

const MapFileSchema = z.object({
    ...mapContent,
    version: z.string().refine(isSupportedFileVersion),
    name: z.string().catch('Untitled Mind Map'),
    connectionStyle: ConnectionStyleSchema.optional().catch(undefined),
    createdAt: z.string().catch(''),
    updatedAt: z.string().catch(''),
});

const repairStructure = <T extends { nodes: MindMapNode[] }>(doc: T): T => {
    const { nodes, repaired } = repairNodeLinks(doc.nodes);
    if (repaired > 0) console.warn(`Repaired ${repaired} node link${repaired === 1 ? '' : 's'} while reading a map`);
    return nodes === doc.nodes ? doc : { ...doc, nodes };
};

const parseRecord = <T extends { nodes: MindMapNode[] }>(schema: z.ZodTypeAny, raw: unknown, label: string): T | null => {
    const result = schema.safeParse(migrateDocument(raw));
    if (!result.success) {
        console.error(`Skipping an unreadable ${label}:`, result.error);
        return null;
    }
    return repairStructure(result.data as T);
};

export const parseSavedMap = (raw: unknown) => parseRecord<SavedMindMap>(SavedMapSchema, raw, 'saved map');
export const parseAutoSave = (raw: unknown) => parseRecord<AutoSaveData>(AutoSaveSchema, raw, 'unsaved session');
export const parseSnapshot = (raw: unknown) => parseRecord<SnapshotRecord>(SnapshotSchema, raw, 'snapshot');
export const parseCustomTemplate = (raw: unknown) => parseRecord<Template>(CustomTemplateSchema, raw, 'custom template');

export const parseMapFile = (raw: unknown): NeuronMindMapFile | null => {
    const version = typeof raw === 'object' && raw !== null ? (raw as { version?: unknown }).version : undefined;
    if (typeof version === 'string' && FILE_VERSION_RE.test(version) && !isSupportedFileVersion(version)) {
        throw new UnsupportedFileVersionError('This file was made by a newer version of Neuron Mapping.');
    }
    const result = MapFileSchema.safeParse(raw);
    return result.success ? repairStructure(result.data as NeuronMindMapFile) : null;
};
