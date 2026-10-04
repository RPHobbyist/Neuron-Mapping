/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState, useRef, useEffect, useCallback, memo, Fragment } from 'react';
import { Plus, Minus, FileText, Flag, Check, CalendarDays } from 'lucide-react';
import { MindMapNode as NodeType, TextRun } from '@/types/mindmap';
import { cn } from '@/lib/utils';
import { NodeToolbar, TextFormatToolbar } from './NodeToolbar';
import { NodeTextEditor } from './NodeTextEditor';
import { TextLine, getNodeRichLines, getRunStyle, plainTextToLines } from '@/utils/richText';
import { colorStyles, getShapeStyles, getTextFormatStyles, statusOptions, priorityStyles } from '@/utils/nodeStyles';
import { iconMap } from '@/utils/iconLibrary';
import { sanitizeUrl, getContrastTextColor, releaseTextFocus } from '@/utils/common';
import { IRREGULAR_SHAPES, IRREGULAR_SHAPE_PATHS, SHAPE_SVG_INSET, scalePathToBox } from '@/utils/shapePaths';
import { formatDay, isOverdue, todayAsDay } from '@/utils/tasks';
import { tagColor } from '@/utils/tagColors';
import { RuleTone } from '@/utils/styleRules';

const RULE_TONE_CLASS: Record<RuleTone, string> = {
  done: 'outline outline-2 outline-offset-2 outline-green-500/80',
  overdue: 'outline outline-2 outline-offset-2 outline-red-500',
  urgent: 'outline outline-2 outline-offset-2 outline-orange-500/80',
};

const BADGE_CLASS = 'inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-[11px] font-medium leading-4 text-foreground ring-1 ring-inset ring-black/10';

const ProgressRing = ({ done, total }: { done: number; total: number }) => {
  const radius = 5;
  const length = 2 * Math.PI * radius;
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className="-rotate-90" aria-hidden="true">
      <circle cx="7" cy="7" r={radius} fill="none" stroke="currentColor" strokeOpacity={0.2} strokeWidth="2.5" />
      <circle
        cx="7" cy="7" r={radius} fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeDasharray={`${(done / total) * length} ${length}`}
      />
    </svg>
  );
};

const renderRuns = (line: TextLine) =>
  line.map((run, i) => <span key={i} style={getRunStyle(run)}>{run.text}</span>);

const AUTO_NODE_MAX_WIDTH = 320;

const measureNodeFootprint = (element: HTMLElement) => {
  const w = element.offsetWidth;
  const h = element.offsetHeight;
  const transform = getComputedStyle(element).transform;
  if (!transform || transform === 'none') return { w, h };

  const matrix = new DOMMatrixReadOnly(transform);
  const corners = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]
    .map(([x, y]) => matrix.transformPoint(new DOMPoint(x, y)));
  const xs = corners.map(p => p.x);
  const ys = corners.map(p => p.y);
  return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
};

const SNAKE_TRAIL = [
  { delay: 0, opacity: 1, width: 4 },
  { delay: 0.16, opacity: 0.55, width: 3.25 },
  { delay: 0.32, opacity: 0.3, width: 2.5 },
  { delay: 0.48, opacity: 0.12, width: 1.75 },
];

