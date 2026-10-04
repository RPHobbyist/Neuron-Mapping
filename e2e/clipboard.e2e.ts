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

import { node, preparePage } from './helpers';

test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await preparePage(page);
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
});

const nodes = (page: Page) => page.getByTestId('mindmap-canvas').locator('[data-node-id]');
const selected = (page: Page) => page.getByTestId('mindmap-canvas').locator('[data-selected]');

test('copied blocks reach the clipboard as an outline other apps can paste', async ({ page }) => {
    await node(page, 'Topic 1').click();
    await page.keyboard.press('Tab');
    await expect(selected(page)).toContainText('New Item');
    await node(page, 'Topic 1').click();
    await node(page, 'New Item').click({ modifiers: ['Shift'] });

    await page.keyboard.press('Control+c');
    await expect(page.getByText('2 blocks copied')).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Topic 1\n\tNew Item');

    await page.getByTestId('mindmap-canvas').click({ position: { x: 20, y: 20 } });
    await page.keyboard.press('Control+v');
    await expect(page.getByText('Blocks pasted')).toBeVisible();
    await expect(nodes(page)).toHaveCount(8);
});

test('text pasted from another app becomes topics under the selected one', async ({ page }) => {
    await page.evaluate(() => navigator.clipboard.writeText('- Budget\n  - Hardware\n  - Travel\n- Hiring'));
    await node(page, 'Topic 2').click();
    await page.keyboard.press('Control+v');

    await expect(page.getByText('Added 4 topics from the clipboard under "Topic 2"')).toBeVisible();
    await expect(nodes(page)).toHaveCount(9);
    await node(page, 'Travel').dispatchEvent('click');
    await page.keyboard.press('ArrowLeft');
    await expect(selected(page)).toContainText('Budget');
    await page.keyboard.press('ArrowLeft');
    await expect(selected(page)).toContainText('Topic 2');

    await page.keyboard.press('Control+z');
    await expect(nodes(page)).toHaveCount(5);
});

test('text pasted while renaming a topic stays in its text', async ({ page }) => {
    await page.evaluate(() => navigator.clipboard.writeText('Pasted words'));
    await node(page, 'Topic 3').click();
    await page.keyboard.press('F2');
    await expect(page.locator('[data-node-text-editor]')).toBeFocused();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Control+v');
    await page.keyboard.press('Enter');

    await expect(node(page, 'Pasted words')).toBeVisible();
    await expect(nodes(page)).toHaveCount(5);
});

test('copied blocks go on the clipboard as an outline too, and paste in another tab', async ({ page, context }) => {
    await node(page, 'Topic 2').click();
    await page.keyboard.press('Control+c');
    await expect(page.getByText('Block copied')).toBeVisible();
    expect((await page.evaluate(() => navigator.clipboard.readText())).trim()).toBe('Topic 2');

    const other = await context.newPage();
    await preparePage(other);
    await other.goto('/workspace');
    await other.getByRole('button', { name: 'New Map' }).click();
    await expect(node(other, 'Central Idea')).toBeVisible();
    await page.bringToFront();
    await page.keyboard.press('Control+c');
    await other.bringToFront();
    await other.keyboard.press('Control+v');
    await expect(other.getByText('Block pasted')).toBeVisible();
    await expect(node(other, 'Topic 2')).toHaveCount(2);
});

test('pasted text becomes topics under the selected one', async ({ page }) => {
    await page.evaluate(() => navigator.clipboard.writeText('Ideas\n\tFirst idea\n\tSecond idea'));
    await node(page, 'Topic 3').click();
    await page.keyboard.press('Control+v');
    await expect(page.getByText(/Added 3 topics from the clipboard under "Topic 3"/)).toBeVisible();
    await expect(node(page, 'Second idea')).toBeVisible();
    await page.keyboard.press('Control+z');
    await expect(node(page, 'Second idea')).toHaveCount(0);
});
