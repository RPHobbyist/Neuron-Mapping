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

import { parseOpenSections, toggleSection } from './panelSections';

describe('parseOpenSections', () => {
    it('opens Text and Color by default', () => {
        const sections = parseOpenSections(null, false);
        expect(sections.text).toBe(true);
        expect(sections.color).toBe(true);
        expect(sections.status).toBeFalsy();
    });

    it('opens only Text by default on a short screen', () => {
        const sections = parseOpenSections(null, true);
        expect(sections.text).toBe(true);
        expect(sections.color).toBeFalsy();
    });

    it('restores what was saved', () => {
        expect(parseOpenSections(JSON.stringify({ text: false, status: true }), false)).toEqual({ text: false, status: true });
    });

    it('drops values that are not true or false', () => {
        expect(parseOpenSections(JSON.stringify({ text: 'yes', color: true }), false)).toEqual({ color: true });
    });

    it('falls back to the defaults for broken data', () => {
        expect(parseOpenSections('{not json', false)).toEqual(parseOpenSections(null, false));
        expect(parseOpenSections('[true]', false)).toEqual(parseOpenSections(null, false));
        expect(parseOpenSections('null', false)).toEqual(parseOpenSections(null, false));
    });
});

describe('toggleSection', () => {
    it('opens and closes a section without touching the others', () => {
        const opened = toggleSection({ text: true }, 'status');
        expect(opened).toEqual({ text: true, status: true });
        expect(toggleSection(opened, 'text')).toEqual({ text: false, status: true });
    });

    it('closes the siblings when opening one of them', () => {
        const next = toggleSection({ text: true, color: true, 'line-type': true }, 'status', ['text', 'color', 'status']);
        expect(next).toEqual({ text: false, color: false, status: true, 'line-type': true });
    });

    it('leaves the siblings alone when closing', () => {
        expect(toggleSection({ text: true, color: true }, 'text', ['text', 'color'])).toEqual({ text: false, color: true });
    });
});
