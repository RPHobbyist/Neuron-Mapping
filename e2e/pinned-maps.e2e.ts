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

import { chooseMapAction, node, preparePage, saveAs } from './helpers';

test.beforeEach(async ({ page }) => {
    await preparePage(page);
});

test('a pinned map comes first, and stays pinned after a reload', async ({ page }) => {
    await page.goto('/workspace');
    for (const name of ['Older Map', 'Newer Map']) {
        await page.getByRole('button', { name: 'New Map' }).click();
        await expect(node(page, 'Central Idea')).toBeVisible();
        await saveAs(page, name);
        await page.getByTitle('Back to templates').click();
    }
    const cards = page.getByRole('button', { name: /^Open .* Map$/ });
    await expect(cards.first()).toHaveAccessibleName('Open Newer Map');

    await chooseMapAction(page, 'Older Map', 'Pin to the top');
    await expect(cards.first()).toHaveAccessibleName('Open Older Map');

    await page.reload();
    await expect(cards.first()).toHaveAccessibleName('Open Older Map');
    await chooseMapAction(page, 'Older Map', 'Unpin');
    await expect(cards.first()).toHaveAccessibleName('Open Newer Map');
});