interface MindMapNodeProps {
  node: NodeType;
  isSelected: boolean;
  selectionCount?: number;
  onSelect: (e: React.MouseEvent, nodeId: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onTextChange: (id: string, text: string, textRuns?: TextRun[][]) => void;
  onTextCommit?: (id: string) => void;
  onCancelTextEdit?: (id: string, text: string, textRuns?: TextRun[][]) => void;
  onSizeChange?: (id: string, width: number, height: number) => void;
  onMeasureNode?: (id: string, width: number, height: number) => void;
  onAddChild: (id: string) => void;
  onRequestImage?: (id: string) => void;
  onRequestLink?: (id: string) => void;
  onRequestNotes?: (id: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
  onDragMove?: (id: string, clientX: number, clientY: number, altKey: boolean) => void;
  onDrop?: (id: string) => void;
  editTrigger?: number;
  getZoom: () => number;
  isLight?: boolean;
  isDimmed?: boolean;
  isHighlighted?: boolean;
  onAddIcon?: (id: string) => void;
  onToggleTask?: (id: string) => void;
  tasksDone?: number;
  tasksTotal?: number;
  numberLabel?: string;
  ruleTone?: RuleTone;
  onTagClick?: (tag: string) => void;
  activeTag?: string;
  hiddenCount?: number;
  onToggleCollapse?: (id: string) => void;
}

const MindMapNodeBase = ({
  node,
  isSelected,
  selectionCount,
  onSelect,
  onPositionChange,
  onTextChange,
  onTextCommit,
  onCancelTextEdit,
  onSizeChange,
  onMeasureNode,
  onAddChild,
  onRequestImage,
  onRequestLink,
  onRequestNotes,
  onDragStart,
  onDragEnd,
  onDragMove,
  onDrop,
  editTrigger,
  getZoom,
  isLight = false,
  isDimmed,
  isHighlighted,
  onAddIcon,
  onToggleTask,
  tasksDone,
  tasksTotal,
  numberLabel,
  ruleTone,
  onTagClick,
  activeTag,
  hiddenCount,
  onToggleCollapse,
}: MindMapNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; nodeX: number; nodeY: number } | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const [renderBox, setRenderBox] = useState<{ w: number; h: number } | null>(null);

  const editOriginalRef = useRef<{ text: string; textRuns?: TextRun[][] } | null>(null);
  const latestNodeRef = useRef(node);
  latestNodeRef.current = node;
  const startEditing = useCallback(() => {
    editOriginalRef.current = { text: latestNodeRef.current.text, textRuns: latestNodeRef.current.textRuns };
    setIsEditing(true);
  }, []);

  useEffect(() => {
    if (editTrigger !== undefined) {
      startEditing();
    }
  }, [editTrigger, startEditing]);

  useEffect(() => {
    if (!nodeRef.current || !onMeasureNode) return;

    const element = nodeRef.current;
    let pendingTimeout: ReturnType<typeof setTimeout> | null = null;

    const observer = new ResizeObserver(() => {
      const { w, h } = measureNodeFootprint(element);

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
  }, [node.id, node.shape, onMeasureNode, node.measuredWidth, node.measuredHeight, isDragging, isResizing]);

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
    onDragStart?.(node.id);
    onDragEnd?.();
    startEditing();
  };

  const handleTextChange = (text: string, textRuns: TextRun[][] | undefined) => {
    onTextChange(node.id, text, textRuns);
  };

  const didDragRef = useRef(false);
  const DRAG_THRESHOLD = 3;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    if (e.button !== 0) return;
    e.preventDefault();
    releaseTextFocus();

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
          onDragStart?.(node.id);
        }
      }

      const zoom = getZoom();
      const deltaX = totalDeltaX / zoom;
      const deltaY = totalDeltaY / zoom;
      onPositionChange(node.id, dragStartRef.current.nodeX + deltaX, dragStartRef.current.nodeY + deltaY);
      onDragMove?.(node.id, moveEvent.clientX, moveEvent.clientY, moveEvent.altKey);
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (didDragRef.current) {
        onDragEnd?.();
        onDrop?.(node.id);
      }
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

    onDragStart?.(node.id);
    const currentWidth = node.width || (nodeRef.current?.offsetWidth || 100);
    const currentHeight = node.height || (nodeRef.current?.offsetHeight || 40);

    resizeStartRef.current = { x: e.clientX, y: e.clientY, width: currentWidth, height: currentHeight };
    setIsResizing(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeStartRef.current) return;
      const zoom = getZoom();
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
  const textFormat = getTextFormatStyles(node, isRoot);
  const textLines: TextLine[] = getNodeRichLines(node) ?? plainTextToLines(node.text);
  const statusOption = node.status ? statusOptions.find(s => s.value === node.status) : undefined;
  const priorityStyle = node.priority ? priorityStyles[node.priority] : undefined;
  const effectiveShape = node.shape || (isRoot ? 'circle' : 'rounded');
  const overdue = isOverdue(node, todayAsDay());
  const hasProgress = !!tasksTotal;

  const contentClipPath = isIrregularShape && renderBox
    ? `path('${scalePathToBox(shapePath, renderBox.w, renderBox.h, SHAPE_SVG_INSET)}')`
    : undefined;

  const isIconOnly = node.icon && node.iconStyle === 'plain';

