/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { expect, test, type Page } from '@playwright/test';

import { node, preparePage, renameSelectedNode, saveAs, savedMapCard } from './helpers';

test.beforeEach(async ({ page }) => {
    await preparePage(page);
});

const startNewMap = async (page: Page, mapName: string) => {
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
    await page.getByRole('textbox', { name: 'Rename Map' }).fill(mapName);
};

const renameTopic = async (page: Page, from: string, to: string) => {
    await node(page, from).click();
    await renameSelectedNode(page, to);
    await expect(node(page, to)).toBeVisible();
};

test('unsaved changes to two different maps are both kept', async ({ page }) => {
    await page.goto('/workspace');
    await startNewMap(page, 'Alpha map');
    await renameTopic(page, 'Topic 1', 'Alpha');
    await page.getByTitle('Back to templates').click();
    await startNewMap(page, 'Beta map');
    await renameTopic(page, 'Topic 1', 'Beta');
    await page.getByTitle('Back to templates').click();

    await page.reload();
    await page.getByRole('button', { name: 'Resume Alpha map' }).click();
    await expect(node(page, 'Alpha')).toBeVisible();
    await page.getByTitle('Back to templates').click();
    await page.getByRole('button', { name: 'Resume Beta map' }).click();
    await expect(node(page, 'Beta')).toBeVisible();
});

test('a saved map with unsaved changes opens with them', async ({ page }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
    await saveAs(page, 'Gamma');
    await renameTopic(page, 'Topic 1', 'Edited after saving');
    await page.getByTitle('Back to templates').click();

    await savedMapCard(page, 'Gamma').click();
    await expect(node(page, 'Edited after saving')).toBeVisible();
});

test('two tabs with the same map warn each other', async ({ page, context }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
    await saveAs(page, 'Shared');

    const secondTab = await context.newPage();
    await preparePage(secondTab);
    await secondTab.goto('/workspace');
    await savedMapCard(secondTab, 'Shared').click();
    await expect(node(secondTab, 'Central Idea')).toBeVisible();

    await expect(secondTab.getByText('This map is already open in another tab')).toBeVisible();
    await expect(page.getByText('This map was just opened in another tab')).toBeVisible();
});
