/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const STORAGE_KEY = 'neuron-custom-colors';
export const MAX_CUSTOM_COLORS = 8;

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/;

export function getCustomColors(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((c): c is string => typeof c === 'string' && HEX_COLOR_RE.test(c))
      .slice(0, MAX_CUSTOM_COLORS);
  } catch {
    return [];
  }
}

export function saveCustomColors(colors: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  } catch {
  }
}

export function withCustomColor(colors: string[], color: string): string[] {
  const hex = color.toLowerCase();
  if (!HEX_COLOR_RE.test(hex)) return colors;
  return [hex, ...colors.filter(c => c !== hex)].slice(0, MAX_CUSTOM_COLORS);
}
