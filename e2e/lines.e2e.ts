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

    await openPanelSection(page, 'Color');
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

test('a line can be straight and dashed at the same time', async ({ page }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();

    const line = page.getByTestId('mindmap-canvas').locator('path[id^="path-"]').first();
    const box = await line.boundingBox();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await openPanelSection(page, 'Type');

    await page.getByRole('button', { name: 'Straight', exact: true }).click();
    await page.getByRole('button', { name: 'Dashed', exact: true }).click();
    await expect(line).toHaveAttribute('stroke-dasharray', '8 4');
    await expect(line).toHaveAttribute('d', /^M [\d.-]+ [\d.-]+ L [\d.-]+ [\d.-]+$/);
    await expect(page.getByRole('button', { name: 'Straight', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('a selected line has a button on it that deletes it', async ({ page }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();

    const lines = page.getByTestId('mindmap-canvas').locator('path[id^="path-"]');
    const count = await lines.count();
    const box = await lines.first().boundingBox();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

    await page.getByTestId('delete-line').click();
    await expect(lines).toHaveCount(count - 1);
    await expect(page.getByTestId('delete-line')).toHaveCount(0);
});

test('the toolbar sets the shape, pattern and arrowheads of every line separately', async ({ page }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();

    const lines = page.getByTestId('mindmap-canvas').locator('path[id^="path-"]');
    await page.getByTitle('Change line type').click();
    await page.getByRole('menuitemradio', { name: 'Straight' }).click();
    await page.getByRole('menuitemradio', { name: 'Dotted' }).click();
    await expect(page.getByRole('menuitemradio', { name: 'Straight' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('menuitemradio', { name: 'Dotted' })).toHaveAttribute('aria-checked', 'true');

    const count = await lines.count();
    for (let i = 0; i < count; i++) {
        await expect(lines.nth(i)).toHaveAttribute('stroke-dasharray', '0 8');
        await expect(lines.nth(i)).toHaveAttribute('d', /^M [\d.-]+ [\d.-]+ L [\d.-]+ [\d.-]+$/);
    }

    const heads = page.getByTestId('mindmap-canvas').locator('path[d="M 0 0 L 10 5 L 0 10 Q 4 5 0 0"]');
    await expect(heads).toHaveCount(0);
    await page.getByRole('menuitemcheckbox', { name: 'Arrowhead at the end' }).click();
    await expect(heads).toHaveCount(count);
    await expect(lines.first()).toHaveAttribute('stroke-dasharray', '0 8');
});
