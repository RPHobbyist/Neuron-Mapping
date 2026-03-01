import { useState, useRef, useEffect, memo } from 'react';
import { Plus, GripHorizontal } from 'lucide-react';
import { MindMapNode as NodeType } from '@/types/mindmap';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { NodeToolbar } from './NodeToolbar';
import { toast } from 'sonner';
import { colorStyles, getShapeStyles } from '@/utils/nodeStyles';
import { iconMap } from '@/utils/iconLibrary';
import { sanitizeUrl } from '@/utils/common';
import DOMPurify from 'dompurify';

interface MindMapNodeProps {
  node: NodeType;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent, nodeId: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onTextChange: (id: string, text: string) => void;
  onSizeChange?: (id: string, width: number, height: number) => void;
  onUpdateNode?: (id: string, data: Partial<NodeType>) => void;
  onAddChild: (id: string) => void;
  onRequestImage?: (id: string) => void;
  onRequestLink?: (id: string) => void;
  onRequestNotes?: (id: string) => void;
  onDragStart?: () => void;
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
  onUpdateNode,
  onAddChild,
  onRequestImage,
  onRequestLink,
  onRequestNotes,
  onDragStart,
  zoom,
  isDimmed,
  isHighlighted,
  onAddIcon,
}: MindMapNodeProps) => {
  // ... state ...
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; nodeX: number; nodeY: number } | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      // Auto-height on mount
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  // Report measured size for auto-layout nodes
  useEffect(() => {
    if (!nodeRef.current || !onUpdateNode) return;

    const element = nodeRef.current;

    // Create observer
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Add padding/border compensation if measuring content box
        // getBoundingClientRect is safer for total visible size
        const rect = element.getBoundingClientRect();
        // Fix: compensate for zoom scale to get logical size
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
            setTimeout(() => {
              onUpdateNode(node.id, { measuredWidth: w, measuredHeight: h });
            }, 100);
          }
        }
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [node.id, onUpdateNode, node.measuredWidth, node.measuredHeight, isDragging, isResizing, zoom]);

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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    e.preventDefault();

    onDragStart?.();
    dragStartRef.current = { x: e.clientX, y: e.clientY, nodeX: node.x, nodeY: node.y };
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current) return;
      const deltaX = (moveEvent.clientX - dragStartRef.current.x) / zoom;
      const deltaY = (moveEvent.clientY - dragStartRef.current.y) / zoom;
      onPositionChange(node.id, dragStartRef.current.nodeX + deltaX, dragStartRef.current.nodeY + deltaY);
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging && !isResizing) onSelect(e, node.id);
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

  // For custom hex colors, generate style object; for predefined names, use colorStyles
  const style = isRoot
    ? colorStyles.root
    : isCustomHex
      ? { bg: '', text: '', border: '' } // Custom colors use inline styles, not Tailwind classes
      : (colorStyles[node.color] || colorStyles.orange);

  // Custom inline styles for hex colors
  const customColorStyle = isCustomHex ? {
    backgroundColor: node.color,
    borderColor: node.color,
    color: '#ffffff' // White text on custom backgrounds
  } : undefined;

  const shapeStyles = getShapeStyles(node.shape, isRoot);

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
          'relative px-4 py-2 overflow-hidden transition-shadow',
          // Only apply standard node styles if NOT in icon-only mode
          !isIconOnly && [
            !['cloud', 'hexagon', 'diamond'].includes(node.shape || '') && 'border shadow-sm',
            !['cloud', 'hexagon', 'diamond'].includes(node.shape || '') && style.bg,
            !['cloud', 'hexagon', 'diamond'].includes(node.shape || '') && style.border,
            'hover:shadow-md',
            shapeStyles.className,
          ],
          style.text, // Text color for icon
          (isSelected && !['cloud', 'hexagon', 'diamond'].includes(node.shape || '')) && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
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
        {node.nodeAnimation === 'snake' && !['cloud', 'hexagon', 'diamond'].includes(node.shape || '') && (
          <div className="absolute inset-0 z-0 pointer-events-none">
            <svg width="100%" height="100%" className="overflow-visible">
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                rx={node.shape === 'pill' ? '999px' : node.shape === 'circle' ? '50%' : '8px'}
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                pathLength="100"
                className="animate-snake-stroke"
                style={{ strokeDasharray: '20 80' }}
              />
            </svg>
          </div>
        )}

        {/* Unified SVG Background for Irregular Shapes (Cloud, Hexagon, Diamond) */}
        {['cloud', 'hexagon', 'diamond'].includes(node.shape || '') && (
          <div className="absolute inset-[-4px] z-0 pointer-events-none drop-shadow-sm">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              {/* Main Shape Path */}
              <path
                d={
                  node.shape === 'cloud'
                    ? "M75,90 C85.4,90 95.8,80.7 95.8,69.2 C95.8,58.3 88.3,49.7 78.3,48.7 C76.7,33.1 64.6,21.1 49.8,21.1 C33.1,21.1 19.3,34.5 16.7,52.4 C9.2,55.3 3.6,62.9 3.6,71.6 C3.6,83.7 12.1,93.6 22.9,94.6 L75,90 Z"
                    : node.shape === 'hexagon'
                      ? "M25,5 L75,5 L95,50 L75,95 L25,95 L5,50 Z"
                      : "M50,5 L95,50 L50,95 L5,50 Z"
                }
                fill={isCustomHex ? node.color : `hsl(var(--node-${node.color || 'orange'}-bg))`}
                stroke={isCustomHex ? node.color : `hsl(var(--node-${node.color || 'orange'}-border))`}
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
              />
              {/* Snake Animation Path (Irregular Shapes) */}
              {node.nodeAnimation === 'snake' && (
                <path
                  d={
                    node.shape === 'cloud'
                      ? "M75,90 C85.4,90 95.8,80.7 95.8,69.2 C95.8,58.3 88.3,49.7 78.3,48.7 C76.7,33.1 64.6,21.1 49.8,21.1 C33.1,21.1 19.3,34.5 16.7,52.4 C9.2,55.3 3.6,62.9 3.6,71.6 C3.6,83.7 12.1,93.6 22.9,94.6 L75,90 Z"
                      : node.shape === 'hexagon'
                        ? "M25,5 L75,5 L95,50 L75,95 L25,95 L5,50 Z"
                        : "M50,5 L95,50 L50,95 L5,50 Z"
                  }
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  pathLength="100"
                  className="animate-snake-stroke"
                  style={{ strokeDasharray: '20 80' }}
                />
              )}
              {/* Selection Ring (Shape-matched) */}
              {isSelected && (
                <path
                  d={
                    node.shape === 'cloud'
                      ? "M75,90 C85.4,90 95.8,80.7 95.8,69.2 C95.8,58.3 88.3,49.7 78.3,48.7 C76.7,33.1 64.6,21.1 49.8,21.1 C33.1,21.1 19.3,34.5 16.7,52.4 C9.2,55.3 3.6,62.9 3.6,71.6 C3.6,83.7 12.1,93.6 22.9,94.6 L75,90 Z"
                      : node.shape === 'hexagon'
                        ? "M25,5 L75,5 L95,50 L75,95 L25,95 L5,50 Z"
                        : "M50,5 L95,50 L50,95 L5,50 Z"
                  }
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  className="opacity-40 animate-pulse"
                />
              )}
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
                    isBoxed ? "p-3 border-2 border-primary/20 bg-background/50 rounded-xl shadow-sm backdrop-blur-sm mb-1" : "",
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
              {node.link && sanitizeUrl(node.link) && (
                <a
                  href={sanitizeUrl(node.link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-xs flex items-center gap-1 mt-1 bg-white/80 px-1.5 py-0.5 rounded"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div onClick={(e) => {
                    e.preventDefault();
                    const safeUrl = sanitizeUrl(node.link);
                    if (safeUrl) window.open(safeUrl, '_blank');
                  }}>
                    🔗 {(() => {
                      try {
                        return new URL(node.link).hostname.replace('www.', '');
                      } catch (e) {
                        return 'Link';
                      }
                    })()}
                  </div>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

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
