/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useEffect, useRef } from 'react';

import { CanvasShortcutId, matchCanvasShortcut } from '@/lib/shortcuts';

const dialogIsOpen = (): boolean =>
    !!document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [aria-modal="true"]');

export const belongsElsewhere = (e: Event): boolean => {
    if (document.querySelector('input:focus, textarea:focus, [contenteditable="true"]:focus')) return true;
    const target = e.target instanceof Element ? e.target : null;
    if (target?.closest('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]')) return true;
    return dialogIsOpen();
};

export type CanvasShortcutHandlers = Partial<Record<CanvasShortcutId, (e: KeyboardEvent) => void>>;

export const useCanvasKeyboard = (handlers: CanvasShortcutHandlers) => {
    const handlersRef = useRef(handlers);
    handlersRef.current = handlers;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.defaultPrevented) return;
            const id = matchCanvasShortcut(e);
            if (id === 'save') {
                e.preventDefault();
                if (!dialogIsOpen()) handlersRef.current.save?.(e);
                return;
            }
            if (belongsElsewhere(e)) return;
            if (id) handlersRef.current[id]?.(e);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
};
