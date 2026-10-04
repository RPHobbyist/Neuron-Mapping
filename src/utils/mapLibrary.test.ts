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

import { copyName, listMaps } from './mapLibrary';

const map = (name: string, createdAt: string, updatedAt: string) => ({ name, createdAt, updatedAt });

const maps = [
    map('Plan 10', '2026-01-03', '2026-02-01'),
    map('Budget', '2026-01-01', '2026-03-01'),
    map('plan 2', '2026-01-02', '2026-01-15'),
];

const names = (list: { name: string }[]) => list.map(entry => entry.name);

describe('listMaps', () => {
    it('sorts by the last change, by name or by creation', () => {
        expect(names(listMaps(maps, '', 'updated'))).toEqual(['Budget', 'Plan 10', 'plan 2']);
        expect(names(listMaps(maps, '', 'name'))).toEqual(['Budget', 'plan 2', 'Plan 10']);
        expect(names(listMaps(maps, '', 'created'))).toEqual(['Plan 10', 'plan 2', 'Budget']);
    });

    it('keeps the maps whose name contains what was typed, whatever the case', () => {
        expect(names(listMaps(maps, ' PLAN ', 'name'))).toEqual(['plan 2', 'Plan 10']);
        expect(listMaps(maps, 'nothing like it', 'updated')).toEqual([]);
    });

    it('puts pinned maps first, each part in the order asked for', () => {
        const withIds = maps.map((entry, i) => ({ ...entry, id: `m${i}` }));
        expect(names(listMaps(withIds, '', 'updated', new Set(['m2'])))).toEqual(['plan 2', 'Budget', 'Plan 10']);
        expect(names(listMaps(withIds, '', 'name', new Set(['m0', 'm2'])))).toEqual(['plan 2', 'Plan 10', 'Budget']);
    });

    it('leaves the list it was given as it is', () => {
        const before = names(maps);
        listMaps(maps, '', 'name');
        expect(names(maps)).toEqual(before);
    });
});

describe('copyName', () => {
    it('adds "(copy)", and a number when that is taken', () => {
        expect(copyName('Plan', ['Plan'])).toBe('Plan (copy)');
        expect(copyName('Plan', ['Plan', 'plan (copy)'])).toBe('Plan (copy 2)');
        expect(copyName('Plan', ['Plan', 'Plan (copy)', 'Plan (copy 2)'])).toBe('Plan (copy 3)');
    });

    it('numbers a copy of a copy rather than stacking the word', () => {
        expect(copyName('Plan (copy)', ['Plan', 'Plan (copy)'])).toBe('Plan (copy 2)');
        expect(copyName('Plan (copy 2)', ['Plan (copy 2)'])).toBe('Plan (copy)');
    });
});
