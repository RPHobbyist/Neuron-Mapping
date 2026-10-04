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

import { node, preparePage } from './helpers';

test.use({ launchOptions: { args: ['--disable-webgl', '--disable-3d-apis'] } });

test.beforeEach(async ({ page }) => {
    await preparePage(page);
});

test('without WebGL, the map stays in 2D with a message', async ({ page }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
    await page.getByTitle('View Mode').click();
    await page.getByRole('menuitem', { name: '3D View' }).click();

    await expect(page.getByText(/The 3D view needs WebGL/)).toBeVisible();
    await expect(page.getByTestId('mindmap-canvas')).toBeVisible();
});
