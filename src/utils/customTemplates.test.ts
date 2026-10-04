/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clear, get, set } from 'idb-keyval';

import { appStore } from '@/lib/appStore';
import { MindMapNode } from '@/types/mindmap';

import { CUSTOM_TEMPLATES_KEY, deleteCustomTemplate, getCustomTemplates, saveCustomTemplate } from './customTemplates';

const local = new Map<string, string>();
vi.stubGlobal('localStorage', {
    getItem: (key: string) => local.get(key) ?? null,
    setItem: (key: string, value: string) => { local.set(key, value); },
    removeItem: (key: string) => { local.delete(key); },
});

const nodes: MindMapNode[] = [{ id: 'root', text: 'Root', x: 0, y: 0, color: 'root', parentId: null }];
const template = (id: string) => ({ id, name: 'Template', category: 'my-templates', description: '', nodes, isCustom: true });

beforeEach(async () => {
    await clear(appStore);
    local.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('custom templates', () => {
    it('moves templates from localStorage into IndexedDB', async () => {
        local.set('neuron-custom-templates', JSON.stringify([template('t1')]));

        expect((await getCustomTemplates()).map(t => t.id)).toEqual(['t1']);
        expect(local.has('neuron-custom-templates')).toBe(false);
        expect(await get(CUSTOM_TEMPLATES_KEY, appStore)).toHaveLength(1);
    });

    it('saves and deletes without dropping entries it cannot read', async () => {
        const unreadable = { id: 'future', nodes: 'from a newer version' };
        await set(CUSTOM_TEMPLATES_KEY, [unreadable], appStore);

        const saved = await saveCustomTemplate('Mine', nodes, 'curved');
        expect((await getCustomTemplates()).map(t => t.id)).toEqual([saved.id]);

        await deleteCustomTemplate(saved.id);
        expect(await get(CUSTOM_TEMPLATES_KEY, appStore)).toEqual([unreadable]);
    });
});
