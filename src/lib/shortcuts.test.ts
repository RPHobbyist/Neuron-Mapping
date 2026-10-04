/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { CANVAS_SHORTCUTS, matchCanvasShortcut, SHORTCUT_LIST } from './shortcuts';

const press = (key: string, modifiers: KeyboardEventInit = {}) =>
    matchCanvasShortcut(new KeyboardEvent('keydown', { key, ...modifiers }));

const pressOn = (target: Element, key: string) => {
    let matched: string | null = null;
    target.addEventListener('keydown', e => { matched = matchCanvasShortcut(e as KeyboardEvent); }, { once: true });
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    return matched;
};

describe('matchCanvasShortcut', () => {
    it('tells undo from redo, with Ctrl or Cmd and any case', () => {
        expect(press('z', { ctrlKey: true })).toBe('undo');
        expect(press('z', { metaKey: true })).toBe('undo');
        expect(press('Z', { ctrlKey: true, shiftKey: true })).toBe('redo');
        expect(press('y', { ctrlKey: true })).toBe('redo');
    });

    it('matches the other canvas keys', () => {
        expect(press('Delete')).toBe('delete');
        expect(press('Backspace')).toBe('delete');
        expect(press('c', { ctrlKey: true })).toBe('copy');
        expect(press('v', { metaKey: true })).toBe('paste');
        expect(press('Tab')).toBe('addChild');
        expect(press('Enter')).toBe('addSibling');
        expect(press('Enter', { ctrlKey: true })).toBe('insertParent');
        expect(press('Tab', { shiftKey: true })).toBe('outdent');
        expect(press('c', { ctrlKey: true, altKey: true })).toBe('copyStyle');
        expect(press('v', { ctrlKey: true, altKey: true })).toBe('pasteStyle');
        expect(matchCanvasShortcut(new KeyboardEvent('keydown', { key: 'ć', code: 'KeyC', ctrlKey: true, altKey: true }))).toBe('copyStyle');
        expect(press('F2')).toBe('editText');
        expect(press('ArrowLeft')).toBe('navigate');
        expect(press('?', { shiftKey: true })).toBe('showShortcuts');
        expect(press('d', { ctrlKey: true })).toBe('duplicate');
        expect(press('A', { metaKey: true })).toBe('selectAll');
    });

    it('tells moving a node among its siblings from moving the selection', () => {
        expect(press('ArrowUp', { altKey: true })).toBe('moveUp');
        expect(press('ArrowDown', { altKey: true })).toBe('moveDown');
        expect(press('ArrowUp')).toBe('navigate');
        expect(press('ArrowLeft', { altKey: true })).toBeNull();
    });

    it('zooms with Ctrl and the plus, minus and zero keys, shifted or not', () => {
        expect(press('=', { ctrlKey: true })).toBe('zoomIn');
        expect(press('+', { ctrlKey: true, shiftKey: true })).toBe('zoomIn');
        expect(press('-', { metaKey: true })).toBe('zoomOut');
        expect(press('_', { ctrlKey: true, shiftKey: true })).toBe('zoomOut');
        expect(press('0', { ctrlKey: true })).toBe('fitToScreen');
        expect(press('0')).toBeNull();
        expect(press('.', { ctrlKey: true })).toBe('toggleCollapse');
        expect(press('.')).toBeNull();
    });

    it('leaves keys the canvas does not own alone', () => {
        expect(press('Enter', { shiftKey: true })).toBeNull();
        expect(press('Enter', { ctrlKey: true, shiftKey: true })).toBeNull();
        expect(press('a')).toBeNull();
        expect(press('d')).toBeNull();
        expect(press('D', { ctrlKey: true, shiftKey: true })).toBeNull();
        expect(press('A', { ctrlKey: true, shiftKey: true })).toBeNull();
    });

    it('lets Space and Enter press a focused button instead', () => {
        const button = document.body.appendChild(document.createElement('button'));
        const div = document.body.appendChild(document.createElement('div'));
        expect(pressOn(button, ' ')).toBeNull();
        expect(pressOn(div, ' ')).toBe('editText');
        expect(pressOn(button, 'Enter')).toBeNull();
        expect(pressOn(div, 'Enter')).toBe('addSibling');
    });
});

describe('SHORTCUT_LIST', () => {
    it('lists every shortcut the canvas handles, once', () => {
        const listed = SHORTCUT_LIST.map(shortcut => shortcut.keys);
        CANVAS_SHORTCUTS.forEach(shortcut => expect(listed).toContain(shortcut.keys));
        expect(new Set(listed).size).toBe(listed.length);
    });
});
