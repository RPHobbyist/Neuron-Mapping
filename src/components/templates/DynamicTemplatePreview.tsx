import { MindMapNode } from '@/types/mindmap';
import { useMemo } from 'react';

interface DynamicTemplatePreviewProps {
    nodes: MindMapNode[];
    animated?: boolean;
}

// Extended color mapping with gradients and fresher colors
const colorThemes: Record<string, { from: string; to: string; border: string; text: string; shadow: string }> = {
    teal: { from: '#f0fdfa', to: '#ccfbf1', border: '#14b8a6', text: '#0f766e', shadow: 'rgba(20, 184, 166, 0.15)' },
    purple: { from: '#faf5ff', to: '#f3e8ff', border: '#a855f7', text: '#7c3aed', shadow: 'rgba(168, 85, 247, 0.15)' },
    orange: { from: '#fff7ed', to: '#ffedd5', border: '#f97316', text: '#c2410c', shadow: 'rgba(249, 115, 22, 0.15)' },
    pink: { from: '#fdf2f8', to: '#fce7f3', border: '#ec4899', text: '#be185d', shadow: 'rgba(236, 72, 153, 0.15)' },
    blue: { from: '#eff6ff', to: '#dbeafe', border: '#3b82f6', text: '#1d4ed8', shadow: 'rgba(59, 130, 246, 0.15)' },
    green: { from: '#f0fdf4', to: '#dcfce7', border: '#22c55e', text: '#15803d', shadow: 'rgba(34, 197, 94, 0.15)' },
    yellow: { from: '#fefce8', to: '#fef3c7', border: '#eab308', text: '#a16207', shadow: 'rgba(234, 179, 8, 0.15)' },
    cyan: { from: '#ecfeff', to: '#cffafe', border: '#06b6d4', text: '#0e7490', shadow: 'rgba(6, 182, 212, 0.15)' },
    grey: { from: '#f9fafb', to: '#f3f4f6', border: '#6b7280', text: '#374151', shadow: 'rgba(107, 114, 128, 0.15)' },
    // Root node theme
    root: { from: '#1f2937', to: '#111827', border: '#374151', text: '#ffffff', shadow: 'rgba(0, 0, 0, 0.2)' },
};

