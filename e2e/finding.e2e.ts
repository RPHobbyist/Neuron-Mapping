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

import { commandPalette, node, panOf, preparePage, runCommand, saveAs, searchPalette } from './helpers';

test.beforeEach(async ({ page }) => {
    await preparePage(page);
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
});

const nodes = (page: Page) => page.getByTestId('mindmap-canvas').locator('[data-node-id]');
const selected = (page: Page) => page.getByTestId('mindmap-canvas').locator('[data-selected]');
test('Ctrl + K finds and runs a command for the selected topic', async ({ page }) => {
    await node(page, 'Topic 1').click();
    await runCommand(page, 'insert parent');

    await expect(nodes(page)).toHaveCount(6);
    await expect(selected(page)).toContainText('New Item');
});

test('Ctrl + K jumps to a topic by its text', async ({ page }) => {
    await searchPalette(page, 'Topic 3');
    await commandPalette(page).getByRole('option', { name: 'Topic 3' }).click();
    await expect(selected(page)).toContainText('Topic 3');
});

test('Ctrl + K opens another saved map', async ({ page }) => {
    await saveAs(page, 'First Map');
    await page.getByTitle('Back to templates').click();
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
    await node(page, 'Topic 1').click();
    await page.keyboard.press('Delete');
    await expect(nodes(page)).toHaveCount(4);

    await searchPalette(page, 'First Map');
    await commandPalette(page).getByRole('option', { name: 'First Map' }).click();
    await expect(page.locator('#map-name-input')).toHaveValue('First Map');
    await expect(nodes(page)).toHaveCount(5);
});

test('right-clicking a topic offers what can be done with it', async ({ page }) => {
    await node(page, 'Topic 2').click({ button: 'right' });
    const menu = page.getByTestId('context-menu');
    await expect(menu).toBeVisible();
    await expect(selected(page)).toContainText('Topic 2');
    await menu.getByRole('menuitem', { name: /Make a Task/ }).click();
    await expect(page.getByTestId('mindmap-canvas').getByRole('checkbox')).toHaveCount(1);

    await page.getByTestId('mindmap-canvas').click({ button: 'right', position: { x: 30, y: 30 } });
    await expect(menu.getByRole('menuitem', { name: /Fit to Screen/ })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: /Add Child Topic/ })).toHaveCount(0);
});

test('a branch shown alone hides the rest, and Escape shows the whole map', async ({ page }) => {
    await node(page, 'Topic 1').click();
    await page.keyboard.press('Tab');
    await expect(selected(page)).toContainText('New Item');

    await node(page, 'Topic 1').click({ button: 'right' });
    await page.getByTestId('context-menu').getByRole('menuitem', { name: /Show Branch Only/ }).click();
    await expect(page.getByTestId('hoist-breadcrumb')).toContainText('Topic 1');
    await expect(nodes(page)).toHaveCount(2);
    await expect(node(page, 'Central Idea')).toHaveCount(0);

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('hoist-breadcrumb')).toHaveCount(0);
    await expect(nodes(page)).toHaveCount(6);
});

test('zen mode leaves only the map, until Escape', async ({ page }) => {
    await runCommand(page, 'zen mode');
    await expect(page.getByTitle('Back to templates')).toHaveCount(0);
    await expect(page.getByTestId('minimap')).toHaveCount(0);

    await page.keyboard.press('Escape');
    await expect(page.getByTitle('Back to templates')).toBeVisible();
});

test('pressing the minimap moves the view there', async ({ page }) => {
    const minimap = page.getByTestId('minimap');
    await expect(minimap).toBeVisible();
    const before = await panOf(page);
    const box = (await minimap.boundingBox())!;
    await minimap.click({ position: { x: 8, y: 8 } });
    await expect.poll(() => panOf(page)).not.toEqual(before);
    expect(box.width).toBeGreaterThan(100);
});
