import { useState, useRef, useEffect } from 'react';
import { ConnectionStyle, LineThickness, NodeColor, NodeShape, NodePriority, NodeAnimation } from '@/types/mindmap';
import { Spline, Minus, Equal, Bold, Palette, Type, Zap, GripHorizontal, ArrowRight, ArrowLeft, Activity, Shapes, AlertCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LineSettings {
    type?: ConnectionStyle;
    thickness?: LineThickness;
    color?: string;
    label?: string;
    animated?: boolean;
    gradient?: boolean;
    tension?: number;
    animationDirection?: 'forward' | 'reverse';
    animationType?: 'dash' | 'arrow' | 'cross';
}

export interface NodeSettings {
    color?: NodeColor;
    shape?: NodeShape;
    priority?: NodePriority;
    lineType?: ConnectionStyle;
    nodeAnimation?: NodeAnimation;
    icon?: string;
    iconStyle?: 'plain' | 'boxed';
}

interface PropertiesPanelProps {
    mode: 'line' | 'node';
    position?: { x: number; y: number };

    // Line Props
    lineValues?: LineSettings;
    onLineUpdate?: (updates: Partial<LineSettings>) => void;

    // Node Props
    nodeValues?: NodeSettings;
    onNodeUpdate?: (updates: Partial<NodeSettings>) => void;
    onDelete?: () => void;

    onClose: () => void;
    is3DMode?: boolean;
}

const lineTypes: { value: ConnectionStyle; label: string }[] = [
    { value: 'curved', label: 'Curve' },
    { value: 'orthogonal', label: 'Step' },
    { value: 'straight', label: 'Straight' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'dotted', label: 'Dotted' },
    { value: 'arrow', label: 'Arrow' },
];

const thicknessOptions: { value: LineThickness; label: string; icon: React.ReactNode }[] = [
    { value: 'thin', label: 'Thin', icon: <Minus className="w-4 h-4" /> },
    { value: 'medium', label: 'Medium', icon: <Equal className="w-4 h-4" /> },
    { value: 'thick', label: 'Thick', icon: <Bold className="w-4 h-4" /> },
];

const lineColorOptions = [
    '#f97316', '#3b82f6', '#14b8a6', '#a855f7', '#eab308',
    '#22c55e', '#ef4444', '#ec4899', '#6b7280', '#1a1a1a'
];

const nodeColorOptions: { color: NodeColor; label: string; class: string }[] = [
    { color: 'orange', label: 'Legal (Orange)', class: 'bg-[hsl(25,95%,60%)]' },
    { color: 'blue', label: 'Marketing (Blue)', class: 'bg-[hsl(210,95%,60%)]' },
    { color: 'cyan', label: 'Design (Cyan)', class: 'bg-[hsl(180,80%,45%)]' },
    { color: 'yellow', label: 'Support (Yellow)', class: 'bg-[hsl(45,95%,55%)]' },
    { color: 'grey', label: 'DevOps (Grey)', class: 'bg-[hsl(220,15%,60%)]' },
    { color: 'purple', label: 'Other (Purple)', class: 'bg-[hsl(270,80%,60%)]' },
];

const shapes: { value: NodeShape; label: string; icon: React.ReactNode }[] = [
    { value: 'rounded', label: 'Rounded', icon: <div className="w-4 h-3 rounded border-2 border-current" /> },
    { value: 'rectangle', label: 'Rectangle', icon: <div className="w-4 h-3 border-2 border-current" /> },
    { value: 'pill', label: 'Pill', icon: <div className="w-4 h-4 rounded-full border-2 border-current" /> },
    { value: 'circle', label: 'Circle', icon: <div className="w-5 h-3 rounded-full border-2 border-current" /> },
    { value: 'diamond', label: 'Diamond', icon: <div className="w-3 h-3 border-2 border-current rotate-45" /> },
    { value: 'hexagon', label: 'Hexagon', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" /></svg> },
    { value: 'parallelogram', label: 'Parallelogram', icon: <div className="w-4 h-3 border-2 border-current" style={{ transform: 'skewX(-10deg)' }} /> },
    { value: 'cloud', label: 'Cloud', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.132 20.177 10.244 17.819 10.041C17.433 6.643 14.535 4 11 4C7.027 4 3.737 6.913 3.111 10.822C1.332 11.458 0.003 13.113 0 15C0 17.618 2.003 19.78 4.606 19.996L17.5 19Z" /></svg> },
];

const priorities: { value: NodePriority; label: string }[] = [
    { value: 'high', label: '🔴 High' },
    { value: 'medium', label: '🟡 Medium' },
    { value: 'low', label: '🟢 Low' },
];

export const PropertiesPanel = ({
    mode,
    lineValues,
    onLineUpdate,
    nodeValues,
    onNodeUpdate,
    onDelete,
    onClose,
    is3DMode = false,
    position // Destructure position
}: PropertiesPanelProps) => {
    const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startPosX: dragPosition.x,
            startPosY: dragPosition.y,
        };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!dragRef.current) return;
            const deltaX = moveEvent.clientX - dragRef.current.startX;
            const deltaY = moveEvent.clientY - dragRef.current.startY;
            setDragPosition({
                x: dragRef.current.startPosX + deltaX,
                y: dragRef.current.startPosY + deltaY,
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            dragRef.current = null;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const renderLineContent = () => {
        if (!lineValues || !onLineUpdate) return null;

        return (
            <div className="space-y-3">
                {/* Line Type */}
                <div>
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5 block">Type</label>
                    <div className="grid grid-cols-3 gap-1">
                        {lineTypes.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => onLineUpdate({ type: type.value })}
                                className={cn(
                                    "px-2 py-1.5 text-xs rounded transition-all border",
                                    lineValues.type === type.value
                                        ? "bg-primary text-primary-foreground border-primary font-medium"
                                        : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                                )}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Thickness */}
                <div>
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1">
                        <Bold className="w-3 h-3" /> Thickness
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                        {thicknessOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => onLineUpdate({ thickness: opt.value })}
                                className={cn(
                                    "px-2 py-1.5 text-xs rounded flex items-center justify-center gap-1.5 transition-all border",
                                    (lineValues.thickness || 'medium') === opt.value
                                        ? "bg-primary text-primary-foreground border-primary font-medium"
                                        : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                                )}
                            >
                                {opt.icon} {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Color */}
                <div>
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1">
                        <Palette className="w-3 h-3" /> Color
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                        {lineColorOptions.map((color) => (
                            <button
                                key={color}
                                onClick={() => onLineUpdate({ color: color })}
                                className={cn(
                                    "w-6 h-6 rounded-full border transition-transform hover:scale-110",
                                    lineValues.color === color ? 'border-primary ring-2 ring-primary/30 ring-offset-1' : 'border-transparent ring-1 ring-border'
                                )}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                        <div className="relative">
                            <input
                                id="line-color-custom"
                                name="line-color-custom"
                                type="color"
                                value={lineValues.color || '#f97316'}
                                onChange={(e) => onLineUpdate({ color: e.target.value })}
                                className="w-6 h-6 rounded-full cursor-pointer opacity-0 absolute inset-0"
                                title="Custom color"
                            />
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 via-green-500 to-blue-500 border border-border" />
                        </div>
                    </div>
                </div>

                {/* Label & Animation */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                        <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1">
                            <Type className="w-3 h-3" /> Label
                        </label>
                        <input
                            id="line-label-input"
                            name="line-label"
                            type="text"
                            value={lineValues.label || ''}
                            onChange={(e) => onLineUpdate({ label: e.target.value })}
                            placeholder="Label..."
                            className="w-full px-2 py-1.5 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    <div className="col-span-2 space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Effect
                            </label>
                            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                                <input
                                    id="line-animated-checkbox"
                                    name="line-animated"
                                    type="checkbox"
                                    checked={lineValues.animated || false}
                                    onChange={(e) => onLineUpdate({ animated: e.target.checked })}
                                    className="rounded border-muted w-3.5 h-3.5 text-primary focus:ring-primary"
                                />
                                <span className={lineValues.animated ? "text-foreground" : "text-muted-foreground"}>Animated</span>
                            </label>
                        </div>

                        {lineValues.animated && (
                            <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                {/* Animation Style */}
                                <div className="flex gap-1 bg-muted/50 p-1 rounded-md border border-border/50">
                                    <button
                                        onClick={() => onLineUpdate({ animationType: 'dash' })}
                                        className={cn(
                                            "flex-1 flex items-center justify-center py-1 rounded text-[10px] transition-all",
                                            !lineValues.animationType || lineValues.animationType === 'dash'
                                                ? "bg-white shadow-sm text-primary font-medium"
                                                : "text-muted-foreground hover:bg-white/50"
                                        )}
                                        title="Flowing Dash"
                                    >
                                        <Activity className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => onLineUpdate({ animationType: 'arrow' })}
                                        className={cn(
                                            "flex-1 flex items-center justify-center py-1 rounded text-[10px] transition-all",
                                            lineValues.animationType === 'arrow'
                                                ? "bg-white shadow-sm text-primary font-medium"
                                                : "text-muted-foreground hover:bg-white/50"
                                        )}
                                        title="Moving Arrow"
                                    >
                                        <ArrowRight className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => onLineUpdate({ animationType: 'cross' })}
                                        className={cn(
                                            "flex-1 flex items-center justify-center py-1 rounded text-[10px] transition-all",
                                            lineValues.animationType === 'cross'
                                                ? "bg-white shadow-sm text-primary font-medium"
                                                : "text-muted-foreground hover:bg-white/50"
                                        )}
                                        title="Moving Cross"
                                    >
                                        ×
                                    </button>
                                </div>

                                {/* Direction */}
                                <div className="flex gap-1 bg-muted/50 p-1 rounded-md border border-border/50">
                                    <button
                                        onClick={() => onLineUpdate({ animationDirection: 'forward' })}
                                        className={cn(
                                            "flex-1 flex items-center justify-center py-0.5 px-1 rounded text-[10px] transition-all",
                                            !lineValues.animationDirection || lineValues.animationDirection === 'forward'
                                                ? "bg-white shadow-sm text-primary font-medium"
                                                : "text-muted-foreground hover:bg-white/50"
                                        )}
                                        title="Forward"
                                    >
                                        <ArrowRight className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => onLineUpdate({ animationDirection: 'reverse' })}
                                        className={cn(
                                            "flex-1 flex items-center justify-center py-0.5 px-1 rounded text-[10px] transition-all",
                                            lineValues.animationDirection === 'reverse'
                                                ? "bg-white shadow-sm text-primary font-medium"
                                                : "text-muted-foreground hover:bg-white/50"
                                        )}
                                        title="Reverse"
                                    >
                                        <ArrowLeft className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderNodeContent = () => {
        if (!nodeValues || !onNodeUpdate) return null;

        return (
            <div className="space-y-3">
                {/* Node Color */}
                <div>
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1">
                        <Palette className="w-3 h-3" /> Color
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                        {nodeColorOptions.map((opt) => (
                            <button
                                key={opt.color}
                                onClick={() => onNodeUpdate({ color: opt.color })}
                                className={cn(
                                    "w-6 h-6 rounded-full border transition-transform hover:scale-110",
                                    opt.class,
                                    nodeValues.color === opt.color ? 'border-primary ring-2 ring-primary/30 ring-offset-1' : 'border-transparent ring-1 ring-border'
                                )}
                                title={opt.label}
                            />
                        ))}
                        <div className="relative">
                            <input
                                id="node-color-custom"
                                name="node-color-custom"
                                type="color"
                                value={nodeValues.color?.startsWith('#') ? nodeValues.color : '#6366f1'}
                                onChange={(e) => {
                                    // Save the actual hex color value
                                    onNodeUpdate({ color: e.target.value as unknown as NodeColor });
                                }}
                                className="w-6 h-6 rounded-full cursor-pointer opacity-0 absolute inset-0"
                                title="Custom color"
                            />
                            <div
                                className="w-6 h-6 rounded-full border border-border"
                                style={{
                                    background: nodeValues.color?.startsWith('#')
                                        ? nodeValues.color
                                        : 'linear-gradient(135deg, #ef4444, #22c55e, #3b82f6)'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Node Shape - Hidden for icon-only nodes */}
                {!(nodeValues.icon && nodeValues.iconStyle === 'plain') && (
                    <div>
                        <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1">
                            <Shapes className="w-3 h-3" /> Shape
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                            {shapes.map((shape) => (
                                <button
                                    key={shape.value}
                                    onClick={() => onNodeUpdate({ shape: shape.value })}
                                    className={cn(
                                        "px-2 py-1.5 text-[10px] rounded flex items-center gap-1.5 transition-all border",
                                        nodeValues.shape === shape.value
                                            ? "bg-primary text-primary-foreground border-primary font-medium"
                                            : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                                    )}
                                >
                                    <span className="w-3 h-3 flex items-center justify-center flex-shrink-0">{shape.icon}</span>
                                    <span className="truncate">{shape.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Priority & Line Type */}
                <div className="space-y-3">
                    <div>
                        <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Priority
                        </label>
                        <div className="grid grid-cols-4 gap-1">
                            {priorities.map((p) => (
                                <button
                                    key={p.value}
                                    onClick={() => onNodeUpdate({ priority: p.value })}
                                    className={cn(
                                        "px-2 py-1.5 text-[10px] rounded transition-all border",
                                        nodeValues.priority === p.value
                                            ? "bg-primary text-primary-foreground border-primary font-medium"
                                            : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                                    )}
                                >
                                    {p.label.split(' ')[1]}
                                </button>
                            ))}
                            <button
                                onClick={() => onNodeUpdate({ priority: undefined })}
                                className={cn(
                                    "px-2 py-1.5 text-[10px] rounded transition-all border",
                                    !nodeValues.priority
                                        ? "bg-muted text-foreground border-muted-foreground/20 font-medium"
                                        : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                                )}
                            >
                                None
                            </button>
                        </div>
                    </div>

                    {/* Node Animation (New) */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Effect
                            </label>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                            {/* None Button */}
                            <button
                                onClick={() => onNodeUpdate({ nodeAnimation: undefined })}
                                className={cn(
                                    "px-2 py-1.5 text-[10px] rounded transition-all border",
                                    !nodeValues.nodeAnimation
                                        ? "bg-muted text-foreground border-muted-foreground/20 font-medium"
                                        : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                                )}
                            >
                                None
                            </button>

                            {/* Animation Options */}
                            {[
                                { value: 'ring', label: 'Ring' },
                                { value: 'snake', label: 'Snake' },
                                { value: 'blink', label: 'Blink' }
                            ].map((anim) => (
                                <button
                                    key={anim.value}
                                    onClick={() => onNodeUpdate({ nodeAnimation: anim.value as NodeAnimation })}
                                    className={cn(
                                        "px-2 py-1.5 text-[10px] rounded transition-all border",
                                        nodeValues.nodeAnimation === anim.value
                                            ? "bg-primary text-primary-foreground border-primary font-medium"
                                            : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                                    )}
                                >
                                    {anim.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Line Connection - Hide in 3D Mode */}
                    {!is3DMode && (
                        <div>
                            <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1">
                                <Spline className="w-3 h-3" /> Line Connection
                            </label>
                            <div className="grid grid-cols-3 gap-1">
                                {lineTypes.slice(0, 6).map((type) => ( // Show first 6 types
                                    <button
                                        key={type.value}
                                        onClick={() => onNodeUpdate({ lineType: type.value })}
                                        className={cn(
                                            "px-2 py-1.5 text-[10px] rounded transition-all border",
                                            nodeValues.lineType === type.value
                                                ? "bg-primary text-primary-foreground border-primary font-medium"
                                                : "bg-background hover:bg-muted text-muted-foreground border-transparent hover:border-border"
                                        )}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Delete Button */}
                {onDelete && (
                    <div className="pt-2">
                        <button
                            onClick={onDelete}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-transparent hover:border-destructive/20"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Delete Block
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            className="fixed bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border p-3 z-50 w-[300px]"
            style={{
                left: position ? `${position.x - 170 + dragPosition.x}px` : `calc(50% + ${dragPosition.x}px)`,
                top: position ? `${position.y - 100 + dragPosition.y}px` : undefined,
                bottom: position ? undefined : `calc(1rem - ${dragPosition.y}px)`,
                transform: position ? 'translateX(-100%)' : 'translateX(-50%)',
                cursor: isDragging ? 'grabbing' : 'default',
            }}
        >
            {/* Draggable header */}
            <div
                className="flex items-center justify-between mb-3 cursor-grab active:cursor-grabbing select-none border-b pb-2"
                onMouseDown={handleMouseDown}
            >
                <h3 className="font-semibold text-xs flex items-center gap-2 uppercase tracking-wide text-foreground/80">
                    <GripHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                    {mode === 'line' ? 'Line Properties' : 'Block Properties'}
                </h3>
                <button
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full w-5 h-5 flex items-center justify-center transition-all hover:rotate-90 duration-300"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    ×
                </button>
            </div>

            {mode === 'line' ? renderLineContent() : renderNodeContent()}
        </div>
    );
};
