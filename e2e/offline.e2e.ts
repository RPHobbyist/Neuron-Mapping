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

import { node, preparePage, saveAs, savedMapCard } from './helpers';

test.beforeEach(async ({ page }) => {
    await preparePage(page);
});

const openEditorAndWaitForOffline = async (page: Page) => {
    await page.goto('/workspace');
    await expect(page.getByRole('button', { name: 'New Map' })).toBeVisible();
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
};

test('once visited, the editor opens and saves maps offline', async ({ page, context }) => {
    await openEditorAndWaitForOffline(page);

    await context.setOffline(true);
    const response = await page.reload();
    expect(response?.fromServiceWorker()).toBe(true);

    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
    await saveAs(page, 'Offline Plan');
    await page.getByTitle('Back to templates').click();
    await expect(savedMapCard(page, 'Offline Plan')).toBeVisible();
});

test('a public page visited before still opens offline', async ({ page, context }) => {
    await openEditorAndWaitForOffline(page);

    const online = await page.goto('/templates/');
    expect(online?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await context.setOffline(true);
    const offline = await page.reload();
    expect(offline?.fromServiceWorker()).toBe(true);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.getByPlaceholder(/Search templates/).fill('zzzz-no-such-template');
    await expect(page.getByText('No templates match that search')).toBeVisible();
});
