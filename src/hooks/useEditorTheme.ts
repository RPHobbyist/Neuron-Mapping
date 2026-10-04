/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { createContext, useContext } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface EditorTheme {
    preference: ThemePreference;
    resolved: 'light' | 'dark';
    setPreference: (preference: ThemePreference) => void;
}

export const EditorThemeContext = createContext<EditorTheme>({ preference: 'light', resolved: 'light', setPreference: () => {} });

export const useEditorTheme = () => useContext(EditorThemeContext);
