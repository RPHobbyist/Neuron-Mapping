import { MindMapNode, ConnectionStyle, Drawing } from '@/types/mindmap';
import { z } from 'zod';
import { sanitizeUrl } from '@/utils/common';

const DrawingSchema = z.object({
    id: z.string(),
    points: z.array(z.object({
        x: z.number(),
        y: z.number(),
    })),
    color: z.string(),
});

const NodeSchema = z.object({
    // ... rest of schema
    id: z.string(),
    text: z.string(),
    x: z.number(),
    y: z.number(),
    color: z.string(),
    parentId: z.string().nullable(),
    shape: z.string().optional(),
    nodeAnimation: z.string().optional(),
    lineType: z.string().optional(),
    lineThickness: z.string().optional(),
    lineColor: z.string().optional(),
    lineLabel: z.string().optional(),
    lineAnimated: z.boolean().optional(),
    lineDouble: z.boolean().optional(),
    lineGradient: z.boolean().optional(),
    lineTension: z.number().optional(),
    lineAnimationDirection: z.string().optional(),
    lineAnimationType: z.string().optional(),
    relations: z.array(z.unknown()).optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    measuredWidth: z.number().optional(),
    measuredHeight: z.number().optional(),
    image: z.string().optional().transform(v => sanitizeUrl(v)),
    icon: z.string().optional(),
    iconStyle: z.string().optional(),
    link: z.string().optional().transform(v => sanitizeUrl(v)),
    notes: z.string().optional(),
    priority: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
});

const MindMapFileSchema = z.object({
    version: z.literal('1.0'),
    name: z.string(),
    nodes: z.array(NodeSchema),
    connectionStyle: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    drawings: z.array(DrawingSchema).optional(),
});

// File format for saving mind maps
export interface NeuronMindMapFile {
    version: '1.0';
    name: string;
    nodes: MindMapNode[];
    connectionStyle?: ConnectionStyle;
    createdAt: string;
    updatedAt: string;
    drawings?: Drawing[];
}

/**
 * Save mind map to a .nmm file (JSON format)
 */
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

/**
 * Load mind map from a .nmm file
 */
export const loadFromFile = (file: File): Promise<NeuronMindMapFile> => {
    return new Promise((resolve, reject) => {
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

/**
 * Export mind map canvas to high-quality PNG
 * Uses html-to-image library for better SVG support
 */
export const exportToPNG = async (
    element: HTMLElement,
    mapName: string
): Promise<void> => {
    try {
        const { toPng } = await import('html-to-image');

        const dataUrl = await toPng(element, {
            quality: 1.0,
            pixelRatio: 3, // 3x for higher quality
            backgroundColor: '#f9fafb',
            cacheBust: true,
            skipFonts: false, // Include fonts for proper text rendering
            style: {
                // Ensure consistent font rendering
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

/**
 * Export mind map canvas to high-quality PDF
 */
export const exportToPDF = async (
    element: HTMLElement,
    mapName: string
): Promise<void> => {
    try {
        const { toCanvas } = await import('html-to-image');
        const { jsPDF } = await import('jspdf');

        const canvas = await toCanvas(element, {
            pixelRatio: 3, // 3x for higher quality PDF
            backgroundColor: '#f9fafb',
            cacheBust: true,
            skipFonts: false, // Include fonts
            style: {
                fontFamily: 'system-ui, -apple-system, sans-serif',
            },
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        // Calculate PDF dimensions - use actual size for better quality
        const pdfWidth = imgWidth * 0.264583; // Convert pixels to mm (assuming 96 DPI)
        const pdfHeight = imgHeight * 0.264583;

        const pdf = new jsPDF({
            orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [pdfWidth, pdfHeight],
            compress: false, // No compression for quality
        });

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        pdf.save(`${mapName || 'mindmap'}.pdf`);
    } catch (error) {
        console.error('Export PDF error:', error);
        throw new Error('Failed to export PDF');
    }
};

/**
 * Generate a thumbnail image (Base64) from the canvas element
 */
export const generateThumbnail = async (
    element: HTMLElement
): Promise<string> => {
    try {
        const { toPng } = await import('html-to-image');

        const dataUrl = await toPng(element, {
            quality: 0.6,
            pixelRatio: 0.8, // Slightly lower resolution for thumbnails
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


