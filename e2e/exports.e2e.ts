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

import { expect, test, type Page } from '@playwright/test';

import { node, preparePage, putInAppStore, savedMapCard } from './helpers';

test.beforeEach(async ({ page }) => {
    await preparePage(page);
});

const openNewMap = async (page: Page) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
};

const chooseExport = async (page: Page, name: RegExp) => {
    await page.getByTitle('Export options').click();
    await page.getByRole('menuitem', { name }).click();
};

test('the map is copied to the clipboard as an image', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await openNewMap(page);

    await chooseExport(page, /Copy image/);
    await expect(page.getByText('Map copied as an image')).toBeVisible();
    const types = await page.evaluate(async () => (await navigator.clipboard.read()).flatMap(item => [...item.types]));
    expect(types).toContain('image/png');
});

test('an SVG export holds the whole map', async ({ page }) => {
    await openNewMap(page);

    const downloadPromise = page.waitForEvent('download');
    await chooseExport(page, /Export as SVG/);
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.svg$/);
    const svg = await readFile(await download.path(), 'utf-8');
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain('Central Idea');
});

test('a large map prints at actual size over several labelled A4 pages', async ({ page }) => {
    await page.goto('/workspace');
    await expect(page.getByRole('button', { name: 'New Map' })).toBeVisible();
    await putInAppStore(page, 'neuron_saved_maps', [{
        id: 'wide-map',
        name: 'Wide Plan',
        nodes: [
            { id: 'root', text: 'Wide root', x: 0, y: 0, color: 'root', parentId: null },
            { id: 'far', text: 'Far away', x: 3000, y: 600, color: 'blue', parentId: 'root' },
        ],
        connectionStyle: 'curved',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
    }]);
    await page.reload();
    await savedMapCard(page, 'Wide Plan').click();
    await expect(node(page, 'Far away')).toBeAttached();

    await chooseExport(page, /Export as PDF/);
    const dialog = page.getByRole('dialog', { name: 'Export as PDF' });
    await dialog.getByText('A4', { exact: true }).click();
    await dialog.getByText('Actual size', { exact: true }).click();
    const summary = await dialog.getByText(/\d+ (landscape|portrait) pages/).textContent();
    const expectedPages = Number(summary!.match(/(\d+) (landscape|portrait) pages/)![1]);
    expect(expectedPages).toBeGreaterThan(1);

    const downloadPromise = page.waitForEvent('download');
    await dialog.getByRole('button', { name: 'Export PDF' }).click();
    const pdf = await readFile(await (await downloadPromise).path(), 'latin1');
    expect(pdf.match(/\/Type \/Page(?!s)/g)).toHaveLength(expectedPages);
    expect(pdf).toContain(`Page 1 of ${expectedPages}`);
});
