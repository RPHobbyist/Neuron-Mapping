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

import { ruleToneOf } from './styleRules';
import { tagColor } from './tagColors';

describe('ruleToneOf', () => {
    const today = '2026-10-03';

    it('shows done tasks, then overdue topics, then high priority', () => {
        expect(ruleToneOf({ task: 'done', priority: 'high', dueDate: '2026-01-01' }, today)).toBe('done');
        expect(ruleToneOf({ task: 'open', priority: 'high', dueDate: '2026-01-01' }, today)).toBe('overdue');
        expect(ruleToneOf({ priority: 'high' }, today)).toBe('urgent');
        expect(ruleToneOf({ priority: 'low', dueDate: '2026-12-01' }, today)).toBeUndefined();
    });
});

describe('tagColor', () => {
    it('gives a tag the same colour every time, whatever its case', () => {
        expect(tagColor('Work')).toBe(tagColor('work'));
        expect(tagColor('work')).toMatch(/^#[0-9a-f]{6}$/);
    });
});
