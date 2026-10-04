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

import { node, preparePage, renameSelectedNode, saveAs, savedMapCard, settledBox } from './helpers';

test.beforeEach(async ({ page }) => {
    await preparePage(page);
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
    await settledBox(node(page, 'Topic 1'));
});

const canvasOf = (page: Page) => page.getByTestId('mindmap-canvas');
const nodesOf = (page: Page) => canvasOf(page).locator('[data-node-id]');

const growBranch = async (page: Page) => {
    await node(page, 'Topic 1').click();
    await page.keyboard.press('Tab');
    await renameSelectedNode(page, 'Alpha');
    await page.keyboard.press('Enter');
    await renameSelectedNode(page, 'Beta');
    await expect(nodesOf(page)).toHaveCount(7);
    await canvasOf(page).click({ position: { x: 30, y: 30 } });
    await node(page, 'Topic 1').click();
};

test('a branch is collapsed and expanded from its node, with Ctrl+., and stays collapsed when saved', async ({ page }) => {
    await growBranch(page);
    const lines = canvasOf(page).locator('path[id^="path-"]');
    await expect(lines).toHaveCount(6);

    await page.getByRole('button', { name: 'Collapse this branch' }).click();
    await expect(nodesOf(page)).toHaveCount(5);
    await expect(node(page, 'Alpha')).toHaveCount(0);
    await expect(lines).toHaveCount(4);
    const expand = page.getByRole('button', { name: 'Expand: 2 hidden' });
    await expect(expand).toHaveText('+2');

    await canvasOf(page).click({ position: { x: 30, y: 30 } });
    await expect(expand).toBeVisible();
    await expand.click();
    await expect(node(page, 'Beta')).toBeVisible();

    await node(page, 'Topic 1').click();
    await page.keyboard.press('Control+.');
    await expect(nodesOf(page)).toHaveCount(5);
    await page.keyboard.press('Control+z');
    await expect(nodesOf(page)).toHaveCount(7);
    await page.keyboard.press('Control+.');

    await saveAs(page, 'Folded');
    await page.getByTitle('Back to templates').click();
    await savedMapCard(page, 'Folded').click();
    await expect(node(page, 'Central Idea')).toBeVisible();
    await expect(nodesOf(page)).toHaveCount(5);
    await expect(page.getByRole('button', { name: 'Expand: 2 hidden' })).toBeVisible();
});

test('the View Mode menu shows the map down to a level, and all of it again', async ({ page }) => {
    await growBranch(page);
    await page.getByTitle('View Mode').click();
    await page.getByRole('menuitem', { name: 'Show 1 Level' }).click();
    await expect(nodesOf(page)).toHaveCount(5);
    await expect(page.getByRole('button', { name: 'Expand: 2 hidden' })).toBeVisible();

    await page.getByTitle('View Mode').click();
    await page.getByRole('menuitem', { name: 'Expand All' }).click();
    await expect(nodesOf(page)).toHaveCount(7);
    await expect(page.getByRole('menu')).toBeHidden();
    await page.getByTitle('View Mode').click();
    await expect(page.getByRole('menuitem', { name: 'Expand All' })).toBeDisabled();
});

test('a search hit inside a collapsed branch opens the branch', async ({ page }) => {
    await growBranch(page);
    await page.keyboard.press('Control+.');
    await expect(node(page, 'Beta')).toHaveCount(0);

    await page.getByTitle('Search nodes (Ctrl+F)').click();
    const search = page.getByPlaceholder('Search text, notes and #tags...');
    await search.fill('beta');
    await expect(page.getByText('1 results')).toBeVisible();
    await search.press('Enter');
    await expect(node(page, 'Beta')).toBeVisible();
    await expect(canvasOf(page).locator('[data-selected]')).toContainText('Beta');
});

test('a collapsed node opens for a new subtopic, and takes its branch along when dragged', async ({ page }) => {
    await growBranch(page);
    const offset = async () => {
        const parent = (await node(page, 'Topic 1').boundingBox())!;
        const child = (await node(page, 'Alpha').boundingBox())!;
        return { x: Math.round(child.x - parent.x), y: Math.round(child.y - parent.y) };
    };
    const before = await offset();

    await page.keyboard.press('Control+.');
    await expect(nodesOf(page)).toHaveCount(5);
    const box = (await node(page, 'Topic 1').boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2 + 90, { steps: 6 });
    await page.mouse.up();

    await page.keyboard.press('Tab');
    await expect(nodesOf(page)).toHaveCount(8);
    await expect(node(page, 'Alpha')).toBeVisible();
    await settledBox(node(page, 'Alpha'));
    expect(await offset()).toEqual(before);
});