export const DynamicTemplatePreview = ({ nodes, animated = false }: DynamicTemplatePreviewProps) => {
    // Memoize the calculation of bounds and layout
    const layout = useMemo(() => {
        if (!nodes || nodes.length === 0) return null;

        const xs = nodes.map(n => n.x);
        const ys = nodes.map(n => n.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const rangeX = maxX - minX || 1;
        const rangeY = maxY - minY || 1;

        // SVG dimensions
        const width = 320; // Increased resolution
        const height = 240;
        const padding = 40; // Increased padding

        // Compute scale to fit with padding
        const scaleX = (width - padding * 2) / rangeX;
        const scaleY = (height - padding * 2) / rangeY;
        const scale = Math.min(scaleX, scaleY, 0.6); // Higher max scale cap

        // Center calculation
        const svgCenterX = width / 2;
        const svgCenterY = height / 2;
        const contentCenterX = (minX + maxX) / 2;
        const contentCenterY = (minY + maxY) / 2;

        return {
            width,
            height,
            scale,
            offsetX: svgCenterX - contentCenterX * scale,
            offsetY: svgCenterY - contentCenterY * scale,
            nodeCount: nodes.length
        };
    }, [nodes]);

    if (!layout || !nodes.length) {
        return (
            <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg border border-dashed border-gray-300">
                <span className="text-xs text-gray-400">Empty</span>
            </div>
        );
    }

    const { width, height, scale, offsetX, offsetY, nodeCount } = layout;

    const normalizeX = (x: number) => x * scale + offsetX;
    const normalizeY = (y: number) => y * scale + offsetY;
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Dynamic sizing based on density
    const baseNodeWidth = nodeCount > 20 ? 40 : nodeCount > 10 ? 60 : 80;
    const baseNodeHeight = nodeCount > 20 ? 15 : nodeCount > 10 ? 25 : 32;
    const baseFontSize = nodeCount > 20 ? 6 : nodeCount > 10 ? 8 : 10;

    // Scale down dimensions slightly if total scale is very small
    const sizeMultiplier = scale < 0.3 ? 1.5 : 1;
    const nodeWidth = baseNodeWidth * sizeMultiplier;
    const nodeHeight = baseNodeHeight * sizeMultiplier;
    const fontSize = baseFontSize * sizeMultiplier;

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full select-none"
            preserveAspectRatio="xMidYMid meet"
        >
            <defs>
                {/* Create gradients for each color */}
                {Object.entries(colorThemes).map(([key, theme]) => (
                    <linearGradient key={key} id={`grad-${key}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={theme.from} />
                        <stop offset="100%" stopColor={theme.to} />
                    </linearGradient>
                ))}

                {/* Subtle drop shadow filter */}
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.08" />
                </filter>
            </defs>

            {/* Background (optional) */}
            <rect width="100%" height="100%" fill="#ffffff" opacity="0" />

            {/* Connections */}
            <g className="connections">
                {nodes.map(node => {
                    if (!node.parentId) return null;
                    const parent = nodeMap.get(node.parentId);
                    if (!parent) return null;

                    const x1 = normalizeX(parent.x);
                    const y1 = normalizeY(parent.y);
                    const x2 = normalizeX(node.x);
                    const y2 = normalizeY(node.y);

                    const theme = colorThemes[node.color] || colorThemes.grey;

                    // Simple curved path logic
                    const dx = x2 - x1;
                    const dy = y2 - y1;

                    // Control points for nice Bezier
                    const cp1x = x1 + dx * 0.5;
                    const cp1y = y1;
                    const cp2x = x2 - dx * 0.5;
                    const cp2y = y2;

                    // Adjust curve based on relative position (layout orientation detection could be better but this works for general cases)
                    const isVertical = Math.abs(dy) > Math.abs(dx) * 1.5;

                    let d = `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;
                    if (isVertical) {
                        d = `M ${x1} ${y1} C ${x1} ${y1 + dy * 0.5}, ${x2} ${y2 - dy * 0.5}, ${x2} ${y2}`;
                    }

                    return (
                        <path
                            key={`conn-${node.id}`}
                            d={d}
                            fill="none"
                            stroke={theme.border}
                            strokeWidth={scale < 0.4 ? 1.5 : 2}
                            strokeOpacity={0.4}
                            strokeLinecap="round"
                            className={animated ? "animate-draw" : ""}
                        />
                    );
                })}
            </g>

            {/* Nodes */}
            <g className="nodes">
                {nodes.map(node => {
                    const x = normalizeX(node.x);
                    const y = normalizeY(node.y);
                    const isRoot = !node.parentId;

                    // Use root theme for root node, otherwise use node color
                    const themeKey = isRoot ? 'root' : (colorThemes[node.color] ? node.color : 'grey');
                    const theme = colorThemes[themeKey];

                    const w = isRoot ? nodeWidth * 1.3 : nodeWidth;
                    const h = isRoot ? nodeHeight * 1.3 : nodeHeight;
                    const fs = isRoot ? fontSize * 1.2 : fontSize;
                    const r = h / 2; // Pill shape

                    // Text truncation
                    const charWidth = fs * 0.6;
                    const maxChars = Math.floor((w - 10) / charWidth);
                    const label = node.text.length > maxChars
                        ? node.text.substring(0, maxChars - 1) + '…'
                        : node.text;

                    return (
                        <g key={node.id} filter="url(#shadow)">
                            <rect
                                x={x - w / 2}
                                y={y - h / 2}
                                width={w}
                                height={h}
                                rx={r}
                                fill={isRoot ? theme.from : `url(#grad-${themeKey})`} // Solid for root, gradient for others
                                stroke={theme.border}
                                strokeWidth={isRoot ? 0 : 1}
                            />
                            <text
                                x={x}
                                y={y}
                                dy={fs * 0.35}
                                textAnchor="middle"
                                fontSize={fs}
                                fontWeight={isRoot ? 700 : 500}
                                fill={theme.text}
                                style={{ pointerEvents: 'none', fontFamily: 'Inter, sans-serif' }}
                            >
                                {label}
                            </text>
                        </g>
                    );
                })}
            </g>
        </svg>
    );
};
