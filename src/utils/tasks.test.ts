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

import { MindMapNode, NodeTask } from '@/types/mindmap';

import { completedBranchIds, computeTaskProgress, formatDay, isOverdue, taskSummary, todayAsDay } from './tasks';

const node = (id: string, parentId: string | null, task?: NodeTask): MindMapNode => ({
    id, text: id, x: 0, y: 0, color: 'blue', parentId, ...(task ? { task } : {}),
});

const map = (): MindMapNode[] => [
    node('root', null),
    node('Launch', 'root'),
    node('Design', 'Launch', 'done'),
    node('Build', 'Launch', 'open'),
    node('Ship', 'Launch', 'open'),
    node('Announce', 'Ship', 'done'),
    node('Notes', 'root'),
    node('Idea', 'Notes'),
];

describe('computeTaskProgress', () => {
    it('counts every task below a topic, not its own', () => {
        const progress = computeTaskProgress(map());
        expect(progress.get('root')).toEqual({ done: 2, total: 4 });
        expect(progress.get('Launch')).toEqual({ done: 2, total: 4 });
        expect(progress.get('Ship')).toEqual({ done: 1, total: 1 });
    });

    it('leaves out topics without tasks below them', () => {
        const progress = computeTaskProgress(map());
        expect(progress.has('Notes')).toBe(false);
        expect(progress.has('Design')).toBe(false);
    });

    it('ends on a parent loop', () => {
        const looped = [node('a', 'b', 'done'), node('b', 'a', 'open')];
        expect(() => computeTaskProgress(looped)).not.toThrow();
    });
});

describe('taskSummary', () => {
    it('counts the tasks of the whole map', () => {
        expect(taskSummary(map())).toEqual({ done: 2, total: 4 });
        expect(taskSummary([node('root', null)])).toEqual({ done: 0, total: 0 });
    });
});

describe('completedBranchIds', () => {
    it('takes done tasks with everything below them, and nothing else', () => {
        const nodes = [...map(), node('Detail', 'Design')];
        expect(completedBranchIds(nodes)).toEqual(new Set(['Design', 'Detail', 'Announce']));
    });
});

describe('due dates', () => {
    it('reads today as a calendar day where the map is open', () => {
        expect(todayAsDay(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
    });

    it('is overdue once the day has passed, unless the task is done', () => {
        expect(isOverdue({ dueDate: '2026-10-02' }, '2026-10-03')).toBe(true);
        expect(isOverdue({ dueDate: '2026-10-03' }, '2026-10-03')).toBe(false);
        expect(isOverdue({ dueDate: '2026-10-02', task: 'done' }, '2026-10-03')).toBe(false);
        expect(isOverdue({ dueDate: '2026-10-02', task: 'open' }, '2026-10-03')).toBe(true);
        expect(isOverdue({}, '2026-10-03')).toBe(false);
    });

    it('shows the year only when it is not this one', () => {
        const now = new Date(2026, 9, 3);
        expect(formatDay('2026-10-05', now)).not.toMatch(/2026/);
        expect(formatDay('2027-01-05', now)).toMatch(/2027/);
    });
});
