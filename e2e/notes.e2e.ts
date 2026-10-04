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

test('notes are written in Markdown and shown formatted, with only safe links', async ({ page }) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await node(page, 'Topic 1').click();
    await page.getByTitle('Edit Notes').click();

    await page.getByRole('textbox', { name: 'Notes' }).fill([
        '## Plan',
        '',
        '**Bold** and [a link](https://example.com/page)',
        '',
        '- [x] done',
        '- [ ] to do',
        '',
        '[unsafe](javascript:alert(1))',
    ].join('\n'));
    await page.getByRole('tab', { name: 'Preview' }).click();

    const preview = page.locator('.notes-markdown');
    await expect(preview.getByRole('heading', { name: 'Plan' })).toBeVisible();
    await expect(preview.locator('strong')).toHaveText('Bold');
    await expect(preview.getByRole('link', { name: 'a link' })).toHaveAttribute('href', 'https://example.com/page');
    await expect(preview.getByRole('checkbox')).toHaveCount(2);
    await expect(preview.getByText('unsafe')).toBeVisible();
    await expect(preview.getByRole('link', { name: 'unsafe' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Close notes' }).click();
    await page.getByTitle('Edit Notes').click();
    await expect(page.locator('.notes-markdown').getByRole('heading', { name: 'Plan' })).toBeVisible();
});
