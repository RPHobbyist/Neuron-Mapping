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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MindMapNode } from '@/types/mindmap';

const writes = vi.hoisted(() => ({ count: 0 }));
vi.mock('idb-keyval', async (importOriginal) => ({
    ...(await importOriginal<typeof import('idb-keyval')>()),
    set: () => {
        writes.count++;
        return new Promise<void>((resolve) => setTimeout(resolve, 300));
    },
}));

import { useAutoSave } from './useAutoSave';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const nodesAt = (x: number): MindMapNode[] => [{ id: 'r', text: 'Root', x, y: 0, color: 'root', parentId: null }];

let unmount: (() => void) | undefined;
beforeEach(() => {
    vi.useFakeTimers();
    writes.count = 0;
});
afterEach(() => {
    unmount?.();
    unmount = undefined;
    vi.useRealTimers();
});

describe('useAutoSave', () => {
    it('keeps writing about every 15 seconds during a long, continuous edit instead of on every change', async () => {
        const Probe = ({ x }: { x: number }) => {
            useAutoSave(nodesAt(x), 'curved', [], [], { enabled: true, sessionId: 'new:test' });
            return null;
        };
        const root = createRoot(document.createElement('div'));
        unmount = () => act(() => root.unmount());

        for (let step = 0; step < 120; step++) {
            act(() => root.render(<Probe x={step} />));
            await act(async () => { await vi.advanceTimersByTimeAsync(250); });
        }

        expect(writes.count).toBeGreaterThanOrEqual(1);
        expect(writes.count).toBeLessThanOrEqual(3);
    });
});
