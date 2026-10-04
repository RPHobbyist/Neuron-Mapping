/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

export const MAX_NODE_IMAGE_SIDE = 1600;
const WEBP_QUALITY = 0.85;

export const MAX_IMAGE_UPLOAD_SIZE = 25 * 1024 * 1024;

export const readAsDataUrl = (file: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read the file'));
    reader.readAsDataURL(file);
});

const encodeScaled = (picture: CanvasImageSource, width: number, height: number): { dataUrl: string; scaledDown: boolean } | null => {
    if (!width || !height) return null;
    const scale = Math.min(1, MAX_NODE_IMAGE_SIDE / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(picture, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL('image/webp', WEBP_QUALITY), scaledDown: scale < 1 };
};

export const prepareNodeImage = async (file: File): Promise<string> => {
    const original = await readAsDataUrl(file);
    if (file.type === 'image/gif') return original;

    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(file);
    } catch {
        return original;
    }
    try {
        const encoded = encodeScaled(bitmap, bitmap.width, bitmap.height);
        if (!encoded) return original;
        return encoded.scaledDown || encoded.dataUrl.length < original.length ? encoded.dataUrl : original;
    } finally {
        bitmap.close();
    }
};

export const imageFileIn = (files: FileList | null | undefined): File | undefined =>
    Array.from(files ?? []).find(file => file.type.startsWith('image/'));

export const isHttpsUrl = (text: string): boolean => {
    try {
        return new URL(text).protocol === 'https:';
    } catch {
        return false;
    }
};

const loadPicture = (url: string, forCopying: boolean): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const picture = new Image();
    if (forCopying) picture.crossOrigin = 'anonymous';
    picture.referrerPolicy = 'no-referrer';
    picture.onload = () => resolve(picture);
    picture.onerror = () => reject(new Error('No picture could be loaded from that address'));
    picture.src = url;
});

export interface PictureFromUrl {
    image: string;
    linked: boolean;
}

export const pictureFromUrl = async (url: string): Promise<PictureFromUrl> => {
    try {
        const picture = await loadPicture(url, true);
        const encoded = encodeScaled(picture, picture.naturalWidth, picture.naturalHeight);
        if (encoded) return { image: encoded.dataUrl, linked: false };
    } catch {
    }
    await loadPicture(url, false);
    return { image: url, linked: true };
};
