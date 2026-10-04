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
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
});

test('the outline edits the map: typing, Enter, Tab and Shift+Tab', async ({ page }) => {
    await page.getByTitle('View Mode').click();
    await page.getByRole('menuitem', { name: 'Outline' }).click();
    const outline = page.getByRole('complementary', { name: 'Outline' });
    await expect(outline.getByRole('textbox')).toHaveCount(5);

    const topic1 = outline.getByRole('textbox', { name: 'Topic: Topic 1' });
    await topic1.fill('Research');
    await expect(node(page, 'Research')).toBeVisible();

    await outline.getByRole('textbox', { name: 'Topic: Research' }).press('Enter');
    const added = outline.getByRole('textbox', { name: 'Topic: New Item' });
    await expect(added).toBeFocused();
    await page.keyboard.type('Interviews');
    await expect(node(page, 'Interviews')).toBeVisible();

    await page.keyboard.press('Tab');
    const parentOf = () => page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('aside[aria-label="Outline"] li'));
        const row = items.find(li => li.querySelector('input')?.value === 'Interviews') as HTMLElement;
        return row.style.paddingLeft;
    });
    await expect.poll(parentOf).toBe('38px');
    await page.keyboard.press('Shift+Tab');
    await expect.poll(parentOf).toBe('22px');

    await page.getByRole('button', { name: 'Close outline' }).click();
    await expect(outline).toBeHidden();
});
