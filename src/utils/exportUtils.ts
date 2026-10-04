/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { MAX_MAP_FILE_SIZE } from '@/lib/constants';
import { FILE_FORMAT_VERSION, NeuronMindMapFile, parseMapFile } from '@/lib/mapDocument';
import { MindMapNode, ConnectionStyle, Drawing, BoxArea } from '@/types/mindmap';
import type { ContentBounds } from '@/utils/common';
import { parseNMM } from '@/utils/parsers/nmmParser';

export type { NeuronMindMapFile } from '@/lib/mapDocument';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n: number): string => String(n).padStart(2, '0');

export const buildExportFileName = (mapName: string, extension: string): string => {
    const now = new Date();
    const date = `${pad(now.getDate())}-${MONTHS[now.getMonth()]}-${now.getFullYear()}`;
    const hours = now.getHours();
    const time = `${pad(hours % 12 || 12)}.${pad(now.getMinutes())}${hours < 12 ? 'AM' : 'PM'}`;
    return `${toFileNamePart(mapName) || 'mindmap'}_${date}_${time}.${extension}`;
};

const toFileNamePart = (name: string): string =>
    name
        // eslint-disable-next-line no-control-regex
        .replace(/[\\/:*?"<>|\u0000-\u001F]/g, '-')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[. ]+$/, '')
        .slice(0, 100);

export const downloadBlob = (blob: Blob, fileName: string): void => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

export const saveToFile = (
    nodes: MindMapNode[],
    mapName: string,
    connectionStyle?: ConnectionStyle,
    drawings?: Drawing[],
    boxAreas?: BoxArea[]
): void => {
    const fileData: NeuronMindMapFile = {
        version: FILE_FORMAT_VERSION,
        name: mapName || 'Untitled Mind Map',
        nodes,
        connectionStyle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        drawings,
        boxAreas,
    };

    const blob = new Blob([JSON.stringify(fileData, null, 2)], {
        type: 'application/json',
    });
    downloadBlob(blob, buildExportFileName(mapName, 'nmm'));
};

export const loadFromFile = (file: File): Promise<NeuronMindMapFile> => {
    return new Promise((resolve, reject) => {
        if (file.size > MAX_MAP_FILE_SIZE) {
            reject(new Error(`File exceeds the ${MAX_MAP_FILE_SIZE / (1024 * 1024)}MB size limit.`));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            let parsed: unknown;
            try {
                parsed = JSON.parse(content);
            } catch {
                parsed = undefined;
            }
            try {
                const data = parseMapFile(parsed);
                if (data) {
                    resolve(data);
                    return;
                }
            } catch (error) {
                reject(error);
                return;
            }
            const nodes = parseNMM(content);
            if (nodes.length === 0) {
                reject(new Error('Failed to parse mind map file'));
                return;
            }
            const now = new Date().toISOString();
            resolve({
                version: FILE_FORMAT_VERSION,
                name: file.name.replace(/\.[^.]+$/, '').trim() || 'Untitled Mind Map',
                nodes,
                createdAt: now,
                updatedAt: now,
            });
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
};

const EXPORT_BACKGROUND = '#f9fafb';
const EXPORT_PADDING = 40;
const MAX_PIXEL_RATIO = 3;
const MAX_EXPORT_PIXELS = 64_000_000;
const MAX_EXPORT_SIDE = 16_384;
const UNREADABLE_PICTURE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export const exportPixelRatio = (width: number, height: number): number =>
    Math.min(MAX_PIXEL_RATIO, Math.sqrt(MAX_EXPORT_PIXELS / (width * height)), MAX_EXPORT_SIDE / width, MAX_EXPORT_SIDE / height);

const getWholeMapRenderOptions = (bounds: ContentBounds) => {
    const width = Math.ceil(bounds.maxX - bounds.minX + EXPORT_PADDING * 2);
    const height = Math.ceil(bounds.maxY - bounds.minY + EXPORT_PADDING * 2);
    const pixelRatio = exportPixelRatio(width, height);
    const left = `${EXPORT_PADDING - bounds.minX}px`;
    const top = `${EXPORT_PADDING - bounds.minY}px`;
    return {
        width,
        height,
        pixelRatio,
        backgroundColor: EXPORT_BACKGROUND,
        cacheBust: true,
        skipFonts: false,
        imagePlaceholder: UNREADABLE_PICTURE,
        style: {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            transform: 'none',
            left,
            top,
            insetInlineStart: left,
            insetBlockStart: top,
        },
    };
};

export interface PictureFrame {
    width: number;
    height: number;
    pixelRatio: number;
    view: { originX: number; originY: number; scale: number };
    background: string;
}

export type MapPicture = HTMLElement | ((frame: PictureFrame) => HTMLCanvasElement);

const wholeMapFrame = (bounds: ContentBounds, background = EXPORT_BACKGROUND): PictureFrame => {
    const { width, height, pixelRatio } = getWholeMapRenderOptions(bounds);
    return { width, height, pixelRatio, view: { originX: EXPORT_PADDING - bounds.minX, originY: EXPORT_PADDING - bounds.minY, scale: 1 }, background };
};

const renderCanvas = async (picture: MapPicture, bounds: ContentBounds): Promise<HTMLCanvasElement> => {
    if (typeof picture === 'function') return picture(wholeMapFrame(bounds));
    const { toCanvas } = await import('html-to-image');
    return toCanvas(picture, getWholeMapRenderOptions(bounds));
};

const canvasBlob = (canvas: HTMLCanvasElement): Promise<Blob> => new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('The map could not be drawn'))), 'image/png');
});

