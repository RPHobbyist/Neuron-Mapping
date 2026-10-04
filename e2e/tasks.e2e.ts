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

test.beforeEach(async ({ page }) => {
    await preparePage(page);
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
});

const nodeBox = (page: Page, text: string) =>
    page.getByTestId('mindmap-canvas').locator('[data-node-id]').filter({ has: page.getByText(text, { exact: true }) });

const makeTask = async (page: Page, text: string) => {
    await node(page, text).click();
    await page.getByRole('button', { name: 'To do', exact: true }).click();
    await expect(nodeBox(page, text).getByRole('checkbox')).toBeVisible();
};

test('a ticked-off task counts towards its parent, and can be hidden', async ({ page }) => {
    await makeTask(page, 'Topic 1');
    await makeTask(page, 'Topic 2');
    const summary = page.getByTestId('task-summary');
    await expect(summary).toContainText('0 of 2 tasks done');
    await expect(page.locator('[data-task-progress="0/2"]')).toBeVisible();

    await nodeBox(page, 'Topic 1').getByRole('checkbox').click();
    await expect(nodeBox(page, 'Topic 1').getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
    await expect(summary).toContainText('1 of 2 tasks done');
    await expect(page.locator('[data-task-progress="1/2"]')).toBeVisible();

    await summary.getByRole('button', { name: 'Hide done' }).click();
    await expect(node(page, 'Topic 1')).toHaveCount(0);
    await expect(node(page, 'Topic 2')).toBeVisible();
    await summary.getByRole('button', { name: 'Show done' }).click();
    await expect(node(page, 'Topic 1')).toBeVisible();

    await page.keyboard.press('Control+z');
    await expect(summary).toContainText('0 of 2 tasks done');
});

test('a due date that has passed shows as overdue until the task is done', async ({ page }) => {
    await makeTask(page, 'Topic 3');
    await page.getByLabel('Due date').fill('2020-01-15');
    const due = nodeBox(page, 'Topic 3').locator('[data-due]');
    await expect(due).toHaveAttribute('data-due', 'overdue');

    await nodeBox(page, 'Topic 3').getByRole('checkbox').click();
    await expect(due).toHaveAttribute('data-due', 'due');
});
