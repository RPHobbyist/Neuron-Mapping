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

test.beforeEach(async ({ page }) => {
    await preparePage(page);
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
});

test('an icon is added to a node from the icon library, changed and removed', async ({ page }) => {
    const topic = page.getByTestId('mindmap-canvas').locator('[data-node-id]', { hasText: 'Topic 1' });
    const icon = topic.locator('svg[class*="stroke-[1.5]"]');
    await node(page, 'Topic 1').click();

    await page.getByTitle('Add Icon').click();
    const library = page.getByRole('dialog', { name: /Icon Library/ });
    await expect(library.getByRole('button', { name: 'Insert Icon' })).toBeDisabled();
    await library.getByPlaceholder('Search icons...').fill('rocket');
    await library.getByTitle('Rocket', { exact: true }).click();
    await library.getByText('Icon with Box').click();
    await library.getByRole('button', { name: 'Insert Icon' }).click();

    await expect(library).toBeHidden();
    await expect(icon).toHaveCount(1);
    await expect(node(page, 'Topic 1')).toBeVisible();

    await page.getByTitle('Change or Remove Icon').click();
    await expect(library.getByRole('radio', { name: 'Icon with Box' })).toBeChecked();
    await expect(library.getByRole('button', { name: /Transport/ })).toHaveClass(/bg-primary/);
    await library.getByTitle('Plane', { exact: true }).click();
    await library.getByRole('button', { name: 'Save' }).click();
    await expect(icon).toHaveClass(/lucide-plane/);

    await page.getByTitle('Change or Remove Icon').click();
    await library.getByRole('button', { name: 'Remove Icon' }).click();
    await expect(icon).toHaveCount(0);
    await expect(page.getByTitle('Add Icon')).toBeVisible();

    await node(page, 'Topic 2').click();
    await page.getByTitle('Add Icon').click();
    await expect(library.getByRole('button', { name: 'Insert Icon' })).toBeDisabled();
});
