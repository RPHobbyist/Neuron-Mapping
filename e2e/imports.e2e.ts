/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { strToU8, zipSync } from 'fflate';
import { expect, test, type Page } from '@playwright/test';

import { node, preparePage } from './helpers';

test.beforeEach(async ({ page }) => {
    await preparePage(page);
});

const importFile = async (page: Page, name: string, buffer: Buffer) => {
    await page.getByRole('button', { name: 'Import', exact: true }).click();
    await page.locator('#file-upload-input').setInputFiles({ name, mimeType: 'application/octet-stream', buffer });
};

test('maps from FreeMind and XMind open with their topics', async ({ page }) => {
    await page.goto('/workspace');

    const freeMind = `<map version="1.0.1">
<node TEXT="FreeMind root" ID="ID_1">
  <node TEXT="FreeMind child" ID="ID_2"><arrowlink DESTINATION="ID_3"/></node>
  <node TEXT="Second child" ID="ID_3"/>
</node>
</map>`;
    await importFile(page, 'Plan.mm', Buffer.from(freeMind));
    await expect(node(page, 'FreeMind root')).toBeVisible();
    await expect(node(page, 'FreeMind child')).toBeVisible();
    await page.getByTitle('Back to templates').click();

    const xmind = zipSync({
        'content.json': strToU8(JSON.stringify([{
            id: 'sheet',
            rootTopic: { id: 'root', title: 'XMind root', children: { attached: [{ id: 'a', title: 'XMind child' }] } },
        }])),
    });
    await importFile(page, 'Plan.xmind', Buffer.from(xmind));
    await expect(node(page, 'XMind root')).toBeVisible();
    await expect(node(page, 'XMind child')).toBeVisible();
});
