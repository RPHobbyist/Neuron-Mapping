import { useState, useRef, useEffect, memo } from 'react';
import { Plus, GripHorizontal, FileText } from 'lucide-react';
import { MindMapNode as NodeType } from '@/types/mindmap';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { NodeToolbar } from './NodeToolbar';
import { toast } from 'sonner';
import { colorStyles, getShapeStyles } from '@/utils/nodeStyles';
import { iconMap } from '@/utils/iconLibrary';
import { sanitizeUrl, getContrastTextColor } from '@/utils/common';

// Shapes rendered via a custom SVG path instead of the div's own box/background
const IRREGULAR_SHAPES = ['cloud', 'hexagon', 'diamond'];

const IRREGULAR_SHAPE_PATHS: Record<string, string> = {
  cloud: "M77.56,38.98 C75.01,19.57 63.65,5 50,5 C39.16,5 29.75,14.23 25.06,27.73 C13.78,29.53 5,43.87 5,61.25 C5,79.87 15.09,95 27.5,95 L76.25,95 C86.6,95 95,82.4 95,66.88 C95,52.03 87.31,39.99 77.56,38.98 Z",
  hexagon: "M25,5 L75,5 L95,50 L75,95 L25,95 L5,50 Z",
  diamond: "M41.52,13.49 Q50,5 58.49,13.49 L86.52,41.52 Q95,50 86.52,58.49 L58.49,86.52 Q50,95 41.52,86.52 L13.49,58.49 Q5,50 13.49,41.52 L41.52,13.49 Z",
};

// The snake border effect is a short bright "head" segment followed by
// progressively fainter, thinner copies riding the same dash animation
// with a small phase delay — since the delay is shorter than the dash
// length, the copies overlap and blend into a tapering comet-like tail
// instead of reading as a hard-edged block sliding around the border.
const SNAKE_TRAIL = [
  { delay: 0, opacity: 1, width: 4 },
  { delay: 0.16, opacity: 0.55, width: 3.25 },
  { delay: 0.32, opacity: 0.3, width: 2.5 },
  { delay: 0.48, opacity: 0.12, width: 1.75 },
];

interface MindMapNodeProps {
  node: NodeType;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent, nodeId: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onTextChange: (id: string, text: string) => void;
  onSizeChange?: (id: string, width: number, height: number) => void;
  onMeasureNode?: (id: string, width: number, height: number) => void;
  onAddChild: (id: string) => void;
  onRequestImage?: (id: string) => void;
  onRequestLink?: (id: string) => void;
  onRequestNotes?: (id: string) => void;
  onDragStart?: () => void;
  /** Bumped by the parent (e.g. on F2/Space) to force this node into edit mode. */
  editTrigger?: number;
  zoom: number;
  isDimmed?: boolean; // For focus mode - dims non-focused nodes
  isHighlighted?: boolean;
  onAddIcon?: (id: string) => void;
}

