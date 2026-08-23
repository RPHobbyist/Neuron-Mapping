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
import { IRREGULAR_SHAPES, IRREGULAR_SHAPE_PATHS, SHAPE_SVG_INSET, scalePathToBox } from '@/utils/shapePaths';

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
  onDragEnd?: () => void;
  editTrigger?: number;
  zoom: number;
  isDimmed?: boolean;
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
  onDragEnd,
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
  const [renderBox, setRenderBox] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (editTrigger !== undefined) {
      setIsEditing(true);
    }
  }, [editTrigger]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  useEffect(() => {
    if (!nodeRef.current || !onMeasureNode) return;

    const element = nodeRef.current;
    let pendingTimeout: ReturnType<typeof setTimeout> | null = null;

    const observer = new ResizeObserver(() => {
      const rect = element.getBoundingClientRect();
      const w = rect.width / zoom;
      const h = rect.height / zoom;

      if (!isDragging && !isResizing) {
        if (
          Math.abs(w - (node.measuredWidth || 0)) > 2 ||
          Math.abs(h - (node.measuredHeight || 0)) > 2
        ) {
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

  useEffect(() => {
    if (!nodeRef.current || !IRREGULAR_SHAPES.includes(node.shape || '')) {
      setRenderBox(null);
      return;
    }

    const element = nodeRef.current;
    const observer = new ResizeObserver(() => {
      setRenderBox({ w: element.offsetWidth, h: element.offsetHeight });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [node.shape]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDragStart?.();
    onDragEnd?.();
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

  const didDragRef = useRef(false);
  const DRAG_THRESHOLD = 3;

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
      if (didDragRef.current) onDragEnd?.();
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
      onDragEnd?.();
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

  const style = isCustomHex
    ? { bg: '', text: '', border: '' }
    : (colorStyles[node.color] || (isRoot ? colorStyles.root : colorStyles.orange));

  const customColorStyle = isCustomHex ? {
    ...(isIrregularShape ? {} : { backgroundColor: node.color, borderColor: node.color }),
    color: getContrastTextColor(node.color!)
  } : undefined;

  const shapeStyles = getShapeStyles(node.shape, isRoot);
  const effectiveShape = node.shape || (isRoot ? 'circle' : 'rounded');

  const contentClipPath = isIrregularShape && renderBox
    ? `path('${scalePathToBox(shapePath, renderBox.w, renderBox.h, SHAPE_SVG_INSET)}')`
    : undefined;

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
          !isIconOnly && [
            !isIrregularShape && 'border shadow-sm',
            !isIrregularShape && style.bg,
            !isIrregularShape && style.border,
            !isIrregularShape && 'hover:shadow-md',
            shapeStyles.className,
          ],
          style.text,
          (isSelected && !isIrregularShape) && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
          isHighlighted && 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-background z-10 shadow-[0_0_15px_rgba(250,204,21,0.5)]',
          node.nodeAnimation === 'ring' && 'animate-ring',
          node.nodeAnimation === 'blink' && 'animate-blink',
          isIconOnly && "bg-transparent border-none shadow-none p-0"
        )}
        style={{
          ...(!isIconOnly ? shapeStyles.style : {}),
          ...(!isIconOnly && node.width ? { width: node.width, minWidth: node.width } : {}),
          ...(!isIconOnly && node.height ? { height: node.height, minHeight: node.height } : {}),
          ...(!isIconOnly && customColorStyle ? customColorStyle : {}),
          ...(!isIconOnly && contentClipPath ? { clipPath: contentClipPath } : {}),
        }}
      >
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

        {isIrregularShape && (
          <div className="absolute inset-[-4px] z-0 pointer-events-none drop-shadow-sm">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <path
                d={shapePath}
                fill={isCustomHex ? node.color : `hsl(var(--node-${node.color === 'root' ? 'black' : (node.color || 'orange')}-bg))`}
                stroke={isSelected ? 'hsl(var(--primary))' : (isCustomHex ? node.color : `hsl(var(--node-${node.color === 'root' ? 'black' : (node.color || 'orange')}-border))`)}
                strokeWidth={isSelected ? '4' : '2.5'}
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
              />
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

        <div className="relative z-10 w-full">
          {isEditing ? (
            <textarea
              ref={inputRef}
              value={node.text}
              onChange={handleInput}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-center font-medium outline-none min-w-[50px] resize-none overflow-hidden text-inherit"
              onClick={(e) => e.stopPropagation()}
              rows={1}
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              {node.image && (
                <img
                  src={node.image}
                  alt="Node attachment"
                  className="w-full h-full object-cover rounded pointer-events-none"
                  draggable={false}
                  referrerPolicy="no-referrer"
                />
              )}

              {node.icon && iconMap[node.icon] && (() => {
                const IconComponent = iconMap[node.icon];
                const isBoxed = node.iconStyle === 'boxed';
                const isPlain = node.iconStyle === 'plain';

                const iconColorClass = isBoxed
                  ? "text-primary"
                  : (isCustomHex ? undefined : (style.text || "text-current"));
                const iconInlineColor = (!isBoxed && isPlain && isCustomHex) ? node.color : undefined;

                const iconSize = isPlain && node.width
                  ? Math.min(node.width, node.height || node.width)
                  : 32;

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
                        height: iconSize,
                        ...(iconInlineColor ? { color: iconInlineColor } : {})
                      }}
                    />
                  </div>
                );
              })()}

              {(!node.icon || node.iconStyle !== 'plain') && (
                <span className={cn(
                  'text-center block font-medium break-words whitespace-pre-wrap text-inherit',
                  isRoot && 'font-bold leading-tight'
                )}>
                  {node.text}
                </span>
              )}

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

      {node.notes?.trim() && (
        <div
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-sm ring-2 ring-background pointer-events-none z-20"
          title="This node has notes"
        >
          <FileText className="w-3 h-3" strokeWidth={2.5} />
        </div>
      )}

      {isSelected && !isEditing && !isDragging && (
        <NodeToolbar
          onAddImage={handleAddImage}
          onAddLink={handleAddLink}
          onAddNotes={() => onRequestNotes?.(node.id)}
          onAddIcon={() => onAddIcon?.(node.id)}
        />
      )}

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
 