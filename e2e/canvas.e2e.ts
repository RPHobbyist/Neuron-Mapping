/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { expect, test, type Locator, type Page } from '@playwright/test';

import { node, panOf, preparePage, settledBox } from './helpers';

test.beforeEach(async ({ page }) => {
    await preparePage(page);
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
});

const canvasOf = (page: Page) => page.getByTestId('mindmap-canvas');

const drag = async (page: Page, canvas: Locator, from: [number, number], to: [number, number]) => {
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + from[0], box.y + from[1]);
    await page.mouse.down();
    await page.mouse.move(box.x + to[0], box.y + to[1], { steps: 8 });
    await page.mouse.up();
};

const pickTool = async (page: Page, title: 'Pencil' | 'Eraser') => {
    const button = page.getByTitle(title, { exact: true });
    await settledBox(button);
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
};

test('dragging the empty canvas pans it', async ({ page }) => {
    const canvas = canvasOf(page);
    const [x0, y0] = await panOf(page);
    await drag(page, canvas, [60, 60], [160, 110]);
    const [x1, y1] = await panOf(page);
    expect(x1 - x0).toBeCloseTo(100, 0);
    expect(y1 - y0).toBeCloseTo(50, 0);
    await expect(page.getByText('100%')).toBeVisible();
});

test('shift-dragging a box selects the nodes inside it', async ({ page }) => {
    const canvas = canvasOf(page);
    const box = (await canvas.boundingBox())!;
    await page.keyboard.down('Shift');
    await drag(page, canvas, [10, 10], [box.width - 250, box.height - 90]);
    await page.keyboard.up('Shift');
    await expect(canvas.locator('[data-selected]')).toHaveCount(await canvas.locator('[data-node-id]').count());
});

test('the pencil draws a stroke, and the eraser removes it', async ({ page }) => {
    const canvas = canvasOf(page);
    const strokes = canvas.locator('polyline');
    const before = await strokes.count();

    await pickTool(page, 'Pencil');
    await drag(page, canvas, [80, 80], [200, 120]);
    await expect(strokes).toHaveCount(before + 1);

    await pickTool(page, 'Eraser');
    await drag(page, canvas, [140, 60], [140, 160]);
    await expect(strokes).toHaveCount(before);
});

test('the pencil draws in the colour and width chosen, and keeps them', async ({ page }) => {
    const canvas = canvasOf(page);
    await pickTool(page, 'Pencil');
    const options = page.getByRole('group', { name: 'Pencil options' });
    await expect(options.getByRole('button', { name: 'Red pencil' })).toHaveAttribute('aria-pressed', 'true');
    await options.getByRole('button', { name: 'Blue pencil' }).click();
    await options.getByRole('button', { name: 'Thick line' }).click();

    await drag(page, canvas, [80, 80], [300, 80]);
    const stroke = canvas.locator('polyline').last();
    await expect(stroke).toHaveAttribute('stroke', '#3b82f6');
    await expect(stroke).toHaveAttribute('stroke-width', '6');
    expect((await stroke.getAttribute('points'))!.trim().split(' ')).toHaveLength(2);

    await page.getByTitle('Back to templates').click();
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
    await pickTool(page, 'Pencil');
    await expect(options.getByRole('button', { name: 'Blue pencil' })).toHaveAttribute('aria-pressed', 'true');
    await expect(options.getByRole('button', { name: 'Thick line' })).toHaveAttribute('aria-pressed', 'true');
});

test('a box area can be drawn on the canvas', async ({ page }) => {
    const canvas = canvasOf(page);
    await page.getByRole('button', { name: 'Box Area' }).click();
    await drag(page, canvas, [60, 60], [260, 200]);
    await expect(canvas.getByTitle('Drag to move, double-click to rename')).toHaveCount(1);
});

test('keys delete, undo, copy and paste, and move the selection', async ({ page }) => {
    const canvas = canvasOf(page);
    await node(page, 'Topic 1').click();
    await page.keyboard.press('Delete');
    await expect(node(page, 'Topic 1')).toHaveCount(0);
    await page.keyboard.press('Control+z');
    await expect(node(page, 'Topic 1')).toBeVisible();

    await node(page, 'Topic 1').click();
    await page.keyboard.press('Control+c');
    await page.keyboard.press('Control+v');
    await expect(node(page, 'Topic 1')).toHaveCount(2);

    await canvas.click({ position: { x: 30, y: 30 } });
    await node(page, 'Central Idea').click();
    await page.keyboard.press('ArrowRight');
    const selected = canvas.locator('[data-selected]');
    await expect(selected).toHaveCount(1);
    await expect(selected).not.toContainText('Central Idea');
    await page.keyboard.press('ArrowLeft');
    await expect(selected).toContainText('Central Idea');
});
