/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { expect, test } from '@playwright/test';

import { chooseMapAction, node, preparePage, renameSelectedNode, saveAs, savedMapCard } from './helpers';

test.beforeEach(async ({ page }) => {
    await preparePage(page);
});

test('each save keeps the version it replaces, which can be restored', async ({ page }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
    await saveAs(page, 'Versions');
    await expect(page.getByText('Saved "Versions"')).toBeHidden({ timeout: 10_000 });

    await node(page, 'Topic 1').click();
    await renameSelectedNode(page, 'Second version');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Saved "Versions"')).toBeVisible();

    await page.getByTitle('Version History').click();
    await expect(page.getByText(/· automatic/)).toBeVisible();
    await page.getByRole('button', { name: 'Restore Saved version' }).click();

    await expect(node(page, 'Topic 1')).toBeVisible();
    await expect(node(page, 'Second version')).toBeHidden();
});

test('a deleted map comes back with Undo', async ({ page }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
    await saveAs(page, 'Short-lived');
    await page.getByTitle('Back to templates').click();

    await chooseMapAction(page, 'Short-lived', 'Delete');
    await expect(savedMapCard(page, 'Short-lived')).toBeHidden();
    await page.getByRole('button', { name: 'Undo' }).click();

    await expect(page.getByText('Restored "Short-lived"')).toBeVisible();
    await savedMapCard(page, 'Short-lived').click();
    await expect(node(page, 'Central Idea')).toBeVisible();
});
