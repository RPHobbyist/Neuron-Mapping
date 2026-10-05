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

import { node, openPanelSection, preparePage, saveAs } from './helpers';

test.beforeEach(async ({ page }) => {
    await preparePage(page);
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
});

const canvasOf = (page: Page) => page.getByTestId('mindmap-canvas');
const pictures = (page: Page) => canvasOf(page).getByRole('img', { name: 'Node attachment' });

const drawPng = (page: Page) => page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 200;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#3b82f6';
    context.fillRect(0, 0, 320, 200);
    context.fillStyle = '#f97316';
    context.fillRect(40, 40, 120, 80);
    return canvas.toDataURL('image/png').split(',')[1];
});

test('tags are added and removed as chips, on one node or on several', async ({ page }) => {
    await node(page, 'Topic 1').click();
    await openPanelSection(page, 'Tags');
    const tagInput = page.getByLabel('Add a tag');
    await tagInput.fill('urgent');
    await tagInput.press('Enter');
    await tagInput.fill('#Q3, next week,');
    for (const tag of ['#urgent', '#Q3', '#next week']) await expect(node(page, tag)).toBeVisible();
    await expect(tagInput).toHaveValue('');

    await page.getByRole('button', { name: 'Remove tag urgent' }).click();
    await expect(node(page, '#urgent')).toHaveCount(0);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(node(page, '#urgent')).toBeVisible();

    await canvasOf(page).click({ position: { x: 30, y: 30 } });
    await node(page, 'Topic 2').click();
    await node(page, 'Topic 3').click({ modifiers: ['Shift'] });
    await expect(page.getByRole('heading', { name: '2 Blocks' })).toBeVisible();
    await tagInput.fill('shared');
    await tagInput.press('Enter');
    await expect(node(page, '#shared')).toHaveCount(2);
    await page.getByRole('button', { name: 'Remove tag shared' }).click();
    await expect(node(page, '#shared')).toHaveCount(0);
});

test('search finds nodes by their tags and notes, and filters by tag', async ({ page }) => {
    await node(page, 'Topic 1').click();
    await openPanelSection(page, 'Tags');
    const tagInput = page.getByLabel('Add a tag');
    await tagInput.fill('urgent');
    await tagInput.press('Enter');

    await node(page, 'Topic 2').click();
    await page.getByTitle('Edit Notes').click();
    await page.getByRole('textbox', { name: 'Notes' }).fill('Remember the quarterly budget figures before the review.');
    await page.getByRole('button', { name: 'Close notes' }).click();

    await page.getByTitle('Search nodes (Ctrl+F)').click();
    const search = page.getByPlaceholder('Search text, notes and #tags...');
    await search.fill('quarterly');
    await expect(page.getByText('Remember the quarterly budget figures before the review.')).toBeVisible();
    await expect(page.getByText('1 results')).toBeVisible();

    await search.fill('#urg');
    const result = page.getByRole('button', { name: /Topic 1/ });
    await expect(result).toContainText('#urgent');

    await search.fill('');
    await page.getByTitle('Filters').click();
    await page.locator('#tag-filter-select').selectOption('urgent');
    await expect(page.getByText('1 results')).toBeVisible();
    await search.press('Enter');
    await expect(canvasOf(page).locator('[data-selected]')).toContainText('Topic 1');
});

