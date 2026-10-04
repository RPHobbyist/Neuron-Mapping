/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const MAX_IMAGE_DIMENSION = 2048;
const ENCODE_QUALITY = 0.85;
const PASS_THROUGH_TYPES = ['image/gif', 'image/x-icon', 'image/vnd.microsoft.icon'];
const PASS_THROUGH_MAX_SIZE = 2 * 1024 * 1024;
const STORABLE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp', ...PASS_THROUGH_TYPES];

export const fitWithin = (width: number, height: number, max: number): { width: number; height: number } => {
    const scale = Math.min(1, max / Math.max(width, height, 1));
    return {
        width: Math.max(1, Math.round(width * scale)),
        height: Math.max(1, Math.round(height * scale)),
    };
};

const readAsDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image'));
    reader.readAsDataURL(blob);
});

const encode = (canvas: HTMLCanvasElement, type: string): Promise<Blob | null> =>
    new Promise((resolve) => canvas.toBlob(resolve, type, ENCODE_QUALITY));

export const compressImageFile = async (file: File): Promise<string> => {
    if (PASS_THROUGH_TYPES.includes(file.type) && file.size <= PASS_THROUGH_MAX_SIZE) {
        return readAsDataUrl(file);
    }

    const bitmap = await createImageBitmap(file);
    try {
        const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_IMAGE_DIMENSION);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas is not available');
        context.drawImage(bitmap, 0, 0, width, height);

        let blob = await encode(canvas, 'image/webp');
        if (!blob || blob.type !== 'image/webp') {
            const opaque = file.type === 'image/jpeg' || file.type === 'image/bmp';
            blob = await encode(canvas, opaque ? 'image/jpeg' : 'image/png');
        }
        if (!blob) throw new Error('Failed to encode image');

        const sameSize = width === bitmap.width && height === bitmap.height;
        if (sameSize && file.size <= blob.size && STORABLE_TYPES.includes(file.type)) {
            return readAsDataUrl(file);
        }
        return readAsDataUrl(blob);
    } finally {
        bitmap.close();
    }
};
