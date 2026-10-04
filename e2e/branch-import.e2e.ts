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
});

const openNewMap = async (page: Page) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
};

test('a file added as a branch goes under the selected topic, and one undo takes it back', async ({ page }) => {
    await openNewMap(page);
    await node(page, 'Topic 1').click();

    await page.getByTitle('Export options').click();
    await page.getByRole('menuitem', { name: /Add a file as a branch/ }).click();
    await page.locator('#file-upload-input').setInputFiles({
        name: 'notes.md',
        mimeType: 'text/markdown',
        buffer: Buffer.from('# Imported\n- Alpha\n- Beta\n'),
    });

    await expect(page.getByText('Added 3 topics from "notes" under "Topic 1"')).toBeVisible();
    for (const text of ['Imported', 'Alpha', 'Beta']) await expect(node(page, text)).toBeVisible();

    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(node(page, 'Imported')).toHaveCount(0);
    await expect(node(page, 'Alpha')).toHaveCount(0);
});

test('a file dropped on a topic goes under that topic', async ({ page }) => {
    await openNewMap(page);

    const dataTransfer = await page.evaluateHandle(() => {
        const transfer = new DataTransfer();
        transfer.items.add(new File(['# Dropped\n- Gamma\n'], 'dropped.md', { type: 'text/markdown' }));
        return transfer;
    });
    const box = await node(page, 'Central Idea').boundingBox();
    await page.getByTestId('mindmap-canvas').dispatchEvent('drop', {
        dataTransfer,
        clientX: box!.x + box!.width / 2,
        clientY: box!.y + box!.height / 2,
    });

    await expect(page.getByText('Added 2 topics from dropped.md under "Central Idea"')).toBeVisible();
    await expect(node(page, 'Gamma')).toBeVisible();
});
