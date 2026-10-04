/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

export interface ShortcutInfo {
    keys: string;
    action: string;
}

export type CanvasShortcutId =
    | 'addChild' | 'addSibling' | 'insertParent' | 'outdent' | 'editText' | 'delete' | 'copy' | 'paste' | 'copyStyle' | 'pasteStyle'
    | 'duplicate' | 'selectAll' | 'commandPalette' | 'escape'
    | 'navigate' | 'moveUp' | 'moveDown' | 'toggleCollapse' | 'zoomIn' | 'zoomOut' | 'fitToScreen' | 'undo' | 'redo' | 'showShortcuts'
    | 'save' | 'pen' | 'eraser' | 'boxArea' | 'fitKey';

export interface CanvasShortcut extends ShortcutInfo {
    id: CanvasShortcutId;
    matches: (e: KeyboardEvent) => boolean;
}

const withModifier = (e: KeyboardEvent) => e.ctrlKey || e.metaKey;
const keyIs = (e: KeyboardEvent, key: string) => e.key.toLowerCase() === key;
const letterIs = (e: KeyboardEvent, letter: string) => keyIs(e, letter) || e.code === `Key${letter.toUpperCase()}`;
const onControl = (e: KeyboardEvent) =>
    e.target instanceof Element && !!e.target.closest('button, a, select, [role="button"]');
const plainLetter = (e: KeyboardEvent, letter: string) =>
    !withModifier(e) && !e.altKey && !e.shiftKey && keyIs(e, letter);

export const CANVAS_SHORTCUTS: CanvasShortcut[] = [
    { id: 'save', keys: 'Ctrl + S', action: 'Save Map', matches: e => withModifier(e) && letterIs(e, 's') && !e.altKey && !e.shiftKey },
    { id: 'delete', keys: 'Backsp / Del', action: 'Delete Node', matches: e => e.key === 'Delete' || e.key === 'Backspace' },
    { id: 'undo', keys: 'Ctrl + Z', action: 'Undo', matches: e => withModifier(e) && keyIs(e, 'z') && !e.shiftKey },
    { id: 'redo', keys: 'Ctrl + Y', action: 'Redo', matches: e => withModifier(e) && (keyIs(e, 'y') || (e.shiftKey && keyIs(e, 'z'))) },
    { id: 'copyStyle', keys: 'Ctrl + Alt + C', action: 'Copy Style', matches: e => withModifier(e) && e.altKey && letterIs(e, 'c') },
    { id: 'pasteStyle', keys: 'Ctrl + Alt + V', action: 'Paste Style', matches: e => withModifier(e) && e.altKey && letterIs(e, 'v') },
    { id: 'copy', keys: 'Ctrl + C', action: 'Copy Node', matches: e => withModifier(e) && keyIs(e, 'c') },
    { id: 'paste', keys: 'Ctrl + V', action: 'Paste Node', matches: e => withModifier(e) && keyIs(e, 'v') },
    { id: 'duplicate', keys: 'Ctrl + D', action: 'Duplicate', matches: e => withModifier(e) && keyIs(e, 'd') && !e.shiftKey },
    { id: 'selectAll', keys: 'Ctrl + A', action: 'Select All', matches: e => withModifier(e) && keyIs(e, 'a') && !e.shiftKey },
    { id: 'zoomIn', keys: 'Ctrl + =', action: 'Zoom In', matches: e => withModifier(e) && (e.key === '=' || e.key === '+') },
    { id: 'zoomOut', keys: 'Ctrl + −', action: 'Zoom Out', matches: e => withModifier(e) && (e.key === '-' || e.key === '_') },
    { id: 'fitToScreen', keys: 'Ctrl + 0', action: 'Fit to Screen', matches: e => withModifier(e) && e.key === '0' },
    { id: 'commandPalette', keys: 'Ctrl + K', action: 'Commands, Topics and Maps', matches: e => withModifier(e) && keyIs(e, 'k') && !e.shiftKey },
    { id: 'escape', keys: 'Escape', action: 'Leave Zen Mode, the Branch Shown, Drawing or Box Mode, or Deselect', matches: e => e.key === 'Escape' },
    { id: 'toggleCollapse', keys: 'Ctrl + .', action: 'Collapse / Expand Branch', matches: e => withModifier(e) && e.key === '.' },
    { id: 'showShortcuts', keys: 'Shift + ?', action: 'Show Shortcuts', matches: e => e.key === '?' && e.shiftKey },
    { id: 'addChild', keys: 'Tab', action: 'Add Child Node', matches: e => e.key === 'Tab' && !e.shiftKey && !withModifier(e) },
    { id: 'outdent', keys: 'Shift + Tab', action: 'Move Up a Level', matches: e => e.key === 'Tab' && e.shiftKey && !withModifier(e) },
    { id: 'insertParent', keys: 'Ctrl + Enter', action: 'Insert Parent Node', matches: e => e.key === 'Enter' && withModifier(e) && !e.shiftKey && !onControl(e) },
    { id: 'addSibling', keys: 'Enter', action: 'Add Sibling Node', matches: e => e.key === 'Enter' && !e.shiftKey && !withModifier(e) && !onControl(e) },
    { id: 'editText', keys: 'Space / F2', action: 'Edit Node Text', matches: e => e.key === 'F2' || (e.key === ' ' && !onControl(e)) },
    { id: 'moveUp', keys: 'Alt + ↑', action: 'Move Up Among Siblings', matches: e => e.altKey && e.key === 'ArrowUp' },
    { id: 'moveDown', keys: 'Alt + ↓', action: 'Move Down Among Siblings', matches: e => e.altKey && e.key === 'ArrowDown' },
    { id: 'navigate', keys: 'Arrow Keys', action: 'Navigate', matches: e => e.key.startsWith('Arrow') && !e.altKey },
    { id: 'pen', keys: 'P', action: 'Pencil', matches: e => plainLetter(e, 'p') },
    { id: 'eraser', keys: 'E', action: 'Eraser', matches: e => plainLetter(e, 'e') },
    { id: 'boxArea', keys: 'B', action: 'Box Area', matches: e => plainLetter(e, 'b') },
    { id: 'fitKey', keys: 'F', action: 'Fit to Screen', matches: e => plainLetter(e, 'f') },
];