const MindMapNodeBase = ({
  node,
  isSelected,
  onSelect,
  onPositionChange,
  onTextChange,
  onSizeChange,
  onMeasureNode,
  onAddChild,
  onRequestImage,
  onRequestLink,
  onRequestNotes,
  onDragStart,
  editTrigger,
  zoom,
  isDimmed,
  isHighlighted,
  onAddIcon,
}: MindMapNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; nodeX: number; nodeY: number } | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Parent bumps editTrigger (e.g. on F2/Space) to request edit mode for
  // this specific node without the component tree needing to lift isEditing.
  useEffect(() => {
    if (editTrigger !== undefined) {
      setIsEditing(true);
    }
  }, [editTrigger]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      // Auto-height on mount
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  // Report measured size for auto-layout nodes. This is a passive layout
  // measurement, not a user edit, so it must never go through undo/redo
  // history — onMeasureNode routes to a history-exempt update.
  useEffect(() => {
    if (!nodeRef.current || !onMeasureNode) return;

    const element = nodeRef.current;
    let pendingTimeout: ReturnType<typeof setTimeout> | null = null;

    // Create observer
    const observer = new ResizeObserver(() => {
      // getBoundingClientRect is safer for total visible size than contentRect
      const rect = element.getBoundingClientRect();
      // Compensate for zoom scale to get logical (unscaled) size
      const w = rect.width / zoom;
      const h = rect.height / zoom;

      // Only update if significantly different (ignore sub-pixel noise)
      // AND if not currently dragging/resizing (to avoid conflict)
      if (!isDragging && !isResizing) {
        if (
          Math.abs(w - (node.measuredWidth || 0)) > 2 ||
          Math.abs(h - (node.measuredHeight || 0)) > 2
        ) {
          // Use a small timeout to debounce/defer state update
          // This prevents "ResizeObserver loop limit exceeded" and excessive renders
          if (pendingTimeout) clearTimeout(pendingTimeout);
          pendingTimeout = setTimeout(() => {
            onMeasureNode(node.id, w, h);
          }, 100);
        }
      }
    });

    observer.observe(element);
    return () => {
      observer.disconnect();
      if (pendingTimeout) clearTimeout(pendingTimeout);
    };
  }, [node.id, onMeasureNode, node.measuredWidth, node.measuredHeight, isDragging, isResizing, zoom]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDragStart?.(); // Save snapshot before text editing starts
    setIsEditing(true);
  };

  const handleBlur = () => setIsEditing(false);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
    }
    if (e.key === 'Escape') setIsEditing(false);
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
    onTextChange(node.id, target.value);
  };

  // Tracks whether the current mouse gesture actually moved past the drag
  // threshold. This is a ref (not state) so handleClick can read it
  // synchronously — React 18 can flush the isDragging state reset from the
  // native mouseup listener before the browser's trailing click event fires,
  // which otherwise makes every drag end by collapsing the selection.
  const didDragRef = useRef(false);
  const DRAG_THRESHOLD = 3; // px, in screen space

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    e.preventDefault();

    dragStartRef.current = { x: e.clientX, y: e.clientY, nodeX: node.x, nodeY: node.y };
    didDragRef.current = false;
    let snapshotSaved = false;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current) return;
      const totalDeltaX = moveEvent.clientX - dragStartRef.current.x;
      const totalDeltaY = moveEvent.clientY - dragStartRef.current.y;

      // Don't count as a drag (and don't push undo history) until the
      // pointer has actually moved — a plain click/select is not an edit.
      if (!didDragRef.current) {
        if (Math.hypot(totalDeltaX, totalDeltaY) < DRAG_THRESHOLD) return;
        didDragRef.current = true;
        setIsDragging(true);
        if (!snapshotSaved) {
          snapshotSaved = true;
          onDragStart?.();
        }
      }

      const deltaX = totalDeltaX / zoom;
      const deltaY = totalDeltaY / zoom;
      onPositionChange(node.id, dragStartRef.current.nodeX + deltaX, dragStartRef.current.nodeY + deltaY);
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Keep didDragRef true through the synchronous trailing click event;
      // clear it on the next tick so the next plain click isn't suppressed.
      setTimeout(() => { didDragRef.current = false; }, 0);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!didDragRef.current && !isResizing) onSelect(e, node.id);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    onDragStart?.();
    const currentWidth = node.width || (nodeRef.current?.offsetWidth || 100);
    const currentHeight = node.height || (nodeRef.current?.offsetHeight || 40);

    resizeStartRef.current = { x: e.clientX, y: e.clientY, width: currentWidth, height: currentHeight };
    setIsResizing(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeStartRef.current) return;
      const deltaX = (moveEvent.clientX - resizeStartRef.current.x) / zoom;
      const deltaY = (moveEvent.clientY - resizeStartRef.current.y) / zoom;
      const newWidth = Math.max(60, resizeStartRef.current.width + deltaX);
      const newHeight = Math.max(30, resizeStartRef.current.height + deltaY);
      onSizeChange?.(node.id, newWidth, newHeight);
    };

    const handleMouseUp = () => {
      resizeStartRef.current = null;
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleAddImage = () => {
    onRequestImage?.(node.id);
  };

  const handleAddLink = () => {
    onRequestLink?.(node.id);
  };

  const isRoot = node.parentId === null;
  const isCustomHex = node.color?.startsWith('#');
  const isIrregularShape = IRREGULAR_SHAPES.includes(node.shape || '');
  const shapePath = isIrregularShape ? IRREGULAR_SHAPE_PATHS[node.shape!] : '';

  // For custom hex colors, generate style object; for predefined names, use colorStyles
  const style = isRoot
    ? colorStyles.root
    : isCustomHex
      ? { bg: '', text: '', border: '' } // Custom colors use inline styles, not Tailwind classes
      : (colorStyles[node.color] || colorStyles.orange);

  // Custom inline styles for hex colors. Cloud/hexagon/diamond shapes get their
  // fill from the SVG path below, so skip the rectangular background/border here
  // or it paints over the shape's silhouette.
  const customColorStyle = isCustomHex ? {
    ...(isIrregularShape ? {} : { backgroundColor: node.color, borderColor: node.color }),
    color: getContrastTextColor(node.color!)
  } : undefined;

  const shapeStyles = getShapeStyles(node.shape, isRoot);
  const effectiveShape = node.shape || (isRoot ? 'circle' : 'rounded');

  const isIconOnly = node.icon && node.iconStyle === 'plain';

  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(10px)", scale: 0.9, translateX: "-50%", translateY: "-50%" }}
      animate={{
        opacity: isDimmed ? 0.3 : 1,
        filter: isDimmed ? "blur(2px)" : "blur(0px)",
        scale: 1,
        translateX: "-50%",
        translateY: "-50%"
      }}
      exit={{ opacity: 0, filter: "blur(10px)", scale: 0.9, translateX: "-50%", translateY: "-50%" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "absolute flex items-center justify-center cursor-pointer select-none",
        isDimmed && "pointer-events-none"
      )}
      style={{ left: node.x, top: node.y }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div
        ref={nodeRef}
        className={cn(
          'relative px-4 py-3 overflow-hidden transition-shadow',
          // Only apply standard node styles if NOT in icon-only mode
          !isIconOnly && [
            !isIrregularShape && 'border shadow-sm',
            !isIrregularShape && style.bg,
            !isIrregularShape && style.border,
            !isIrregularShape && 'hover:shadow-md',
            shapeStyles.className,
          ],
          style.text, // Text color for icon
          (isSelected && !isIrregularShape) && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
          isHighlighted && 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-background z-10 shadow-[0_0_15px_rgba(250,204,21,0.5)]',
          node.nodeAnimation === 'ring' && 'animate-ring',
          node.nodeAnimation === 'blink' && 'animate-blink',
          isIconOnly && "bg-transparent border-none shadow-none p-0" // Icon-only: no padding, no background
        )}
        style={{
          ...(!isIconOnly ? shapeStyles.style : {}),
          ...(!isIconOnly && node.width ? { width: node.width, minWidth: node.width } : {}),
          ...(!isIconOnly && node.height ? { height: node.height, minHeight: node.height } : {}),
          ...(!isIconOnly && customColorStyle ? customColorStyle : {}),
        }}
      >
        {/* Snake Animation Layer for Standard Shapes */}
        {node.nodeAnimation === 'snake' && !isIrregularShape && (
          <div className="absolute inset-0 z-0 pointer-events-none">
            <svg width="100%" height="100%" className="overflow-visible">
              {SNAKE_TRAIL.map(({ delay, opacity, width }, i) => (
                <rect
                  key={i}
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  rx={effectiveShape === 'pill' ? '999px' : effectiveShape === 'circle' ? '50%' : '8px'}
                  ry={effectiveShape === 'pill' ? '999px' : effectiveShape === 'circle' ? '50%' : '8px'}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={width}
                  strokeLinecap="round"
                  strokeOpacity={opacity}
                  pathLength="100"
                  className="animate-snake-stroke"
                  style={{
                    strokeDasharray: '14 86',
                    animationDelay: `${delay}s`,
                    filter: i === 0 ? 'drop-shadow(0 0 3px currentColor)' : undefined,
                  }}
                />
              ))}
            </svg>
          </div>
        )}

        {/* Unified SVG Background for Irregular Shapes (Cloud, Hexagon, Diamond) */}
        {isIrregularShape && (
          <div className="absolute inset-[-4px] z-0 pointer-events-none drop-shadow-sm">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              {/* Main Shape Path */}
              <path
                d={shapePath}
                fill={isCustomHex ? node.color : `hsl(var(--node-${node.color || 'orange'}-bg))`}
                stroke={isCustomHex ? node.color : `hsl(var(--node-${node.color || 'orange'}-border))`}
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
              />
              {/* Snake Animation Path (Irregular Shapes) */}
              {node.nodeAnimation === 'snake' && SNAKE_TRAIL.map(({ delay, opacity, width }, i) => (
                <path
                  key={i}
                  d={shapePath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={width + 1}
                  strokeLinecap="round"
                  strokeOpacity={opacity}
                  vectorEffect="non-scaling-stroke"
                  pathLength="100"
                  className="animate-snake-stroke"
                  style={{
                    strokeDasharray: '14 86',
                    animationDelay: `${delay}s`,
                    filter: i === 0 ? 'drop-shadow(0 0 3px currentColor)' : undefined,
                  }}
                />
              ))}
            </svg>
          </div>
        )}

        {/* Selection Ring (Shape-matched) — drawn in its own, larger-inset
            layer so it reads as an offset halo (like the ring-offset-2 used
            on regular shapes) instead of a border traced on the fill edge. */}
        {isIrregularShape && isSelected && (
          <div className="absolute inset-[-10px] z-0 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <path
                d={shapePath}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {/* Content Wrapper to stay above background animations */}
        <div className="relative z-10 w-full">
          {isEditing ? (
            <textarea
              ref={inputRef}
              value={node.text}
              onChange={handleInput}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className={cn(
                'w-full bg-transparent text-center font-medium outline-none min-w-[50px] resize-none overflow-hidden',
                isRoot ? 'text-white' : 'text-inherit'
              )}
              onClick={(e) => e.stopPropagation()}
              rows={1}
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              {/* Image Rendering */}
              {node.image && (
                <img
                  src={node.image}
                  alt="Node attachment"
                  className="w-full h-full object-cover rounded pointer-events-none"
                  draggable={false}
                />
              )}

              {/* Icon Rendering */}
              {node.icon && iconMap[node.icon] && (() => {
                const IconComponent = iconMap[node.icon];
                const isBoxed = node.iconStyle === 'boxed';
                const isPlain = node.iconStyle === 'plain';

                // Get icon color based on node color
                const iconColorClass = isBoxed
                  ? "text-primary"
                  : style.text || "text-current";

                // Calculate icon size - use node dimensions for plain icons, default for others
                const iconSize = isPlain && node.width
                  ? Math.min(node.width, node.height || node.width)
                  : 32; // Default 32px (w-8 h-8)

                return (
                  <div className={cn(
                    "flex items-center justify-center transition-all",
                    isBoxed ? "p-1 mb-1" : "",
                    !isPlain && "mb-1"
                  )}>
                    <IconComponent
                      className={cn("stroke-[1.5]", iconColorClass)}
                      style={{
                        width: iconSize,
                        height: iconSize
                      }}
                    />
                  </div>
                );
              })()}

              {/* Text Rendering - Hidden if strictly in "Icon Only" (plain) mode */}
              {(!node.icon || node.iconStyle !== 'plain') && (
                <span className={cn(
                  'text-center block font-medium break-words whitespace-pre-wrap',
                  isRoot ? 'text-white font-bold leading-tight' : 'text-inherit'
                )}>
                  {node.text}
                </span>
              )}

              {/* Priority Badge */}
              {node.priority && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full font-medium',
                  node.priority === 'high' ? 'bg-red-100 text-red-700' :
                    node.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                )}>
                  {node.priority === 'high' ? '🔴 High' : node.priority === 'medium' ? '🟡 Medium' : '🟢 Low'}
                </span>
              )}

              {/* Tags Display */}
              {node.tags && node.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center mt-1">
                  {node.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      #{tag}
                    </span>
                  ))}
                  {node.tags.length > 3 && (
                    <span className="text-xs text-gray-400">+{node.tags.length - 3}</span>
                  )}
                </div>
              )}

              {/* Link Rendering */}
              {node.link && sanitizeUrl(node.link) && (() => {
                const safeUrl = sanitizeUrl(node.link);
                return (
                  <a
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-xs flex items-center gap-1 mt-1 bg-white/80 px-1.5 py-0.5 rounded"
                    onClick={(e) => e.stopPropagation()}
                  >
                    🔗 {(() => {
                      try {
                        return new URL(safeUrl!).hostname.replace('www.', '');
                      } catch (e) {
                        return 'Link';
                      }
                    })()}
                  </a>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Notes Indicator Badge - shown whenever the node has notes attached */}
      {node.notes?.trim() && (
        <div
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-sm ring-2 ring-background pointer-events-none z-20"
          title="This node has notes"
        >
          <FileText className="w-3 h-3" strokeWidth={2.5} />
        </div>
      )}

      {/* Node Toolbar */}
      {isSelected && !isEditing && !isDragging && (
        <NodeToolbar
          onAddImage={handleAddImage}
          onAddLink={handleAddLink}
          onAddNotes={() => onRequestNotes?.(node.id)}
          onAddIcon={() => onAddIcon?.(node.id)}
        />
      )}

      {/* Simple Add button */}
      {isSelected && !isEditing && (
        <button
          className={cn(
            'absolute -right-6 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full',
            'flex items-center justify-center text-white',
            'bg-gray-400 hover:bg-gray-600 transition-colors',
            'shadow-sm'
          )}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }}
        >
          <Plus className="w-3 h-3" strokeWidth={3} />
        </button>
      )}

      {/* Resize Handle */}
      {isSelected && !isEditing && onSizeChange && (
        <div
          className={cn(
            'absolute -bottom-1.5 -right-1.5 w-5 h-5',
            'flex items-center justify-center',
            'cursor-nwse-resize',
            'hover:scale-110 transition-transform'
          )}
          onMouseDown={handleResizeMouseDown}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 rotate-90">
            <path d="M21 3L3 21" />
            <path d="M15 3h6v6" />
            <path d="M9 21H3v-6" />
          </svg>
        </div>
      )}
    </motion.div>
  );
};

export const MindMapNode = memo(MindMapNodeBase);
