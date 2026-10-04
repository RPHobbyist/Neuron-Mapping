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

test('a presentation steps through the map topic by topic, following each one', async ({ page }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
    const topics = page.getByTestId('mindmap-canvas').getByText(/^Topic \d+$/);
    const topicCount = await topics.count();
    expect(topicCount).toBeGreaterThan(1);

    await page.getByTitle('View Mode').click();
    await page.getByRole('menuitem', { name: 'Present' }).click();
    const controls = page.getByRole('toolbar', { name: 'Presentation' });
    await expect(controls).toBeVisible();
    await expect(page.getByTitle('Back to templates')).toBeHidden();

    await page.keyboard.press('p');
    await expect(controls.getByRole('button', { name: 'Play' })).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(controls.getByText(`1 of ${topicCount + 1}`)).toBeVisible();
    await expect(topics).toHaveCount(0);

    await page.keyboard.press('ArrowRight');
    await expect(controls.getByText(`2 of ${topicCount + 1}`)).toBeVisible();
    await expect(topics).toHaveCount(1);
    await expect(topics.first()).toBeInViewport();

    await page.keyboard.press('ArrowLeft');
    await expect(topics).toHaveCount(0);

    await controls.getByRole('radio', { name: 'Fast' }).click();
    await page.keyboard.press('p');
    await expect(controls.getByText(`All ${topicCount + 1} topics`)).toBeVisible({ timeout: 15_000 });
    await expect(topics).toHaveCount(topicCount);

    await page.keyboard.press('Escape');
    await expect(controls).toBeHidden();
    await expect(page.getByTitle('Back to templates')).toBeVisible();
    await expect(topics).toHaveCount(topicCount);
});

test('presented branch by branch, each step shows a whole branch of the root', async ({ page }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
    await node(page, 'Topic 1').click();
    await page.keyboard.press('Tab');
    await expect(node(page, 'New Item')).toBeVisible();
    const branches = await page.getByTestId('mindmap-canvas').getByText(/^Topic \d+$/).count();

    await page.getByTitle('View Mode').click();
    await page.getByRole('menuitem', { name: 'Present' }).click();
    const controls = page.getByRole('toolbar', { name: 'Presentation' });
    await page.keyboard.press('p');
    await controls.getByRole('radio', { name: 'Branches' }).click();

    await expect(controls.getByText(`1 of ${branches + 1}`)).toBeVisible();
    const shown = page.getByTestId('mindmap-canvas').locator('[data-node-id]');
    await expect(shown).toHaveCount(1);
    await controls.getByRole('button', { name: 'Next step' }).click();
    await expect(controls.getByText(`2 of ${branches + 1}`)).toBeVisible();
    await expect(shown).toHaveCount(3);
    await expect(node(page, 'New Item')).toBeInViewport();

    await page.keyboard.press('Escape');
    await controls.waitFor({ state: 'hidden' });
});
