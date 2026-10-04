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

import { expect, test, type Page } from '@playwright/test';

import { node, preparePage } from './helpers';

test.beforeEach(async ({ page }) => {
    await preparePage(page);
});

const exportPng = async (page: Page) => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByTitle('Export options').click();
    await page.getByRole('menuitem', { name: /Export as PNG/ }).click();
    return readFile(await (await downloadPromise).path());
};

const imageDifference = (page: Page, a: Buffer, b: Buffer) => page.evaluate(async ([first, second]) => {
    const load = (base64: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = `data:image/png;base64,${base64}`;
    });
    const images = await Promise.all([load(first), load(second)]);
    if (images[0].width !== images[1].width || images[0].height !== images[1].height) return 1;
    const [pixelsA, pixelsB] = images.map((image) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, image.width, image.height).data;
    });
    let differing = 0;
    for (let i = 0; i < pixelsA.length; i += 4) {
        const difference = Math.max(...[0, 1, 2].map(c => Math.abs(pixelsA[i + c] - pixelsB[i + c])));
        if (difference > 16) differing++;
    }
    return differing / (pixelsA.length / 4);
}, [a.toString('base64'), b.toString('base64')] as const);

test('the editor can be dark, while exports and the public pages stay light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
    await page.waitForTimeout(1000);
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/\bdark\b/);
    const lightExport = await exportPng(page);

    const toggle = page.getByRole('button', { name: /^Theme:/ });
    await toggle.click();
    await toggle.click();
    await expect(toggle).toHaveAccessibleName(/^Theme: Dark/);
    await expect(html).toHaveClass(/\bdark\b/);

    expect(await imageDifference(page, await exportPng(page), lightExport)).toBeLessThan(0.02);

    await page.reload();
    await expect(html).toHaveClass(/\bdark\b/);
    await page.goto('/');
    await expect(html).not.toHaveClass(/\bdark\b/);
});
