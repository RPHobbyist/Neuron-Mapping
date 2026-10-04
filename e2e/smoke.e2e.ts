/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

import { node, preparePage, renameSelectedNode, saveAs, savedMapCard } from './helpers';

test.beforeEach(async ({ page }) => {
    await preparePage(page);
});

test('a map survives saving, reloading, an unsaved session and a file round trip', async ({ page }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();

    await node(page, 'Central Idea').click();
    await page.keyboard.press('Tab');
    await expect(node(page, 'New Item')).toBeVisible();
    await renameSelectedNode(page, 'Research');
    await expect(node(page, 'Research')).toBeVisible();

    await saveAs(page, 'E2E Plan');

    await page.getByTitle('Back to templates').click();
    await expect(savedMapCard(page, 'E2E Plan')).toBeVisible();
    await page.reload();
    await savedMapCard(page, 'E2E Plan').click();
    await expect(node(page, 'Research')).toBeVisible();

    await node(page, 'Research').click();
    await page.keyboard.press('Tab');
    await expect(node(page, 'New Item')).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: 'Resume E2E Plan' }).click();
    await expect(node(page, 'New Item')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByTitle('Export options').click();
    await page.getByRole('menuitem', { name: /Save to File/ }).click();
    const content = await readFile(await (await downloadPromise).path(), 'utf-8');
    const file = JSON.parse(content);
    expect(file).toMatchObject({ version: '1.1', name: 'E2E Plan' });
    expect(file.nodes.map((n: { text: string }) => n.text)).toEqual(expect.arrayContaining(['Central Idea', 'Research', 'New Item']));

    await page.getByTitle('Back to templates').click();
    await page.locator('#template-file-input').setInputFiles({
        name: 'E2E Plan.nmm',
        mimeType: 'application/json',
        buffer: Buffer.from(content),
    });
    await expect(node(page, 'Research')).toBeVisible();
    await expect(node(page, 'New Item')).toBeVisible();
});
