import { z } from 'zod';

import { MindMapNodeSchema as NodeSchema, DrawingSchema, ConnectionStyleSchema } from '@/lib/schemas';
import { MindMapNode, ConnectionStyle, Drawing } from '@/types/mindmap';

const MindMapFileSchema = z.object({
    version: z.literal('1.0'),
    name: z.string(),
    nodes: z.array(NodeSchema),
    connectionStyle: ConnectionStyleSchema.optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    drawings: z.array(DrawingSchema).optional(),
});

export interface NeuronMindMapFile {
    version: '1.0';
    name: string;
    nodes: MindMapNode[];
    connectionStyle?: ConnectionStyle;
    createdAt: string;
    updatedAt: string;
    drawings?: Drawing[];
}

export const saveToFile = (
    nodes: MindMapNode[],
    mapName: string,
    connectionStyle?: ConnectionStyle,
    drawings?: Drawing[]
): void => {
    const fileData: NeuronMindMapFile = {
        version: '1.0',
        name: mapName || 'Untitled Mind Map',
        nodes,
        connectionStyle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        drawings,
    };

    const blob = new Blob([JSON.stringify(fileData, null, 2)], {
        type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${mapName || 'mindmap'}.nmm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const loadFromFile = (file: File): Promise<NeuronMindMapFile> => {
    return new Promise((resolve, reject) => {
        if (file.size > 5 * 1024 * 1024) {
            reject(new Error('File exceeds the 5MB size limit.'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = JSON.parse(content);
                const data = MindMapFileSchema.parse(parsed) as NeuronMindMapFile;

                resolve(data);
            } catch (error) {
                reject(new Error('Failed to parse mind map file'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
};

export const exportToPNG = async (
    element: HTMLElement,
    mapName: string
): Promise<void> => {
    try {
        const { toPng } = await import('html-to-image');

        const dataUrl = await toPng(element, {
            quality: 1.0,
            pixelRatio: 3,
            backgroundColor: '#f9fafb',
            cacheBust: true,
            skipFonts: false,
            style: {
                fontFamily: 'system-ui, -apple-system, sans-serif',
            },
        });

        const link = document.createElement('a');
        link.download = `${mapName || 'mindmap'}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Export PNG error:', error);
        throw new Error('Failed to export PNG');
    }
};

export const exportToPDF = async (
    element: HTMLElement,
    mapName: string
): Promise<void> => {
    try {
        const { toCanvas } = await import('html-to-image');
        const { jsPDF } = await import('jspdf');

        const PIXEL_RATIO = 3;
        const canvas = await toCanvas(element, {
            pixelRatio: PIXEL_RATIO,
            backgroundColor: '#f9fafb',
            cacheBust: true,
            skipFonts: false,
            style: {
                fontFamily: 'system-ui, -apple-system, sans-serif',
            },
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        const pdfWidth = (imgWidth / PIXEL_RATIO) * 0.264583;
        const pdfHeight = (imgHeight / PIXEL_RATIO) * 0.264583;

        const pdf = new jsPDF({
            orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [pdfWidth, pdfHeight],
            compress: false,
        });

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        pdf.save(`${mapName || 'mindmap'}.pdf`);
    } catch (error) {
        console.error('Export PDF error:', error);
        throw new Error('Failed to export PDF');
    }
};

export const generateThumbnail = async (
    element: HTMLElement
): Promise<string> => {
    try {
        const { toPng } = await import('html-to-image');

        const dataUrl = await toPng(element, {
            quality: 0.6,
            pixelRatio: 0.8,
            backgroundColor: '#f9fafb',
            cacheBust: true,
            skipFonts: false,
            style: {
                fontFamily: 'system-ui, -apple-system, sans-serif',
            },
        });
        return dataUrl;
    } catch (error) {
        console.error('Thumbnail generation error:', error);
        return '';
    }
};


 