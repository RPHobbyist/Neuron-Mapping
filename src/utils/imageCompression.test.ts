/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { describe, expect, it } from 'vitest';

import { fitWithin } from './imageCompression';

describe('fitWithin', () => {
    it('scales the longer side down to the limit and keeps the aspect ratio', () => {
        expect(fitWithin(4000, 3000, 2048)).toEqual({ width: 2048, height: 1536 });
        expect(fitWithin(1000, 8000, 2048)).toEqual({ width: 256, height: 2048 });
    });

    it('never upscales a smaller image', () => {
        expect(fitWithin(800, 600, 2048)).toEqual({ width: 800, height: 600 });
    });

    it('keeps every side at least one pixel', () => {
        expect(fitWithin(100000, 10, 2048)).toEqual({ width: 2048, height: 1 });
    });
});
