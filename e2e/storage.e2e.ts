/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

import { node, preparePage, putInAppStore, saveAs, savedMapCard } from './helpers';

test.beforeEach(async ({ page }) => {
    await preparePage(page);
});

test('maps saved by earlier versions move to the new storage and still open', async ({ page }) => {
    await page.goto('/workspace');
    await expect(page.getByRole('button', { name: 'New Map' })).toBeVisible();
    await putInAppStore(page, 'neuron_saved_maps', [{
        id: 'legacy-map',
        name: 'Legacy Plan',
        nodes: [
            { id: 'root', text: 'Legacy root', x: 0, y: 0, color: 'root', parentId: null },
            { id: 'child', text: 'Legacy child', x: 250, y: 0, color: 'blue', parentId: 'root' },
        ],
        connectionStyle: 'curved',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
    }]);

    await page.reload();
    await savedMapCard(page, 'Legacy Plan').click();
    await expect(node(page, 'Legacy child')).toBeVisible();
});

test('a backup brings every map back in a fresh browser profile', async ({ page, browser }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
    await saveAs(page, 'Backed Up Plan');
    await page.getByTitle('Back to templates').click();

    await expect(page.getByText('Back up your maps')).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Back up now' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.nmmbackup$/);
    const content = await readFile(await download.path(), 'utf-8');
    expect(JSON.parse(content).maps.map((m: { name: string }) => m.name)).toEqual(['Backed Up Plan']);
    await expect(page.getByText('Back up your maps')).toBeHidden();

    const fresh = await browser.newContext();
    try {
        const freshPage = await fresh.newPage();
        await preparePage(freshPage);
        await freshPage.goto(new URL('/workspace', page.url()).toString());
        await freshPage.locator('#backup-file-input').setInputFiles({
            name: 'maps.nmmbackup',
            mimeType: 'application/json',
            buffer: Buffer.from(content),
        });
        await expect(freshPage.getByText('Added 1 map.')).toBeVisible();
        await savedMapCard(freshPage, 'Backed Up Plan').click();
        await expect(node(freshPage, 'Central Idea')).toBeVisible();
    } finally {
        await fresh.close();
    }
});
