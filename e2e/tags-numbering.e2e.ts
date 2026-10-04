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

import { node, preparePage, renameSelectedNode, runCommand } from './helpers';

test.beforeEach(async ({ page }) => {
    await preparePage(page);
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
});

const canvas = (page: Page) => page.getByTestId('mindmap-canvas');
const nodeBox = (page: Page, text: string) =>
    canvas(page).locator('[data-node-id]').filter({ has: page.getByText(text, { exact: true }) });

test('pressing a tag highlights every topic with it, until Escape', async ({ page }) => {
    await node(page, 'Topic 1').click();
    await renameSelectedNode(page, 'Budget #work');
    await node(page, 'Topic 3').click();
    await renameSelectedNode(page, 'Hiring #Work');

    await nodeBox(page, 'Budget').getByRole('button', { name: '#work' }).click();
    await expect(page.getByText('2 topics tagged #work')).toBeVisible();
    const highlighted = canvas(page).locator('[data-node-id] > div.ring-yellow-400');
    await expect(highlighted).toHaveCount(2);

    await page.keyboard.press('Escape');
    await expect(highlighted).toHaveCount(0);
});

test('numbering puts outline numbers on the topics, and takes them off again', async ({ page }) => {
    await node(page, 'Topic 1').click();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Escape');

    await runCommand(page, 'number the topics');
    await expect(canvas(page).locator('[data-number]')).toHaveCount(5);
    await expect(nodeBox(page, 'New Item').locator('[data-number]')).toHaveText(/^\d\.1$/);

    await runCommand(page, 'hide numbering');
    await expect(canvas(page).locator('[data-number]')).toHaveCount(0);
});

test('status colours show done tasks and high priority, and can be turned off', async ({ page }) => {
    await node(page, 'Topic 2').click();
    await renameSelectedNode(page, '[x] Shipped');
    await node(page, 'Topic 4').click();
    await renameSelectedNode(page, 'Urgent fix !!');

    await expect(nodeBox(page, 'Shipped')).toHaveAttribute('data-rule-tone', 'done');
    await expect(nodeBox(page, 'Urgent fix')).toHaveAttribute('data-rule-tone', 'urgent');

    await runCommand(page, 'hide status colors');
    await expect(canvas(page).locator('[data-rule-tone]')).toHaveCount(0);
});
