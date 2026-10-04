/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { expect, type Locator, type Page } from '@playwright/test';

export const preparePage = async (page: Page) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('license-update-acknowledged-agplv3', 'true');
    });
    page.on('dialog', dialog => dialog.accept());
};

export const node = (page: Page, text: string) => page.getByTestId('mindmap-canvas').getByText(text, { exact: true });

export const commandPalette = (page: Page) => page.getByRole('dialog', { name: 'Command palette' });

export const searchPalette = async (page: Page, search: string) => {
    await page.keyboard.press('Control+k');
    const input = commandPalette(page).getByRole('combobox');
    await expect(input).toBeFocused();
    await page.keyboard.type(search);
    await expect(input).toHaveValue(search);
};

export const runCommand = async (page: Page, search: string) => {
    await searchPalette(page, search);
    await expect(commandPalette(page).getByRole('option', { selected: true })).toContainText(new RegExp(search, 'i'));
    await page.keyboard.press('Enter');
    await expect(commandPalette(page)).toHaveCount(0);
};

export const savedMapCard = (page: Page, name: string) => page.getByRole('button', { name: `Open ${name}`, exact: true });

export const chooseMapAction = async (page: Page, name: string, action: string | RegExp) => {
    await page.getByRole('button', { name: `Actions for ${name}`, exact: true }).click();
    await page.getByRole('menuitem', { name: action }).click();
};

export const settledBox = async (locator: Locator) => {
    let previous = '';
    let box: Awaited<ReturnType<Locator['boundingBox']>> = null;
    await expect.poll(async () => {
        box = await locator.boundingBox();
        const current = JSON.stringify(box);
        const settled = box !== null && current === previous;
        previous = current;
        return settled;
    }, { intervals: [150] }).toBe(true);
    return box!;
};

export const panOf = async (page: Page): Promise<[number, number]> => {
    const transform = await page.getByTestId('mindmap-canvas').locator(':scope > div').first()
        .evaluate(el => (el as HTMLElement).style.transform);
    const [x, y] = transform.match(/translate\(([-\d.e]+)px, ([-\d.e]+)px\)/)!.slice(1).map(Number);
    return [x, y];
};

export const saveAs = async (page: Page, name: string) => {
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Save Mind Map' });
    await dialog.getByLabel('Name').fill(name);
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText(`Saved "${name}"`)).toBeVisible();
};

export const renameSelectedNode = async (page: Page, text: string) => {
    await page.keyboard.press('F2');
    const editor = page.locator('[data-node-text-editor]');
    await expect(editor).toBeFocused();
    await page.keyboard.type(text);
    await page.keyboard.press('Enter');
    await expect(editor).toBeHidden();
};

export const putInAppStore = (page: Page, key: string, value: unknown) => page.evaluate(({ key, value }) => (
    new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('keyval-store');
        open.onupgradeneeded = () => open.result.createObjectStore('keyval');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
            const db = open.result;
            const tx = db.transaction('keyval', 'readwrite');
            tx.objectStore('keyval').put(value, key);
            tx.oncomplete = () => {
                db.close();
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        };
    })
), { key, value });