export const exportToPNG = async (
    picture: MapPicture,
    mapName: string,
    bounds: ContentBounds
): Promise<void> => {
    try {
        if (typeof picture === 'function') {
            downloadBlob(await canvasBlob(picture(wholeMapFrame(bounds))), buildExportFileName(mapName, 'png'));
            return;
        }
        const { toPng } = await import('html-to-image');

        const dataUrl = await toPng(picture, { ...getWholeMapRenderOptions(bounds), quality: 1.0 });

        const link = document.createElement('a');
        link.download = buildExportFileName(mapName, 'png');
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Export PNG error:', error);
        throw new Error('Failed to export PNG');
    }
};

export const renderPngBlob = async (picture: MapPicture, bounds: ContentBounds): Promise<Blob> => {
    if (typeof picture === 'function') return canvasBlob(picture(wholeMapFrame(bounds)));
    const { toBlob } = await import('html-to-image');
    const blob = await toBlob(picture, getWholeMapRenderOptions(bounds));
    if (!blob) throw new Error('The map could not be drawn');
    return blob;
};

export const canCopyImages = (): boolean =>
    typeof ClipboardItem !== 'undefined' && typeof navigator !== 'undefined' && !!navigator.clipboard?.write;

export const copyImageToClipboard = (image: Promise<Blob>): Promise<void> => {
    if (!canCopyImages()) {
        image.catch(() => {});
        return Promise.reject(new Error("This browser can't copy images. Export a PNG instead."));
    }
    return navigator.clipboard.write([new ClipboardItem({ 'image/png': image })]);
};

export class TooLargeForSvgError extends Error {}

export const exportToSVG = async (
    picture: MapPicture,
    mapName: string,
    bounds: ContentBounds
): Promise<void> => {
    if (typeof picture === 'function') throw new TooLargeForSvgError('This map is too large for SVG. Export it as PNG or PDF instead.');
    const element = picture;
    try {
        const { toSvg } = await import('html-to-image');
        const dataUrl = await toSvg(element, getWholeMapRenderOptions(bounds));
        const svg = decodeURIComponent(dataUrl.slice(dataUrl.indexOf(',') + 1));
        downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), buildExportFileName(mapName, 'svg'));
    } catch (error) {
        console.error('Export SVG error:', error);
        throw new Error('Failed to export SVG');
    }
};

