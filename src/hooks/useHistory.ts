/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState, useCallback, useRef } from 'react';

export interface HistoryState<T> {
    past: T[];
    present: T;
    future: T[];
    checkpoint: T | null;
    gestureOpen: boolean;
    revision: number;
}

type Update<T> = T | ((prev: T) => T);

export type HistoryAction<T> =
    | { type: 'set'; update: Update<T> }
    | { type: 'replace'; update: Update<T> }
    | { type: 'mutate'; update: Update<T> }
    | { type: 'checkpoint' }
    | { type: 'cancelGesture' }
    | { type: 'undo' }
    | { type: 'redo' }
    | { type: 'reset'; state: T };

const resolve = <T,>(update: Update<T>, prev: T): T =>
    typeof update === 'function' ? (update as (prev: T) => T)(prev) : update;

export const createHistoryState = <T,>(present: T): HistoryState<T> =>
    ({ past: [], present, future: [], checkpoint: null, gestureOpen: false, revision: 0 });

export type HistoryLimit<T> = number | ((state: T) => number);

export function historyReducer<T>(current: HistoryState<T>, action: HistoryAction<T>, limit: HistoryLimit<T> = 50): HistoryState<T> {
    const maxHistory = typeof limit === 'function' ? limit(current.present) : limit;
    switch (action.type) {
        case 'set': {
            const next = resolve(action.update, current.present);
            if (Object.is(next, current.present)) return current;
            return {
                past: [...current.past, current.present].slice(-maxHistory),
                present: next,
                future: [],
                checkpoint: null,
                gestureOpen: false,
                revision: current.revision + 1,
            };
        }
        case 'replace': {
            const next = resolve(action.update, current.present);
            if (Object.is(next, current.present)) return current;
            if (current.gestureOpen && current.checkpoint === null) {
                return { ...current, present: next, future: [], revision: current.revision + 1 };
            }
            return {
                past: [...current.past, current.checkpoint ?? current.present].slice(-maxHistory),
                present: next,
                future: [],
                checkpoint: null,
                gestureOpen: true,
                revision: current.revision + 1,
            };
        }
        case 'mutate': {
            const next = resolve(action.update, current.present);
            if (Object.is(next, current.present)) return current;
            return { ...current, present: next };
        }
        case 'checkpoint':
            return { ...current, checkpoint: current.present, gestureOpen: false };
        case 'cancelGesture': {
            if (!current.gestureOpen || current.past.length === 0) return current;
            return {
                past: current.past.slice(0, -1),
                present: current.past[current.past.length - 1],
                future: current.future,
                checkpoint: null,
                gestureOpen: false,
                revision: current.revision + 1,
            };
        }
        case 'undo': {
            if (current.past.length === 0) return current;
            return {
                past: current.past.slice(0, -1),
                present: current.past[current.past.length - 1],
                future: [current.present, ...current.future],
                checkpoint: null,
                gestureOpen: false,
                revision: current.revision + 1,
            };
        }
        case 'redo': {
            if (current.future.length === 0) return current;
            return {
                past: [...current.past, current.present].slice(-maxHistory),
                present: current.future[0],
                future: current.future.slice(1),
                checkpoint: null,
                gestureOpen: false,
                revision: current.revision + 1,
            };
        }
        case 'reset':
            return { ...createHistoryState(action.state), revision: current.revision + 1 };
    }
}

export function useHistory<T>(initialState: T, maxHistory: HistoryLimit<T> = 50) {
    const [history, setHistory] = useState<HistoryState<T>>(() => createHistoryState(initialState));
    const limitRef = useRef(maxHistory);
    limitRef.current = maxHistory;

    const dispatch = useCallback((action: HistoryAction<T>) => {
        setHistory((current) => historyReducer(current, action, limitRef.current));
    }, []);

    const set = useCallback((update: Update<T>) => dispatch({ type: 'set', update }), [dispatch]);
    const replace = useCallback((update: Update<T>) => dispatch({ type: 'replace', update }), [dispatch]);
    const mutate = useCallback((update: Update<T>) => dispatch({ type: 'mutate', update }), [dispatch]);
    const checkpoint = useCallback(() => dispatch({ type: 'checkpoint' }), [dispatch]);
    const cancelGesture = useCallback(() => dispatch({ type: 'cancelGesture' }), [dispatch]);
    const undo = useCallback(() => dispatch({ type: 'undo' }), [dispatch]);
    const redo = useCallback(() => dispatch({ type: 'redo' }), [dispatch]);
    const reset = useCallback((state: T) => dispatch({ type: 'reset', state }), [dispatch]);

    return {
        state: history.present,
        set,
        replace,
        mutate,
        checkpoint,
        cancelGesture,
        undo,
        redo,
        reset,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        revision: history.revision,
        historyLength: history.past.length,
        futureLength: history.future.length,
    };
}
