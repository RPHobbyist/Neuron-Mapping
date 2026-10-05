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

import { node, openPanelSection, preparePage } from './helpers';

test.beforeEach(async ({ page }) => {
    await preparePage(page);
});

test('several selected blocks are edited together, in one undo step', async ({ page }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();

    await node(page, 'Topic 1').click();
    await node(page, 'Topic 2').click({ modifiers: ['Shift'] });
    await expect(page.getByRole('heading', { name: '2 Blocks' })).toBeVisible();

    const fill = (text: string) => page.locator(`[data-node-id]:has-text("${text}") > div`).first();
    await openPanelSection(page, 'Color');
    await page.getByTitle('Green', { exact: true }).click();
    await expect(fill('Topic 1')).toHaveClass(/node-green-bg/);
    await expect(fill('Topic 2')).toHaveClass(/node-green-bg/);

    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(fill('Topic 1')).not.toHaveClass(/node-green-bg/);
    await expect(fill('Topic 2')).not.toHaveClass(/node-green-bg/);
});
