/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useRef, useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { MindMapNode as NodeType, NodeColor, ConnectionStyle, Drawing, BoxArea, Side, TextRun, Viewport } from '@/types/mindmap';
import { MindMapNode } from './MindMapNode';
import { ConnectionLines, ConnectionHandles, ConnectionDots } from './ConnectionLines';
import { getEdgePoint } from '@/utils/nodeOutline';
import { useLineRouting } from './lineRouting';
import { CanvasOverviewLayer } from './CanvasOverviewLayer';
import { createColorResolver, drawMap, toNodeBoxes } from '@/utils/mapRenderer';
import { Box as MapBox, SpatialIndex } from '@/utils/spatialIndex';
import { SaveDialog } from './SaveDialog';
import { PdfExportDialog } from './PdfExportDialog';
import { FileUpload } from './FileUpload';
import { PresentationControls } from './PresentationControls';
import { GalaxyErrorBoundary } from './GalaxyErrorBoundary';
import { supportsWebGL } from '@/utils/webgl';
import { commonNodeSettings, nodeSettingsOf } from '@/utils/nodeSettings';
import { siblingsOf } from '@/utils/siblings';
import { addTag, allTags, commonTags, removeTag, sameTag } from '@/utils/tags';
import { hiddenCounts, hiddenNodeIds as collapsedHiddenIds } from '@/utils/collapse';
import { MAX_IMAGE_UPLOAD_SIZE, imageFileIn, prepareNodeImage } from '@/utils/imageUtils';
import { MAX_PASTED_TOPICS, parsePastedOutline } from '@/utils/parsers/pastedOutline';
import { toClipboardOutline } from '@/utils/exporters/clipboard';
import { withSmartText } from '@/utils/smartText';
import { NodeStyle, styleOf } from '@/utils/styleClipboard';
import { completedBranchIds, computeTaskProgress, taskSummary, todayAsDay } from '@/utils/tasks';
import { computeNumbering } from '@/utils/numbering';
import { ruleToneOf } from '@/utils/styleRules';
import { NotesPanel } from './NotesPanel';
import { OutlinePanel } from './OutlinePanel';
import { ZoomControls } from './ZoomControls';
import { DrawingTools } from './DrawingTools';
import {
  saveToFile, exportToPNG, exportToSVG, exportToPDF, generateThumbnail, renderPngBlob, copyImageToClipboard,
  canCopyImages, wholeMapSizeMm, PdfLayout, MapPicture, PictureFrame, TooLargeForSvgError,
} from '@/utils/exportUtils';
import { exportOutline, OUTLINE_FORMATS, OutlineFormat } from '@/utils/exporters';
import { ImportFileError, readImportFile } from '@/utils/importFile';
import { NodeActionDialog } from './NodeActionDialog';
import { useMindMapNodes } from '@/hooks/useMindMapNodes';
import { useAutoSave, clearAutoSave, mapSessionId, newSessionId } from '@/hooks/useAutoSave';
import { useMapPresence } from '@/hooks/useMapPresence';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import { clampZoom, FIT_PADDING, useCanvasViewport } from '@/hooks/useCanvasViewport';
import { belongsElsewhere, useCanvasKeyboard } from '@/hooks/useCanvasKeyboard';
import { DEFAULT_PEN, useDrawingTool } from '@/hooks/useDrawingTool';
import { useSelectionBox } from '@/hooks/useSelectionBox';
import { toast } from 'sonner';
import {
  Link, SquareCheck, Eye, EyeOff, Plus, CornerDownRight, ArrowUpFromLine, ArrowLeftFromLine, Copy, Pencil, FileText, Trash2,
  Paintbrush, PaintRoller, ClipboardPaste, Check, ArrowUp, ArrowDown, LayoutGrid, MousePointerClick, Crosshair, Focus,
  Maximize2, Minimize2, Map as MapIcon, Maximize, ZoomIn, ZoomOut, Box, Play, Keyboard, Save, ListPlus, FilePlus2, History,
  Image as ImageIcon, FileDown, ArrowLeft, ChevronRight, ListOrdered, Palette, Tag, ChevronsDownUp, ChevronsUpDown, ListTree,
} from 'lucide-react';
import { CommandPalette, PaletteMap } from './CommandPalette';
import { CanvasContextMenu, MenuSection } from './CanvasContextMenu';
import { Minimap } from './Minimap';
import { EditorCommand, pickCommands } from '@/lib/editorCommands';
import { CANVAS_SHORTCUTS, CanvasShortcutId } from '@/lib/shortcuts';
import { cn } from '@/lib/utils';
import { PropertiesPanel, LineSettings } from './LinePropertiesPanel';
import { MindMapToolbar } from './MindMapToolbar';
import { SnapshotPanel } from './SnapshotPanel';
import { usePlayMode } from '@/hooks/usePlayMode';
import { IconLibraryDialog } from './IconLibraryDialog';
import { SmartAddPanel } from './SmartAddPanel';
import { BoxAreaLayer, BoxAreaToolbar } from './BoxAreaLayer';
import { findBestParent } from '@/utils/smartPlacement';
import { LAYOUTS } from '@/utils/layoutUtils';
import { getArrowheadPointing, generateId, getContentBounds, getNodeDimensions, findRootNode, getDescendantIds, areNodesConnected, isRootNode, sanitizeImageUrl } from '@/utils/common';
import { DETACHED_PARENT_ID, BOX_AREA_COLORS, BOX_AREA_PADDING, BOX_AREA_LABEL_SPACE, BOX_AREA_DEFAULT_LABEL } from '@/lib/constants';

const GalaxyView = lazy(() => import('./GalaxyView').then(module => ({ default: module.GalaxyView })));

interface MindMapCanvasProps {
  initialNodes?: NodeType[];
  initialDrawings?: Drawing[];
  initialBoxAreas?: BoxArea[];
  initialViewport?: Viewport;
  onBack?: () => void;
  connectionStyle?: ConnectionStyle;
  onSave?: (name: string, nodes: NodeType[], thumbnail: string | undefined, connectionStyle: ConnectionStyle, drawings?: Drawing[], boxAreas?: BoxArea[], viewport?: Viewport) => void | Promise<string | void>;
  onNameChange?: (name: string) => void;
  mapName?: string;
  mapId?: string;
  templateId?: string;
  initiallyDirty?: boolean;
  sessionId?: string;
  savedMaps?: PaletteMap[];
  onOpenMap?: (id: string) => void;
}

const defaultNodes: NodeType[] = [
  { id: 'root', text: 'Product Launch\nChecklist', x: 0, y: 0, color: 'root' as NodeColor, parentId: null },
];

const NODES_MIME = 'application/x-neuron-mapping-nodes+json';

const TOOLBAR_HEIGHT = 56;
const MINIMAP_KEY = 'neuron-minimap';
const LIGHT_MAP_NODES = 300;
const CULL_MARGIN = 0.5;
const CULL_STEP = 256;
const OVERVIEW_NODES = 700;
const KEEP_SELECTED = 50;
const PAGE_PICTURE_NODES = 1500;
const STATUS_COLORS_KEY = 'neuron-status-colors';
const numberingKey = (mapId: string | undefined) => `neuron-numbering:${mapId ?? 'new'}`;

const readSetting = (key: string, fallback: boolean): boolean => {
  try {
    const stored = window.localStorage.getItem(key);
    return stored === null ? fallback : stored === 'on';
  } catch {
    return fallback;
  }
};
const writeSetting = (key: string, on: boolean) => {
  try {
    window.localStorage.setItem(key, on ? 'on' : 'off');
  } catch {
  }
};
const PRESENTATION_MAX_ZOOM = 1.25;

