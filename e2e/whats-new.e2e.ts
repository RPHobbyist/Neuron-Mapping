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

import { preparePage } from './helpers';

test("What's New shows this version's changes, then earlier ones", async ({ page }) => {
    const { version } = JSON.parse(await readFile('package.json', 'utf-8'));
    await preparePage(page);
    await page.goto('/workspace');
    await page.getByRole('button', { name: "What's New" }).click();

    const dialog = page.getByRole('dialog', { name: "What's New" });
    await expect(dialog.getByText(`Version ${version}`, { exact: true })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Dark mode' })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Earlier, in 1.6.0' })).toBeAttached();
});
