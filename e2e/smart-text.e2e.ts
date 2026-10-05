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

import { node, preparePage, renameSelectedNode } from './helpers';

test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await preparePage(page);
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
});

const nodeBox = (page: Page, text: string) =>
    page.getByTestId('mindmap-canvas').locator('[data-node-id]').filter({ has: page.getByText(text, { exact: true }) });

test('shorthand typed into a topic becomes a task, a tag and a priority', async ({ page }) => {
    await node(page, 'Topic 1').click();
    await renameSelectedNode(page, '[ ] Buy milk #home !!');

    const topic = nodeBox(page, 'Buy milk');
    await expect(topic).toBeVisible();
    await expect(topic.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
    await expect(topic.getByText('#home')).toBeVisible();
    await expect(topic.getByTitle('Priority: High')).toBeVisible();

    await page.keyboard.press('Control+z');
    await expect(node(page, 'Topic 1')).toBeVisible();
    await expect(page.getByTestId('mindmap-canvas').getByRole('checkbox')).toHaveCount(0);
});

test('pasted lines with task boxes and tags become tasks', async ({ page }) => {
    await page.evaluate(() => navigator.clipboard.writeText('- [ ] Call Sam #work\n- [x] Book room'));
    await node(page, 'Topic 2').click();
    await page.keyboard.press('Control+v');

    await expect(nodeBox(page, 'Call Sam').getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
    await expect(nodeBox(page, 'Call Sam').getByText('#work')).toBeVisible();
    await expect(nodeBox(page, 'Book room').getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('mindmap-canvas').getByRole('checkbox')).toHaveCount(2);
});
