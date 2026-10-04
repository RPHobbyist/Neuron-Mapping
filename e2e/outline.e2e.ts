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

import { node, preparePage } from './helpers';

test.beforeEach(async ({ page }) => {
    await preparePage(page);
});

test('a map exported as a Markdown outline imports back', async ({ page }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByTitle('Export options').click();
    await page.getByRole('menuitem', { name: /Export as outline/ }).click();
    await page.getByRole('menuitem', { name: /Markdown/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.md$/);
    const content = await readFile(await download.path(), 'utf-8');
    expect(content).toMatch(/^# Central Idea$/m);
    const topics = [...content.matchAll(/^\s*- (.+)$/gm)].map(match => match[1]);
    expect(topics.length).toBeGreaterThan(0);

    await page.getByTitle('Back to templates').click();
    await page.getByRole('button', { name: 'Import', exact: true }).click();
    await page.locator('#file-upload-input').setInputFiles({
        name: 'Plan.md',
        mimeType: 'text/markdown',
        buffer: Buffer.from(content),
    });
    await expect(node(page, 'Central Idea')).toBeVisible();
    for (const topic of topics) await expect(node(page, topic)).toBeVisible();
});
