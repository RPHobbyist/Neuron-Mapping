import { useRef, useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { MindMapNode as NodeType, NodeColor, NodeShape, ConnectionStyle, Drawing, Side } from '@/types/mindmap';
import { MindMapNode } from './MindMapNode';
import { ConnectionLines, ConnectionHandles } from './ConnectionLines';
import { SaveDialog } from './SaveDialog';
import { NotesPanel } from './NotesPanel';
import { ZoomControls } from './ZoomControls';
import { saveToFile, exportToPNG, exportToPDF, generateThumbnail } from '@/utils/exportUtils';
import { NodeActionDialog } from './NodeActionDialog';
import { useMindMapNodes } from '@/hooks/useMindMapNodes';
import { useAutoSave, AutoSaveData } from '@/hooks/useAutoSave';
import { toast } from 'sonner';
import { Pencil, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PropertiesPanel, LineSettings } from './LinePropertiesPanel';
import { MindMapToolbar } from './MindMapToolbar';
import { SnapshotPanel } from './SnapshotPanel';
import { usePlayMode } from '@/hooks/usePlayMode';
import { AnimatePresence } from 'framer-motion';
import { IconLibraryDialog } from './IconLibraryDialog';
import { SmartAddPanel } from './SmartAddPanel';
import { findBestParent } from '@/utils/smartPlacement';
import { MIN_ZOOM, MAX_ZOOM, DETACHED_PARENT_ID } from '@/lib/constants';

const GalaxyView = lazy(() => import('./GalaxyView').then(module => ({ default: module.GalaxyView })));

interface MindMapCanvasProps {
  initialNodes?: NodeType[];
  initialDrawings?: Drawing[];
  onBack?: () => void;
  connectionStyle?: ConnectionStyle;
  onSave?: (name: string, nodes: NodeType[], thumbnail: string | undefined, connectionStyle: ConnectionStyle, drawings?: Drawing[]) => void | Promise<void>;
  onNameChange?: (name: string) => void;
  mapName?: string;
  mapId?: string;
}

const defaultNodes: NodeType[] = [
  { id: 'root', text: 'Product Launch\nChecklist', x: 0, y: 0, color: 'root' as NodeColor, parentId: null },
];

const PEN_CURSOR = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>') 0 24, crosshair`;
const ERASER_CURSOR = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>') 12 12, cell`;

export const MindMapCanvas = ({
  initialNodes = defaultNodes,
  initialDrawings = [],
  onBack,
  connectionStyle = 'orthogonal',
  onSave,
  onNameChange,
  mapName,
  mapId,
}: MindMapCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const {
    nodes, setNodes, resetNodes, restoreFullState, undo, redo, canUndo, canRedo, saveSnapshot,
    selectedNodeIds, setSelectedNodeIds,
    selectedLineId, setSelectedLineId,
    addChildNode, addRelation, pinConnectionSides, updateNodePosition, replaceNodeText, replaceNode, updateNode, updateNodeMeasurement, updateNodeSize,
    deleteNode, deleteSelectedNodes, deleteRelation, reconnectRelation,
    connectionStyle: hookConnectionStyle, applyGlobalConnectionStyle,
    drawings, setDrawings, replaceDrawings
  } = useMindMapNodes(initialNodes, connectionStyle, initialDrawings);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const notesSnapshotTakenRef = useRef(false);
  const [focusRootIds, setFocusRootIds] = useState<Set<string> | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showSnapshotPanel, setShowSnapshotPanel] = useState(false);
  const [editTrigger, setEditTrigger] = useState<{ nodeId: string; token: number } | null>(null);

  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);

  const { isPlaying, visibleNodeIds, visibleLineIds, startPlay, stopPlay } = usePlayMode(nodes);
  const [is3DMode, setIs3DMode] = useState(false);
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    nodeId: string | null;
    type: 'image' | 'link' | null;
  }>({ isOpen: false, nodeId: null, type: null });

  const [showIconLibrary, setShowIconLibrary] = useState<{ isOpen: boolean, nodeId: string | null }>({ isOpen: false, nodeId: null });
  const [isSmartAddOpen, setIsSmartAddOpen] = useState(false);

  const [drawingMode, setDrawingMode] = useState<'none' | 'pen' | 'eraser'>('none');
  const [currentPath, setCurrentPath] = useState<{ x: number, y: number }[]>([]);

  const [lineDrag, setLineDrag] = useState<{
    connectionId: string;
    endpoint: 'from' | 'to';
    pos: { x: number, y: number };
    hoverNodeId: string | null;
  } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawingMode !== 'none') {
        setDrawingMode('none');
        toast.info("Exit drawing mode");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingMode]);


  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    if (!contentRef.current) return { x: 0, y: 0 };
    const rect = contentRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom
    };
  }, [zoom]);

  const getMousePos = (e: React.MouseEvent) => screenToCanvas(e.clientX, e.clientY);

  const getNodeBounds = (node: NodeType) => ({
    w: node.measuredWidth || node.width || (node.id === 'root' ? 128 : Math.max(100, node.text.length * 8 + 48)),
    h: node.measuredHeight || node.height || (node.id === 'root' ? 128 : 50),
  });

  const findNodeAtPosition = useCallback((pos: { x: number, y: number }, excludeIds: Set<string>) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (excludeIds.has(n.id)) continue;
      const { w, h } = getNodeBounds(n);
      if (Math.abs(pos.x - n.x) <= w / 2 && Math.abs(pos.y - n.y) <= h / 2) return n.id;
    }
    return null;
  }, [nodes]);

  const distToSegment = (p: { x: number, y: number }, a: { x: number, y: number }, b: { x: number, y: number }) => {
    const l2 = Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
    if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const q = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
    return Math.hypot(p.x - q.x, p.y - q.y);
  };

  const eraseDrawingsAt = (pos: { x: number, y: number }) => {
    const eraserRadius = 15 / zoom;
    replaceDrawings(prev => prev.filter(d => {
      for (let i = 0; i < d.points.length - 1; i++) {
        if (distToSegment(pos, d.points[i], d.points[i + 1]) < eraserRadius) return false;
      }
      if (d.points.length === 1) {
        return Math.hypot(d.points[0].x - pos.x, d.points[0].y - pos.y) >= eraserRadius;
      }
      return true;
    }));
  };

  const getDescendants = useCallback((nodeId: string, currentNodes: NodeType[]): Set<string> => {
    const descendants = new Set<string>([nodeId]);
    const queue = [nodeId];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = currentNodes.filter(n => n.parentId === currentId);
      children.forEach(c => {
        descendants.add(c.id);
        queue.push(c.id);
      });
    }
    return descendants;
  }, []);

  const handleEndpointDragStart = useCallback((connectionId: string, endpoint: 'from' | 'to', e: React.PointerEvent) => {
    const isRelation = connectionId.startsWith('rel::');
    const startClientX = e.clientX;
    const startClientY = e.clientY;

    const excludeIds = isRelation
      ? new Set<string>()
      : getDescendants(connectionId.split('::')[1], nodes);

    let didDrag = false;
    let snapshotSaved = false;
    const DRAG_THRESHOLD = 3;

    const handleMove = (moveEvent: MouseEvent) => {
      if (!didDrag) {
        if (Math.hypot(moveEvent.clientX - startClientX, moveEvent.clientY - startClientY) < DRAG_THRESHOLD) return;
        didDrag = true;
        if (!snapshotSaved) {
          snapshotSaved = true;
          saveSnapshot();
        }
      }

      const pos = screenToCanvas(moveEvent.clientX, moveEvent.clientY);
      const hoverNodeId = findNodeAtPosition(pos, excludeIds);
      setLineDrag({ connectionId, endpoint, pos, hoverNodeId });
    };

    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);

      if (didDrag) {
        setLineDrag(current => {
          if (current) {
            if (isRelation) {
              reconnectRelation(connectionId, endpoint, current.hoverNodeId);
            } else {
              const [, childId] = connectionId.split('::');
              if (current.hoverNodeId) {
                updateNode(childId, { parentId: current.hoverNodeId });
                setSelectedLineId(`${current.hoverNodeId}::${childId}`);
              } else {
                updateNode(childId, { parentId: DETACHED_PARENT_ID });
                setSelectedLineId(null);
              }
            }
          }
          return null;
        });
      }
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [nodes, getDescendants, screenToCanvas, findNodeAtPosition, saveSnapshot, reconnectRelation, updateNode, setSelectedLineId]);

  const toggleFocusMode = useCallback(() => {
    if (isFocusMode) {
      setIsFocusMode(false);
      setFocusRootIds(null);
      toast.info("Focus mode deactivated");
    } else {
      if (selectedNodeIds.size === 0) {
        toast.warning("Select a node to focus on its branch");
        return;
      }
      setFocusRootIds(new Set(selectedNodeIds));
      setIsFocusMode(true);
      toast.success("Focus mode activated");
    }
  }, [isFocusMode, selectedNodeIds]);

  const focusedNodeIds = useMemo(() => {
    if (!isFocusMode || !focusRootIds) return null;
    const focused = new Set<string>();
    focusRootIds.forEach(id => {
      const descendants = getDescendants(id, nodes);
      descendants.forEach(d => focused.add(d));
    });
    return focused;
  }, [isFocusMode, focusRootIds, nodes, getDescendants]);

  const handleAutoLoad = useCallback((data: AutoSaveData) => {
    resetNodes(data.nodes, data.connectionStyle, data.drawings);
  }, [resetNodes]);

  useAutoSave(nodes, hookConnectionStyle, drawings, handleAutoLoad);


  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (drawingMode !== 'none') {
      const pos = getMousePos(e);
      if (drawingMode === 'pen') {
        setIsDragging(true);
        setCurrentPath([pos]);
      } else if (drawingMode === 'eraser') {
        saveSnapshot();
        setIsDragging(true);
        eraseDrawingsAt(pos);
      }
      return;
    }

    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-area')) {
      setIsPropertiesOpen(false);

      if (e.shiftKey) {
        setDragStart({ x: e.clientX, y: e.clientY });
        setSelectionBox({ x: e.clientX, y: e.clientY, w: 0, h: 0 });
      } else {
        setSelectedNodeIds(new Set());
        setSelectedLineId(null);
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (drawingMode !== 'none' && isDragging) {
      const pos = getMousePos(e);
      if (drawingMode === 'pen') {
        setCurrentPath(prev => [...prev, pos]);
      } else if (drawingMode === 'eraser') {
        eraseDrawingsAt(pos);
      }
      return;
    }

    if (selectionBox) {
      const currentX = e.clientX;
      const currentY = e.clientY;
      const startX = dragStart.x;
      const startY = dragStart.y;
      const x = Math.min(currentX, startX);
      const y = Math.min(currentY, startY);
      const w = Math.abs(currentX - startX);
      const h = Math.abs(currentY - startY);
      setSelectionBox({ x, y, w, h });
    } else if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleCanvasMouseUp = () => {
    if (drawingMode !== 'none' && isDragging) {
      if (drawingMode === 'pen' && currentPath.length > 1) {
        setDrawings(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          points: currentPath,
          color: '#EF4444'
        }]);
      }
      setCurrentPath([]);
      setIsDragging(false);
      return;
    }

    if (selectionBox) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const offsetX = rect.left;
        const offsetY = rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const boxLeft = (selectionBox.x - offsetX - centerX - pan.x) / zoom;
        const boxTop = (selectionBox.y - offsetY - centerY - pan.y) / zoom;
        const boxRight = boxLeft + (selectionBox.w / zoom);
        const boxBottom = boxTop + (selectionBox.h / zoom);

        const newSelected = new Set<string>();
        if (selectionBox.w > 5 || selectionBox.h > 5) {
          nodes.forEach(node => {
            if (node.x >= boxLeft && node.x <= boxRight &&
              node.y >= boxTop && node.y <= boxBottom) {
              newSelected.add(node.id);
            }
          });
          if (newSelected.size > 0) {
            setSelectedNodeIds(newSelected);
            setIsPropertiesOpen(true);
          }
        }
      }
      setSelectionBox(null);
    }
    setIsDragging(false);
  };

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const onNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.min(Math.max(prev + delta, MIN_ZOOM), MAX_ZOOM));
    };

    el.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => el.removeEventListener('wheel', onNativeWheel);
  }, [is3DMode]);

  const handleSave = async (name: string) => {
    setIsSaving(true);
    try {
      let thumbnail = undefined;
      if (canvasRef.current) {
        try {
          thumbnail = await generateThumbnail(canvasRef.current);
        } catch (e) {
        }
      }
      await onSave?.(name, nodes, thumbnail, hookConnectionStyle, drawings);
      toast.success('Saved!');
      setShowSaveDialog(false);
    } catch (e) {
      console.error('Save failed:', e);
      toast.error('Failed to save. Your browser storage may be full.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGlobalStyleChange = useCallback((style: ConnectionStyle) => {
    applyGlobalConnectionStyle(style);
    toast.success(`Applied ${style} style to all lines`);
  }, [applyGlobalConnectionStyle]);

  const handleExportToFile = () => {
    try {
      saveToFile(nodes, mapName || 'mindmap', hookConnectionStyle, drawings);
      toast.success('Mind map saved to file!');
    } catch {
      toast.error('Failed to save file');
    }
  };

  const handleExportPNG = async () => {
    if (!canvasRef.current) {
      toast.error('Switch to 2D view to export images');
      return;
    }
    setIsExporting(true);
    try {
      await exportToPNG(canvasRef.current, mapName || 'mindmap');
      toast.success('Exported as PNG!');
    } catch {
      toast.error('Failed to export PNG');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!canvasRef.current) {
      toast.error('Switch to 2D view to export images');
      return;
    }
    setIsExporting(true);
    try {
      await exportToPDF(canvasRef.current, mapName || 'mindmap');
      toast.success('Exported as PDF!');
    } catch {
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.querySelector('input:focus, textarea:focus')) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeIds.size > 0) deleteSelectedNodes();
        else if (selectedLineId && selectedLineId.startsWith('rel::')) deleteRelation(selectedLineId);
      }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
      }
      else if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setShowShortcuts(true);
      }
      else if (selectedNodeIds.size === 1) {
        const selectedId = Array.from(selectedNodeIds)[0];
        const selected = nodes.find(n => n.id === selectedId);
        if (!selected) return;

        if (e.key === 'Tab') {
          e.preventDefault();
          addChildNode(selectedId);
        }
        else if (e.key === 'F2' || e.key === ' ') {
          e.preventDefault();
          saveSnapshot();
          setEditTrigger({ nodeId: selectedId, token: Date.now() });
        }
        else if (e.key.startsWith('Arrow')) {
          e.preventDefault();
          let targetId: string | null = null;

          if (e.key === 'ArrowLeft') {
            if (selected.parentId) targetId = selected.parentId;
          } else if (e.key === 'ArrowRight') {
            const children = nodes.filter(n => n.parentId === selectedId);
            if (children.length > 0) {
              targetId = children[Math.floor(children.length / 2)].id;
            }
          } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            if (selected.parentId) {
              const siblings = nodes.filter(n => n.parentId === selected.parentId).sort((a, b) => a.y - b.y);
              const idx = siblings.findIndex(n => n.id === selectedId);
              if (idx !== -1) {
                if (e.key === 'ArrowUp' && idx > 0) targetId = siblings[idx - 1].id;
                if (e.key === 'ArrowDown' && idx < siblings.length - 1) targetId = siblings[idx + 1].id;
              }
            }
          }

          if (targetId) setSelectedNodeIds(new Set([targetId]));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedNodeIds, selectedLineId, deleteSelectedNodes, deleteRelation, addChildNode, nodes, setSelectedNodeIds, setEditTrigger, saveSnapshot]);

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
  }, [setSelectedLineId, setSelectedNodeIds]);

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

  const handleRequestImage = useCallback((id: string) => {
    setActionDialog({ isOpen: true, nodeId: id, type: 'image' });
  }, []);

  const handleRequestLink = useCallback((id: string) => {
    setActionDialog({ isOpen: true, nodeId: id, type: 'link' });
  }, []);

  const handleRequestNotes = useCallback((id: string) => {
    notesSnapshotTakenRef.current = false;
    const target = nodes.find(n => n.id === id);
    if (target && !target.notes) {
      replaceNode(id, { notes: ' ' });
    }
    setSelectedNodeIds(new Set([id]));
    setIsNotesOpen(true);
  }, [nodes, replaceNode, setSelectedNodeIds]);

  const handleRequestIcon = useCallback((id: string) => {
    setShowIconLibrary({ isOpen: true, nodeId: id });
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background flex flex-col">
      <MindMapToolbar
        mapName={mapName}
        onNameChange={onNameChange}
        nodes={nodes}
        selectedNodeIds={selectedNodeIds}
        zoom={zoom}
        connectionStyle={hookConnectionStyle}
        onBack={onBack}
        onSave={() => mapId ? handleSave(mapName || 'Untitled') : setShowSaveDialog(true)}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onAddRelation={addRelation}
        onConnectionStyleChange={handleGlobalStyleChange}
        setNodes={setNodes}
        onNodeSelect={(nodeId) => {
          setSelectedNodeIds(new Set([nodeId]));
          setIsPropertiesOpen(false);
          const node = nodes.find(n => n.id === nodeId);
          if (node) setPan({ x: -node.x * zoom, y: -node.y * zoom });
        }}
        onHighlight={setHighlightedNodeIds}
        showSnapshotPanel={showSnapshotPanel}
        toggleSnapshotPanel={() => setShowSnapshotPanel(!showSnapshotPanel)}
        isFocusMode={isFocusMode}
        toggleFocusMode={toggleFocusMode}
        isPlaying={isPlaying}
        onTogglePlay={isPlaying ? stopPlay : startPlay}
        onExportToFile={handleExportToFile}
        onExportPNG={handleExportPNG}
        onExportPDF={handleExportPDF}
        isExporting={isExporting}
        showShortcuts={showShortcuts}
        setShowShortcuts={setShowShortcuts}
        is3DMode={is3DMode}
        onToggle3DMode={() => setIs3DMode(!is3DMode)}
        onSmartAdd={() => setIsSmartAddOpen(true)}
        drawingMode={drawingMode}
        setDrawingMode={setDrawingMode}
      />

      <SmartAddPanel
        isOpen={isSmartAddOpen}
        onClose={() => setIsSmartAddOpen(false)}
        nodes={nodes}
        selectedNodeIds={selectedNodeIds}
        onAdd={(text) => {
          const parentId = findBestParent(nodes, text, selectedNodeIds);
          const parentNode = nodes.find(n => n.id === parentId);

          const newNodeId = addChildNode(parentId, text);
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
        <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-black text-white">Loading 3D Galaxy...</div>}>
          <div className="flex-1 relative overflow-hidden bg-black">
            <GalaxyView
              nodes={nodes}
              selectedNodeIds={selectedNodeIds}
              onExit={() => setIs3DMode(false)}
              onNodeMove={updateNodePosition}
              onNodeDragStart={saveSnapshot}
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
      ) : (
        <div className="flex-1 relative overflow-hidden bg-canvas">
          <div
            ref={canvasRef}
            className={cn(
              "w-full h-full canvas-dots canvas-area",
              drawingMode === 'none' ? "cursor-grab active:cursor-grabbing" : ""
            )}
            style={{
              cursor: drawingMode === 'pen' ? PEN_CURSOR : drawingMode === 'eraser' ? ERASER_CURSOR : undefined
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          >
            <div
              ref={contentRef}
              className="absolute canvas-area origin-center"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                left: '50%',
                top: '50%'
              }}
            >
              <ConnectionLines
                nodes={nodes}
                zoom={zoom}
                connectionStyle={hookConnectionStyle}
                selectedLineId={selectedLineId}
                onLineSelect={(id) => {
                  setSelectedLineId(id);
                  if (id) setIsPropertiesOpen(true);
                }}
                visibleLineIds={visibleLineIds}
              />
              <AnimatePresence>
                {nodes.map((node) => {
                  if (isPlaying && !visibleNodeIds.has(node.id)) return null;

                  return (
                    <MindMapNode
                      key={node.id}
                      node={node}
                      isSelected={selectedNodeIds.has(node.id)}
                      onSelect={handleNodeSelect}
                      onPositionChange={updateNodePosition}
                      onTextChange={replaceNodeText}
                      onSizeChange={updateNodeSize}
                      onMeasureNode={updateNodeMeasurement}
                      onAddChild={addChildNode}
                      onRequestImage={handleRequestImage}
                      onRequestLink={handleRequestLink}
                      onRequestNotes={handleRequestNotes}
                      onAddIcon={handleRequestIcon}
                      onDragStart={() => { pinConnectionSides(node.id); saveSnapshot(); }}
                      editTrigger={editTrigger?.nodeId === node.id ? editTrigger.token : undefined}
                      zoom={zoom}
                      isDimmed={isFocusMode && focusedNodeIds ? !focusedNodeIds.has(node.id) : false}
                      isHighlighted={highlightedNodeIds.includes(node.id)}
                    />
                  );
                })}
              </AnimatePresence>

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
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                  {currentPath.length > 0 && (
                    <polyline
                      points={currentPath.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </g>
              </svg>

              <ConnectionHandles
                nodes={nodes}
                zoom={zoom}
                connectionStyle={hookConnectionStyle}
                selectedLineId={selectedLineId}
                visibleLineIds={visibleLineIds}
                onSetConnectionSide={handleSetConnectionSide}
                onEndpointDragStart={handleEndpointDragStart}
              />

              {lineDrag && (() => {
                const isRelation = lineDrag.connectionId.startsWith('rel::');
                const parts = lineDrag.connectionId.split('::');
                const fixedNodeId = isRelation
                  ? (lineDrag.endpoint === 'from' ? parts[2] : parts[1])
                  : (lineDrag.endpoint === 'from' ? parts[1] : parts[0]);
                const fixedNode = nodes.find(n => n.id === fixedNodeId);
                const hoverNode = lineDrag.hoverNodeId ? nodes.find(n => n.id === lineDrag.hoverNodeId) : null;
                if (!fixedNode) return null;

                return (
                  <svg
                    className="absolute pointer-events-none overflow-visible"
                    style={{ left: -5000, top: -5000, width: 10000, height: 10000, zIndex: 20 }}
                  >
                    <g transform="translate(5000, 5000)">
                      <line
                        x1={fixedNode.x}
                        y1={fixedNode.y}
                        x2={lineDrag.pos.x}
                        y2={lineDrag.pos.y}
                        stroke="#f97316"
                        strokeWidth={2 / zoom}
                        strokeDasharray="6 4"
                      />
                      {hoverNode && (() => {
                        const { w, h } = getNodeBounds(hoverNode);
                        return (
                          <rect
                            x={hoverNode.x - w / 2 - 4}
                            y={hoverNode.y - h / 2 - 4}
                            width={w + 8}
                            height={h + 8}
                            rx={10}
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

            {selectionBox && (
              <div
                className="fixed border-2 border-primary bg-primary/20 pointer-events-none z-[100]"
                style={{
                  left: selectionBox.x,
                  top: selectionBox.y,
                  width: selectionBox.w,
                  height: selectionBox.h
                }}
              />
            )}
          </div>

          <div className="absolute bottom-0 left-0 z-40 bg-white/90 backdrop-blur-sm border-t border-r border-border/50 shadow-sm rounded-tr-lg p-0.5 flex items-center group hover:bg-white transition-colors">
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
          </div>

          <div className="absolute bottom-6 right-6 z-50">
            <ZoomControls
              zoom={zoom}
              onZoomIn={() => setZoom(z => Math.min(MAX_ZOOM, z + 0.1))}
              onZoomOut={() => setZoom(z => Math.max(MIN_ZOOM, z - 0.1))}
              onReset={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            >
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDrawingMode(drawingMode === 'pen' ? 'none' : 'pen')}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    drawingMode === 'pen'
                      ? "bg-red-50 text-red-500"
                      : "text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105"
                  )}
                  title="Pencil (Red)"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDrawingMode(drawingMode === 'eraser' ? 'none' : 'eraser')}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    drawingMode === 'eraser'
                      ? "bg-blue-50 text-blue-500"
                      : "text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105"
                  )}
                  title="Eraser"
                >
                  <Eraser className="w-4 h-4" />
                </button>
              </div>
            </ZoomControls>
          </div>
        </div>
      )}

      <SaveDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSave}
        defaultName={mapName || nodes.find(n => n.parentId === null)?.text || 'New Map'}
      />

      {((selectedLineId || selectedNodeIds.size === 1) && !isFocusMode && isPropertiesOpen) && (() => {
        const getScreenPos = (x: number, y: number) => {
          if (is3DMode) {
            return { x: window.innerWidth - 340, y: 96 };
          }
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
          return {
            x: rect.left + rect.width / 2 + pan.x + (x * zoom),
            y: rect.top + rect.height / 2 + pan.y + (y * zoom)
          };
        };

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
                lineValues={values}
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
                onLiveEditStart={saveSnapshot}
                onDelete={() => deleteRelation(selectedLineId)}
                onClose={() => { setSelectedLineId(null); setIsPropertiesOpen(false); }}
              />
            );
          } else {
            const [, childId] = selectedLineId.split('::');
            const childNode = nodes.find(n => n.id === childId);
            if (!childNode) return null;

            const pos = getScreenPos(childNode.x, childNode.y - 50);

            const resolvedLineType = childNode.lineType || hookConnectionStyle;
            const values: LineSettings = {
              type: resolvedLineType,
              thickness: childNode.lineThickness || 'medium',
              color: childNode.lineColor,
              label: childNode.lineLabel,
              animated: childNode.lineAnimated,
              gradient: childNode.lineGradient,
              tension: childNode.lineTension,
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
                lineValues={values}
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
                onLiveEditStart={saveSnapshot}
                onDelete={() => { updateNode(childId, { parentId: DETACHED_PARENT_ID }); setSelectedLineId(null); }}
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
              nodeValues={{
                color: node.color,
                shape: node.shape,
                priority: node.priority,
                lineType: node.lineType,
                nodeAnimation: node.nodeAnimation,
                icon: node.icon,
                iconStyle: node.iconStyle
              }}
              onNodeUpdate={(updates) => updateNode(nodeId, updates)}
              onNodeUpdateLive={(updates) => replaceNode(nodeId, updates)}
              onLiveEditStart={saveSnapshot}
              onDelete={nodeId === 'root' ? undefined : () => deleteNode(nodeId)}
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
            isOpen={isNotesOpen && !!selectedNode}
            onClose={() => setIsNotesOpen(false)}
            content={selectedNode?.notes || ''}
            onUpdate={(text) => {
              if (!selectedNode) return;
              if (!notesSnapshotTakenRef.current) {
                notesSnapshotTakenRef.current = true;
                saveSnapshot();
              }
              replaceNode(selectedNode.id, { notes: text });
            }}
          />
        );
      })()}
      <NodeActionDialog
        isOpen={actionDialog.isOpen}
        type={actionDialog.type}
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
        onClose={() => setShowIconLibrary(prev => ({ ...prev, isOpen: false }))}
        onSubmit={(iconName, style) => {
          if (showIconLibrary.nodeId) {
            updateNode(showIconLibrary.nodeId, { icon: iconName, iconStyle: style });
          }
        }}
      />


      <SnapshotPanel
        nodes={nodes}
        connectionStyle={hookConnectionStyle}
        drawings={drawings}
        onRestore={(restoredNodes, restoredStyle, restoredDrawings) =>
          restoreFullState(restoredNodes, restoredStyle, restoredDrawings)
        }
        isOpen={showSnapshotPanel}
        onClose={() => setShowSnapshotPanel(false)}
      />

    </div>
  );
};

 