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
});

for (const width of [1920, 1600, 1536, 1366, 1280, 1024, 860]) {
    test(`every toolbar button is within a window ${width} wide`, async ({ page }) => {
        await page.setViewportSize({ width, height: 720 });
        await page.goto('/workspace');
        await page.getByRole('button', { name: 'New Map' }).click();
        await expect(node(page, 'Central Idea')).toBeVisible();

        const toolbar = page.getByTitle('Back to templates').locator('xpath=../..');
        const edges = await toolbar.getByRole('button').evaluateAll(buttons => buttons.map((button) => {
            const box = button.getBoundingClientRect();
            return { name: button.getAttribute('title') ?? button.textContent, left: box.left, right: box.right };
        }));
        expect(edges.length).toBeGreaterThan(14);
        for (const edge of edges) {
            expect(edge.left, String(edge.name)).toBeGreaterThanOrEqual(0);
            expect(edge.right, String(edge.name)).toBeLessThanOrEqual(width);
        }
        await page.getByTitle(/^Theme: Same as the system/).click();
        await expect(page.getByTitle(/^Theme: Light/)).toBeVisible();
    });
}

test('the labels that fit are shown', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 720 });
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
    for (const label of ['Undo', 'Smart Add', 'Layout', 'View Mode', 'Export', "What's New", 'Shortcuts']) {
        await expect(page.getByText(label, { exact: true })).toBeVisible();
    }

    await page.setViewportSize({ width: 1280, height: 720 });
    for (const label of ['Smart Add', 'Box Area', 'Layout', 'View Mode', 'Export']) {
        await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    for (const label of ['Undo', "What's New", 'Shortcuts']) {
        await expect(page.getByText(label, { exact: true })).toBeHidden();
    }
    await expect(page.getByRole('button', { name: "What's New" })).toBeVisible();
});
