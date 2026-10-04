/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { Monitor, Moon, Sun } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ThemePreference, useEditorTheme } from '@/hooks/useEditorTheme';

const NEXT: Record<ThemePreference, ThemePreference> = { light: 'dark', dark: 'system', system: 'light' };
const LABELS: Record<ThemePreference, string> = { light: 'Light', dark: 'Dark', system: 'Same as the system' };
const ICONS = { light: Sun, dark: Moon, system: Monitor };

export const ThemeToggle = ({ className }: { className?: string }) => {
  const { preference, setPreference } = useEditorTheme();
  const Icon = ICONS[preference];
  const next = NEXT[preference];
  return (
    <button
      type="button"
      onClick={() => setPreference(next)}
      className={cn('p-2 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors', className)}
      title={`Theme: ${LABELS[preference]}. Click for ${LABELS[next].toLowerCase()}.`}
      aria-label={`Theme: ${LABELS[preference]}. Switch to ${LABELS[next].toLowerCase()}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
};
