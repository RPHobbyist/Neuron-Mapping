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

import { chooseMapAction, node, preparePage, putInAppStore, renameSelectedNode, saveAs, savedMapCard } from './helpers';

test.beforeEach(async ({ page }) => {
    await preparePage(page);
});

const storedMap = (id: string, name: string, createdAt: string, updatedAt: string) => ({
    id,
    name,
    nodes: [{ id: 'root', text: `${name} root`, x: 0, y: 0, color: 'root', parentId: null }],
    connectionStyle: 'curved',
    createdAt,
    updatedAt,
});

const seedMaps = async (page: Page) => {
    await page.goto('/workspace');
    await expect(page.getByRole('button', { name: 'New Map' })).toBeVisible();
    await putInAppStore(page, 'neuron_saved_maps', [
        storedMap('a', 'Budget', '2026-01-01T00:00:00.000Z', '2026-03-01T00:00:00.000Z'),
        storedMap('b', 'Plan 10', '2026-01-03T00:00:00.000Z', '2026-02-01T00:00:00.000Z'),
        storedMap('c', 'Plan 2', '2026-01-02T00:00:00.000Z', '2026-01-15T00:00:00.000Z'),
    ]);
    await page.reload();
    await expect(savedMapCard(page, 'Budget')).toBeVisible();
};

const cardNames = (page: Page) => page.getByRole('region', { name: 'Your Maps' }).getByRole('heading', { level: 3 }).allTextContents();

test('saved maps are searched and sorted, and the order is remembered', async ({ page }) => {
    await seedMaps(page);
    expect(await cardNames(page)).toEqual(['Budget', 'Plan 10', 'Plan 2']);

    const sort = page.getByLabel('Sort your maps');
    await sort.selectOption('name');
    expect(await cardNames(page)).toEqual(['Budget', 'Plan 2', 'Plan 10']);
    await sort.selectOption('created');
    expect(await cardNames(page)).toEqual(['Plan 10', 'Plan 2', 'Budget']);

    await page.getByLabel('Search your maps').fill('plan');
    expect(await cardNames(page)).toEqual(['Plan 10', 'Plan 2']);
    await page.getByLabel('Search your maps').fill('holiday');
    await expect(page.getByText('None of your maps is called that.')).toBeVisible();

    await page.reload();
    await expect(savedMapCard(page, 'Budget')).toBeVisible();
    await expect(sort).toHaveValue('created');
});

test('a map is renamed, duplicated and exported from its card', async ({ page }) => {
    await seedMaps(page);

    await chooseMapAction(page, 'Budget', /Rename/);
    const dialog = page.getByRole('dialog', { name: 'Rename Map' });
    await expect(dialog.getByLabel('Name')).toHaveValue('Budget');
    await dialog.getByLabel('Name').fill('Budget 2026');
    await dialog.getByRole('button', { name: 'Rename' }).click();
    await expect(page.getByText('Renamed to "Budget 2026"')).toBeVisible();
    await expect(savedMapCard(page, 'Budget 2026')).toBeVisible();
    await expect(savedMapCard(page, 'Budget')).toHaveCount(0);

    await chooseMapAction(page, 'Budget 2026', 'Duplicate');
    await expect(page.getByText('Created "Budget 2026 (copy)"')).toBeVisible();
    await chooseMapAction(page, 'Budget 2026', 'Duplicate');
    await expect(savedMapCard(page, 'Budget 2026 (copy 2)')).toBeVisible();

    const download = page.waitForEvent('download');
    await chooseMapAction(page, 'Plan 2', /Export as a file/);
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/\.nmm$/);
    const exported = JSON.parse(await readFile(await file.path(), 'utf-8'));
    expect(exported).toMatchObject({ name: 'Plan 2', nodes: [{ text: 'Plan 2 root' }] });

    await savedMapCard(page, 'Budget 2026 (copy)').click();
    await expect(node(page, 'Budget root')).toBeVisible();
    await page.getByTitle('Back to templates').click();
    await chooseMapAction(page, 'Budget 2026', 'Delete');
    await expect(savedMapCard(page, 'Budget 2026 (copy)')).toBeVisible();
    await expect(savedMapCard(page, 'Budget 2026')).toHaveCount(0);
});

test("renaming a map renames its unsaved changes too", async ({ page }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
    await saveAs(page, 'Draft');
    await node(page, 'Topic 1').click();
    await renameSelectedNode(page, 'Edited');
    await page.getByTitle('Back to templates').click();

    await chooseMapAction(page, 'Draft', /Rename/);
    const dialog = page.getByRole('dialog', { name: 'Rename Map' });
    await dialog.getByLabel('Name').fill('Final');
    await dialog.getByLabel('Name').press('Enter');
    await expect(savedMapCard(page, 'Final')).toBeVisible();

    await page.getByRole('button', { name: 'Resume Final' }).click();
    await expect(node(page, 'Edited')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Rename Map' })).toHaveValue('Final');
});

test('the save and import dialogs close with Escape and keep the focus inside', async ({ page }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'Import', exact: true }).click();
    const importDialog = page.getByRole('dialog', { name: 'Import from File' });
    await expect(importDialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(importDialog).toBeHidden();

    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const saveDialog = page.getByRole('dialog', { name: 'Save Mind Map' });
    const name = saveDialog.getByLabel('Name');
    await expect(name).toBeFocused();
    await page.keyboard.type('Typed over');
    await expect(name).toHaveValue('Typed over');
    for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
    expect(await saveDialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(saveDialog).toBeHidden();
    await expect(page.getByTestId('mindmap-canvas').locator('[data-node-id]')).toHaveCount(5);
});