export interface PdfLayout {
    page: 'fit' | 'a4' | 'letter';
    orientation: 'auto' | 'portrait' | 'landscape';
    scale: 'fit' | 'actual';
}

export const DEFAULT_PDF_LAYOUT: PdfLayout = { page: 'fit', orientation: 'auto', scale: 'fit' };

const MM_PER_CSS_PX = 25.4 / 96;
const PAPER_SIZES_MM: Record<Exclude<PdfLayout['page'], 'fit'>, [number, number]> = {
    a4: [210, 297],
    letter: [215.9, 279.4],
};
const PAGE_MARGIN_MM = 10;

const countTiles = (mapWidth: number, mapHeight: number, areaWidth: number, areaHeight: number) => ({
    columns: Math.max(1, Math.ceil(mapWidth / areaWidth - 1e-6)),
    rows: Math.max(1, Math.ceil(mapHeight / areaHeight - 1e-6)),
});

export const wholeMapSizeMm = (bounds: ContentBounds) => {
    const { width, height } = getWholeMapRenderOptions(bounds);
    return { width: width * MM_PER_CSS_PX, height: height * MM_PER_CSS_PX };
};

export interface PdfPagePlan {
    landscape: boolean;
    pageWidth: number;
    pageHeight: number;
    areaWidth: number;
    areaHeight: number;
    columns: number;
    rows: number;
}

export const planPdfPages = (mapWidth: number, mapHeight: number, layout: PdfLayout): PdfPagePlan => {
    if (layout.page === 'fit') {
        return { landscape: mapWidth > mapHeight, pageWidth: mapWidth, pageHeight: mapHeight, areaWidth: mapWidth, areaHeight: mapHeight, columns: 1, rows: 1 };
    }
    const [short, long] = PAPER_SIZES_MM[layout.page];
    const plan = (landscape: boolean): PdfPagePlan => {
        const [pageWidth, pageHeight] = landscape ? [long, short] : [short, long];
        const areaWidth = pageWidth - 2 * PAGE_MARGIN_MM;
        const areaHeight = pageHeight - 2 * PAGE_MARGIN_MM;
        const tiles = layout.scale === 'actual'
            ? countTiles(mapWidth, mapHeight, areaWidth, areaHeight)
            : { columns: 1, rows: 1 };
        return { landscape, pageWidth, pageHeight, areaWidth, areaHeight, ...tiles };
    };
    if (layout.orientation !== 'auto') return plan(layout.orientation === 'landscape');
    const [portrait, landscape] = [plan(false), plan(true)];
    const pages = (p: PdfPagePlan) => p.columns * p.rows;
    if (pages(portrait) !== pages(landscape)) return pages(landscape) < pages(portrait) ? landscape : portrait;
    return mapWidth > mapHeight ? landscape : portrait;
};

