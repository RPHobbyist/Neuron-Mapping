/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';

import { EditorThemeContext, ThemePreference } from '@/hooks/useEditorTheme';

const STORAGE_KEY = 'neuron-theme';

const readPreference = (): ThemePreference => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    } catch {
        return 'system';
    }
};

const darkQuery = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null);

const useBeforePaintEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export const EditorThemeProvider = ({ children }: { children: ReactNode }) => {
    const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);
    const [systemDark, setSystemDark] = useState(() => !!darkQuery()?.matches);

    useEffect(() => {
        const query = darkQuery();
        if (!query) return;
        const handleChange = () => setSystemDark(query.matches);
        query.addEventListener('change', handleChange);
        return () => query.removeEventListener('change', handleChange);
    }, []);

    const resolved = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

    useBeforePaintEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('dark', resolved === 'dark');
        root.style.colorScheme = resolved;
        return () => {
            root.classList.remove('dark');
            root.style.colorScheme = '';
        };
    }, [resolved]);

    const setPreference = useCallback((next: ThemePreference) => {
        setPreferenceState(next);
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {
        }
    }, []);

    const value = useMemo(() => ({ preference, resolved, setPreference }), [preference, resolved, setPreference]);
    return <EditorThemeContext.Provider value={value}>{children}</EditorThemeContext.Provider>;
};
