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
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GalaxyErrorBoundary } from './GalaxyErrorBoundary';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const Broken = (): JSX.Element => {
    throw new Error('WebGL context lost');
};

let container: HTMLDivElement;
afterEach(() => container?.remove());

const render = (element: JSX.Element) => {
    container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(element));
    return root;
};

describe('GalaxyErrorBoundary', () => {
    it('shows the 3D view while it works', () => {
        render(<GalaxyErrorBoundary onExit={() => {}}><p>3D view</p></GalaxyErrorBoundary>);
        expect(container.textContent).toBe('3D view');
    });

    it('keeps a failure inside the view and offers the way back to 2D', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const silence = (e: ErrorEvent) => e.preventDefault();
        window.addEventListener('error', silence);
        try {
            const onExit = vi.fn();
            render(<GalaxyErrorBoundary onExit={onExit}><Broken /></GalaxyErrorBoundary>);

            expect(container.querySelector('[role="alert"]')?.textContent).toContain("The 3D view couldn't start");
            act(() => container.querySelector('button')!.click());
            expect(onExit).toHaveBeenCalledOnce();
        } finally {
            window.removeEventListener('error', silence);
        }
    });
});
