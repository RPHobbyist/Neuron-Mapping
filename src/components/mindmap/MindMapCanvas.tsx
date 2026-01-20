import { useRef, useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { MindMapNode as NodeType, NodeColor, NodeShape, ConnectionStyle } from '@/types/mindmap';
import { MindMapNode } from './MindMapNode';
import { ConnectionLines } from './ConnectionLines';
import { SaveDialog } from './SaveDialog';
import { NotesPanel } from './NotesPanel';
import { ZoomControls } from './ZoomControls';
import { saveToFile, exportToPNG, exportToPDF, generateThumbnail } from '@/utils/exportUtils';
import { NodeActionDialog } from './NodeActionDialog';
import { useMindMapNodes } from '@/hooks/useMindMapNodes';
import { useAutoSave, AutoSaveData } from '@/hooks/useAutoSave';
import { toast } from 'sonner';
import { LayoutGrid, Save, ArrowLeft, Trash2, Undo2, Redo2, Link, CircleHelp, Focus, Play, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PropertiesPanel, LineSettings } from './LinePropertiesPanel';
import { MindMapToolbar } from './MindMapToolbar';
import { SnapshotPanel } from './SnapshotPanel';
import { usePlayMode } from '@/hooks/usePlayMode';
import { AnimatePresence } from 'framer-motion';
import { IconLibraryDialog } from './IconLibraryDialog';

// Lazy load GalaxyView to split Three.js chunk
const GalaxyView = lazy(() => import('./GalaxyView').then(module => ({ default: module.GalaxyView })));

interface MindMapCanvasProps {
  initialNodes?: NodeType[];
  onBack?: () => void;
  connectionStyle?: ConnectionStyle;
  onSave?: (name: string, nodes: NodeType[], thumbnail: string | undefined, connectionStyle: ConnectionStyle) => void;
  onNameChange?: (name: string) => void;
  mapName?: string;
  mapId?: string;
}

const defaultNodes: NodeType[] = [
  { id: 'root', text: 'Product Launch\nChecklist', x: 0, y: 0, color: 'root' as NodeColor, parentId: null },
];



export const MindMapCanvas = ({
  initialNodes = defaultNodes,
  onBack,
  connectionStyle = 'orthogonal', // Default to orthogonal (step) lines
  onSave,
  onNameChange,
  mapName,
  mapId,
}: MindMapCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Business Logic from Hook
  const {
    nodes, setNodes, undo, redo, canUndo, canRedo, saveSnapshot,
    selectedNodeIds, setSelectedNodeIds,
    selectedLineId, setSelectedLineId,
    addChildNode, addRelation, updateNodePosition, updateNodeText, replaceNodeText, updateNode, updateNodeSize,
    updateSelectedNodesColor, updateSelectedNodesShape, updateSelectedNodesLineType, updateSelectedNodesPriority,
    deleteNode, deleteSelectedNodes, deleteRelation,
    connectionStyle: hookConnectionStyle, setConnectionStyle
  } = useMindMapNodes(initialNodes);



  // UI State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 }); // For Pan AND Selection Box
  const [isDragging, setIsDragging] = useState(false);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [focusRootIds, setFocusRootIds] = useState<Set<string> | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showSnapshotPanel, setShowSnapshotPanel] = useState(false);

  // Properties Panel Visibility
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);

  // Play Mode Hook
  const { isPlaying, visibleNodeIds, visibleLineIds, startPlay, stopPlay } = usePlayMode(nodes);
  const [is3DMode, setIs3DMode] = useState(false);
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    nodeId: string | null;
    type: 'image' | 'link' | null;
  }>({ isOpen: false, nodeId: null, type: null });

  const [showIconLibrary, setShowIconLibrary] = useState<{ isOpen: boolean, nodeId: string | null }>({ isOpen: false, nodeId: null });

  // Focus Mode Logic
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

  // Auto-save integration (must be after state declarations)
  const handleAutoLoad = useCallback((data: AutoSaveData) => {
    setNodes(data.nodes);
    if (data.connectionStyle) {
      setConnectionStyle(data.connectionStyle);
    }
  }, [setNodes, setConnectionStyle]);

  // Auto-save integration (must be after state declarations)
  useAutoSave(nodes, hookConnectionStyle, handleAutoLoad);

  // Sync connectionStyle prop only on mount/change if provided, but hook manages source of truth
  useEffect(() => {
    if (connectionStyle) {
      setConnectionStyle(connectionStyle);
    }
  }, [connectionStyle, setConnectionStyle]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Determine if we should close the properties panel
    // Keep open if clicking inside it? No, it catches its own events usually.
    // If clicking canvas directly:
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-area')) {
      // Close properties panel on background click
      setIsPropertiesOpen(false);

      if (e.shiftKey) {
        // Start Box Selection
        setDragStart({ x: e.clientX, y: e.clientY });
        setSelectionBox({ x: e.clientX, y: e.clientY, w: 0, h: 0 });
      } else {
        // Standard Pan
        setSelectedNodeIds(new Set()); // Deselect all on click empty
        setSelectedLineId(null);
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (selectionBox) { // Box Selection
      const currentX = e.clientX;
      const currentY = e.clientY;
      const startX = dragStart.x;
      const startY = dragStart.y;
      const x = Math.min(currentX, startX);
      const y = Math.min(currentY, startY);
      const w = Math.abs(currentX - startX);
      const h = Math.abs(currentY - startY);
      setSelectionBox({ x, y, w, h });
    } else if (isDragging) { // Pan
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleCanvasMouseUp = () => {
    if (selectionBox) {
      // Finalize Box Selection (Screen -> Node coordinates)
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
            setIsPropertiesOpen(true); // Open properties for box selection? Optional, but likely desired.
          }
        }
      }
      setSelectionBox(null);
    }
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.25), 2));
  };

  const handleSave = async (name: string) => {
    setIsSaving(true);
    try {
      let thumbnail = undefined;
      if (canvasRef.current) {
        try {
          thumbnail = await generateThumbnail(canvasRef.current);
        } catch (e) {
          console.warn('Thumbnail generation failed', e);
        }
      }
      onSave?.(name, nodes, thumbnail, hookConnectionStyle);
      toast.success('Saved!');
      setShowSaveDialog(false);
    } catch {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGlobalStyleChange = useCallback((style: ConnectionStyle) => {
    // 1. Update the default global style
    setConnectionStyle(style);

    // 2. Clear individual overrides from all nodes and relations to enforce uniformity
    setNodes((prev) => prev.map(node => {
      const newNode = { ...node };
      // Clear node line override
      if (newNode.lineType) delete newNode.lineType;

      // Clear relation line overrides
      if (newNode.relations) {
        newNode.relations = newNode.relations.map(r => {
          const newRel = { ...r };
          if (newRel.type) delete newRel.type;
          return newRel;
        });
      }
      return newNode;
    }));

    toast.success(`Applied ${style} style to all lines`);
  }, [setConnectionStyle, setNodes]);

  const handleExportToFile = () => {
    try {
      saveToFile(nodes, mapName || 'mindmap', connectionStyle);
      toast.success('Mind map saved to file!');
    } catch {
      toast.error('Failed to save file');
    }
  };

  const handleExportPNG = async () => {
    if (!canvasRef.current) return;
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
    if (!canvasRef.current) return;
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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (document.querySelector('input:focus, textarea:focus')) return;

      // Deletion
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeIds.size > 0) deleteSelectedNodes();
        else if (selectedLineId && selectedLineId.startsWith('rel::')) deleteRelation(selectedLineId);
      }
      // Undo/Redo
      else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
      }
      // Help Dialog
      else if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setShowShortcuts(true);
      }
      // Navigation & Editing
      else if (selectedNodeIds.size === 1) {
        const selectedId = Array.from(selectedNodeIds)[0];
        const selected = nodes.find(n => n.id === selectedId);
        if (!selected) return;

        // Add Child (Tab)
        if (e.key === 'Tab') {
          e.preventDefault();
          addChildNode(selectedId);
        }
        // Edit Text (F2 or Space)
        else if (e.key === 'F2' || e.key === ' ') {
          e.preventDefault();
          // Logic to trigger edit mode handled by Node component, but we can prevent default scroll
        }
        // Navigation (Arrows)
        else if (e.key.startsWith('Arrow')) {
          e.preventDefault();
          let targetId: string | null = null;

          if (e.key === 'ArrowLeft') {
            // Go to parent
            if (selected.parentId) targetId = selected.parentId;
          } else if (e.key === 'ArrowRight') {
            // Go to first child
            const children = nodes.filter(n => n.parentId === selectedId);
            if (children.length > 0) {
              targetId = children[Math.floor(children.length / 2)].id;
            }
          } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            // Go to sibling
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
  }, [undo, redo, selectedNodeIds, selectedLineId, deleteSelectedNodes, deleteRelation, addChildNode, nodes, setSelectedNodeIds]);

  const selectedNode = selectedNodeIds.size > 0 ? nodes.find((n) => n.id === Array.from(selectedNodeIds)[0]) : null;

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
    // Explicit click on node enables the properties panel
    setIsPropertiesOpen(true);
    setSelectedLineId(null);
  }, [setSelectedLineId, setSelectedNodeIds]);

  const handleRequestImage = useCallback((id: string) => {
    setActionDialog({ isOpen: true, nodeId: id, type: 'image' });
  }, []);

  const handleRequestLink = useCallback((id: string) => {
    setActionDialog({ isOpen: true, nodeId: id, type: 'link' });
  }, []);

  const handleRequestNotes = useCallback((id: string) => {
    // 1. Ensure node has notes field initialized
    const node = nodes.find(n => n.id === id);
    if (node && !node.notes) {
      updateNode(id, { notes: ' ' });
    }
    // 2. Select the node to ensure panel shows correct data
    setSelectedNodeIds(new Set([id]));
    // 3. Open panel
    setIsNotesOpen(true);
    setIsNotesOpen(true);
  }, [nodes, updateNode, setSelectedNodeIds]);

  const handleRequestIcon = useCallback((id: string) => {
    setShowIconLibrary({ isOpen: true, nodeId: id });
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background flex flex-col">
      {/* ... Top Toolbar code ... */}
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
          // Search selection should NOT open properties panel
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
      />

      {/* Canvas Area */}
      {is3DMode ? (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-black text-white">Loading 3D Galaxy...</div>}>
          <div className="flex-1 relative overflow-hidden bg-black">
            <GalaxyView
              nodes={nodes}
              selectedNodeIds={selectedNodeIds}
              onExit={() => setIs3DMode(false)}
              onNodeMove={updateNodePosition}
              onNodeClick={(id, e) => handleNodeSelect(e, id)}
              onNodeDoubleClick={(id) => {
                // Focus on Double Click or trigger edit?
                // For now, toggle Focus Mode as a power user feature, OR just select.
                // Or better: Simulate F2 by finding the node and maybe showing a prompt since we don't have a 3D Input yet.
                // We'll rely on the properties panel for text editing for now, so double click can be 'Focus Mode'

                // OR: Just select and ensure panel is open.
                setSelectedNodeIds(new Set([id]));
                setIsPropertiesOpen(true);
              }}
              onLineSelect={(sourceId, targetId, relationId) => {
                if (relationId) {
                  setSelectedLineId(relationId);
                } else {
                  setSelectedLineId(`conn::${sourceId}::${targetId}`); // Assuming child ID connection convention or use child ID if hierarchical
                  // Actually standard lines in 2D are usually selected by the Child Node ID they connect TO.
                  // Let's assume targetId is the child
                  setSelectedLineId(`conn::${targetId}`);
                }
                setIsPropertiesOpen(true);
              }}
            />
          </div>
        </Suspense>
      ) : (
        <div className="flex-1 relative overflow-hidden bg-canvas">
          <div
            ref={canvasRef}
            className="w-full h-full canvas-dots canvas-area cursor-grab active:cursor-grabbing"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onWheel={handleWheel}
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
                pan={pan}
                connectionStyle={hookConnectionStyle}
                selectedLineId={selectedLineId}
                onLineSelect={(id) => {
                  setSelectedLineId(id);
                  // Selecting a line should open properties
                  if (id) setIsPropertiesOpen(true);
                }}
                visibleLineIds={visibleLineIds}
              />
              {/* Nodes Rendered via AnimatePresence for Exit animations */}
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
                      onUpdateNode={updateNode}
                      onAddChild={addChildNode}
                      onRequestImage={handleRequestImage}
                      onRequestLink={handleRequestLink}
                      onRequestNotes={handleRequestNotes}
                      onAddIcon={handleRequestIcon}
                      onDragStart={saveSnapshot}
                      zoom={zoom}
                      isDimmed={isFocusMode && focusedNodeIds ? !focusedNodeIds.has(node.id) : false}
                      isHighlighted={highlightedNodeIds.includes(node.id)}
                    />
                  );
                })}
              </AnimatePresence>
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

          {/* Zoom Controls */}
          <ZoomControls
            zoom={zoom}
            onZoomIn={() => setZoom(z => Math.min(2, z + 0.1))}
            onZoomOut={() => setZoom(z => Math.max(0.1, z - 0.1))}
            onReset={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          />
        </div>
      )}

      <SaveDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSave}
        defaultName={mapName || nodes.find(n => n.parentId === null)?.text || 'New Map'}
      />

      {/* Properties Panel (Line or Node) */}
      {((selectedLineId || selectedNodeIds.size === 1) && !isFocusMode && isPropertiesOpen && !is3DMode) && (() => {
        if (selectedLineId) {
          if (selectedLineId.startsWith('rel::')) {
            const [, sourceId, targetId] = selectedLineId.split('::');
            const sourceNode = nodes.find(n => n.id === sourceId);
            if (!sourceNode) return null;
            const relation = sourceNode.relations?.find(r => r.targetId === targetId);

            const values: LineSettings = {
              type: relation?.type || 'dashed',
              thickness: relation?.thickness || 'medium',
              color: relation?.color || '#ef4444',
              label: relation?.label,
              animated: relation?.animated,
              animationDirection: relation?.animationDirection,
              animationType: relation?.animationType,
            };

            return (
              <PropertiesPanel
                mode="line"
                lineValues={values}
                onLineUpdate={(updates) => {
                  const newRelations = sourceNode.relations?.map(r =>
                    r.targetId === targetId ? { ...r, ...updates } : r
                  ) || [];
                  updateNode(sourceId, { relations: newRelations });
                }}
                onClose={() => { setSelectedLineId(null); setIsPropertiesOpen(false); }}
              />
            );
          } else {
            const [, childId] = selectedLineId.split('::');
            const childNode = nodes.find(n => n.id === childId);
            if (!childNode) return null;

            const values: LineSettings = {
              type: childNode.lineType || hookConnectionStyle,
              thickness: childNode.lineThickness || 'medium',
              color: childNode.lineColor,
              label: childNode.lineLabel,
              animated: childNode.lineAnimated,
              gradient: childNode.lineGradient,
              tension: childNode.lineTension,
              animationDirection: childNode.lineAnimationDirection,
              animationType: childNode.lineAnimationType
            };

            return (
              <PropertiesPanel
                mode="line"
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
                  updateNode(childId, nodeUpdates);
                }}
                onClose={() => { setSelectedLineId(null); setIsPropertiesOpen(false); }}
              />
            );
          }
        } else if (selectedNodeIds.size === 1) {
          const nodeId = Array.from(selectedNodeIds)[0];
          const node = nodes.find(n => n.id === nodeId);
          if (!node) return null;

          return (
            <PropertiesPanel
              mode="node"
              nodeValues={{
                color: node.color,
                shape: node.shape,
                priority: node.priority,
                lineType: node.lineType,
                icon: node.icon,
                iconStyle: node.iconStyle
              }}
              onNodeUpdate={(updates) => updateNode(nodeId, updates)}
              onDelete={nodeId === 'root' ? undefined : () => deleteNode(nodeId)}
              onClose={() => { setIsPropertiesOpen(false); }}
              is3DMode={is3DMode}
            />
          );
        }
      })()}

      {/* Notes Panel */}
      {(() => {
        const lastSelectedId = Array.from(selectedNodeIds).pop();
        const selectedNode = lastSelectedId ? nodes.find(n => n.id === lastSelectedId) : null;

        return (
          <NotesPanel
            isOpen={isNotesOpen && !!selectedNode}
            onClose={() => setIsNotesOpen(false)}
            content={selectedNode?.notes || ''}
            onUpdate={(text) => {
              if (selectedNode) updateNode(selectedNode.id, { notes: text });
            }}
          />
        );
      })()}
      {/* Node Action Dialog */}
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

      {/* Icon Library Dialog */}
      <IconLibraryDialog
        isOpen={showIconLibrary.isOpen}
        onClose={() => setShowIconLibrary(prev => ({ ...prev, isOpen: false }))}
        onSubmit={(iconName, style) => {
          if (showIconLibrary.nodeId) {
            updateNode(showIconLibrary.nodeId, { icon: iconName, iconStyle: style });
          }
        }}
      />

      {/* Presentation Mode Removed */}

      {/* Snapshot Panel */}
      <SnapshotPanel
        nodes={nodes}
        onRestore={(restoredNodes) => setNodes(() => restoredNodes)}
        isOpen={showSnapshotPanel}
        onClose={() => setShowSnapshotPanel(false)}
      />

      {/* Bulk Action Toolbar Removed */}
    </div>
  );
};

