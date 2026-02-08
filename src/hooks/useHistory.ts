import { useState, useCallback } from 'react';

interface HistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

export function useHistory<T>(initialState: T, maxHistory: number = 50) {
    const [history, setHistory] = useState<HistoryState<T>>({
        past: [],
        present: initialState,
        future: [],
    });

    const set = useCallback((newState: T | ((prev: T) => T)) => {
        setHistory((current) => {
            const nextState = typeof newState === 'function'
                ? (newState as (prev: T) => T)(current.present)
                : newState;

            // Add current state to past, limit history size
            const newPast = [...current.past, current.present].slice(-maxHistory);

            return {
                past: newPast,
                present: nextState,
                future: [], // Clear future when new action is taken
            };
        });
    }, [maxHistory]);

    const replace = useCallback((newState: T | ((prev: T) => T)) => {
        setHistory((current) => {
            const nextState = typeof newState === 'function'
                ? (newState as (prev: T) => T)(current.present)
                : newState;

            return {
                past: current.past,
                present: nextState,
                future: [],
            };
        });
    }, []);

    const undo = useCallback(() => {
        setHistory((current) => {
            if (current.past.length === 0) {
                return current;
            }

            const previous = current.past[current.past.length - 1];
            const newPast = current.past.slice(0, -1);

            return {
                past: newPast,
                present: previous,
                future: [current.present, ...current.future],
            };
        });
    }, []);

    const redo = useCallback(() => {
        setHistory((current) => {
            if (current.future.length === 0) {
                return current;
            }

            const next = current.future[0];
            const newFuture = current.future.slice(1);

            return {
                past: [...current.past, current.present],
                present: next,
                future: newFuture,
            };
        });
    }, []);

    const reset = useCallback((newState: T) => {
        setHistory({
            past: [],
            present: newState,
            future: [],
        });
    }, []);

    const canUndo = history.past.length > 0;
    const canRedo = history.future.length > 0;

    return {
        state: history.present,
        set,
        replace,
        undo,
        redo,
        reset,
        canUndo,
        canRedo,
        historyLength: history.past.length,
        futureLength: history.future.length,
    };
}

