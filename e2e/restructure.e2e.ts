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

import { node, preparePage, settledBox } from './helpers';

test.beforeEach(async ({ page }) => {
    await preparePage(page);
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
});

const selected = (page: Page) => page.getByTestId('mindmap-canvas').locator('[data-selected]');

const expectParentOfSelected = async (page: Page, parentText: string) => {
    await page.keyboard.press('ArrowLeft');
    await expect(selected(page)).toContainText(parentText);
};

test('Ctrl + Enter puts a new node between a topic and its parent', async ({ page }) => {
    await node(page, 'Topic 1').click();
    await page.keyboard.press('Control+Enter');

    await expect(page.getByTestId('mindmap-canvas').locator('[data-node-id]')).toHaveCount(6);
    await expect(selected(page)).toContainText('New Item');
    await expectParentOfSelected(page, 'Central Idea');

    await node(page, 'Topic 1').click();
    await expectParentOfSelected(page, 'New Item');

    await page.keyboard.press('Control+z');
    await node(page, 'Topic 1').click();
    await expectParentOfSelected(page, 'Central Idea');
});

test('Shift + Tab moves a topic up a level', async ({ page }) => {
    await node(page, 'Topic 1').click();
    await page.keyboard.press('Tab');
    await expect(selected(page)).toContainText('New Item');

    await page.keyboard.press('Shift+Tab');
    await expectParentOfSelected(page, 'Central Idea');
});

const drag = async (page: Page, from: string, to: string, { alt = false } = {}) => {
    const source = await settledBox(node(page, from));
    const target = await settledBox(node(page, to));
    await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
    await page.mouse.down();
    if (alt) await page.keyboard.down('Alt');
    await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 12 });
};

test('a topic dropped on another becomes its child, and one undo takes the move back', async ({ page }) => {
    await drag(page, 'Topic 2', 'Topic 1');
    await expect(page.getByTestId('drop-target')).toBeVisible();
    await page.mouse.up();
    await expect(page.getByTestId('drop-target')).toHaveCount(0);
    await expect(page.getByText('Moved under "Topic 1"')).toBeVisible();

    await node(page, 'Topic 2').click();
    await expectParentOfSelected(page, 'Topic 1');

    const parent = await settledBox(node(page, 'Topic 1'));
    const child = await settledBox(node(page, 'Topic 2'));
    const overlaps = child.x < parent.x + parent.width && parent.x < child.x + child.width
        && child.y < parent.y + parent.height && parent.y < child.y + child.height;
    expect(overlaps).toBe(false);

    await page.keyboard.press('Control+z');
    await node(page, 'Topic 2').click();
    await expectParentOfSelected(page, 'Central Idea');
});

test('with Alt held, a dropped topic only moves', async ({ page }) => {
    await drag(page, 'Topic 2', 'Topic 1', { alt: true });
    await expect(page.getByTestId('drop-target')).toHaveCount(0);
    await page.mouse.up();
    await page.keyboard.up('Alt');

    await node(page, 'Topic 2').click({ force: true });
    await expectParentOfSelected(page, 'Central Idea');
});