export const exportToPDF = async (
    picture: MapPicture,
    mapName: string,
    bounds: ContentBounds,
    layout: PdfLayout = DEFAULT_PDF_LAYOUT
): Promise<void> => {
    try {
        const { jsPDF } = await import('jspdf');
        const canvas = await renderCanvas(picture, bounds);

        const { width: mapWidth, height: mapHeight } = wholeMapSizeMm(bounds);
        const { landscape, pageWidth, pageHeight, areaWidth, areaHeight, columns, rows } = planPdfPages(mapWidth, mapHeight, layout);
        const orientation = landscape ? 'landscape' : 'portrait';

        if (layout.page === 'fit') {
            const pdf = new jsPDF({ orientation, unit: 'mm', format: [mapWidth, mapHeight], compress: false });
            pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, mapWidth, mapHeight, undefined, 'FAST');
            pdf.save(buildExportFileName(mapName, 'pdf'));
            return;
        }

        const pdf = new jsPDF({ orientation, unit: 'mm', format: layout.page, compress: false });

        if (layout.scale === 'fit') {
            const scale = Math.min(areaWidth / mapWidth, areaHeight / mapHeight);
            const width = mapWidth * scale;
            const height = mapHeight * scale;
            pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', (pageWidth - width) / 2, (pageHeight - height) / 2, width, height, undefined, 'FAST');
            pdf.save(buildExportFileName(mapName, 'pdf'));
            return;
        }

        const pxPerMm = canvas.width / mapWidth;
        const tile = document.createElement('canvas');
        const context = tile.getContext('2d');
        if (!context) throw new Error('Canvas is not available');
        for (let row = 0; row < rows; row++) {
            for (let column = 0; column < columns; column++) {
                const sx = column * areaWidth * pxPerMm;
                const sy = row * areaHeight * pxPerMm;
                const sw = Math.min(areaWidth * pxPerMm, canvas.width - sx);
                const sh = Math.min(areaHeight * pxPerMm, canvas.height - sy);
                tile.width = Math.ceil(sw);
                tile.height = Math.ceil(sh);
                context.fillStyle = EXPORT_BACKGROUND;
                context.fillRect(0, 0, tile.width, tile.height);
                context.drawImage(canvas, sx, sy, sw, sh, 0, 0, tile.width, tile.height);

                if (row > 0 || column > 0) pdf.addPage(layout.page, orientation);
                pdf.addImage(tile.toDataURL('image/png', 1.0), 'PNG', PAGE_MARGIN_MM, PAGE_MARGIN_MM, sw / pxPerMm, sh / pxPerMm, undefined, 'FAST');
                if (rows * columns > 1) {
                    pdf.setFontSize(8);
                    pdf.setTextColor(140);
                    pdf.text(`Page ${row * columns + column + 1} of ${rows * columns}: row ${row + 1}, column ${column + 1}`, PAGE_MARGIN_MM, pageHeight - PAGE_MARGIN_MM / 2);
                }
            }
        }
        pdf.save(buildExportFileName(mapName, 'pdf'));
    } catch (error) {
        console.error('Export PDF error:', error);
        throw new Error('Failed to export PDF');
    }
};

const THUMBNAIL_WIDTH = 480;
const THUMBNAIL_HEIGHT = 360;

export const generateThumbnail = async (
    picture: MapPicture,
    bounds: ContentBounds,
    background: string = EXPORT_BACKGROUND
): Promise<string> => {
    try {
        const options = { ...getWholeMapRenderOptions(bounds), backgroundColor: background };
        const scale = Math.min(THUMBNAIL_WIDTH / options.width, THUMBNAIL_HEIGHT / options.height, 1);
        if (typeof picture === 'function') {
            const whole = wholeMapFrame(bounds, background);
            return picture({
                width: THUMBNAIL_WIDTH,
                height: THUMBNAIL_HEIGHT,
                pixelRatio: 1,
                view: {
                    originX: (THUMBNAIL_WIDTH - options.width * scale) / 2 + whole.view.originX * scale,
                    originY: (THUMBNAIL_HEIGHT - options.height * scale) / 2 + whole.view.originY * scale,
                    scale,
                },
                background,
            }).toDataURL('image/webp', 0.8);
        }
        const element = picture;
        const { toCanvas } = await import('html-to-image');

        const map = await toCanvas(element, { ...options, pixelRatio: scale, skipFonts: true, cacheBust: false });

        const thumbnail = document.createElement('canvas');
        thumbnail.width = THUMBNAIL_WIDTH;
        thumbnail.height = THUMBNAIL_HEIGHT;
        const context = thumbnail.getContext('2d');
        if (!context) return '';
        context.fillStyle = background;
        context.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
        context.drawImage(map, (THUMBNAIL_WIDTH - map.width) / 2, (THUMBNAIL_HEIGHT - map.height) / 2);
        return thumbnail.toDataURL('image/webp', 0.8);
    } catch (error) {
        console.error('Thumbnail generation error:', error);
        return '';
    }
};


 