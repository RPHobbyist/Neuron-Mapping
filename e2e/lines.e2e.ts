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

test("a line's tension can be changed, in one undo step", async ({ page }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();

    const line = page.getByTestId('mindmap-canvas').locator('path[id^="path-"]').first();
    const box = await line.boundingBox();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

    const tension = page.getByLabel(/Tension/);
    await expect(tension).toHaveValue('0.5');
    const before = await line.getAttribute('d');
    await tension.focus();
    await page.keyboard.press('End');
    await expect(tension).toHaveValue('1');
    await expect(line).not.toHaveAttribute('d', before!);

    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(line).toHaveAttribute('d', before!);
});

test("a line can blend from its parent block's colour into its own", async ({ page }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();

    const canvas = page.getByTestId('mindmap-canvas');
    const line = canvas.locator('path[id^="path-"]').first();
    const box = await line.boundingBox();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await expect(line).toHaveAttribute('stroke', '#9ca3af');

    await page.getByLabel("Blend from the parent block's color").check();
    await expect(line).toHaveAttribute('stroke', /^url\(#gradient-/);
    const stops = canvas.locator('linearGradient stop');
    await expect(stops).toHaveCount(2);
    const colors = await stops.evaluateAll(elements => elements.map(element => getComputedStyle(element).stopColor));
    expect(colors[0]).not.toBe(colors[1]);

    await page.getByTitle('Green', { exact: true }).click();
    await expect(stops.nth(1)).toHaveAttribute('stop-color', /^#/);

    await page.getByLabel("Blend from the parent block's color").uncheck();
    await expect(canvas.locator('linearGradient')).toHaveCount(0);
    await expect(line).toHaveAttribute('stroke', /^#/);
});
