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

import { historyReducer, createHistoryState, HistoryAction, HistoryState } from './useHistory';

type State = { value: number; measured?: number };

const initial = (value = 0): HistoryState<State> => createHistoryState<State>({ value });

const run = (actions: HistoryAction<State>[], start = initial()) =>
    actions.reduce((state, action) => historyReducer(state, action), start);

const values = (h: HistoryState<State>) => h.past.map(s => s.value);

describe('historyReducer', () => {
    it('records a whole gesture as one undo step', () => {
        const h = run([
            { type: 'checkpoint' },
            { type: 'replace', update: s => ({ ...s, value: 1 }) },
            { type: 'replace', update: s => ({ ...s, value: 2 }) },
            { type: 'replace', update: s => ({ ...s, value: 3 }) },
        ]);
        expect(values(h)).toEqual([0]);
        expect(historyReducer(h, { type: 'undo' }).present.value).toBe(0);
    });

    it('adds no step for a gesture that changes nothing', () => {
        const h = run([
            { type: 'checkpoint' },
            { type: 'replace', update: s => s },
        ]);
        expect(h.past).toEqual([]);
        expect(h.revision).toBe(0);
    });

    it('adds one step when a checkpoint is followed by an undoable change', () => {
        const h = run([
            { type: 'checkpoint' },
            { type: 'set', update: s => ({ ...s, value: 5 }) },
        ]);
        expect(values(h)).toEqual([0]);
        expect(historyReducer(h, { type: 'undo' }).present.value).toBe(0);
    });

    it('keeps bookkeeping changes out of history and out of the gesture', () => {
        const h = run([
            { type: 'checkpoint' },
            { type: 'mutate', update: s => ({ ...s, measured: 10 }) },
            { type: 'replace', update: s => ({ ...s, value: 1 }) },
        ]);
        expect(h.past).toEqual([{ value: 0 }]);
        expect(h.present).toEqual({ value: 1, measured: 10 });
    });

    it('changes the revision on content changes but not on bookkeeping', () => {
        let h = run([{ type: 'mutate', update: s => ({ ...s, measured: 1 }) }]);
        expect(h.revision).toBe(0);
        h = historyReducer(h, { type: 'set', update: s => ({ ...s, value: 1 }) });
        h = historyReducer(h, { type: 'undo' });
        expect(h.revision).toBe(2);
    });

    it('clears redo after a new change', () => {
        let h = run([
            { type: 'set', update: s => ({ ...s, value: 1 }) },
            { type: 'undo' },
        ]);
        expect(h.future).toHaveLength(1);
        h = run([{ type: 'checkpoint' }, { type: 'replace', update: s => ({ ...s, value: 9 }) }], h);
        expect(h.future).toEqual([]);
    });

    it('cancels a gesture without leaving an undo or redo step', () => {
        const h = run([
            { type: 'set', update: { value: 1 } },
            { type: 'checkpoint' },
            { type: 'replace', update: { value: 2 } },
            { type: 'replace', update: { value: 3 } },
            { type: 'cancelGesture' },
        ]);
        expect(h.present).toEqual({ value: 1 });
        expect(values(h)).toEqual([0]);
        expect(h.future).toEqual([]);
    });

    it('does not cancel anything once another change was recorded after the gesture', () => {
        const h = run([
            { type: 'checkpoint' },
            { type: 'replace', update: { value: 2 } },
            { type: 'set', update: { value: 5 } },
            { type: 'cancelGesture' },
        ]);
        expect(h.present).toEqual({ value: 5 });
        expect(values(h)).toEqual([0, 2]);
    });

    it('does nothing when the gesture changed nothing', () => {
        const h = run([
            { type: 'set', update: { value: 1 } },
            { type: 'checkpoint' },
            { type: 'cancelGesture' },
        ]);
        expect(h.present).toEqual({ value: 1 });
        expect(values(h)).toEqual([0]);
    });

    it('makes a change without a checkpoint undoable when no gesture is open', () => {
        const h = run([
            { type: 'set', update: { value: 1 } },
            { type: 'replace', update: { value: 2 } },
            { type: 'replace', update: { value: 3 } },
        ]);
        expect(values(h)).toEqual([0, 1]);
        expect(historyReducer(h, { type: 'undo' }).present.value).toBe(1);
    });

    it('drops redo when a gesture continues after an undo', () => {
        let h = run([
            { type: 'checkpoint' },
            { type: 'replace', update: { value: 1 } },
            { type: 'undo' },
        ]);
        expect(h.future).toHaveLength(1);
        h = run([{ type: 'replace', update: { value: 7 } }, { type: 'replace', update: { value: 8 } }], h);
        expect(h.future).toEqual([]);
        expect(values(h)).toEqual([0]);
        expect(historyReducer(h, { type: 'undo' }).present.value).toBe(0);
    });

    it('caps the undo history', () => {
        let h = initial();
        for (let i = 1; i <= 5; i++) h = historyReducer(h, { type: 'set', update: { value: i } }, 3);
        expect(values(h)).toEqual([2, 3, 4]);
    });
});
