import { CSSProperties } from 'react';

// Flat color styles based on reference
export const colorStyles: Record<string, { bg: string; text: string; border: string }> = {
    // Root node style (Black)
    root: {
        bg: 'bg-[hsl(var(--node-black-bg))]',
        text: 'text-[hsl(var(--node-black-text))]',
        border: 'border-transparent'
    },
    // Default/Orange
    orange: {
        bg: 'bg-[hsl(var(--node-orange-bg))]',
        text: 'text-[hsl(var(--node-orange-text))]',
        border: 'border-[hsl(var(--node-orange-border))]'
    },
    amber: {
        bg: 'bg-[hsl(var(--node-orange-bg))]',
        text: 'text-[hsl(var(--node-orange-text))]',
        border: 'border-[hsl(var(--node-orange-border))]'
    },
    // Blue/Marketing
    blue: {
        bg: 'bg-[hsl(var(--node-blue-bg))]',
        text: 'text-[hsl(var(--node-blue-text))]',
        border: 'border-[hsl(var(--node-blue-border))]'
    },
    sky: {
        bg: 'bg-[hsl(var(--node-blue-bg))]',
        text: 'text-[hsl(var(--node-blue-text))]',
        border: 'border-[hsl(var(--node-blue-border))]'
    },
    // Cyan/Design
    cyan: {
        bg: 'bg-[hsl(var(--node-cyan-bg))]',
        text: 'text-[hsl(var(--node-cyan-text))]',
        border: 'border-[hsl(var(--node-cyan-border))]'
    },
    teal: {
        bg: 'bg-[hsl(var(--node-cyan-bg))]',
        text: 'text-[hsl(var(--node-cyan-text))]',
        border: 'border-[hsl(var(--node-cyan-border))]'
    },
    // Purple
    violet: {
        bg: 'bg-[hsl(var(--node-purple-bg))]',
        text: 'text-[hsl(var(--node-purple-text))]',
        border: 'border-[hsl(var(--node-purple-border))]'
    },
    purple: {
        bg: 'bg-[hsl(var(--node-purple-bg))]',
        text: 'text-[hsl(var(--node-purple-text))]',
        border: 'border-[hsl(var(--node-purple-border))]'
    },
    // Yellow/Support
    yellow: {
        bg: 'bg-[hsl(var(--node-yellow-bg))]',
        text: 'text-[hsl(var(--node-yellow-text))]',
        border: 'border-[hsl(var(--node-yellow-border))]'
    },
    rose: {
        bg: 'bg-[hsl(var(--node-yellow-bg))]',
        text: 'text-[hsl(var(--node-yellow-text))]',
        border: 'border-[hsl(var(--node-yellow-border))]'
    },
    // Grey/IT
    grey: {
        bg: 'bg-[hsl(var(--node-grey-bg))]',
        text: 'text-[hsl(var(--node-grey-text))]',
        border: 'border-[hsl(var(--node-grey-border))]'
    },
    emerald: {
        bg: 'bg-[hsl(var(--node-cyan-bg))]',
        text: 'text-[hsl(var(--node-cyan-text))]',
        border: 'border-[hsl(var(--node-cyan-border))]'
    },
    green: {
        bg: 'bg-[hsl(var(--node-cyan-bg))]',
        text: 'text-[hsl(var(--node-cyan-text))]',
        border: 'border-[hsl(var(--node-cyan-border))]'
    },
    red: {
        bg: 'bg-[hsl(var(--node-orange-bg))]',
        text: 'text-[hsl(var(--node-orange-text))]',
        border: 'border-[hsl(var(--node-orange-border))]'
    },
    pink: {
        bg: 'bg-[hsl(var(--node-purple-bg))]',
        text: 'text-[hsl(var(--node-purple-text))]',
        border: 'border-[hsl(var(--node-purple-border))]'
    },
};

// Shape styles with CSS classes and clip-path
// Shape styles with CSS classes and clip-path
export const getShapeStyles = (shape?: string, isRoot?: boolean): { className: string; style?: CSSProperties } => {
    // Default root to circle if not specified, otherwise default to rounded
    const effectiveShape = shape || (isRoot ? 'circle' : 'rounded');

    // Add prominence to root node regardless of shape
    const rootClass = isRoot ? 'shadow-lg' : '';

    switch (effectiveShape) {
        case 'rectangle':
            return { className: `rounded-none ${rootClass}`.trim() };
        case 'pill':
            return { className: `rounded-full px-6 ${rootClass}`.trim() };
        case 'diamond':
            return {
                className: `px-10 py-6 border-0 ${rootClass}`.trim(),
                style: {
                    minWidth: '100px',
                    minHeight: '100px'
                }
            };
        case 'hexagon':
            return {
                className: `px-10 py-6 border-0 ${rootClass}`.trim(),
                style: {
                    minWidth: '120px',
                    minHeight: '80px'
                }
            };
        case 'circle':
            return {
                // Maintain original larger size for root circle
                className: isRoot
                    ? 'rounded-full aspect-square flex items-center justify-center px-4 py-4 w-32 shadow-lg'
                    : `rounded-full aspect-square flex items-center justify-center min-w-[60px] min-h-[60px] ${rootClass}`.trim()
            };
        case 'parallelogram':
            return {
                className: `px-6 ${rootClass}`.trim(),
                style: { transform: 'skewX(-10deg)' }
            };
        case 'iso-cube': // Renaming isometric to iso-cube for clarity if needed, but keeping switch case
        case 'isometric': // Keep backward compatibility
            return {
                className: 'px-8 py-4 shadow-xl',
                style: {
                    transform: 'rotateX(55deg) rotateZ(-45deg)',
                    boxShadow: '-4px 4px 0px rgba(0,0,0,0.2), -8px 8px 10px rgba(0,0,0,0.1)',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.4)',
                }
            };
        case 'cloud':
            return {
                className: `px-10 py-6 border-0 ${rootClass}`.trim(),
                style: {
                    minWidth: '120px',
                    minHeight: '80px'
                }
            };
        case 'rounded':
        default:
            return { className: `rounded-lg ${rootClass}`.trim() };
    }
};
