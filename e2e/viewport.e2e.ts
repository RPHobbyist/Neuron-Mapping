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

import { node, panOf, preparePage, renameSelectedNode, saveAs, savedMapCard, settledBox } from './helpers';

test.beforeEach(async ({ page }) => {
    await preparePage(page);
});

const openNewMap = async (page: Page) => {
    await page.goto('/workspace');
    await page.getByRole('button', { name: 'New Map' }).click();
    await expect(node(page, 'Central Idea')).toBeVisible();
};

const roundedPan = async (page: Page) => (await panOf(page)).map(value => Math.round(value * 10) / 10);

const ctrlWheel = async (page: Page, deltaY: number) => {
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, deltaY);
    await page.keyboard.up('Control');
};

test('the wheel pans, and sideways with Shift', async ({ page }) => {
    await openNewMap(page);
    const canvas = (await page.getByTestId('mindmap-canvas').boundingBox())!;
    await page.mouse.move(canvas.x + 60, canvas.y + 60);

    const [x0, y0] = await roundedPan(page);
    await page.mouse.wheel(30, 80);
    await expect.poll(() => roundedPan(page)).toEqual([x0 - 30, y0 - 80]);

    await page.keyboard.down('Shift');
    await page.mouse.wheel(0, 50);
    await page.keyboard.up('Shift');
    await expect.poll(() => roundedPan(page)).toEqual([x0 - 80, y0 - 80]);
    await expect(page.getByText('100%')).toBeVisible();
});

test('Ctrl + wheel zooms on the point under the pointer', async ({ page }) => {
    await openNewMap(page);
    const topic = node(page, 'Topic 3');
    const before = await settledBox(topic);
    const pointer = { x: before.x + before.width / 2, y: before.y + before.height / 2 };
    await page.mouse.move(pointer.x, pointer.y);

    await ctrlWheel(page, -100);
    await expect(page.getByText('120%')).toBeVisible();
    const after = (await topic.boundingBox())!;
    expect(after.width).toBeCloseTo(before.width * 1.2, 0);
    expect(Math.abs(after.x + after.width / 2 - pointer.x)).toBeLessThan(1.5);
    expect(Math.abs(after.y + after.height / 2 - pointer.y)).toBeLessThan(1.5);

    await ctrlWheel(page, 100);
    await expect(page.getByText('100%')).toBeVisible();
    await ctrlWheel(page, -10);
    await expect(page.getByText('111%')).toBeVisible();
});

test("Safari's pinch gestures zoom on the point between the fingers", async ({ page }) => {
    await openNewMap(page);
    const canvas = page.getByTestId('mindmap-canvas');
    const box = (await canvas.boundingBox())!;
    await canvas.evaluate((el, at) => {
        const send = (type: string, scale: number) => {
            const event = new Event(type, { bubbles: true, cancelable: true });
            Object.assign(event, { scale, clientX: at.x, clientY: at.y });
            el.dispatchEvent(event);
        };
        send('gesturestart', 1);
        send('gesturechange', 1.25);
        send('gesturechange', 1.5);
    }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    await expect(page.getByText('150%')).toBeVisible();
});

test('a map opens with all of it in view', async ({ page }) => {
    await page.goto('/workspace?template=order-fulfillment');
    const canvas = page.getByTestId('mindmap-canvas');
    const nodes = canvas.locator('[data-node-id]');
    await expect(nodes.first()).toBeVisible();
    await settledBox(nodes.first());

    await expect(page.getByText('100%')).toHaveCount(0);
    const view = (await canvas.boundingBox())!;
    for (const box of await nodes.evaluateAll(els => els.map(el => el.getBoundingClientRect().toJSON()))) {
        expect(box.left).toBeGreaterThanOrEqual(view.x);
        expect(box.top).toBeGreaterThanOrEqual(view.y);
        expect(box.right).toBeLessThanOrEqual(view.x + view.width);
        expect(box.bottom).toBeLessThanOrEqual(view.y + view.height);
    }
});

test('a saved map opens with the view it was saved with', async ({ page }) => {
    await openNewMap(page);
    const canvas = (await page.getByTestId('mindmap-canvas').boundingBox())!;
    await page.mouse.move(canvas.x + 60, canvas.y + 60);
    await page.mouse.wheel(140, -90);
    await page.keyboard.press('Control+=');
    await page.keyboard.press('Control+=');
    await expect(page.getByText('144%')).toBeVisible();
    const view = await panOf(page);

    await saveAs(page, 'Where I left off');
    await page.getByTitle('Back to templates').click();
    await savedMapCard(page, 'Where I left off').click();
    await expect(node(page, 'Central Idea')).toBeVisible();
    await expect(page.getByText('144%')).toBeVisible();
    expect(await panOf(page)).toEqual(view);
});

test('unsaved changes are resumed in the view they were left in', async ({ page }) => {
    await openNewMap(page);
    await node(page, 'Topic 1').click();
    await renameSelectedNode(page, 'Edited');
    await page.keyboard.press('Control+-');
    await expect(page.getByText('83%')).toBeVisible();
    const view = await panOf(page);

    await page.getByTitle('Back to templates').click();
    await page.getByRole('button', { name: /^Resume / }).click();
    await expect(node(page, 'Edited')).toBeVisible();
    await expect(page.getByText('83%')).toBeVisible();
    expect(await panOf(page)).toEqual(view);
});
