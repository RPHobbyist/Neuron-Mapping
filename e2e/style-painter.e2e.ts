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

import { node, openPanelSection, preparePage } from './helpers';

test.beforeEach(async ({ page }) => {
    await preparePage(page);
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
});

const lookOf = (page: Page, text: string) => page.getByTestId('mindmap-canvas').locator('[data-node-id]')
    .filter({ has: page.getByText(text, { exact: true }) })
    .locator(':scope > div').first()
    .evaluate(el => el.className);

const deselect = (page: Page) => page.getByTestId('mindmap-canvas').click({ position: { x: 10, y: 10 } });

test('a copied style is given to other blocks with the keys or the panel, in one undo step each', async ({ page }) => {
    await node(page, 'Topic 1').click();
    await openPanelSection(page, 'Shape');
    await page.getByRole('button', { name: 'Pill', exact: true }).click();
    await deselect(page);
    const look = await lookOf(page, 'Topic 1');
    expect(await lookOf(page, 'Topic 2')).not.toBe(look);

    await node(page, 'Topic 1').click();
    await page.keyboard.press('Control+Alt+c');
    await expect(page.getByText('Style copied')).toBeVisible();

    await node(page, 'Topic 2').click();
    await page.keyboard.press('Control+Alt+v');
    await deselect(page);
    expect(await lookOf(page, 'Topic 2')).toBe(look);

    await node(page, 'Topic 3').click();
    await page.getByRole('button', { name: 'Paste Style' }).click();
    await deselect(page);
    expect(await lookOf(page, 'Topic 3')).toBe(look);

    await page.keyboard.press('Control+z');
    expect(await lookOf(page, 'Topic 3')).not.toBe(look);
    expect(await lookOf(page, 'Topic 2')).toBe(look);
});