export const MindMapCanvas = ({
  initialNodes = defaultNodes,
  initialDrawings = [],
  initialBoxAreas = [],
  initialViewport,
  onBack,
  connectionStyle = 'orthogonal',
  onSave,
  onNameChange,
  mapName,
  mapId,
  templateId,
  initiallyDirty = false,
  sessionId: resumedSessionId,
  savedMaps,
  onOpenMap,
}: MindMapCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const copiedNodesRef = useRef<NodeType[] | null>(null);
  const [copiedStyle, setCopiedStyle] = useState<NodeStyle | null>(null);

  const {
    nodes, restoreFullState, undo, redo, canUndo, canRedo, checkpoint, cancelGesture, revision,
    selectedNodeIds, setSelectedNodeIds,
    selectedLineId, setSelectedLineId,
    addChildNode, addSiblingNode, moveAmongSiblings, insertParent, outdent, moveBranch, toggleCollapse, indentNode, outdentNode, expandAllBranches, collapseBranchesToLevel, expandTo, pasteNodes, graftBranch, addRelation, updateSelectedNodes, replaceSelectedNodes, updateSelectedTags, pinConnectionSides, unpinConnectionSides, pinConnectionSidesForNodes, updateNodePosition, replaceNodeText, applySmartText, replaceNode, updateNode, updateNodeMeasurement, updateNodeSize,
    deleteNode, deleteSelectedNodes, deleteRelation, reconnectRelation, reconnectParentLink, getParentLinkDropExclusions,
    connectionStyle: hookConnectionStyle, applyGlobalConnectionStyle, applyAutoLayout, applyBranchLayout,
    drawings, setDrawings, replaceDrawings,
    boxAreas, addBoxArea, updateBoxArea, replaceBoxArea, deleteBoxArea, moveBoxArea,
    selectedBoxAreaId, setSelectedBoxAreaId
  } = useMindMapNodes(initialNodes, connectionStyle, initialDrawings, initialBoxAreas);

  const taskProgress = useMemo(() => computeTaskProgress(nodes), [nodes]);
  const tasks = useMemo(() => taskSummary(nodes), [nodes]);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [hoistRootId, setHoistRootId] = useState<string | null>(null);
  const hoistedIds = useMemo(
    () => (hoistRootId && nodes.some(n => n.id === hoistRootId) ? getDescendantIds(hoistRootId, nodes) : null),
    [hoistRootId, nodes]
  );
  useEffect(() => {
    if (hoistRootId && !hoistedIds) setHoistRootId(null);
  }, [hoistRootId, hoistedIds]);
  const offCanvasIds = useMemo(() => {
    const hidden = collapsedHiddenIds(nodes);
    if (hideCompleted && tasks.done > 0) completedBranchIds(nodes).forEach(id => hidden.add(id));
    if (hoistedIds) nodes.forEach((n) => { if (!hoistedIds.has(n.id)) hidden.add(n.id); });
    return hidden.size > 0 ? hidden : null;
  }, [hideCompleted, tasks.done, hoistedIds, nodes]);
  const shownNodes = useMemo(() => (offCanvasIds ? nodes.filter(n => !offCanvasIds.has(n.id)) : nodes), [nodes, offCanvasIds]);
  const hiddenCountById = useMemo(() => hiddenCounts(nodes), [nodes]);

  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [renderAll, setRenderAll] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [showBranchImport, setShowBranchImport] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const notesCheckpointNodeRef = useRef<string | null>(null);
  const [focusRootIds, setFocusRootIds] = useState<Set<string> | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showSnapshotPanel, setShowSnapshotPanel] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [editTrigger, setEditTrigger] = useState<{ nodeId: string; token: number } | null>(null);
  useEffect(() => {
    if (editTrigger) setEditTrigger(null);
  }, [editTrigger]);

  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);

  const {
    isPlaying, isPaused, isFinished, visibleNodeIds, visibleLineIds, currentNodeId, currentStepIds, step: playStep, setStep: setPlayStep,
    startPlay, stopPlay, nextStep, previousStep, togglePause, speed, setSpeed, currentStep, totalSteps,
  } = usePlayMode(shownNodes);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    nodeId: string | null;
    type: 'image' | 'link' | null;
  }>({ isOpen: false, nodeId: null, type: null });

  const [showIconLibrary, setShowIconLibrary] = useState<{ isOpen: boolean, nodeId: string | null }>({ isOpen: false, nodeId: null });
  const [isSmartAddOpen, setIsSmartAddOpen] = useState(false);

  const [editingBoxAreaId, setEditingBoxAreaId] = useState<string | null>(null);

  const [lineDrag, setLineDrag] = useState<{
    connectionId: string;
    endpoint: 'from' | 'to';
    pos: { x: number, y: number };
    hoverNodeId: string | null;
  } | null>(null);

  useEffect(() => {
    if (!offCanvasIds) return;
    setSelectedNodeIds(prev => {
      const shown = new Set([...prev].filter(id => !offCanvasIds.has(id)));
      return shown.size === prev.size ? prev : shown;
    });
  }, [offCanvasIds, setSelectedNodeIds]);

  const {
    zoom, setZoom, pan, setPan, viewport, screenToCanvas, getScreenPos, fitToScreen, reveal, zoomIn, zoomOut, startPan, movePan, endPan,
  } = useCanvasViewport({
    canvasRef, contentRef, nodes: shownNodes, drawings: hoistedIds ? [] : drawings, boxAreas: hoistedIds ? [] : boxAreas, is3DMode, initialViewport,
  });

  const getMousePos = (e: React.MouseEvent) => screenToCanvas(e.clientX, e.clientY);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const getZoom = useCallback(() => zoomRef.current, []);
  const isLightMap = nodes.length >= LIGHT_MAP_NODES;

  const fittedHoistRef = useRef(hoistRootId);
  useEffect(() => {
    if (fittedHoistRef.current === hoistRootId) return;
    fittedHoistRef.current = hoistRootId;
    fitToScreen();
  }, [hoistRootId, fitToScreen]);

  const [showPalette, setShowPalette] = useState(false);
  const [isZen, setIsZen] = useState(false);
  const [showMinimap, setShowMinimap] = useState(() => {
    try {
      return window.localStorage.getItem(MINIMAP_KEY) !== 'hidden';
    } catch {
      return true;
    }
  });
  const toggleMinimap = () => {
    const next = !showMinimap;
    setShowMinimap(next);
    try {
      window.localStorage.setItem(MINIMAP_KEY, next ? 'shown' : 'hidden');
    } catch {
    }
  };
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setCanvasSize({ width: el.clientWidth, height: el.clientHeight }));
    observer.observe(el);
    return () => observer.disconnect();
  }, [is3DMode]);
  const [menuTarget, setMenuTarget] = useState<'node' | 'canvas'>('canvas');

  const [numbering, setNumbering] = useState(() => readSetting(numberingKey(mapId), false));
  const toggleNumbering = () => {
    writeSetting(numberingKey(mapId), !numbering);
    setNumbering(!numbering);
  };
  useEffect(() => {
    if (mapId && numbering) writeSetting(numberingKey(mapId), true);
  }, [mapId, numbering]);
  const numberLabels = useMemo(() => (numbering ? computeNumbering(nodes) : null), [numbering, nodes]);
  const [statusColors, setStatusColors] = useState(() => readSetting(STATUS_COLORS_KEY, true));
  const toggleStatusColors = () => {
    writeSetting(STATUS_COLORS_KEY, !statusColors);
    setStatusColors(!statusColors);
  };
  const today = todayAsDay();
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const [nodesToReveal, setNodesToReveal] = useState<string[] | null>(null);
  useEffect(() => {
    if (!nodesToReveal) return;
    const found = shownNodes.filter(n => nodesToReveal.includes(n.id));
    if (found.length === 0) return;
    setNodesToReveal(null);
    reveal(getContentBounds(found)!);
  }, [nodesToReveal, shownNodes, reveal]);

  const handleAddChild = useCallback((id: string) => {
    const newId = addChildNode(id);
    if (newId) setNodesToReveal([newId]);
  }, [addChildNode]);

  const createBoxArea = useCallback((rect: { x: number, y: number, width: number, height: number }) => {
    const id = generateId();
    addBoxArea({
      id,
      ...rect,
      label: BOX_AREA_DEFAULT_LABEL,
      color: BOX_AREA_COLORS[boxAreas.length % BOX_AREA_COLORS.length],
    });
    setSelectedNodeIds(new Set());
    setSelectedLineId(null);
    setIsPropertiesOpen(false);
    setSelectedBoxAreaId(id);
    setEditingBoxAreaId(id);
  }, [addBoxArea, boxAreas.length, setSelectedNodeIds, setSelectedLineId, setSelectedBoxAreaId]);

  const drawing = useDrawingTool({ zoom, setDrawings, replaceDrawings, checkpoint, onBoxDrawn: createBoxArea });
  const { drawingMode, setDrawingMode } = drawing;

  const selection = useSelectionBox({
    canvasRef,
    pan,
    zoom,
    nodes: shownNodes,
    onSelect: (ids) => {
      setSelectedNodeIds(ids);
      setIsPropertiesOpen(true);
    },
  });

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => toast.error("Full screen isn't available here"));
    }
  }, []);

  const startPresentation = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setSelectedNodeIds(new Set());
    setSelectedLineId(null);
    setSelectedBoxAreaId(null);
    setIsPropertiesOpen(false);
    setIsSmartAddOpen(false);
    setIsNotesOpen(false);
    setShowSnapshotPanel(false);
    setDrawingMode('none');
    startPlay();
  }, [setSelectedNodeIds, setSelectedLineId, setSelectedBoxAreaId, setDrawingMode, startPlay]);

  const exitPresentation = useCallback(() => {
    stopPlay();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, [stopPlay]);

  useEffect(() => {
    if (!isPlaying) return;
    if (isFinished) {
      fitToScreen();
      return;
    }
    const node = nodes.find(n => n.id === currentNodeId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!node || !rect) return;
    const parent = nodes.find(n => n.id === node.parentId);
    const stepNodes = currentStepIds.length > 1 ? nodes.filter(n => currentStepIds.includes(n.id)) : [node];
    const shown = parent ? [...stepNodes, parent] : stepNodes;
    const edges = shown.map((n) => {
      const { w, h } = getNodeDimensions(n);
      return { minX: n.x - w / 2, maxX: n.x + w / 2, minY: n.y - h / 2, maxY: n.y + h / 2 };
    });
    const minX = Math.min(...edges.map(e => e.minX));
    const maxX = Math.max(...edges.map(e => e.maxX));
    const minY = Math.min(...edges.map(e => e.minY));
    const maxY = Math.max(...edges.map(e => e.maxY));
    const nextZoom = clampZoom(Math.min(
      Math.max(rect.width - FIT_PADDING * 2, 1) / Math.max(maxX - minX, 1),
      Math.max(rect.height - FIT_PADDING * 2, 1) / Math.max(maxY - minY, 1),
      PRESENTATION_MAX_ZOOM
    ));
    setZoom(nextZoom);
    setPan({ x: -((minX + maxX) / 2) * nextZoom, y: -((minY + maxY) / 2) * nextZoom });
  }, [isPlaying, isFinished, currentNodeId, currentStepIds, nodes, fitToScreen, setZoom, setPan]);

  useEffect(() => {
    if (!isPlaying) return;
    const actions: Record<string, () => void> = {
      ArrowRight: nextStep, ArrowDown: nextStep, PageDown: nextStep, ' ': nextStep,
      ArrowLeft: previousStep, ArrowUp: previousStep, PageUp: previousStep,
      p: togglePause, P: togglePause,
      f: toggleFullscreen, F: toggleFullscreen,
      Escape: exitPresentation,
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
      if (e.key === ' ' && target?.closest('button')) return;
      const action = actions[e.key];
      if (!action) return;
      e.preventDefault();
      e.stopPropagation();
      action();
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isPlaying, nextStep, previousStep, togglePause, toggleFullscreen, exitPresentation]);

  const toggle3DMode = useCallback(() => {
    if (!is3DMode && !supportsWebGL()) {
      toast.error("The 3D view needs WebGL, which this browser has turned off or doesn't support.");
      return;
    }
    setIs3DMode(!is3DMode);
  }, [is3DMode]);

  useEffect(() => {
    if (!is3DMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], [role="menu"]')) return;
      if (isPropertiesOpen) {
        setIsPropertiesOpen(false);
        return;
      }
      setIs3DMode(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [is3DMode, isPropertiesOpen]);

  const nodeBoxes = useMemo(() => toNodeBoxes(shownNodes), [shownNodes]);
  const nodeIndex = useMemo(() => new SpatialIndex(nodeBoxes), [nodeBoxes]);

  const findNodeAtPosition = useCallback((pos: { x: number, y: number }, excludeIds: Set<string>) => {
    let topId: string | null = null;
    let topOrder = -1;
    nodeIndex.query({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y }).forEach(({ node, order }) => {
      if (!excludeIds.has(node.id) && order > topOrder) {
        topId = node.id;
        topOrder = order;
      }
    });
    return topId;
  }, [nodeIndex]);

  const lineDragRef = useRef<typeof lineDrag>(null);

  const handleEndpointDragStart = useCallback((connectionId: string, endpoint: 'from' | 'to', e: React.PointerEvent) => {
    const isRelation = connectionId.startsWith('rel::');
    const [parentId, childId] = connectionId.split('::');
    const startClientX = e.clientX;
    const startClientY = e.clientY;

    const excludeIds = isRelation
      ? new Set<string>()
      : getParentLinkDropExclusions(parentId, childId, endpoint);

    let didDrag = false;
    const DRAG_THRESHOLD = 3;

    const handleMove = (moveEvent: MouseEvent) => {
      if (!didDrag) {
        if (Math.hypot(moveEvent.clientX - startClientX, moveEvent.clientY - startClientY) < DRAG_THRESHOLD) return;
        didDrag = true;
        checkpoint();
      }

      const pos = screenToCanvas(moveEvent.clientX, moveEvent.clientY);
      const hoverNodeId = findNodeAtPosition(pos, excludeIds);
      const next = { connectionId, endpoint, pos, hoverNodeId };
      lineDragRef.current = next;
      setLineDrag(next);
    };

    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);

      const drag = lineDragRef.current;
      lineDragRef.current = null;
      setLineDrag(null);
      if (!didDrag || !drag) return;

      if (isRelation) {
        reconnectRelation(connectionId, endpoint, drag.hoverNodeId);
      } else {
        setSelectedLineId(reconnectParentLink(parentId, childId, endpoint, drag.hoverNodeId));
      }
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [checkpoint, screenToCanvas, findNodeAtPosition, getParentLinkDropExclusions, reconnectRelation, reconnectParentLink, setSelectedLineId]);

  const toggleFocusMode = useCallback(() => {
    if (isFocusMode) {
      setIsFocusMode(false);
      setFocusRootIds(null);
      toast.info("Focus mode off");
    } else {
      if (selectedNodeIds.size === 0) {
        toast.warning("Select a node to focus on its branch");
        return;
      }
      setFocusRootIds(new Set(selectedNodeIds));
      setIsFocusMode(true);
      toast.success("Focus mode on");
    }
  }, [isFocusMode, selectedNodeIds]);

  useEffect(() => {
    if (!focusRootIds) return;
    const remaining = new Set(nodes.filter(n => focusRootIds.has(n.id)).map(n => n.id));
    if (remaining.size === focusRootIds.size) return;
    if (remaining.size === 0) {
      setIsFocusMode(false);
      setFocusRootIds(null);
      toast.info("Focus mode ended: the focused node was removed");
    } else {
      setFocusRootIds(remaining);
    }
  }, [nodes, focusRootIds]);

  const focusedNodeIds = useMemo(() => {
    if (!isFocusMode || !focusRootIds) return null;
    const focused = new Set<string>();
    focusRootIds.forEach(id => {
      getDescendantIds(id, nodes).forEach(d => focused.add(d));
    });
    return focused;
  }, [isFocusMode, focusRootIds, nodes]);

  const [cleanRevision, setCleanRevision] = useState(() => (initiallyDirty ? -1 : 0));
  const [cleanName, setCleanName] = useState(() => mapName ?? '');
  const isDirty = revision !== cleanRevision || (mapName ?? '') !== cleanName;
  const revisionRef = useRef(revision);
  revisionRef.current = revision;

  const [draftSessionId] = useState(() => (resumedSessionId?.startsWith('new:') ? resumedSessionId : newSessionId()));
  const sessionId = mapId ? mapSessionId(mapId) : draftSessionId;
  useAutoSave(nodes, hookConnectionStyle, drawings, boxAreas, { enabled: isDirty, sessionId, mapId, name: mapName, templateId, viewport });
  const announceSave = useMapPresence(mapId);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleAddBoxArea = useCallback(() => {
    if (drawingMode === 'box') {
      setDrawingMode('none');
      return;
    }

    const selected = nodes.filter(n => selectedNodeIds.has(n.id));
    if (selected.length === 0) {
      setDrawingMode('box');
      toast.info("Drag on the canvas to draw a box area");
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selected.forEach(n => {
      const { w, h } = getNodeDimensions(n);
      minX = Math.min(minX, n.x - w / 2);
      maxX = Math.max(maxX, n.x + w / 2);
      minY = Math.min(minY, n.y - h / 2);
      maxY = Math.max(maxY, n.y + h / 2);
    });

    const top = minY - BOX_AREA_PADDING - BOX_AREA_LABEL_SPACE;
    createBoxArea({
      x: minX - BOX_AREA_PADDING,
      y: top,
      width: maxX - minX + BOX_AREA_PADDING * 2,
      height: maxY + BOX_AREA_PADDING - top,
    });
  }, [drawingMode, setDrawingMode, nodes, selectedNodeIds, createBoxArea]);

  const handleSelectBoxArea = useCallback((id: string) => {
    setSelectedBoxAreaId(id);
    setSelectedNodeIds(new Set());
    setSelectedLineId(null);
    setIsPropertiesOpen(false);
  }, [setSelectedBoxAreaId, setSelectedNodeIds, setSelectedLineId]);

  const handleRenameBoxArea = useCallback((id: string, label: string) => {
    updateBoxArea(id, { label });
  }, [updateBoxArea]);

  const handleEndBoxAreaEdit = useCallback(() => setEditingBoxAreaId(null), []);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) return;
    if (drawing.isActive) {
      drawing.start(getMousePos(e));
      return;
    }

    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-area')) {
      setIsPropertiesOpen(false);
      setSelectedBoxAreaId(null);

      if (e.shiftKey) {
        selection.start(e.clientX, e.clientY);
      } else {
        setSelectedNodeIds(new Set());
        setSelectedLineId(null);
        startPan(e.clientX, e.clientY);
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (drawing.isActive) {
      drawing.move(getMousePos(e));
      return;
    }
    if (!selection.update(e.clientX, e.clientY)) movePan(e.clientX, e.clientY);
  };

  const handleCanvasMouseUp = () => {
    if (drawing.end()) return;
    selection.end();
    endPan();
  };

  const withoutSelection = async <T,>(capture: () => Promise<T>, { lightTheme = false } = {}): Promise<T> => {
    const previousSelection = { nodes: selectedNodeIds, line: selectedLineId, box: selectedBoxAreaId };
    const content = contentRef.current;
    if (!drawsPictures) setRenderAll(true);
    setSelectedNodeIds(new Set());
    setSelectedLineId(null);
    setSelectedBoxAreaId(null);
    if (lightTheme) content?.classList.add('export-light');
    try {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return await capture();
    } finally {
      content?.classList.remove('export-light');
      setRenderAll(false);
      setSelectedNodeIds(previousSelection.nodes);
      setSelectedLineId(previousSelection.line);
      setSelectedBoxAreaId(previousSelection.box);
    }
  };

  const captureThumbnail = async (): Promise<string | undefined> => {
    const content = contentRef.current;
    const bounds = getContentBounds(shownNodes, drawings, boxAreas);
    if (!content || !bounds) return undefined;
    const canvasColor = getComputedStyle(content).getPropertyValue('--canvas-bg').trim().split(/\s+/).join(', ');
    return (await withoutSelection(() => generateThumbnail(mapPicture(content), bounds, canvasColor ? `hsl(${canvasColor})` : undefined))) || undefined;
  };

  const isSavingRef = useRef(false);
  const handleSave = async (name: string) => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);
    const savedRevision = revision;
    try {
      const thumbnail = await captureThumbnail();
      const savedId = await onSave?.(name, nodes, thumbnail, hookConnectionStyle, drawings, boxAreas, viewport);
      setCleanRevision(savedRevision);
      setCleanName(name);
      const savedSessionId = typeof savedId === 'string' ? mapSessionId(savedId) : sessionId;
      if (savedSessionId !== sessionId) await clearAutoSave(sessionId);
      if (revisionRef.current === savedRevision) await clearAutoSave(savedSessionId);
      announceSave();
      toast.success(`Saved "${name}"`);
      setShowSaveDialog(false);
    } catch (e) {
      console.error('Save failed:', e);
      toast.error('Failed to save. Your browser storage may be full.');
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const saveMap = () => (mapId ? handleSave(mapName || 'Untitled') : setShowSaveDialog(true));

  const handleGlobalStyleChange = useCallback((style: ConnectionStyle) => {
    applyGlobalConnectionStyle(style);
    toast.success(`Applied ${style} style to all lines`);
  }, [applyGlobalConnectionStyle]);

  const handleExportToFile = () => {
    try {
      saveToFile(nodes, mapName || 'mindmap', hookConnectionStyle, drawings, boxAreas);
      toast.success('Map saved as a file');
    } catch {
      toast.error('Failed to save file');
    }
  };

  const exportWholeMap = async (format: 'PNG' | 'SVG' | 'PDF', pdfLayout?: PdfLayout) => {
    const bounds = getContentBounds(shownNodes, drawings, boxAreas);
    const content = contentRef.current;
    if (!content || !bounds) {
      toast.error('Switch to 2D view to export images');
      return;
    }
    setIsExporting(true);
    try {
      const name = mapName || 'mindmap';
      await withoutSelection(() => (
        format === 'PNG' ? exportToPNG(mapPicture(content), name, bounds)
          : format === 'SVG' ? exportToSVG(mapPicture(content), name, bounds)
          : exportToPDF(mapPicture(content), name, bounds, pdfLayout)
      ), { lightTheme: true });
      toast.success(`Exported as ${format}`);
    } catch (e) {
      toast.error(e instanceof TooLargeForSvgError ? e.message : `Failed to export ${format}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPNG = () => exportWholeMap('PNG');
  const handleExportSVG = () => exportWholeMap('SVG');
  const handleExportPDF = () => setShowPdfDialog(true);

  const handleCopyImage = () => {
    const bounds = getContentBounds(shownNodes, drawings, boxAreas);
    const content = contentRef.current;
    if (!content || !bounds) {
      toast.error('Switch to 2D view to copy the map as an image');
      return;
    }
    setIsExporting(true);
    copyImageToClipboard(withoutSelection(() => renderPngBlob(mapPicture(content), bounds), { lightTheme: true }))
      .then(() => toast.success('Map copied as an image'))
      .catch((e) => {
        console.error('Copy image failed:', e);
        toast.error(canCopyImages() ? 'Failed to copy the image' : String(e instanceof Error ? e.message : e));
      })
      .finally(() => setIsExporting(false));
  };

  const singleSelectedNode = selectedNodeIds.size === 1 ? nodes.find(n => selectedNodeIds.has(n.id)) : undefined;

  const addAsBranch = (imported: NodeType[], isMapFile: boolean, source: string, targetId?: string): boolean => {
    const selectedId = selectedNodeIds.size === 1 ? [...selectedNodeIds][0] : undefined;
    const target = nodes.find(n => n.id === (targetId ?? selectedId)) ?? findRootNode(nodes);
    if (!target) {
      toast.error('Add a topic to the map first');
      return false;
    }
    const addedIds = graftBranch(imported, target.id, { keepColors: isMapFile });
    const added = addedIds.length;
    if (added === 0) {
      toast.error(`No topics found in ${source}`);
      return false;
    }
    setNodesToReveal(addedIds);
    const targetName = target.text.split('\n')[0].trim() || 'the selected topic';
    toast.success(`Added ${added} ${added === 1 ? 'topic' : 'topics'} from ${source} under "${targetName}"`);
    return true;
  };

  const addDroppedImage = async (file: File, targetId: string | undefined) => {
    const target = nodes.find(n => n.id === targetId);
    if (!target) {
      toast.info('Drop a picture on the topic it belongs to');
      return;
    }
    if (file.size > MAX_IMAGE_UPLOAD_SIZE) {
      toast.error(`${file.name} is too large. Maximum size is ${MAX_IMAGE_UPLOAD_SIZE / (1024 * 1024)}MB.`);
      return;
    }
    try {
      const image = sanitizeImageUrl(await prepareNodeImage(file));
      if (!image) {
        toast.error(`${file.name} can't be used as a picture. Try a PNG, JPEG, GIF or WebP file.`);
        return;
      }
      updateNode(target.id, { image });
      toast.success(`Picture added to "${target.text.split('\n')[0].trim() || 'the topic'}"`);
    } catch (error) {
      console.error('Adding a dropped picture failed:', error);
      toast.error(`Failed to read ${file.name}`);
    }
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    e.preventDefault();
    const dropTargetId = findNodeAtPosition(screenToCanvas(e.clientX, e.clientY), new Set());
    if (file.type.startsWith('image/')) {
      await addDroppedImage(file, dropTargetId ?? singleSelectedNode?.id);
      return;
    }
    try {
      const imported = await readImportFile(file);
      addAsBranch(imported.nodes, imported.isMapFile, file.name, dropTargetId ?? undefined);
    } catch (error) {
      console.error('Adding a dropped file failed:', error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error(error instanceof ImportFileError ? message : `Failed to read ${file.name}: ${message}`);
    }
  };

  const handleExportOutline = (format: OutlineFormat) => {
    try {
      exportOutline(nodes, mapName || 'mindmap', format);
      toast.success(`Exported as ${OUTLINE_FORMATS.find(f => f.format === format)?.name ?? format}`);
    } catch (e) {
      console.error('Outline export failed:', e);
      toast.error('Failed to export');
    }
  };

  const duplicateSelection = () => {
    const rootId = findRootNode(nodes)?.id;
    const toCopy = nodes.filter(n => selectedNodeIds.has(n.id) && n.id !== rootId);
    if (toCopy.length === 0) return;
    setNodesToReveal(pasteNodes(toCopy, { keepParents: true }));
    toast.success(toCopy.length > 1 ? `${toCopy.length} blocks duplicated` : 'Block duplicated');
  };

  const handleAddSibling = (id: string) => {
    const newId = id === hoistRootId ? addChildNode(id) : addSiblingNode(id);
    if (newId) setNodesToReveal([newId]);
  };

  const goToNode = (id: string) => {
    if (hoistedIds && !hoistedIds.has(id)) setHoistRootId(null);
    if (hideCompleted && completedBranchIds(nodes).has(id)) setHideCompleted(false);
    expandTo([id]);
    setSelectedNodeIds(new Set([id]));
    setSelectedLineId(null);
    setNodesToReveal([id]);
  };

  const handleCopyStyle = (node: NodeType) => {
    setCopiedStyle(styleOf(node));
    toast.success('Style copied');
  };
  const handlePasteStyle = () => {
    if (!copiedStyle || selectedNodeIds.size === 0) return;
    updateSelectedNodes(copiedStyle);
    toast.success(selectedNodeIds.size > 1 ? `Style given to ${selectedNodeIds.size} blocks` : 'Style pasted');
  };

  useCanvasKeyboard({
    copyStyle: (e) => {
      if (!singleSelectedNode) return;
      e.preventDefault();
      handleCopyStyle(singleSelectedNode);
    },
    pasteStyle: (e) => {
      if (!copiedStyle || selectedNodeIds.size === 0) return;
      e.preventDefault();
      handlePasteStyle();
    },
    delete: () => {
      if (selectedNodeIds.size > 0) deleteSelectedNodes();
      else if (selectedLineId && selectedLineId.startsWith('rel::')) deleteRelation(selectedLineId);
      else if (selectedLineId) {
        const [parentId, childId] = selectedLineId.split('::');
        reconnectParentLink(parentId, childId, 'to', null);
        setSelectedLineId(null);
      }
      else if (selectedBoxAreaId) deleteBoxArea(selectedBoxAreaId);
    },
    undo: (e) => {
      e.preventDefault();
      undo();
    },
    redo: (e) => {
      e.preventDefault();
      redo();
    },
    showShortcuts: (e) => {
      e.preventDefault();
      setShowShortcuts(true);
    },
    addChild: (e) => {
      if (!singleSelectedNode) return;
      e.preventDefault();
      handleAddChild(singleSelectedNode.id);
    },
    addSibling: (e) => {
      if (!singleSelectedNode) return;
      e.preventDefault();
      handleAddSibling(singleSelectedNode.id);
    },
    insertParent: (e) => {
      if (!singleSelectedNode) return;
      e.preventDefault();
      const newId = insertParent(singleSelectedNode.id);
      if (newId) setNodesToReveal([newId]);
    },
    outdent: (e) => {
      if (!singleSelectedNode) return;
      e.preventDefault();
      if (outdent(singleSelectedNode.id)) setNodesToReveal([singleSelectedNode.id]);
    },
    duplicate: (e) => {
      e.preventDefault();
      duplicateSelection();
    },
    commandPalette: (e) => {
      if (isPlaying) return;
      e.preventDefault();
      setShowPalette(true);
    },
    escape: (e) => {
      if (is3DMode || isPlaying) return;
      if (isZen) setIsZen(false);
      else if (hoistRootId) setHoistRootId(null);
      else if (activeTag) clearActiveTag();
      else if (selectedNodeIds.size > 0 || selectedLineId) {
        setSelectedNodeIds(new Set());
        setSelectedLineId(null);
        setIsPropertiesOpen(false);
      } else return;
      e.preventDefault();
    },
    selectAll: (e) => {
      e.preventDefault();
      if (isPlaying || shownNodes.length === 0) return;
      setSelectedNodeIds(new Set(shownNodes.map(n => n.id)));
      setSelectedLineId(null);
      setSelectedBoxAreaId(null);
      setIsPropertiesOpen(true);
    },
    moveUp: (e) => {
      if (!singleSelectedNode) return;
      e.preventDefault();
      moveAmongSiblings(singleSelectedNode.id, -1);
      setNodesToReveal([singleSelectedNode.id]);
    },
    moveDown: (e) => {
      if (!singleSelectedNode) return;
      e.preventDefault();
      moveAmongSiblings(singleSelectedNode.id, 1);
      setNodesToReveal([singleSelectedNode.id]);
    },
    toggleCollapse: (e) => {
      if (selectedNodeIds.size === 0) return;
      e.preventDefault();
      toggleCollapse(selectedNodeIds);
    },
    zoomIn: (e) => {
      if (is3DMode) return;
      e.preventDefault();
      zoomIn();
    },
    zoomOut: (e) => {
      if (is3DMode) return;
      e.preventDefault();
      zoomOut();
    },
    fitToScreen: (e) => {
      if (is3DMode) return;
      e.preventDefault();
      fitToScreen();
    },
    save: () => {
      if (!isPlaying) saveMap();
    },
    pen: (e) => {
      if (is3DMode || isPlaying) return;
      e.preventDefault();
      setDrawingMode(drawingMode === 'pen' ? 'none' : 'pen');
    },
    eraser: (e) => {
      if (is3DMode || isPlaying) return;
      e.preventDefault();
      setDrawingMode(drawingMode === 'eraser' ? 'none' : 'eraser');
    },
    boxArea: (e) => {
      if (is3DMode || isPlaying) return;
      e.preventDefault();
      handleAddBoxArea();
    },
    fitKey: (e) => {
      if (is3DMode || isPlaying) return;
      e.preventDefault();
      fitToScreen();
    },
    editText: (e) => {
      if (!singleSelectedNode || is3DMode) return;
      e.preventDefault();
      checkpoint();
      setEditTrigger({ nodeId: singleSelectedNode.id, token: Date.now() });
    },
    navigate: (e) => {
      const selected = singleSelectedNode;
      if (!selected) return;
      e.preventDefault();
      let targetId: string | null = null;

      const parentId = selected.parentId && selected.parentId !== DETACHED_PARENT_ID ? selected.parentId : null;
      if (e.key === 'ArrowLeft') {
        if (parentId) targetId = parentId;
      } else if (e.key === 'ArrowRight') {
        const children = shownNodes.filter(n => n.parentId === selected.id);
        if (children.length > 0) {
          targetId = children[Math.floor(children.length / 2)].id;
        } else if (selected.collapsed) {
          toggleCollapse([selected.id]);
        }
      } else {
        const siblings = siblingsOf(selected, nodes);
        const idx = siblings.findIndex(n => n.id === selected.id);
        if (e.key === 'ArrowUp' && idx > 0) targetId = siblings[idx - 1].id;
        if (e.key === 'ArrowDown' && idx !== -1 && idx < siblings.length - 1) targetId = siblings[idx + 1].id;
      }

      if (targetId) {
        setSelectedNodeIds(new Set([targetId]));
        setNodesToReveal([targetId]);
      }
    },
  });

  const clipboardRef = useRef<{ copy: (e: ClipboardEvent) => void; cut: (e: ClipboardEvent) => void; paste: (e: ClipboardEvent) => void } | null>(null);
  clipboardRef.current = {
    copy: (e) => {
      if (window.getSelection()?.toString()) return;
      const rootId = findRootNode(nodes)?.id;
      const toCopy = nodes.filter(n => selectedNodeIds.has(n.id) && n.id !== rootId);
      if (toCopy.length === 0 || !e.clipboardData) return;
      e.preventDefault();
      copiedNodesRef.current = toCopy;
      e.clipboardData.setData(NODES_MIME, JSON.stringify(toCopy));
      const outline = toClipboardOutline(toCopy);
      e.clipboardData.setData('text/plain', outline.text);
      e.clipboardData.setData('text/html', outline.html);
      toast.success(toCopy.length > 1 ? `${toCopy.length} blocks copied` : 'Block copied');
    },
    cut: (e) => {
      if (window.getSelection()?.toString() || isPlaying) return;
      const rootId = findRootNode(nodes)?.id;
      const toCut = nodes.filter(n => selectedNodeIds.has(n.id) && n.id !== rootId);
      if (toCut.length === 0 || !e.clipboardData) return;
      e.preventDefault();
      copiedNodesRef.current = toCut;
      e.clipboardData.setData(NODES_MIME, JSON.stringify(toCut));
      const outline = toClipboardOutline(toCut);
      e.clipboardData.setData('text/plain', outline.text);
      e.clipboardData.setData('text/html', outline.html);
      deleteSelectedNodes();
      toast.success(toCut.length > 1 ? `${toCut.length} blocks cut` : 'Block cut');
    },
    paste: (e) => {
      const data = e.clipboardData;
      if (!data || isPlaying) return;
      const copied = data.getData(NODES_MIME);
      if (copied) {
        e.preventDefault();
        try {
          const source = JSON.parse(copied) as NodeType[];
          if (Array.isArray(source) && source.length > 0) {
            setNodesToReveal(pasteNodes(source));
            toast.success(source.length > 1 ? 'Blocks pasted' : 'Block pasted');
          }
        } catch {
          toast.error("The copied blocks couldn't be read");
        }
        return;
      }
      const picture = imageFileIn(data.files);
      if (picture) {
        e.preventDefault();
        if (singleSelectedNode) void addDroppedImage(picture, singleSelectedNode.id);
        else toast.info('Select the topic the picture belongs to, then paste it');
        return;
      }
      const text = data.getData('text/plain');
      if (!text.trim()) return;
      e.preventDefault();
      const lineCount = text.split('\n').filter(line => line.trim()).length;
      if (lineCount > MAX_PASTED_TOPICS) {
        toast.error(`That's ${lineCount} lines; paste at most ${MAX_PASTED_TOPICS} at a time`);
        return;
      }
      const topics = parsePastedOutline(text).map(withSmartText);
      addAsBranch(topics, false, 'the clipboard');
    },
  };
  useEffect(() => {
    const onCopy = (e: ClipboardEvent) => { if (!belongsElsewhere(e)) clipboardRef.current?.copy(e); };
    const onCut = (e: ClipboardEvent) => { if (!belongsElsewhere(e)) clipboardRef.current?.cut(e); };
    const onPaste = (e: ClipboardEvent) => { if (!belongsElsewhere(e)) clipboardRef.current?.paste(e); };
    window.addEventListener('copy', onCopy);
    window.addEventListener('cut', onCut);
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('copy', onCopy);
      window.removeEventListener('cut', onCut);
      window.removeEventListener('paste', onPaste);
    };
  }, []);

  const handleAddTag = (tag: string) => updateSelectedTags(tags => addTag(tags, tag));
  const handleRemoveTag = (tag: string) => updateSelectedTags(tags => removeTag(tags, tag));

  const handleLineSelect = useCallback((id: string | null) => {
    setSelectedLineId(id);
    if (id) {
      setIsPropertiesOpen(true);
      setSelectedBoxAreaId(null);
    }
  }, [setSelectedLineId, setSelectedBoxAreaId]);

  const handleNodeSelect = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (e.shiftKey) {
      setSelectedNodeIds(prev => {
        const next = new Set(prev);
        if (next.has(nodeId)) next.delete(nodeId);
        else next.add(nodeId);
        return next;
      });
    } else {
      setSelectedNodeIds(new Set([nodeId]));
    }
    setIsPropertiesOpen(true);
    setSelectedLineId(null);
    setSelectedBoxAreaId(null);
  }, [setSelectedLineId, setSelectedNodeIds, setSelectedBoxAreaId]);

  const handleSetConnectionSide = useCallback((connectionId: string, endpoint: 'from' | 'to', side: Side | null) => {
    if (connectionId.startsWith('rel::')) {
      const [, sourceId, targetId] = connectionId.split('::');
      const sourceNode = nodes.find(n => n.id === sourceId);
      if (!sourceNode) return;
      const newRelations = (sourceNode.relations || []).map(r =>
        r.targetId !== targetId ? r : endpoint === 'from'
          ? { ...r, sourceSide: side ?? undefined }
          : { ...r, targetSide: side ?? undefined }
      );
      updateNode(sourceId, { relations: newRelations });
    } else {
      const [, childId] = connectionId.split('::');
      updateNode(childId, endpoint === 'from' ? { lineParentSide: side ?? undefined } : { lineChildSide: side ?? undefined });
    }
  }, [nodes, updateNode]);

  const handleToggleCollapse = useCallback((id: string) => toggleCollapse([id]), [toggleCollapse]);

  const handleNodeDragStart = useCallback((id: string) => {
    checkpoint();
    pinConnectionSides(id);
  }, [checkpoint, pinConnectionSides]);

  const handleBoxAreaDragStart = useCallback((movingNodeIds?: Iterable<string>) => {
    checkpoint();
    if (movingNodeIds) pinConnectionSidesForNodes(movingNodeIds);
  }, [checkpoint, pinConnectionSidesForNodes]);

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const selectedNodeIdsRef = useRef(selectedNodeIds);
  selectedNodeIdsRef.current = selectedNodeIds;
  const screenToCanvasRef = useRef(screenToCanvas);
  screenToCanvasRef.current = screenToCanvas;
  const nodeDropRef = useRef<{ id: string; excluded: Set<string> | null; targetId: string | null } | null>(null);
  const [nodeDropTargetId, setNodeDropTargetId] = useState<string | null>(null);

  const handleNodeDragMove = useCallback((id: string, clientX: number, clientY: number, altKey: boolean) => {
    let drop = nodeDropRef.current;
    if (!drop || drop.id !== id) {
      const current = nodesRef.current;
      const node = current.find(n => n.id === id);
      const selected = selectedNodeIdsRef.current;
      const movesAlone = !(selected.has(id) && selected.size > 1);
      let excluded: Set<string> | null = null;
      if (node && movesAlone && !isRootNode(node)) {
        excluded = getDescendantIds(id, current);
        if (node.parentId) excluded.add(node.parentId);
      }
      drop = nodeDropRef.current = { id, excluded, targetId: null };
    }
    let targetId: string | null = null;
    if (drop.excluded && !altKey) {
      const pos = screenToCanvasRef.current(clientX, clientY);
      const current = nodesRef.current;
      for (let i = current.length - 1; i >= 0; i--) {
        const n = current[i];
        if (drop.excluded.has(n.id)) continue;
        const { w, h } = getNodeDimensions(n);
        if (Math.abs(pos.x - n.x) <= w / 2 && Math.abs(pos.y - n.y) <= h / 2) {
          targetId = n.id;
          break;
        }
      }
    }
    if (targetId !== drop.targetId) {
      drop.targetId = targetId;
      setNodeDropTargetId(targetId);
    }
  }, []);

  const handleNodeDrop = useCallback((id: string) => {
    const drop = nodeDropRef.current;
    nodeDropRef.current = null;
    setNodeDropTargetId(null);
    if (!drop || drop.id !== id || !drop.targetId) return;
    const target = nodesRef.current.find(n => n.id === drop.targetId);
    if (!moveBranch(id, drop.targetId, { withinGesture: true })) return;
    setNodesToReveal([id]);
    toast.success(`Moved under "${target?.text.split('\n')[0].trim() || 'the topic'}"`);
  }, [moveBranch]);

  const activeTagRef = useRef<string | null>(null);
  const handleTagClick = useCallback((tag: string) => {
    if (activeTagRef.current && sameTag(activeTagRef.current, tag)) {
      activeTagRef.current = null;
      setActiveTag(null);
      setHighlightedNodeIds([]);
      return;
    }
    const tagged = nodesRef.current.filter(n => n.tags?.some(t => sameTag(t, tag))).map(n => n.id);
    activeTagRef.current = tag;
    setActiveTag(tag);
    setHighlightedNodeIds(tagged);
    toast.info(`${tagged.length} ${tagged.length === 1 ? 'topic' : 'topics'} tagged #${tag}`);
  }, []);
  const clearActiveTag = () => {
    activeTagRef.current = null;
    setActiveTag(null);
    setHighlightedNodeIds([]);
  };

  const handleToggleTask = useCallback((id: string) => {
    const node = nodesRef.current.find(n => n.id === id);
    if (node?.task) updateNode(id, { task: node.task === 'done' ? 'open' : 'done' });
  }, [updateNode]);

  const handleRequestImage = useCallback((id: string) => {
    setActionDialog({ isOpen: true, nodeId: id, type: 'image' });
  }, []);

  const handleRequestLink = useCallback((id: string) => {
    setActionDialog({ isOpen: true, nodeId: id, type: 'link' });
  }, []);

  const handleCancelTextEdit = useCallback((id: string, text: string, textRuns?: TextRun[][]) => {
    cancelGesture();
    replaceNodeText(id, text, textRuns);
  }, [cancelGesture, replaceNodeText]);

  const handleRequestNotes = useCallback((id: string) => {
    notesCheckpointNodeRef.current = null;
    setSelectedNodeIds(new Set([id]));
    setIsNotesOpen(true);
  }, [setSelectedNodeIds]);

  const handleRequestIcon = useCallback((id: string) => {
    setShowIconLibrary({ isOpen: true, nodeId: id });
  }, []);

  const loopConnectCenter = useMemo(() => {
    if (selectedNodeIds.size < 2) return null;
    const selected = nodes.filter(n => selectedNodeIds.has(n.id));
    if (selected.length < 2) return null;
    const sumX = selected.reduce((sum, n) => sum + n.x, 0);
    const sumY = selected.reduce((sum, n) => sum + n.y, 0);
    return { x: sumX / selected.length, y: sumY / selected.length };
  }, [nodes, selectedNodeIds]);

  const handleLoopConnect = useCallback(() => {
    if (selectedNodeIds.size === 2) {
      addRelation();
    } else {
      toast.info("Select exactly two nodes to connect");
    }
  }, [selectedNodeIds, addRelation]);

  const keysOf = (id: CanvasShortcutId) => CANVAS_SHORTCUTS.find(shortcut => shortcut.id === id)?.keys;
  const one = singleSelectedNode;
  const oneParent = one ? nodes.find(n => n.id === one.parentId) : undefined;
  const mapRootId = findRootNode(nodes)?.id;
  const deletable = nodes.some(n => selectedNodeIds.has(n.id) && n.id !== mapRootId);
  const copiedBlocks = copiedNodesRef.current;
  const in2D = !is3DMode;
  const commands: EditorCommand[] = [
    { id: 'addChild', label: 'Add Child Topic', group: 'Topic', keys: keysOf('addChild'), icon: CornerDownRight, run: one && (() => handleAddChild(one.id)) },
    { id: 'addSibling', label: 'Add Sibling Topic', group: 'Topic', keys: keysOf('addSibling'), icon: Plus, run: one && (() => handleAddSibling(one.id)) },
    {
      id: 'insertParent', label: 'Insert Parent Topic', group: 'Topic', keys: keysOf('insertParent'), icon: ArrowUpFromLine,
      run: one && one.parentId !== null ? () => { const id = insertParent(one.id); if (id) setNodesToReveal([id]); } : undefined,
    },
    {
      id: 'outdent', label: 'Move Up a Level', group: 'Topic', keys: keysOf('outdent'), icon: ArrowLeftFromLine,
      run: one && oneParent && nodes.some(n => n.id === oneParent.parentId) ? () => { if (outdent(one.id)) setNodesToReveal([one.id]); } : undefined,
    },
    {
      id: 'editText', label: 'Rename', group: 'Topic', keys: 'F2', icon: Pencil,
      run: one && (() => { checkpoint(); setEditTrigger({ nodeId: one.id, token: Date.now() }); }),
    },
    { id: 'notes', label: 'Edit Notes', group: 'Topic', icon: FileText, run: one && (() => handleRequestNotes(one.id)) },
    { id: 'duplicate', label: 'Duplicate', group: 'Topic', keys: keysOf('duplicate'), icon: Copy, run: deletable ? duplicateSelection : undefined },
    { id: 'copyStyle', label: 'Copy Style', group: 'Topic', keys: keysOf('copyStyle'), icon: Paintbrush, run: one && (() => handleCopyStyle(one)) },
    { id: 'pasteStyle', label: 'Paste Style', group: 'Topic', keys: keysOf('pasteStyle'), icon: PaintRoller, run: copiedStyle && selectedNodeIds.size > 0 ? handlePasteStyle : undefined },
    { id: 'connect', label: 'Connect the Two Topics', group: 'Topic', icon: Link, keywords: ['relation', 'loop', 'link'], run: selectedNodeIds.size === 2 ? addRelation : undefined },
    {
      id: 'pasteBlocks', label: copiedBlocks && copiedBlocks.length > 1 ? 'Paste Blocks' : 'Paste Block', group: 'Topic', keys: keysOf('paste'), icon: ClipboardPaste,
      run: copiedBlocks?.length ? () => setNodesToReveal(pasteNodes(copiedBlocks)) : undefined,
    },
    { id: 'delete', label: selectedNodeIds.size > 1 ? 'Delete Topics' : 'Delete', group: 'Topic', keys: 'Del', icon: Trash2, run: deletable ? deleteSelectedNodes : undefined },

    {
      id: 'toggleTask', label: one?.task ? 'Not a Task' : 'Make a Task', group: 'Tasks', icon: SquareCheck, keywords: ['todo', 'checkbox'],
      run: one && (() => updateNode(one.id, { task: one.task ? undefined : 'open' })),
    },
    {
      id: 'toggleDone', label: one?.task === 'done' ? 'Mark To Do' : 'Mark Done', group: 'Tasks', icon: Check,
      run: one?.task ? () => handleToggleTask(one.id) : undefined,
    },
    {
      id: 'hideDone', label: hideCompleted ? 'Show Done Tasks' : 'Hide Done Tasks', group: 'Tasks', icon: hideCompleted ? Eye : EyeOff,
      run: tasks.total > 0 ? () => setHideCompleted(!hideCompleted) : undefined,
    },

    {
      id: 'toggleCollapse', label: one && hiddenCountById.get(one.id) ? 'Expand Branch' : 'Collapse Branch', group: 'Arrange', keys: keysOf('toggleCollapse'),
      icon: ChevronsDownUp, keywords: ['fold', 'hide'],
      run: [...selectedNodeIds].some(id => hiddenCountById.has(id)) ? () => toggleCollapse(selectedNodeIds) : undefined,
    },
    { id: 'expandAll', label: 'Expand Everything', group: 'Arrange', icon: ChevronsUpDown, run: nodes.some(n => n.collapsed) ? expandAllBranches : undefined },
    ...[1, 2, 3].map((level): EditorCommand => ({
      id: `level-${level}`, label: `Show ${level} ${level === 1 ? 'Level' : 'Levels'}`, group: 'Arrange', icon: ChevronsDownUp, run: () => collapseBranchesToLevel(level),
    })),
    { id: 'moveUp', label: 'Move Up Among Siblings', group: 'Arrange', keys: keysOf('moveUp'), icon: ArrowUp, run: one && (() => moveAmongSiblings(one.id, -1)) },
    { id: 'moveDown', label: 'Move Down Among Siblings', group: 'Arrange', keys: keysOf('moveDown'), icon: ArrowDown, run: one && (() => moveAmongSiblings(one.id, 1)) },
    ...LAYOUTS.map(({ type, label }): EditorCommand => ({
      id: `layout-${type}`, label: `Auto Layout: ${label}`, group: 'Arrange', icon: LayoutGrid, run: in2D ? () => applyAutoLayout(type) : undefined,
    })),
    {
      id: 'selectAll', label: 'Select All', group: 'Arrange', keys: keysOf('selectAll'), icon: MousePointerClick,
      run: nodes.length > 0 ? () => { setSelectedNodeIds(new Set(shownNodes.map(n => n.id))); setIsPropertiesOpen(true); } : undefined,
    },

    {
      id: 'hoist', label: 'Show Branch Only', group: 'View', icon: Crosshair, keywords: ['hoist', 'focus', 'drill'],
      run: one && one.id !== hoistRootId && in2D ? () => setHoistRootId(one.id) : undefined,
    },
    { id: 'wholeMap', label: 'Show Whole Map', group: 'View', keys: 'Esc', icon: MapIcon, run: hoistRootId ? () => setHoistRootId(null) : undefined },
    { id: 'outline', label: showOutline ? 'Close the Outline' : 'Outline View', group: 'View', icon: ListTree, keywords: ['list', 'indent'], run: () => setShowOutline(open => !open) },
    { id: 'focusMode', label: isFocusMode ? 'Leave Focus Mode' : 'Focus Mode', group: 'View', icon: Focus, run: toggleFocusMode },
    { id: 'zen', label: isZen ? 'Leave Zen Mode' : 'Zen Mode', group: 'View', icon: isZen ? Minimize2 : Maximize2, keywords: ['distraction', 'fullscreen'], run: () => setIsZen(!isZen) },
    { id: 'numbering', label: numbering ? 'Hide Numbering' : 'Number the Topics', group: 'View', icon: ListOrdered, keywords: ['1.1', 'outline'], run: toggleNumbering },
    { id: 'statusColors', label: statusColors ? 'Hide Status Colors' : 'Show Status Colors', group: 'View', icon: Palette, keywords: ['done', 'overdue', 'priority'], run: toggleStatusColors },
    { id: 'clearTag', label: `Stop Highlighting #${activeTag ?? ''}`, group: 'View', keys: 'Esc', icon: Tag, run: activeTag ? clearActiveTag : undefined },
    { id: 'minimap', label: showMinimap ? 'Hide Minimap' : 'Show Minimap', group: 'View', icon: MapIcon, keywords: ['overview'], run: in2D ? toggleMinimap : undefined },
    { id: 'fit', label: 'Fit to Screen', group: 'View', keys: keysOf('fitToScreen'), icon: Maximize, run: in2D ? fitToScreen : undefined },
    { id: 'zoomIn', label: 'Zoom In', group: 'View', keys: keysOf('zoomIn'), icon: ZoomIn, run: in2D ? zoomIn : undefined },
    { id: 'zoomOut', label: 'Zoom Out', group: 'View', keys: keysOf('zoomOut'), icon: ZoomOut, run: in2D ? zoomOut : undefined },
    { id: 'view3d', label: is3DMode ? 'Back to the 2D Map' : '3D Galaxy View', group: 'View', icon: Box, run: toggle3DMode },
    { id: 'present', label: 'Present', group: 'View', icon: Play, keywords: ['slides', 'presentation'], run: startPresentation },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', group: 'View', keys: keysOf('showShortcuts'), icon: Keyboard, run: () => setShowShortcuts(true) },

    { id: 'save', label: 'Save', group: 'Map', icon: Save, run: () => (mapId ? handleSave(mapName || 'Untitled') : setShowSaveDialog(true)) },
    { id: 'smartAdd', label: 'Smart Add…', group: 'Map', icon: ListPlus, run: () => setIsSmartAddOpen(true) },
    { id: 'importBranch', label: 'Add a File as a Branch…', group: 'Map', icon: FilePlus2, keywords: ['import'], run: () => setShowBranchImport(true) },
    { id: 'history', label: 'Version History', group: 'Map', icon: History, keywords: ['snapshot'], run: () => setShowSnapshotPanel(true) },
    { id: 'copyImage', label: 'Copy Map as Image', group: 'Map', icon: ImageIcon, run: in2D ? handleCopyImage : undefined },
    { id: 'exportPng', label: 'Export as PNG', group: 'Map', icon: ImageIcon, run: in2D ? handleExportPNG : undefined },
    { id: 'exportSvg', label: 'Export as SVG', group: 'Map', icon: ImageIcon, run: in2D ? handleExportSVG : undefined },
    { id: 'exportPdf', label: 'Export as PDF…', group: 'Map', icon: FileDown, run: in2D ? handleExportPDF : undefined },
    ...OUTLINE_FORMATS.map(({ format, name }): EditorCommand => ({
      id: `export-${format}`, label: `Export as ${name}`, group: 'Map', icon: FileDown, run: () => handleExportOutline(format),
    })),
    { id: 'exportFile', label: 'Save as a .nmm File', group: 'Map', icon: FileDown, keywords: ['export', 'download'], run: handleExportToFile },
    { id: 'back', label: 'Back to Your Maps', group: 'Map', icon: ArrowLeft, run: onBack },
  ];
  const menuSections: MenuSection[] = menuTarget === 'node'
    ? [
      pickCommands(commands, ['addChild', 'addSibling', 'insertParent', 'outdent']),
      pickCommands(commands, ['editText', 'notes', 'toggleTask', 'toggleDone']),
      pickCommands(commands, ['toggleCollapse', 'hoist', 'duplicate', 'copyStyle', 'pasteStyle', 'connect']),
      pickCommands(commands, ['delete']),
    ]
    : [
      pickCommands(commands, ['pasteBlocks', 'selectAll']),
      pickCommands(commands, ['layout-horizontal', 'layout-logic', 'layout-vertical', 'fit']),
      pickCommands(commands, ['wholeMap', 'clearTag', 'expandAll', 'hideDone', 'numbering', 'statusColors', 'outline', 'zen', 'minimap']),
    ];
  const handleMenuTarget = (target: EventTarget | null) => {
    const nodeId = target instanceof Element ? target.closest('[data-node-id]')?.getAttribute('data-node-id') : null;
    if (nodeId) {
      if (!selectedNodeIds.has(nodeId)) {
        setSelectedNodeIds(new Set([nodeId]));
        setSelectedLineId(null);
      }
      setMenuTarget('node');
    } else {
      setMenuTarget('canvas');
    }
  };

  const routing = useLineRouting(shownNodes, hookConnectionStyle);

  const cullKey = (() => {
    if (!canvasSize || is3DMode || renderAll) return null;
    const step = CULL_STEP / zoom;
    const reachX = canvasSize.width * (0.5 + CULL_MARGIN) / zoom;
    const reachY = canvasSize.height * (0.5 + CULL_MARGIN) / zoom;
    const centreX = -pan.x / zoom;
    const centreY = -pan.y / zoom;
    return [
      Math.floor((centreX - reachX) / step) * step,
      Math.floor((centreY - reachY) / step) * step,
      Math.ceil((centreX + reachX) / step) * step,
      Math.ceil((centreY + reachY) / step) * step,
    ].join(',');
  })();
  const cullBox = useMemo((): MapBox | null => {
    if (!cullKey) return null;
    const [x1, y1, x2, y2] = cullKey.split(',').map(Number);
    return { x1, y1, x2, y2 };
  }, [cullKey]);
  const inView = useMemo(() => (cullBox ? nodeIndex.query(cullBox) : null), [cullBox, nodeIndex]);
  const showOverview = !!inView && inView.length > OVERVIEW_NODES;
  const renderedNodes = useMemo(() => {
    if (!inView) return shownNodes;
    if (showOverview) return [];
    const keep = new Set(inView.map(box => box.node.id));
    if (selectedNodeIds.size <= KEEP_SELECTED) selectedNodeIds.forEach(id => keep.add(id));
    if (editTrigger) keep.add(editTrigger.nodeId);
    if (nodeDropTargetId) keep.add(nodeDropTargetId);
    return keep.size >= shownNodes.length ? shownNodes : shownNodes.filter(n => keep.has(n.id));
  }, [inView, showOverview, shownNodes, selectedNodeIds, editTrigger, nodeDropTargetId]);

  const getColors = useCallback(() => createColorResolver(contentRef.current ?? document.documentElement), []);
  const { resolved: resolvedTheme } = useEditorTheme();
  const handleOpenNodeFromOverview = useCallback((id: string) => {
    const node = nodesRef.current.find(n => n.id === id);
    if (!node) return;
    setSelectedNodeIds(new Set([id]));
    setZoom(1);
    setPan({ x: -node.x, y: -node.y });
  }, [setSelectedNodeIds, setZoom, setPan]);
  const highlightedIdSet = useMemo(() => new Set(highlightedNodeIds), [highlightedNodeIds]);

  const drawsPictures = shownNodes.length > PAGE_PICTURE_NODES;
  const drawPicture = (frame: PictureFrame): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(frame.width * frame.pixelRatio));
    canvas.height = Math.max(1, Math.round(frame.height * frame.pixelRatio));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available');
    drawMap(ctx, {
      width: frame.width, height: frame.height, pixelRatio: frame.pixelRatio, view: frame.view,
      nodes: nodeBoxes, index: nodeIndex, routing, colors: getColors(), drawings, boxAreas,
      background: frame.background, text: 'always',
    });
    return canvas;
  };
  const mapPicture = (content: HTMLElement): MapPicture => (drawsPictures ? drawPicture : content);

  const mapView = canvasSize && {
    minX: (-canvasSize.width / 2 - pan.x) / zoom,
    maxX: (canvasSize.width / 2 - pan.x) / zoom,
    minY: (-canvasSize.height / 2 - pan.y) / zoom,
    maxY: (canvasSize.height / 2 - pan.y) / zoom,
  };
  const hoistPath: NodeType[] = [];
  for (let id: string | null = hoistRootId; id && hoistPath.length <= nodes.length;) {
    const node = nodes.find(n => n.id === id);
    if (!node) break;
    hoistPath.unshift(node);
    id = node.parentId;
  }

  return (
    <div
      className="relative w-full h-screen overflow-hidden overflow-clip bg-background flex flex-col"
      onScroll={(e) => {
        e.currentTarget.scrollTop = 0;
        e.currentTarget.scrollLeft = 0;
      }}
    >
      {!isPlaying && !isZen && <MindMapToolbar
        nodes={nodes}
        drawings={drawings}
        boxAreas={boxAreas}
        selectedNodeIds={selectedNodeIds}
        connectionStyle={hookConnectionStyle}
        onBack={onBack}
        onSave={() => mapId ? handleSave(mapName || 'Untitled') : setShowSaveDialog(true)}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onAddRelation={addRelation}
        onConnectionStyleChange={handleGlobalStyleChange}
        onAutoLayout={applyAutoLayout}
        onBranchLayout={singleSelectedNode && nodes.some(n => n.parentId === singleSelectedNode.id) && singleSelectedNode.parentId !== null
          ? (direction) => applyBranchLayout(singleSelectedNode.id, direction)
          : undefined}
        onNodeSelect={(nodeId) => {
          expandTo([nodeId]);
          setSelectedNodeIds(new Set([nodeId]));
          setIsPropertiesOpen(false);
          const node = nodes.find(n => n.id === nodeId);
          if (node) setPan({ x: -node.x * zoom, y: -node.y * zoom });
        }}
        onExpandAll={expandAllBranches}
        onCollapseToLevel={collapseBranchesToLevel}
        onHighlight={setHighlightedNodeIds}
        showSnapshotPanel={showSnapshotPanel}
        toggleSnapshotPanel={() => setShowSnapshotPanel(!showSnapshotPanel)}
        isFocusMode={isFocusMode}
        toggleFocusMode={toggleFocusMode}
        isPlaying={isPlaying}
        onTogglePlay={startPresentation}
        onExportToFile={handleExportToFile}
        onCopyImage={handleCopyImage}
        onExportPNG={handleExportPNG}
        onExportSVG={handleExportSVG}
        onExportPDF={handleExportPDF}
        onExportOutline={handleExportOutline}
        onImportBranch={() => setShowBranchImport(true)}
        showOutline={showOutline}
        onToggleOutline={() => setShowOutline(open => !open)}
        isExporting={isExporting}
        showShortcuts={showShortcuts}
        setShowShortcuts={setShowShortcuts}
        is3DMode={is3DMode}
        onToggle3DMode={toggle3DMode}
        onSmartAdd={() => setIsSmartAddOpen(true)}
        onAddBoxArea={handleAddBoxArea}
        drawingMode={drawingMode}
        setDrawingMode={setDrawingMode}
        onOpenPalette={() => setShowPalette(true)}
        isHoisted={!!hoistRootId}
        onToggleHoist={hoistRootId ? () => setHoistRootId(null) : singleSelectedNode ? () => setHoistRootId(singleSelectedNode.id) : undefined}
        onToggleZen={() => setIsZen(true)}
        showMinimap={showMinimap}
        onToggleMinimap={toggleMinimap}
        numbering={numbering}
        onToggleNumbering={toggleNumbering}
        statusColors={statusColors}
        onToggleStatusColors={toggleStatusColors}
      />}

      <CommandPalette
        open={showPalette}
        onOpenChange={setShowPalette}
        commands={commands}
        nodes={nodes}
        onSelectNode={goToNode}
        maps={savedMaps?.filter(map => map.id !== mapId)}
        onOpenMap={onOpenMap}
      />

      {isPlaying && (
        <PresentationControls
          currentStep={currentStep}
          totalSteps={totalSteps}
          isPaused={isPaused}
          isFinished={isFinished}
          speed={speed}
          step={playStep}
          onStepChange={setPlayStep}
          isFullscreen={isFullscreen}
          onSpeedChange={setSpeed}
          onPrevious={previousStep}
          onNext={nextStep}
          onTogglePause={togglePause}
          onToggleFullscreen={toggleFullscreen}
          onExit={exitPresentation}
        />
      )}

      <SmartAddPanel
        isOpen={isSmartAddOpen}
        onClose={() => setIsSmartAddOpen(false)}
        nodes={nodes}
        selectedNodeIds={selectedNodeIds}
        onAdd={(text) => {
          const parentId = findBestParent(nodes, text, selectedNodeIds);
          const parentNode = nodes.find(n => n.id === parentId);

          const newNodeId = addChildNode(parentId, text);
          if (newNodeId) expandTo([parentId]);
          if (!newNodeId) {
            toast.error("Couldn't find a node to attach to");
          } else if (parentNode) {
            toast.success(`Added to "${parentNode.text.split('\n')[0].substring(0, 20)}..."`);
          } else {
            toast.success("Added new node");
          }
        }}
      />

      {is3DMode ? (
        <GalaxyErrorBoundary onExit={() => setIs3DMode(false)}>
          <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-black text-white">Loading 3D Galaxy...</div>}>
            <div className="flex-1 relative overflow-hidden bg-black">
              <GalaxyView
                nodes={shownNodes}
                connectionStyle={hookConnectionStyle}
                selectedNodeIds={selectedNodeIds}
                onExit={() => setIs3DMode(false)}
                onNodeMove={updateNodePosition}
                onNodeDragStart={checkpoint}
                onNodeClick={(id, e) => handleNodeSelect(e as unknown as React.MouseEvent, id)}
                onNodeDoubleClick={(id) => {
                  setSelectedNodeIds(new Set([id]));
                  setIsPropertiesOpen(true);
                }}
                onLineSelect={(sourceId, targetId, relationId) => {
                  setSelectedLineId(relationId || `${sourceId}::${targetId}`);
                  setIsPropertiesOpen(true);
                }}
              />
            </div>
          </Suspense>
        </GalaxyErrorBoundary>
      ) : (
        <div
          className="flex-1 relative overflow-hidden overflow-clip bg-canvas"
          onScroll={(e) => {
            e.currentTarget.scrollTop = 0;
            e.currentTarget.scrollLeft = 0;
          }}
        >
          <CanvasContextMenu onTarget={handleMenuTarget} sections={menuSections}>
          <div
            ref={canvasRef}
            data-testid="mindmap-canvas"
            className={cn(
              "w-full h-full canvas-dots canvas-area",
              drawingMode === 'none' ? "cursor-grab active:cursor-grabbing" : ""
            )}
            style={{ cursor: drawing.cursor }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onDragOver={(e) => {
              if (!e.dataTransfer.types.includes('Files')) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
            }}
            onDrop={handleFileDrop}
          >
            {showOverview && canvasSize && (
              <CanvasOverviewLayer
                width={canvasSize.width}
                height={canvasSize.height}
                pan={pan}
                zoom={zoom}
                nodes={nodeBoxes}
                index={nodeIndex}
                routing={routing}
                getColors={getColors}
                themeKey={resolvedTheme}
                selectedIds={selectedNodeIds}
                highlightedIds={highlightedIdSet}
                onSelect={handleNodeSelect}
                onDragStart={handleNodeDragStart}
                onPositionChange={updateNodePosition}
                onDragEnd={unpinConnectionSides}
                onOpenNode={handleOpenNodeFromOverview}
              />
            )}
            <div
              ref={contentRef}
              className="absolute canvas-area origin-center"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transition: isPlaying ? 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1)' : undefined,
                left: '50%',
                top: '50%'
              }}
            >
              <BoxAreaLayer
                boxAreas={boxAreas}
                nodes={shownNodes}
                zoom={zoom}
                selectedId={selectedBoxAreaId}
                editingId={editingBoxAreaId}
                onSelect={handleSelectBoxArea}
                onStartEdit={setEditingBoxAreaId}
                onEndEdit={handleEndBoxAreaEdit}
                onRename={handleRenameBoxArea}
                onDragStart={handleBoxAreaDragStart}
                onMove={moveBoxArea}
                onResize={replaceBoxArea}
              />

              {drawing.boxDraft && (
                <div
                  className="absolute rounded-xl pointer-events-none"
                  style={{
                    left: Math.min(drawing.boxDraft.start.x, drawing.boxDraft.end.x),
                    top: Math.min(drawing.boxDraft.start.y, drawing.boxDraft.end.y),
                    width: Math.abs(drawing.boxDraft.end.x - drawing.boxDraft.start.x),
                    height: Math.abs(drawing.boxDraft.end.y - drawing.boxDraft.start.y),
                    border: `${Math.max(2, 2 / zoom)}px dashed ${BOX_AREA_COLORS[boxAreas.length % BOX_AREA_COLORS.length]}`,
                    backgroundColor: `${BOX_AREA_COLORS[boxAreas.length % BOX_AREA_COLORS.length]}14`,
                  }}
                />
              )}

              {!showOverview && (
                <ConnectionLines
                  routing={routing}
                  selectedLineId={selectedLineId}
                  onLineSelect={handleLineSelect}
                  visibleLineIds={visibleLineIds}
                  viewBox={cullBox ?? undefined}
                />
              )}

              {selectedNodeIds.size === 2 && !isFocusMode && (() => {
                const [idA, idB] = Array.from(selectedNodeIds);
                const nodeA = nodes.find(n => n.id === idA);
                const nodeB = nodes.find(n => n.id === idB);
                if (!nodeA || !nodeB) return null;

                if (areNodesConnected(nodeA, nodeB)) return null;

                const midX = (nodeA.x + nodeB.x) / 2;
                const midY = (nodeA.y + nodeB.y) / 2;
                const dx = nodeB.x - nodeA.x;
                const dy = nodeB.y - nodeA.y;
                const dist = Math.hypot(dx, dy) || 1;
                const bow = Math.min(dist * 0.15, 60);
                const curveX = midX - (dy / dist) * bow;
                const curveY = midY + (dx / dist) * bow;

                const clipToNode = (node: NodeType, towardX: number, towardY: number) => {
                  const { w, h } = getNodeDimensions(node);
                  const hw = w / 2 + 4;
                  const hh = h / 2 + 4;
                  const dirX = towardX - node.x;
                  const dirY = towardY - node.y;
                  if (dirX === 0 && dirY === 0) return { x: node.x, y: node.y };
                  const tX = dirX !== 0 ? hw / Math.abs(dirX) : Infinity;
                  const tY = dirY !== 0 ? hh / Math.abs(dirY) : Infinity;
                  const t = Math.min(tX, tY);
                  return { x: node.x + dirX * t, y: node.y + dirY * t };
                };

                const start = clipToNode(nodeA, curveX, curveY);
                const end = clipToNode(nodeB, curveX, curveY);

                return (
                  <svg
                    className="absolute pointer-events-none overflow-visible"
                    style={{ left: -5000, top: -5000, width: 10000, height: 10000, zIndex: 4 }}
                  >
                    <g transform="translate(5000, 5000)">
                      <path
                        d={`M ${start.x} ${start.y} Q ${curveX} ${curveY} ${end.x} ${end.y}`}
                        fill="none"
                        stroke="#6366f1"
                        strokeOpacity={0.45}
                        strokeWidth={3 / zoom}
                        strokeDasharray="8 6"
                        strokeLinecap="round"
                      />
                    </g>
                  </svg>
                );
              })()}

              {renderedNodes.map((node) => {
                if (isPlaying && !visibleNodeIds.has(node.id)) return null;
                const progress = taskProgress.get(node.id);

                return (
                  <MindMapNode
                    key={node.id}
                    node={node}
                    isSelected={selectedNodeIds.has(node.id)}
                    selectionCount={selectedNodeIds.has(node.id) ? selectedNodeIds.size : undefined}
                    onSelect={handleNodeSelect}
                    onPositionChange={updateNodePosition}
                    onTextChange={replaceNodeText}
                    onTextCommit={applySmartText}
                    onCancelTextEdit={handleCancelTextEdit}
                    onSizeChange={updateNodeSize}
                    onMeasureNode={updateNodeMeasurement}
                    onAddChild={handleAddChild}
                    onRequestImage={handleRequestImage}
                    onRequestLink={handleRequestLink}
                    onRequestNotes={handleRequestNotes}
                    onAddIcon={handleRequestIcon}
                    onDragStart={handleNodeDragStart}
                    onDragEnd={unpinConnectionSides}
                    onDragMove={handleNodeDragMove}
                    onDrop={handleNodeDrop}
                    onToggleTask={handleToggleTask}
                    tasksDone={progress?.done}
                    tasksTotal={progress?.total}
                    numberLabel={numberLabels?.get(node.id)}
                    ruleTone={statusColors ? ruleToneOf(node, today) : undefined}
                    onTagClick={handleTagClick}
                    activeTag={activeTag ?? undefined}
                    editTrigger={editTrigger?.nodeId === node.id ? editTrigger.token : undefined}
                    getZoom={getZoom}
                    isLight={isLightMap}
                    isDimmed={isFocusMode && focusedNodeIds ? !focusedNodeIds.has(node.id) : false}
                    isHighlighted={highlightedIdSet.has(node.id)}
                    hiddenCount={hiddenCountById.get(node.id)}
                    onToggleCollapse={handleToggleCollapse}
                  />
                );
              })}

              <svg
                className="absolute pointer-events-none overflow-visible"
                style={{ left: -5000, top: -5000, width: 10000, height: 10000, zIndex: 5 }}
              >
                <g transform={`translate(5000, 5000)`}>
                  {drawings.map(d => (
                    <polyline
                      key={d.id}
                      points={d.points.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke={d.color}
                      strokeWidth={d.width ?? DEFAULT_PEN.width}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                  {drawing.currentPath.length > 0 && (
                    <polyline
                      points={drawing.currentPath.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke={drawing.pen.color}
                      strokeWidth={drawing.pen.width}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </g>
              </svg>

              {!showOverview && (
                <ConnectionDots
                  routing={routing}
                  visibleLineIds={visibleLineIds}
                  viewBox={cullBox ?? undefined}
                />
              )}

              <ConnectionHandles
                nodes={shownNodes}
                zoom={zoom}
                connectionStyle={hookConnectionStyle}
                selectedLineId={selectedLineId}
                visibleLineIds={visibleLineIds}
                onSetConnectionSide={handleSetConnectionSide}
                onEndpointDragStart={handleEndpointDragStart}
              />

              {nodeDropTargetId && (() => {
                const target = nodes.find(n => n.id === nodeDropTargetId);
                if (!target) return null;
                const { w, h } = getNodeDimensions(target);
                return (
                  <svg
                    className="absolute pointer-events-none overflow-visible"
                    style={{ left: -5000, top: -5000, width: 10000, height: 10000, zIndex: 20 }}
                  >
                    <g transform="translate(5000, 5000)">
                      <rect
                        data-testid="drop-target"
                        x={target.x - w / 2 - 6}
                        y={target.y - h / 2 - 6}
                        width={w + 12}
                        height={h + 12}
                        rx={12}
                        fill="#22c55e"
                        fillOpacity={0.08}
                        stroke="#22c55e"
                        strokeWidth={3 / zoom}
                        strokeDasharray={`${8 / zoom} ${5 / zoom}`}
                      />
                    </g>
                  </svg>
                );
              })()}

              {lineDrag && (() => {
                const isRelation = lineDrag.connectionId.startsWith('rel::');
                const parts = lineDrag.connectionId.split('::');
                const fixedNodeId = isRelation
                  ? (lineDrag.endpoint === 'from' ? parts[2] : parts[1])
                  : (lineDrag.endpoint === 'from' ? parts[1] : parts[0]);
                const fixedNode = nodes.find(n => n.id === fixedNodeId);
                const hoverNode = lineDrag.hoverNodeId ? nodes.find(n => n.id === lineDrag.hoverNodeId) : null;
                if (!fixedNode) return null;
                const start = getEdgePoint(fixedNode, lineDrag.pos);

                return (
                  <svg
                    className="absolute pointer-events-none overflow-visible"
                    style={{ left: -5000, top: -5000, width: 10000, height: 10000, zIndex: 20 }}
                  >
                    <g transform="translate(5000, 5000)">
                      <line
                        x1={start.x}
                        y1={start.y}
                        x2={lineDrag.pos.x}
                        y2={lineDrag.pos.y}
                        stroke="#f97316"
                        strokeWidth={2 / zoom}
                        strokeDasharray="6 4"
                      />
                      {hoverNode && (() => {
                        const { w, h } = getNodeDimensions(hoverNode);
                        return (
                          <rect
                            x={hoverNode.x - w / 2 - 4}
                            y={hoverNode.y - h / 2 - 4}
                            width={w + 8}
                            height={h + 8}
                            rx={14}
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth={3 / zoom}
                          />
                        );
                      })()}
                    </g>
                  </svg>
                );
              })()}
            </div>

            {selection.selectionBox && (
              <div
                className="fixed border-2 border-primary bg-primary/20 pointer-events-none z-[100]"
                style={{
                  left: selection.selectionBox.x,
                  top: selection.selectionBox.y,
                  width: selection.selectionBox.w,
                  height: selection.selectionBox.h
                }}
              />
            )}
          </div>
          </CanvasContextMenu>

          {hoistPath.length > 0 && !isPlaying && (
            <nav
              aria-label="Branch shown"
              className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 max-w-[80%] rounded-full border border-border/60 bg-card/90 backdrop-blur-sm shadow-sm px-2 py-1 text-xs"
              data-testid="hoist-breadcrumb"
            >
              <button className="px-2 py-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground" onClick={() => setHoistRootId(null)}>
                Whole map
              </button>
              {hoistPath.map((node, i) => (
                <span key={node.id} className="flex items-center gap-1 min-w-0">
                  <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  {i === hoistPath.length - 1 ? (
                    <span className="px-2 py-0.5 font-medium truncate" aria-current="location">{node.text.split('\n')[0].trim() || 'Topic'}</span>
                  ) : (
                    <button className="px-2 py-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground truncate" onClick={() => setHoistRootId(node.id)}>
                      {node.text.split('\n')[0].trim() || 'Topic'}
                    </button>
                  )}
                </span>
              ))}
            </nav>
          )}

          {isZen && (
            <button
              className="absolute top-3 right-3 z-50 flex items-center gap-1.5 rounded-full border border-border/60 bg-card/80 backdrop-blur-sm px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 transition-opacity"
              onClick={() => setIsZen(false)}
              title="Leave zen mode (Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5" /> Leave Zen
            </button>
          )}

          {showMinimap && mapView && !isPlaying && !isZen && (
            <div className="absolute bottom-24 right-6 z-40">
              <Minimap nodes={shownNodes} view={mapView} onCenterOn={(x, y) => setPan({ x: -x * zoom, y: -y * zoom })} />
            </div>
          )}

          {!isZen && <div className="absolute bottom-0 left-0 z-40 bg-card/90 backdrop-blur-sm border-t border-r border-border/50 shadow-sm rounded-tr-lg p-0.5 flex items-center group hover:bg-card transition-colors">
            <div className="grid items-center min-w-[50px] max-w-[300px]">
              <span
                className="invisible col-start-1 row-start-1 font-semibold text-sm px-1.5 py-0.5 whitespace-pre min-w-[20px] truncate"
                aria-hidden="true"
              >
                {mapName || 'Untitled Map'}
              </span>
              <input
                id="map-name-input"
                name="map-name"
                type="text"
                value={mapName || ''}
                onChange={(e) => onNameChange?.(e.target.value)}
                placeholder="Untitled Map"
                className="col-start-1 row-start-1 w-full font-semibold text-sm bg-transparent border border-transparent hover:border-border/50 rounded px-1.5 py-0.5 outline-none transition-all truncate text-foreground/90 placeholder:text-muted-foreground/50"
                title="Rename Map"
              />
            </div>
          </div>}

          {tasks.total > 0 && !isPlaying && !isZen && (
            <div
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 rounded-full border border-border/60 bg-card/90 backdrop-blur-sm shadow-sm pl-3 pr-1 py-1 text-xs text-foreground"
              data-testid="task-summary"
            >
              <SquareCheck className={cn('w-3.5 h-3.5', tasks.done === tasks.total ? 'text-green-600' : 'text-blue-600')} />
              <span>{tasks.done} of {tasks.total} {tasks.total === 1 ? 'task' : 'tasks'} done</span>
              <button
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => setHideCompleted(!hideCompleted)}
                aria-pressed={hideCompleted}
                title={hideCompleted ? 'Show the tasks that are done' : 'Hide the tasks that are done, with what is below them'}
              >
                {hideCompleted ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {hideCompleted ? 'Show done' : 'Hide done'}
              </button>
            </div>
          )}

          {!isZen && <div className="absolute bottom-6 right-6 z-50">
            <ZoomControls
              zoom={zoom}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onFitToScreen={fitToScreen}
            >
              <DrawingTools
                drawingMode={drawingMode}
                onModeChange={setDrawingMode}
                pen={drawing.pen}
                onPenChange={drawing.setPen}
              />
            </ZoomControls>
          </div>}
        </div>
      )}

      <SaveDialog
        isOpen={showSaveDialog}
        isSaving={isSaving}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSave}
        defaultName={mapName || findRootNode(nodes)?.text.split('\n')[0].trim() || 'New Map'}
      />

      {showBranchImport && (
        <FileUpload
          mode="branch"
          onClose={() => setShowBranchImport(false)}
          onDataParsed={(imported, meta) => addAsBranch(imported, !!meta?.isMapFile, meta?.name ? `"${meta.name}"` : 'the file')}
        />
      )}

      <PdfExportDialog
        open={showPdfDialog}
        onOpenChange={setShowPdfDialog}
        mapSize={showPdfDialog ? (() => {
          const bounds = getContentBounds(shownNodes, drawings, boxAreas);
          return bounds ? wholeMapSizeMm(bounds) : null;
        })() : null}
        onExport={(layout) => exportWholeMap('PDF', layout)}
      />

      {loopConnectCenter && !isFocusMode && !is3DMode && (() => {
        const pos = getScreenPos(loopConnectCenter.x, loopConnectCenter.y);
        return (
          <button
            className="fixed z-50 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-card border shadow-md flex items-center justify-center text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:bg-muted transition-colors"
            style={{ left: pos.x, top: pos.y }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); handleLoopConnect(); }}
            title="Connect Nodes (Loop)"
          >
            <Link className="w-6 h-6" />
          </button>
        );
      })()}

      {selectedBoxAreaId && !is3DMode && (() => {
        const box = boxAreas.find(b => b.id === selectedBoxAreaId);
        if (!box) return null;
        return (
          <BoxAreaToolbar
            box={box}
            position={getScreenPos(box.x + box.width, box.y)}
            onColorChange={(color) => updateBoxArea(box.id, { color })}
            onColorChangeLive={(color) => replaceBoxArea(box.id, { color })}
            onLiveEditStart={checkpoint}
            onRename={() => setEditingBoxAreaId(box.id)}
            onDelete={() => deleteBoxArea(box.id)}
          />
        );
      })()}

      {((selectedLineId || selectedNodeIds.size > 0) && !isFocusMode && isPropertiesOpen) && (() => {
        if (selectedLineId) {
          if (selectedLineId.startsWith('rel::')) {
            const [, sourceId, targetId] = selectedLineId.split('::');
            const sourceNode = nodes.find(n => n.id === sourceId);
            const targetNode = nodes.find(n => n.id === targetId);

            if (!sourceNode || !targetNode) return null;

            const midX = (sourceNode.x + targetNode.x) / 2;
            const midY = (sourceNode.y + targetNode.y) / 2;
            const pos = getScreenPos(midX, midY);

            const relation = sourceNode.relations?.find(r => r.targetId === targetId);

            const values: LineSettings = {
              type: relation?.type || 'dashed',
              thickness: relation?.thickness || 'medium',
              color: relation?.color || '#ef4444',
              label: relation?.label,
              animated: relation?.animated,
              animationDirection: relation?.animationDirection,
              animationType: relation?.animationType,
              arrowDirection: relation?.arrowDirection || 'forward',
            };

            return (
              <PropertiesPanel
                key={`line-rel-${sourceId}-${targetId}`}
                mode="line"
                position={pos}
                anchorWidth={0}
                topInset={TOOLBAR_HEIGHT}
                lineValues={values}
                lineArrowPointing={getArrowheadPointing(sourceNode, targetNode, relation?.sourceSide, relation?.targetSide)}
                onLineUpdate={(updates) => {
                  const newRelations = sourceNode.relations?.map(r =>
                    r.targetId === targetId ? { ...r, ...updates } : r
                  ) || [];
                  updateNode(sourceId, { relations: newRelations });
                }}
                onLineUpdateLive={(updates) => {
                  const newRelations = sourceNode.relations?.map(r =>
                    r.targetId === targetId ? { ...r, ...updates } : r
                  ) || [];
                  replaceNode(sourceId, { relations: newRelations });
                }}
                onLiveEditStart={checkpoint}
                onDelete={() => deleteRelation(selectedLineId)}
                onClose={() => { setSelectedLineId(null); setIsPropertiesOpen(false); }}
              />
            );
          } else {
            const [parentId, childId] = selectedLineId.split('::');
            const childNode = nodes.find(n => n.id === childId);
            if (!childNode) return null;
            const parentNode = nodes.find(n => n.id === parentId);

            const pos = getScreenPos(childNode.x, childNode.y - 50);

            const resolvedLineType = childNode.lineType || parentNode?.lineType || hookConnectionStyle;
            const values: LineSettings = {
              type: resolvedLineType,
              thickness: childNode.lineThickness || 'medium',
              color: childNode.lineColor,
              label: childNode.lineLabel,
              animated: childNode.lineAnimated,
              gradient: !!childNode.lineGradient,
              tension: childNode.lineTension ?? 0.5,
              animationDirection: childNode.lineAnimationDirection,
              animationType: childNode.lineAnimationType,
              arrowDirection: childNode.lineArrowDirection || (resolvedLineType === 'arrow' ? 'forward' : 'none'),
            };

            return (
              <PropertiesPanel
                key={`line-child-${childId}`}
                mode="line"
                position={pos}
                anchorWidth={0}
                topInset={TOOLBAR_HEIGHT}
                lineValues={values}
                lineArrowPointing={parentNode ? getArrowheadPointing(parentNode, childNode, childNode.lineParentSide, childNode.lineChildSide) : undefined}
                onLineUpdate={(updates) => {
                  const nodeUpdates: Partial<NodeType> = {};
                  if (updates.type !== undefined) nodeUpdates.lineType = updates.type;
                  if (updates.thickness !== undefined) nodeUpdates.lineThickness = updates.thickness;
                  if (updates.color !== undefined) nodeUpdates.lineColor = updates.color;
                  if (updates.label !== undefined) nodeUpdates.lineLabel = updates.label;
                  if (updates.animated !== undefined) nodeUpdates.lineAnimated = updates.animated;
                  if (updates.gradient !== undefined) nodeUpdates.lineGradient = updates.gradient;
                  if (updates.tension !== undefined) nodeUpdates.lineTension = updates.tension;
                  if (updates.animationDirection !== undefined) nodeUpdates.lineAnimationDirection = updates.animationDirection;
                  if (updates.animationType !== undefined) nodeUpdates.lineAnimationType = updates.animationType;
                  if (updates.arrowDirection !== undefined) nodeUpdates.lineArrowDirection = updates.arrowDirection;
                  updateNode(childId, nodeUpdates);
                }}
                onLineUpdateLive={(updates) => {
                  const nodeUpdates: Partial<NodeType> = {};
                  if (updates.type !== undefined) nodeUpdates.lineType = updates.type;
                  if (updates.thickness !== undefined) nodeUpdates.lineThickness = updates.thickness;
                  if (updates.color !== undefined) nodeUpdates.lineColor = updates.color;
                  if (updates.label !== undefined) nodeUpdates.lineLabel = updates.label;
                  if (updates.animated !== undefined) nodeUpdates.lineAnimated = updates.animated;
                  if (updates.gradient !== undefined) nodeUpdates.lineGradient = updates.gradient;
                  if (updates.tension !== undefined) nodeUpdates.lineTension = updates.tension;
                  if (updates.animationDirection !== undefined) nodeUpdates.lineAnimationDirection = updates.animationDirection;
                  if (updates.animationType !== undefined) nodeUpdates.lineAnimationType = updates.animationType;
                  if (updates.arrowDirection !== undefined) nodeUpdates.lineArrowDirection = updates.arrowDirection;
                  replaceNode(childId, nodeUpdates);
                }}
                onLiveEditStart={checkpoint}
                onDelete={() => { reconnectParentLink(parentId, childId, 'to', null); setSelectedLineId(null); }}
                onClose={() => { setSelectedLineId(null); setIsPropertiesOpen(false); }}
              />
            );
          }
        } else if (selectedNodeIds.size === 1) {
          const nodeId = Array.from(selectedNodeIds)[0];
          const node = nodes.find(n => n.id === nodeId);
          if (!node) return null;

          const pos = getScreenPos(node.x, node.y);
          const anchorWidth = is3DMode ? undefined : (node.measuredWidth || node.width || 150) * zoom;

          return (
            <PropertiesPanel
              key={`node-${nodeId}`}
              mode="node"
              position={pos}
              anchorWidth={anchorWidth}
              topInset={TOOLBAR_HEIGHT}
              nodeValues={nodeSettingsOf(node)}
              onNodeUpdate={(updates) => updateNode(nodeId, updates)}
              onNodeUpdateLive={(updates) => replaceNode(nodeId, updates)}
              tags={node.tags}
              tagSuggestions={allTags(nodes)}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onLiveEditStart={checkpoint}
              onDelete={nodeId === findRootNode(nodes)?.id ? undefined : () => deleteNode(nodeId)}
              onCopyStyle={() => handleCopyStyle(node)}
              onPasteStyle={copiedStyle ? handlePasteStyle : undefined}
              onClose={() => { setIsPropertiesOpen(false); }}
              is3DMode={is3DMode}
            />
          );
        } else {
          const selected = nodes.filter(n => selectedNodeIds.has(n.id));
          if (selected.length === 0) return null;
          const { values, mixed } = commonNodeSettings(selected);
          const edges = selected.map((n) => {
            const { w, h } = getNodeDimensions(n);
            return { left: n.x - w / 2, right: n.x + w / 2, top: n.y - h / 2, bottom: n.y + h / 2 };
          });
          const left = Math.min(...edges.map(e => e.left));
          const right = Math.max(...edges.map(e => e.right));
          const top = Math.min(...edges.map(e => e.top));
          const bottom = Math.max(...edges.map(e => e.bottom));

          return (
            <PropertiesPanel
              key="node-multi"
              mode="node"
              position={getScreenPos((left + right) / 2, (top + bottom) / 2)}
              anchorWidth={is3DMode ? undefined : (right - left) * zoom}
              topInset={TOOLBAR_HEIGHT}
              nodeValues={values}
              mixed={mixed}
              selectionCount={selected.length}
              onNodeUpdate={updateSelectedNodes}
              onNodeUpdateLive={replaceSelectedNodes}
              tags={commonTags(selected)}
              tagSuggestions={allTags(nodes)}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onLiveEditStart={checkpoint}
              onDelete={deleteSelectedNodes}
              onPasteStyle={copiedStyle ? handlePasteStyle : undefined}
              onClose={() => { setIsPropertiesOpen(false); }}
              is3DMode={is3DMode}
            />
          );
        }
      })()}

      {(() => {
        const lastSelectedId = Array.from(selectedNodeIds).pop();
        const selectedNode = lastSelectedId ? nodes.find(n => n.id === lastSelectedId) : null;

        return (
          <NotesPanel
            key={selectedNode?.id}
            isOpen={isNotesOpen && !!selectedNode}
            onClose={() => setIsNotesOpen(false)}
            content={selectedNode?.notes || ''}
            onUpdate={(text) => {
              if (!selectedNode) return;
              if (notesCheckpointNodeRef.current !== selectedNode.id) {
                notesCheckpointNodeRef.current = selectedNode.id;
                checkpoint();
              }
              replaceNode(selectedNode.id, { notes: text });
            }}
          />
        );
      })()}
      {(() => {
        const dialogNode = nodes.find(n => n.id === actionDialog.nodeId);
        const iconNode = nodes.find(n => n.id === showIconLibrary.nodeId);
        return (
          <>
            <NodeActionDialog
              isOpen={actionDialog.isOpen}
              type={actionDialog.type}
              initialValue={actionDialog.type === 'link' ? dialogNode?.link : dialogNode?.image}
              onClose={() => setActionDialog(prev => ({ ...prev, isOpen: false }))}
              onSubmit={(value) => {
                if (actionDialog.nodeId) {
                  if (actionDialog.type === 'image') updateNode(actionDialog.nodeId, { image: value });
                  else if (actionDialog.type === 'link') updateNode(actionDialog.nodeId, { link: value });
                }
              }}
            />

            <IconLibraryDialog
              isOpen={showIconLibrary.isOpen}
              initialIcon={iconNode?.icon}
              initialStyle={iconNode?.iconStyle}
              onClose={() => setShowIconLibrary(prev => ({ ...prev, isOpen: false }))}
              onSubmit={(iconName, style) => {
                if (showIconLibrary.nodeId) {
                  updateNode(showIconLibrary.nodeId, { icon: iconName, iconStyle: iconName ? style : undefined });
                }
              }}
            />
          </>
        );
      })()}


      {!isPlaying && (
        <OutlinePanel
          isOpen={showOutline}
          onClose={() => setShowOutline(false)}
          nodes={nodes}
          selectedNodeIds={selectedNodeIds}
          onSelect={(id) => {
            setSelectedNodeIds(new Set([id]));
            setNodesToReveal([id]);
          }}
          onTextEditStart={checkpoint}
          onTextChange={(id, text) => replaceNodeText(id, text)}
          onAddSibling={(id) => {
            const newId = addSiblingNode(id);
            if (newId) setNodesToReveal([newId]);
            return newId;
          }}
          onIndent={indentNode}
          onOutdent={outdentNode}
          onMove={moveAmongSiblings}
          onToggleCollapse={handleToggleCollapse}
        />
      )}

      <SnapshotPanel
        mapId={mapId}
        nodes={nodes}
        connectionStyle={hookConnectionStyle}
        drawings={drawings}
        boxAreas={boxAreas}
        onRestore={(restoredNodes, restoredStyle, restoredDrawings, restoredBoxAreas) =>
          restoreFullState(restoredNodes, restoredStyle, restoredDrawings, restoredBoxAreas)
        }
        captureThumbnail={captureThumbnail}
        isOpen={showSnapshotPanel}
        onClose={() => setShowSnapshotPanel(false)}
      />

    </div>
  );
};

 