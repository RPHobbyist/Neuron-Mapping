/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

export type MapSortOrder = 'updated' | 'name' | 'created';

export const MAP_SORT_ORDERS: { value: MapSortOrder; label: string }[] = [
    { value: 'updated', label: 'Last changed' },
    { value: 'name', label: 'Name' },
    { value: 'created', label: 'Newest' },
];

interface ListedMap {
    id?: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export const listMaps = <T extends ListedMap>(maps: T[], query: string, order: MapSortOrder, pinned: ReadonlySet<string> = new Set()): T[] => {
    const words = query.trim().toLowerCase();
    const shown = words ? maps.filter(map => map.name.toLowerCase().includes(words)) : [...maps];
    const byName = (a: T, b: T) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    const date = order === 'created' ? 'createdAt' : 'updatedAt';
    const byOrder = order === 'name' ? byName : (a: T, b: T) => b[date].localeCompare(a[date]) || byName(a, b);
    const isPinned = (map: T) => (map.id !== undefined && pinned.has(map.id) ? 0 : 1);
    return shown.sort((a, b) => isPinned(a) - isPinned(b) || byOrder(a, b));
};

const PINNED_KEY = 'neuron-maps-pinned';

export const readPinnedMaps = (): Set<string> => {
    try {
        const stored = JSON.parse(localStorage.getItem(PINNED_KEY) ?? '[]');
        return new Set(Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : []);
    } catch {
        return new Set();
    }
};

export const writePinnedMaps = (pinned: ReadonlySet<string>) => {
    try {
        localStorage.setItem(PINNED_KEY, JSON.stringify([...pinned]));
    } catch {
    }
};

export const copyName = (name: string, taken: string[]): string => {
    const base = name.replace(/ \(copy(?: \d+)?\)$/, '');
    const isTaken = (candidate: string) => taken.some(other => other.toLowerCase() === candidate.toLowerCase());
    let candidate = `${base} (copy)`;
    for (let n = 2; isTaken(candidate); n++) candidate = `${base} (copy ${n})`;
    return candidate;
};
