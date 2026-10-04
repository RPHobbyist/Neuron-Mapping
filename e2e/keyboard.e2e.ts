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

import { node, panOf, preparePage, renameSelectedNode, settledBox } from './helpers';

test.beforeEach(async ({ page }) => {
    await preparePage(page);
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
});

test('Enter adds a sibling below the selected node, but not when it ends a rename', async ({ page }) => {
    const canvas = page.getByTestId('mindmap-canvas');
    const nodes = canvas.locator('[data-node-id]');
    const selected = canvas.locator('[data-selected]');
    const topic = await settledBox(node(page, 'Topic 1'));

    await node(page, 'Topic 1').click();
    await page.keyboard.press('Enter');
    await expect(nodes).toHaveCount(6);
    await expect(selected).toContainText('New Item');

    const sibling = await settledBox(selected);
    expect(sibling.y).toBeGreaterThan(topic.y + topic.height);
    expect(Math.abs(sibling.x + sibling.width / 2 - (topic.x + topic.width / 2))).toBeLessThan(40);
    await page.keyboard.press('ArrowLeft');
    await expect(selected).toContainText('Central Idea');

    await node(page, 'New Item').click();
    await renameSelectedNode(page, 'Sibling');
    await expect(node(page, 'Sibling')).toBeVisible();
    await expect(nodes).toHaveCount(6);
});

test('a node that was renamed is not put back into editing when it is drawn again', async ({ page }) => {
    const editor = page.locator('[data-node-text-editor]');
    await node(page, 'Topic 1').click();
    await renameSelectedNode(page, 'Renamed');

    await page.keyboard.press('Delete');
    await expect(node(page, 'Renamed')).toHaveCount(0);
    await page.keyboard.press('Control+z');
    await expect(node(page, 'Renamed')).toBeVisible();
    await page.waitForTimeout(400);
    await expect(editor).toHaveCount(0);
    await page.keyboard.press('Control+a');
    await expect(page.getByTestId('mindmap-canvas').locator('[data-selected]')).toHaveCount(5);
});

test('a node added beyond the edge of the window is brought into view', async ({ page }) => {
    const canvas = page.getByTestId('mindmap-canvas');
    await settledBox(node(page, 'Topic 2'));
    const [, panBefore] = await panOf(page);

    await node(page, 'Topic 2').click();
    await page.keyboard.press('Tab');
    const added = await settledBox(canvas.locator('[data-selected]'));
    const view = (await canvas.boundingBox())!;
    expect(added.y).toBeGreaterThanOrEqual(view.y);
    expect(added.y + added.height).toBeLessThanOrEqual(view.y + view.height);
    expect((await panOf(page))[1]).toBeGreaterThan(panBefore);
});

test('Ctrl+A selects every node', async ({ page }) => {
    const canvas = page.getByTestId('mindmap-canvas');
    await node(page, 'Topic 1').click();
    await page.keyboard.press('Control+a');
    await expect(canvas.locator('[data-selected]')).toHaveCount(5);
    await expect(page.getByRole('heading', { name: '5 Blocks' })).toBeVisible();
});

test('Ctrl+D duplicates the selected node under the same parent', async ({ page }) => {
    const canvas = page.getByTestId('mindmap-canvas');
    const selected = canvas.locator('[data-selected]');
    await node(page, 'Topic 2').click();
    await page.keyboard.press('Control+d');
    await expect(page.getByText('Block duplicated')).toBeVisible();
    await expect(node(page, 'Topic 2')).toHaveCount(2);

    await expect(selected).toHaveCount(1);
    await page.keyboard.press('ArrowLeft');
    await expect(selected).toContainText('Central Idea');

    await page.keyboard.press('Control+z');
    await expect(node(page, 'Topic 2')).toHaveCount(1);
});

test('Alt + the arrows move a branch among its siblings', async ({ page }) => {
    const top = await settledBox(node(page, 'Topic 1'));
    const bottom = await settledBox(node(page, 'Topic 4'));
    expect(top.y).toBeLessThan(bottom.y);

    await node(page, 'Topic 1').click();
    await page.keyboard.press('Alt+ArrowDown');
    await expect.poll(async () => (await node(page, 'Topic 1').boundingBox())!.y).toBeCloseTo(bottom.y, 0);
    expect((await node(page, 'Topic 4').boundingBox())!.y).toBeCloseTo(top.y, 0);

    await page.keyboard.press('Alt+ArrowDown');
    await page.keyboard.press('Alt+ArrowUp');
    await expect.poll(async () => (await node(page, 'Topic 1').boundingBox())!.y).toBeCloseTo(top.y, 0);
    await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeEnabled();
});

test('Ctrl with plus, minus and zero zooms and fits the map', async ({ page }) => {
    await expect(page.getByText('100%')).toBeVisible();
    await page.keyboard.press('Control+=');
    await expect(page.getByText('120%')).toBeVisible();
    await page.keyboard.press('Control+-');
    await page.keyboard.press('Control+-');
    await expect(page.getByText('83%')).toBeVisible();
    await page.keyboard.press('Control+0');
    await expect(page.getByText('100%')).toBeVisible();
});

test('the shortcuts dialog lists the new keys', async ({ page }) => {
    await page.keyboard.press('Shift+?');
    const dialog = page.getByRole('dialog', { name: 'Keyboard Shortcuts' });
    await expect(dialog.getByText('Add Sibling Node')).toBeVisible();
    await expect(dialog.getByText('Ctrl + D', { exact: true })).toBeVisible();

    await page.keyboard.press('Control+a');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('mindmap-canvas').locator('[data-selected]')).toHaveCount(0);
});