  return (
    <div
      className={cn(
        "absolute flex items-center justify-center cursor-pointer select-none transition-[opacity,filter] duration-500 ease-out",
        !isLight && "node-enter",
        isDimmed && "pointer-events-none opacity-30 blur-[2px]"
      )}
      data-node-id={node.id}
      data-selected={isSelected || undefined}
      data-rule-tone={ruleTone}
      style={{ left: node.x, top: node.y, transform: 'translate(-50%, -50%)', width: 'max-content', maxWidth: node.width ? undefined : AUTO_NODE_MAX_WIDTH }}
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
          ruleTone && !isIrregularShape && !isIconOnly && RULE_TONE_CLASS[ruleTone],
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
          {(priorityStyle || statusOption || node.dueDate || hasProgress) && (
            <div className={cn(
              'flex flex-wrap gap-1.5 mb-2',
              node.textAlign === 'left' ? 'justify-start' : node.textAlign === 'right' ? 'justify-end' : 'justify-center'
            )}>
              {priorityStyle && (
                <span className={BADGE_CLASS} title={`Priority: ${priorityStyle.label}`}>
                  <Flag className={cn('w-3 h-3 fill-current', priorityStyle.color)} />
                  {priorityStyle.label}
                </span>
              )}
              {statusOption && (
                <span className={BADGE_CLASS} title={`Status: ${statusOption.label}`}>
                  <statusOption.icon className={cn('w-3 h-3', statusOption.color)} />
                  {statusOption.label}
                </span>
              )}
              {hasProgress && (
                <span
                  className={BADGE_CLASS}
                  title={`${tasksDone} of ${tasksTotal} tasks below this topic are done`}
                  data-task-progress={`${tasksDone}/${tasksTotal}`}
                >
                  <span className={tasksDone === tasksTotal ? 'text-green-600' : 'text-blue-600'}>
                    <ProgressRing done={tasksDone ?? 0} total={tasksTotal!} />
                  </span>
                  {tasksDone}/{tasksTotal}
                </span>
              )}
              {node.dueDate && (
                <span
                  className={cn(BADGE_CLASS, overdue && 'bg-red-50 text-red-700 ring-red-300 dark:bg-red-950 dark:text-red-200')}
                  title={overdue ? `Overdue: was due ${formatDay(node.dueDate)}` : `Due ${formatDay(node.dueDate)}`}
                  data-due={overdue ? 'overdue' : 'due'}
                >
                  <CalendarDays className={cn('w-3 h-3', overdue ? 'text-red-600' : 'text-muted-foreground')} />
                  {formatDay(node.dueDate)}
                </span>
              )}
            </div>
          )}

          {isEditing ? (
            <NodeTextEditor
              initialLines={textLines}
              className={cn(isRoot && 'leading-tight', textFormat.className)}
              style={textFormat.style}
              onChange={handleTextChange}
              onDone={() => {
                setIsEditing(false);
                onTextCommit?.(node.id);
              }}
              onCancel={(changed) => {
                setIsEditing(false);
                const original = editOriginalRef.current;
                if (changed && original) onCancelTextEdit?.(node.id, original.text, original.textRuns);
              }}
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

              {(!node.icon || node.iconStyle !== 'plain') && (() => {
                const textClass = cn(
                  'self-stretch block break-words whitespace-pre-wrap text-inherit',
                  isRoot && 'leading-tight',
                  textFormat.className,
                  node.task === 'done' && 'line-through opacity-60'
                );
                const renderText = () => {
                  if (node.textList) {
                    const ListTag = node.textList === 'numbered' ? 'ol' : 'ul';
                    return (
                      <ListTag
                        className={cn(
                          textClass,
                          node.textList === 'numbered' ? 'list-decimal' : 'list-disc',
                          node.textAlign === 'left' ? 'list-outside pl-5' : 'list-inside'
                        )}
                        style={textFormat.style}
                      >
                        {textLines.filter(line => line.some(run => run.text.trim())).map((line, i) => (
                          <li key={i}>{renderRuns(line)}</li>
                        ))}
                      </ListTag>
                    );
                  }

                  return (
                    <span className={textClass} style={textFormat.style}>
                      {textLines.map((line, i) => (
                        <Fragment key={i}>
                          {i > 0 && '\n'}
                          {renderRuns(line)}
                        </Fragment>
                      ))}
                    </span>
                  );
                };
                const text = renderText();
                if (!node.task && !numberLabel) return text;
                const isDone = node.task === 'done';
                return (
                  <div className="self-stretch flex items-start gap-2">
                    {numberLabel && (
                      <span className="mt-px text-[0.85em] font-semibold tabular-nums opacity-60 flex-shrink-0" data-number={numberLabel}>
                        {numberLabel}
                      </span>
                    )}
                    {node.task && <button
                      type="button"
                      role="checkbox"
                      aria-checked={isDone}
                      aria-label={isDone ? 'Done; mark as to do' : 'To do; mark as done'}
                      className={cn(
                        'mt-0.5 w-4 h-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors',
                        isDone ? 'bg-green-600 border-green-600 text-white' : 'border-current bg-card/70 hover:bg-card'
                      )}
                      onMouseDown={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); onToggleTask?.(node.id); }}
                    >
                      {isDone && <Check className="w-3 h-3" strokeWidth={3.5} />}
                    </button>}
                    <div className="flex-1 min-w-0">{text}</div>
                  </div>
                );
              })()}


              {node.tags && node.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center mt-1">
                  {node.tags.slice(0, 3).map((tag, index) => {
                    const isActive = !!activeTag && activeTag.toLowerCase() === tag.toLowerCase();
                    return (
                      <button
                        key={index}
                        type="button"
                        className={cn(
                          'inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:text-foreground',
                          isActive && 'ring-1 ring-current text-foreground'
                        )}
                        title={isActive ? 'Stop highlighting this tag' : `Highlight every topic tagged #${tag}`}
                        aria-pressed={isActive}
                        onMouseDown={(e) => e.stopPropagation()}
                        onDoubleClick={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onTagClick?.(tag); }}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tagColor(tag) }} aria-hidden="true" />
                        #{tag}
                      </button>
                    );
                  })}
                  {node.tags.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{node.tags.length - 3}</span>
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
                    className="text-blue-500 hover:underline text-xs flex items-center gap-1 mt-1 bg-card/80 px-1.5 py-0.5 rounded"
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

      {isEditing && <TextFormatToolbar />}

      {isSelected && !isEditing && !isDragging && (selectionCount ?? 1) < 2 && (
        <NodeToolbar
          onAddImage={handleAddImage}
          onAddLink={handleAddLink}
          onAddNotes={() => onRequestNotes?.(node.id)}
          onAddIcon={() => onAddIcon?.(node.id)}
          hasIcon={!!node.icon}
          hasImage={!!node.image}
          hasLink={!!node.link}
        />
      )}

      {isSelected && !isEditing && (
        <button
          className={cn(
            'absolute -right-6 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full',
            'flex items-center justify-center text-background',
            'bg-muted-foreground hover:bg-foreground transition-colors',
            'shadow-sm'
          )}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }}
        >
          <Plus className="w-3 h-3" strokeWidth={3} />
        </button>
      )}

      {hiddenCount !== undefined && onToggleCollapse && !isEditing && (hiddenCount > 0 || isSelected) && (
        <button
          type="button"
          className={cn(
            'absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-20 h-5 min-w-5 px-1 rounded-full border shadow-sm',
            'flex items-center justify-center text-[10px] font-semibold leading-none tabular-nums transition-colors',
            hiddenCount > 0
              ? 'bg-foreground text-background border-foreground hover:bg-foreground/80'
              : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted'
          )}
          onMouseDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onToggleCollapse(node.id); }}
          title={hiddenCount > 0
            ? `Show the ${hiddenCount} hidden ${hiddenCount === 1 ? 'topic' : 'topics'} (Ctrl + .)`
            : 'Collapse this branch (Ctrl + .)'}
          aria-label={hiddenCount > 0 ? `Expand: ${hiddenCount} hidden` : 'Collapse this branch'}
          aria-expanded={hiddenCount === 0}
        >
          {hiddenCount > 0 ? `+${hiddenCount}` : <Minus className="w-3 h-3" strokeWidth={3} />}
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400 rotate-90">
            <path d="M21 3L3 21" />
            <path d="M15 3h6v6" />
            <path d="M9 21H3v-6" />
          </svg>
        </div>
      )}
    </div>
  );
};

export const MindMapNode = memo(MindMapNodeBase);
 