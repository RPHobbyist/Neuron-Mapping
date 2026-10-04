/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { describe, expect, it } from 'vitest';

import indexHtml from '../../index.html?raw';
import manifest from '../../public/manifest.json?raw';
import readme from '../../README.md?raw';

import { TEMPLATE_COUNT_LABEL } from './seoContent';
import { templates } from './templates';

const staticFiles = { 'index.html': indexHtml, 'manifest.json': manifest, 'README.md': readme };

describe('template count', () => {
    it('is the real count rounded down to a multiple of ten', () => {
        const claimed = Number.parseInt(TEMPLATE_COUNT_LABEL, 10);
        expect(claimed).toBeLessThanOrEqual(templates.length);
        expect(templates.length - claimed).toBeLessThan(10);
    });

    it.each(Object.entries(staticFiles))('is the one %s claims', (_, text) => {
        const claims = [...text.matchAll(/\b(\d+)\+(?=\s)/g)].map(match => `${match[1]}+`);
        expect(claims.length).toBeGreaterThan(0);
        expect([...new Set(claims)]).toEqual([TEMPLATE_COUNT_LABEL]);
    });
});
