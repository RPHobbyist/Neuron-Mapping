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

import { node, preparePage, saveAs, savedMapCard } from './helpers';

test.beforeEach(async ({ page }) => {
    await preparePage(page);
});

test('a large photo added to a node is scaled down before it is stored', async ({ page }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();

    const png = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 3000;
        canvas.height = 2000;
        const context = canvas.getContext('2d')!;
        const gradient = context.createLinearGradient(0, 0, 3000, 2000);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#f97316');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 3000, 2000);
        return canvas.toDataURL('image/png').split(',')[1];
    });

    await node(page, 'Topic 1').click();
    await page.getByTitle('Add Image').click();
    const dialog = page.getByRole('dialog', { name: 'Add Image' });
    await dialog.locator('input[type="file"]').setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
    await dialog.getByRole('button', { name: 'Add', exact: true }).click();

    const image = page.getByTestId('mindmap-canvas').getByRole('img', { name: 'Node attachment' });
    await expect(image).toBeVisible();
    const stored = await image.evaluate((img: HTMLImageElement) => ({
        type: img.src.slice(5, img.src.indexOf(';')),
        width: img.naturalWidth,
        height: img.naturalHeight,
    }));
    expect(stored).toEqual({ type: 'image/webp', width: 1600, height: 1067 });
});

test('a saved map gets a small thumbnail of the whole map', async ({ page }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
    await saveAs(page, 'Thumbnail Plan');
    await page.getByTitle('Back to templates').click();

    const thumbnail = savedMapCard(page, 'Thumbnail Plan').locator('img');
    await expect(thumbnail).toBeVisible();
    const stored = await thumbnail.evaluate((img: HTMLImageElement) => ({
        type: img.src.slice(5, img.src.indexOf(';')),
        width: img.naturalWidth,
        height: img.naturalHeight,
        bytes: img.src.length,
    }));
    expect(stored).toMatchObject({ type: 'image/webp', width: 480, height: 360 });
    expect(stored.bytes).toBeLessThan(100_000);
});
