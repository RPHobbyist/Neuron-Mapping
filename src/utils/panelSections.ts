/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const STORAGE_KEY = 'neuron-panel-sections';

export const SHORT_SCREEN_HEIGHT = 800;

export type OpenSections = Record<string, boolean>;

const defaultOpenSections = (shortScreen: boolean): OpenSections => shortScreen
    ? { text: true, 'line-type': true }
    : { text: true, color: true, 'line-type': true, 'line-color': true };

export function parseOpenSections(raw: string | null, shortScreen: boolean): OpenSections {
    if (!raw) return defaultOpenSections(shortScreen);
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return defaultOpenSections(shortScreen);
        return Object.fromEntries(Object.entries(parsed).filter(([, open]) => typeof open === 'boolean')) as OpenSections;
    } catch {
        return defaultOpenSections(shortScreen);
    }
}

export function getOpenSections(): OpenSections {
    const shortScreen = window.innerHeight < SHORT_SCREEN_HEIGHT;
    try {
        return parseOpenSections(localStorage.getItem(STORAGE_KEY), shortScreen);
    } catch {
        return defaultOpenSections(shortScreen);
    }
}

export function saveOpenSections(sections: OpenSections): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
    } catch {
    }
}

export function toggleSection(sections: OpenSections, id: string, siblings?: readonly string[]): OpenSections {
    const opening = !sections[id];
    const next = { ...sections };
    if (opening && siblings) {
        for (const other of siblings) next[other] = false;
    }
    next[id] = opening;
    return next;
}
