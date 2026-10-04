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

import { generateStressMap } from '../src/utils/stressMap';

import { preparePage, putInAppStore, savedMapCard } from './helpers';

const COUNT = Number(process.env.SCALE_NODES ?? 10_000);
const MAP_NAME = `Stress ${COUNT}`;

test.skip(!process.env.SCALE_TEST, 'set SCALE_TEST=1 to run the scale test');
test.use({ launchOptions: { args: ['--js-flags=--expose-gc'] } });
test.setTimeout(10 * 60_000);

const installLongTaskMonitor = (page: Page) => page.addInitScript(() => {
    const state = { blocked: 0, longest: 0 };
    (window as unknown as { __longTasks: typeof state }).__longTasks = state;
    new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
            state.blocked += entry.duration;
            state.longest = Math.max(state.longest, entry.duration);
        });
    }).observe({ type: 'longtask', buffered: true });
});

const takeLongTasks = (page: Page) => page.evaluate(() => {
    const state = (window as unknown as { __longTasks: { blocked: number; longest: number } }).__longTasks;
    const taken = { blocked: Math.round(state.blocked), longest: Math.round(state.longest) };
    state.blocked = 0;
    state.longest = 0;
    return taken;
});

const settle = (page: Page) => page.evaluate(() => new Promise<void>(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 50)))));

const heapMb = (page: Page) => page.evaluate(() => {
    (window as unknown as { gc?: () => void }).gc?.();
    const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    return memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : -1;
});

const domSize = (page: Page) => page.evaluate(() => document.querySelectorAll('*').length);

interface Step { step: string; ms: number; blockedMs: number; longestTaskMs: number }

test(`a map of ${COUNT} topics stays usable`, async ({ page }) => {
    await preparePage(page);
    await installLongTaskMonitor(page);
    const steps: Step[] = [];
    const measure = async (step: string, action: () => Promise<void>) => {
        await takeLongTasks(page);
        const start = Date.now();
        await action();
        await settle(page);
        const ms = Date.now() - start;
        const { blocked, longest } = await takeLongTasks(page);
        steps.push({ step, ms, blockedMs: blocked, longestTaskMs: longest });
    };

    await page.goto('/workspace');
    await expect(page.getByRole('button', { name: 'New Map' })).toBeVisible();
    const nodes = generateStressMap(COUNT, { relationsRatio: 0.02, lineType: 'orthogonal' });
    await putInAppStore(page, 'neuron_saved_maps', [{
        id: 'stress-map',
        name: MAP_NAME,
        nodes,
        connectionStyle: 'orthogonal',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    }]);

    await measure('load the library', async () => {
        await page.reload();
        await expect(savedMapCard(page, MAP_NAME)).toBeVisible({ timeout: 120_000 });
    });
    const heapBefore = await heapMb(page);

    await measure('open the map', async () => {
        await savedMapCard(page, MAP_NAME).click();
        await expect(page.getByTestId('mindmap-canvas')).toBeVisible({ timeout: 120_000 });
        await expect(page.locator('[data-node-id], [data-testid="overview-layer"]').first()).toBeAttached({ timeout: 120_000 });
    });
    const canvas = (await page.getByTestId('mindmap-canvas').boundingBox())!;
    const centre = { x: canvas.x + canvas.width / 2, y: canvas.y + canvas.height / 2 };
    const domWhole = await domSize(page);

    await measure('zoom in 12 steps', async () => {
        await page.mouse.move(centre.x, centre.y);
        await page.keyboard.down('Control');
        for (let i = 0; i < 12; i++) await page.mouse.wheel(0, -100);
        await page.keyboard.up('Control');
    });
    await measure('zoom in to readable size', async () => {
        await page.keyboard.down('Control');
        for (let i = 0; i < 20; i++) await page.mouse.wheel(0, -100);
        await page.keyboard.up('Control');
    });
    const domZoomed = await domSize(page);

    await measure('pan 30 steps', async () => {
        for (let i = 0; i < 30; i++) await page.mouse.wheel(0, 120);
    });

    const target = page.locator('[data-node-id]').filter({ hasNotText: 'Stress test' }).first();
    await expect(target).toBeVisible();
    const box = (await target.boundingBox())!;
    await measure('drag a topic 30 steps', async () => {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 300, box.y + box.height / 2 + 120, { steps: 30 });
        await page.mouse.up();
    });

    await measure('undo the drag', async () => {
        await page.keyboard.press('Control+z');
    });

    await measure('select all', async () => {
        await page.keyboard.press('Control+a');
    });
    await measure('clear the selection', async () => {
        await page.keyboard.press('Escape');
    });

    await measure('zoom out to the whole map', async () => {
        await page.keyboard.press('Control+0');
    });

    const heapAfter = await heapMb(page);
    const report = { topics: COUNT, heapBeforeOpenMb: heapBefore, heapAfterMb: heapAfter, domWhole, domZoomed, steps };
    console.log(JSON.stringify(report, null, 2));
    await test.info().attach('scale-report', { body: JSON.stringify(report, null, 2), contentType: 'application/json' });

    expect(await page.evaluate(() => document.title)).toBeTruthy();
    if (process.env.SCALE_BUDGET) {
        const budget = Number(process.env.SCALE_BUDGET);
        steps.filter(s => s.step !== 'load the library' && s.step !== 'open the map')
            .forEach(s => expect(s.longestTaskMs, `${s.step}: longest task`).toBeLessThan(budget));
    }
});