test('a picture comes from an address: copied when its site allows that, linked when not', async ({ page }) => {
    const png = Buffer.from(await drawPng(page), 'base64');
    await page.route('https://pictures.test/open.png', route => route.fulfill({
        contentType: 'image/png', body: png, headers: { 'access-control-allow-origin': '*' },
    }));
    await page.route('https://pictures.test/closed.png', route => route.fulfill({
        contentType: 'image/png', body: png, headers: { 'access-control-allow-origin': 'https://elsewhere.test' },
    }));
    await page.route('https://pictures.test/missing.png', route => route.fulfill({ status: 404, body: '' }));

    await node(page, 'Topic 1').click();
    await page.getByTitle('Add Image').click();
    const dialog = page.getByRole('dialog', { name: 'Add Image' });
    const address = dialog.getByLabel('Image Address');
    const add = dialog.getByRole('button', { name: 'Add', exact: true });

    await address.fill('https://pictures.test/missing.png');
    await add.click();
    await expect(page.getByText('No picture could be loaded from that address.')).toBeVisible();
    await address.fill('http://pictures.test/open.png');
    await add.click();
    await expect(page.getByText('Enter the address of a picture, starting with https://')).toBeVisible();

    await address.fill('https://pictures.test/open.png');
    await add.click();
    await expect(pictures(page)).toHaveAttribute('src', /^data:image\/(webp|png);base64,/);

    await canvasOf(page).click({ position: { x: 30, y: 30 } });
    await node(page, 'Topic 2').click();
    await page.getByTitle('Add Image').click();
    await address.fill('https://pictures.test/closed.png');
    await add.click();
    await expect(page.getByText(/so the map links to this one/)).toBeVisible();
    await expect(pictures(page)).toHaveCount(2);
    await expect(pictures(page).nth(1)).toHaveAttribute('src', 'https://pictures.test/closed.png');

    await saveAs(page, 'With pictures');
    const download = page.waitForEvent('download');
    await page.getByTitle('Export options').click();
    await page.getByRole('menuitem', { name: /Export as PNG/ }).click();
    expect((await download).suggestedFilename()).toMatch(/\.png$/);
});

test('a picture is pasted into the image dialog, changed and removed', async ({ page }) => {
    const png = await drawPng(page);
    await node(page, 'Topic 1').click();
    await page.getByTitle('Add Image').click();
    const dialog = page.getByRole('dialog', { name: 'Add Image' });
    await dialog.evaluate((element, base64) => {
        const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
        const clipboardData = new DataTransfer();
        clipboardData.items.add(new File([bytes], 'screenshot.png', { type: 'image/png' }));
        element.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
    }, png);
    await expect(dialog.getByRole('img', { name: 'Preview' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(pictures(page)).toHaveCount(1);

    await page.getByTitle('Change or Remove Image').click();
    const change = page.getByRole('dialog', { name: 'Change Image' });
    await expect(change.getByRole('img', { name: 'Preview' })).toBeVisible();
    await change.getByRole('button', { name: 'Remove Image' }).click();
    await expect(pictures(page)).toHaveCount(0);
    await expect(page.getByTitle('Add Image')).toBeVisible();
});

test('a picture dropped on a topic becomes its image', async ({ page }) => {
    const png = await drawPng(page);
    const dataTransfer = await page.evaluateHandle((base64) => {
        const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
        const transfer = new DataTransfer();
        transfer.items.add(new File([bytes], 'photo.png', { type: 'image/png' }));
        return transfer;
    }, png);
    const box = (await node(page, 'Topic 3').boundingBox())!;
    await canvasOf(page).dispatchEvent('drop', { dataTransfer, clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 });

    await expect(page.getByText('Picture added to "Topic 3"')).toBeVisible();
    await expect(canvasOf(page).locator('[data-node-id]', { hasText: 'Topic 3' }).getByRole('img', { name: 'Node attachment' })).toBeVisible();

    await canvasOf(page).dispatchEvent('drop', { dataTransfer, clientX: 30, clientY: 120 });
    await expect(page.getByText('Drop a picture on the topic it belongs to')).toBeVisible();
    await expect(pictures(page)).toHaveCount(1);
});

test('a link opens its dialog filled in, and can be removed', async ({ page }) => {
    const topic = canvasOf(page).locator('[data-node-id]', { hasText: 'Topic 1' });
    await node(page, 'Topic 1').click();

    await page.getByTitle('Add Link').click();
    const addLink = page.getByRole('dialog', { name: 'Add Link' });
    await addLink.getByLabel('External URL').fill('example.com/plan');
    await addLink.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(topic.getByRole('link')).toHaveAttribute('href', 'https://example.com/plan');

    await page.getByTitle('Edit or Remove Link').click();
    const editLink = page.getByRole('dialog', { name: 'Edit Link' });
    await expect(editLink.getByLabel('External URL')).toHaveValue('https://example.com/plan');
    await editLink.getByRole('button', { name: 'Remove Link' }).click();
    await expect(topic.getByRole('link')).toHaveCount(0);

    await page.getByTitle('Add Link').click();
    await addLink.getByLabel('External URL').fill('https://example.com/again');
    await addLink.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByTitle('Edit or Remove Link').click();
    await editLink.getByLabel('External URL').fill('');
    await editLink.getByRole('button', { name: 'Save' }).click();
    await expect(topic.getByRole('link')).toHaveCount(0);
});