const canvas = (id: CanvasShortcutId): ShortcutInfo => CANVAS_SHORTCUTS.find(shortcut => shortcut.id === id)!;

export const SHORTCUT_LIST: ShortcutInfo[] = [
    canvas('save'),
    canvas('addChild'),
    canvas('addSibling'),
    canvas('insertParent'),
    canvas('outdent'),
    canvas('editText'),
    { keys: 'Ctrl + B / I / U', action: 'Bold / Italic / Underline (while editing)' },
    { keys: 'Ctrl + Shift + X', action: 'Strikethrough (while editing)' },
    canvas('delete'),
    canvas('copy'),
    { keys: 'Ctrl + X', action: 'Cut Node' },
    canvas('paste'),
    canvas('copyStyle'),
    canvas('pasteStyle'),
    canvas('duplicate'),
    canvas('selectAll'),
    canvas('navigate'),
    canvas('moveUp'),
    canvas('moveDown'),
    canvas('toggleCollapse'),
    canvas('undo'),
    canvas('redo'),
    canvas('commandPalette'),
    canvas('zoomIn'),
    canvas('zoomOut'),
    canvas('fitToScreen'),
    canvas('fitKey'),
    canvas('pen'),
    canvas('eraser'),
    canvas('boxArea'),
    { keys: 'Ctrl + Scroll / Pinch', action: 'Zoom at the Pointer' },
    { keys: 'Scroll', action: 'Pan (Shift for Sideways)' },
    { keys: 'Ctrl + F', action: 'Search' },
    { keys: 'Shift + Click', action: 'Select Multiple Nodes' },
    { keys: 'Shift + Drag', action: 'Box Selection' },
    canvas('escape'),
    { keys: 'Right-click', action: 'Menu for a Topic or the Map' },
    { keys: '→ / Space, ←', action: 'Next / Previous Topic (presenting)' },
    { keys: 'P / F / Esc', action: 'Pause / Full Screen / End (presenting)' },
    canvas('showShortcuts'),
];

export const matchCanvasShortcut = (e: KeyboardEvent): CanvasShortcutId | null =>
    CANVAS_SHORTCUTS.find(shortcut => shortcut.matches(e))?.id ?? null;
