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

import packageJson from '../../package.json?raw';
import readme from '../../README.md?raw';

import { RELEASES, readmeChangelogSection, readmeChangelogTocLine } from './changelog';

describe('changelog', () => {
    it("starts with the version in package.json, which the app shows", () => {
        expect(RELEASES[0].version).toBe(JSON.parse(packageJson).version);
        expect(__APP_VERSION__).toBe(RELEASES[0].version);
    });

    it("is what README.md's What's New section says (npm run changelog:readme writes it)", () => {
        const text = readme.replace(/\r\n/g, '\n');
        const section = text.slice(text.search(/<!-- changelog:start[^>]*-->/), text.indexOf('<!-- changelog:end -->'))
            .replace(/^<!--[^>]*-->\n/, '')
            .trim();
        expect(section).toBe(readmeChangelogSection());
        expect(text).toContain(readmeChangelogTocLine());
    });

    it('lists each change once per release', () => {
        RELEASES.forEach((release) => {
            const titles = release.entries.map(entry => entry.title);
            expect(new Set(titles).size).toBe(titles.length);
        });
    });
});
