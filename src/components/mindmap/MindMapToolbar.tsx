/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useMemo, useState } from 'react';
import { ArrowLeft, Save, LayoutGrid, Link, Undo2, Redo2, History, CircleHelp, Focus, Play, StopCircle, Box, Globe, ChevronDown, ListPlus, BookmarkPlus, SquareDashed, Eye, Newspaper, ChevronsUpDown, ChevronsDownUp, ListTree, Command, Crosshair, Maximize2, Map as MapIcon, ListOrdered, Palette } from 'lucide-react';
import { MindMapNode, ConnectionStyle, Drawing, BoxArea } from '@/types/mindmap';
import { cn } from '@/lib/utils';
import { MOD_KEY, withShortcut } from '@/utils/shortcuts';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LineTypeSelector } from './LineTypeSelector';
import { ExportMenu } from './ExportMenu';
import { SearchBar } from './SearchBar';
import { ShortcutsDialog } from './ShortcutsDialog';
import { SaveAsTemplateDialog } from './SaveAsTemplateDialog';
import { LAYOUTS, type LayoutDirection } from '@/utils/layoutUtils';
import type { OutlineFormat } from '@/utils/exporters';
import { saveCustomTemplate } from '@/utils/customTemplates';
import { nodeDepths } from '@/utils/collapse';
import { toast } from 'sonner';
import { WhatsNewDialog } from './WhatsNewDialog';
import { ThemeToggle } from './ThemeToggle';

const LABEL_WIDE = 'hidden min-[1600px]:inline';
const LABEL_MEDIUM = 'hidden xl:inline';
const LABEL_NARROW = 'hidden lg:inline';

const MAX_COLLAPSE_LEVELS = 3;

interface MindMapToolbarProps {
    nodes: MindMapNode[];
    drawings: Drawing[];
    boxAreas: BoxArea[];
    selectedNodeIds: Set<string>;
    connectionStyle: ConnectionStyle;

    drawingMode: 'none' | 'pen' | 'eraser' | 'box';
    setDrawingMode: (mode: 'none' | 'pen' | 'eraser' | 'box') => void;

    onBack?: () => void;
    onSave: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;

    onAddRelation: () => void;
    onAddBoxArea: () => void;

    onConnectionStyleChange: (style: ConnectionStyle) => void;
    onAutoLayout: (direction: LayoutDirection) => void;
    onBranchLayout?: (direction: LayoutDirection) => void;
    onNodeSelect: (nodeId: string) => void;
    onHighlight: (nodeIds: string[]) => void;

    showSnapshotPanel: boolean;
    toggleSnapshotPanel: () => void;
    isFocusMode: boolean;
    toggleFocusMode: () => void;
    isPlaying: boolean;
    onTogglePlay: () => void;
    onExpandAll: () => void;
    showOutline: boolean;
    onToggleOutline: () => void;
    onCollapseToLevel: (level: number) => void;


    onExportToFile: () => void;
    onCopyImage: () => void;
    onExportPNG: () => void;
    onExportSVG: () => void;
    onExportPDF: () => void;
    onExportOutline: (format: OutlineFormat) => void;
    onImportBranch: () => void;
    isExporting: boolean;

    is3DMode?: boolean;
    onToggle3DMode?: () => void;

    onOpenPalette: () => void;
    isHoisted: boolean;
    onToggleHoist?: () => void;
    onToggleZen: () => void;
    showMinimap: boolean;
    onToggleMinimap: () => void;
    numbering: boolean;
    onToggleNumbering: () => void;
    statusColors: boolean;
    onToggleStatusColors: () => void;
}

export function MindMapToolbar({
    nodes,
    drawings,
    boxAreas,
    selectedNodeIds,
    connectionStyle,
    drawingMode,
    onBack,
    onSave,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onAddRelation,
    onAddBoxArea,
    onConnectionStyleChange,
    onAutoLayout,
    onBranchLayout,
    onNodeSelect,
    onHighlight,
    showSnapshotPanel,
    toggleSnapshotPanel,
    isFocusMode,
    toggleFocusMode,
    isPlaying,
    onTogglePlay,
    onExpandAll,
    onCollapseToLevel,
    showOutline,
    onToggleOutline,
    onExportToFile,
    onCopyImage,
    onExportPNG,
    onExportSVG,
    onExportPDF,
    onExportOutline,
    onImportBranch,
    isExporting,
    showShortcuts,
    setShowShortcuts,
    is3DMode = false,
    onToggle3DMode,
    onSmartAdd,
    onOpenPalette,
    isHoisted,
    onToggleHoist,
    onToggleZen,
    showMinimap,
    onToggleMinimap,
    numbering,
    onToggleNumbering,
    statusColors,
    onToggleStatusColors,
}: MindMapToolbarProps & {
    showShortcuts: boolean;
    setShowShortcuts: (show: boolean) => void;
    onSmartAdd: () => void;
}) {
    const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
    const [showWhatsNew, setShowWhatsNew] = useState(false);
    const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);

    const collapseLevels = useMemo(() => {
        const deepest = Math.max(0, ...nodeDepths(nodes).values());
        return Array.from({ length: Math.min(deepest - 1, MAX_COLLAPSE_LEVELS) }, (_, i) => i + 1);
    }, [nodes]);
    const hasCollapsed = nodes.some(node => node.collapsed);

    return (
        <div className="h-14 border-b bg-card flex items-center justify-between px-4 z-50 shrink-0 shadow-sm gap-4">
            <div className="flex items-center gap-4 shrink-0">
                <button onClick={onBack} title="Back to templates" className="p-2 hover:bg-muted rounded text-muted-foreground transition-colors shrink-0">
                    <ArrowLeft className="w-5 h-5" />
                </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <div className={cn("flex items-center gap-1", is3DMode && "opacity-50 pointer-events-none")}>
                    <button onClick={onUndo} disabled={!canUndo} className={cn("flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap", canUndo ? "hover:bg-muted text-muted-foreground hover:text-foreground" : "opacity-40 text-muted-foreground")} aria-label="Undo" title={withShortcut("Undo", MOD_KEY, "Z")}>
                        <Undo2 className="w-4 h-4" />
                        <span className={LABEL_WIDE}>Undo</span>
                    </button>
                    <button onClick={onRedo} disabled={!canRedo} className={cn("flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap", canRedo ? "hover:bg-muted text-muted-foreground hover:text-foreground" : "opacity-40 text-muted-foreground")} aria-label="Redo" title={withShortcut("Redo", MOD_KEY, "Y")}>
                        <Redo2 className="w-4 h-4" />
                        <span className={LABEL_WIDE}>Redo</span>
                    </button>
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                <div className={cn("flex items-center gap-2", is3DMode && "opacity-50 pointer-events-none")}>
                    <button
                        onClick={onSmartAdd}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Smart placement: adds a topic under the one it matches best"
                    >
                        <ListPlus className="w-4 h-4" />
                        <span className={LABEL_NARROW}>Smart Add</span>
                    </button>

                    <button
                        onClick={() => {
                            if (selectedNodeIds.size === 2) {
                                onAddRelation();
                            } else {
                                toast.info("Select exactly two nodes to connect");
                            }
                        }}
                        className={cn(
                            "flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap",
                            selectedNodeIds.size === 2 ? "text-primary hover:bg-muted" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                        title="Node Loop"
                    >
                        <Link className="w-4 h-4" />
                        <span className={LABEL_NARROW}>Node Loop</span>
                    </button>

                    <button
                        onClick={onAddBoxArea}
                        className={cn(
                            "flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap",
                            drawingMode === 'box' ? "bg-muted text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                        title={selectedNodeIds.size > 0 ? "Wrap selected nodes in a named box area (B)" : "Draw a named box area on the canvas (B)"}
                    >
                        <SquareDashed className="w-4 h-4" />
                        <span className={LABEL_MEDIUM}>Box Area</span>
                    </button>
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                <div className={cn("flex items-center gap-2", is3DMode && "opacity-50 pointer-events-none")}>
                    <div className="relative">
                        <button onClick={() => setIsLayoutMenuOpen(!isLayoutMenuOpen)} className={cn("flex items-center gap-2 px-2 py-1.5 text-xs font-medium hover:bg-muted rounded text-muted-foreground hover:text-foreground whitespace-nowrap", isLayoutMenuOpen && "bg-muted")} title="Auto-layout">
                            <LayoutGrid className="w-4 h-4" />
                            <span className={LABEL_MEDIUM}>Layout</span>
                        </button>
                        {isLayoutMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsLayoutMenuOpen(false)} />
                                <div className="absolute top-full right-0 mt-1 bg-card border rounded-lg shadow-lg py-1 w-48 z-50">
                                    {(onBranchLayout ? ['map', 'branch'] as const : ['map'] as const).map(scope => (
                                        <div key={scope}>
                                            <p className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                                                {scope === 'map' ? 'Whole map' : 'Selected branch'}
                                            </p>
                                            {LAYOUTS.map(opt => (
                                                <button
                                                    key={opt.type}
                                                    onClick={() => {
                                                        if (scope === 'branch') onBranchLayout?.(opt.type);
                                                        else onAutoLayout(opt.type);
                                                        toast.success(`Applied ${opt.label}${scope === 'branch' ? ' to the branch' : ''}`);
                                                        setIsLayoutMenuOpen(false);
                                                    }}
                                                    className="w-full text-left px-4 py-1.5 text-sm hover:bg-muted/50 bg-card"
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <LineTypeSelector
                        currentStyle={connectionStyle}
                        onStyleChange={onConnectionStyleChange}
                        label="Canvas Line Type"
                        showSubtext={true}
                    />
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                <div className="flex items-center gap-1">
                    <div className={cn("flex items-center gap-1", is3DMode && "opacity-50 pointer-events-none")}>
                        <SearchBar
                            nodes={nodes}
                            onNodeSelect={onNodeSelect}
                            onHighlight={onHighlight}
                        />

                        <button
                            onClick={onOpenPalette}
                            className="flex items-center justify-center p-1.5 rounded transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Commands, topics and maps (Ctrl + K)"
                            aria-label="Open the command palette"
                        >
                            <Command className="w-4 h-4" />
                        </button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                                    title="View Mode"
                                >
                                    <Eye className="w-4 h-4 xl:hidden" />
                                    <span className={LABEL_MEDIUM}>View Mode</span>
                                    <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 p-1">
                                <DropdownMenuItem
                                    onClick={toggleFocusMode}
                                    className={cn("flex items-center gap-2 cursor-pointer px-3 py-2", isFocusMode && "text-primary font-medium")}
                                >
                                    <Focus className="w-4 h-4 opacity-70" />
                                    <span>Focus Mode</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={onToggleHoist}
                                    disabled={!onToggleHoist}
                                    className={cn("flex items-center gap-2 cursor-pointer px-3 py-2", isHoisted && "text-primary font-medium")}
                                >
                                    <Crosshair className="w-4 h-4 opacity-70" />
                                    <span>{isHoisted ? 'Show Whole Map' : 'Show Branch Only'}</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={onToggleZen} className="flex items-center gap-2 cursor-pointer px-3 py-2">
                                    <Maximize2 className="w-4 h-4 opacity-70" />
                                    <span>Zen Mode</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={onToggleMinimap}
                                    className={cn("flex items-center gap-2 cursor-pointer px-3 py-2", showMinimap && "text-primary font-medium")}
                                >
                                    <MapIcon className="w-4 h-4 opacity-70" />
                                    <span>Minimap</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={onToggleNumbering}
                                    className={cn("flex items-center gap-2 cursor-pointer px-3 py-2", numbering && "text-primary font-medium")}
                                >
                                    <ListOrdered className="w-4 h-4 opacity-70" />
                                    <span>Numbering</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={onToggleStatusColors}
                                    className={cn("flex items-center gap-2 cursor-pointer px-3 py-2", statusColors && "text-primary font-medium")}
                                    title="Done tasks in green, overdue topics in red, high priority in orange"
                                >
                                    <Palette className="w-4 h-4 opacity-70" />
                                    <span>Status Colors</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={onTogglePlay}
                                    className={cn("flex items-center gap-2 cursor-pointer px-3 py-2", isPlaying && "text-green-600 dark:text-green-400 font-medium")}
                                >
                                    {isPlaying ? <StopCircle className="w-4 h-4 opacity-70" /> : <Play className="w-4 h-4 opacity-70" />}
                                    <span>Present</span>
                                </DropdownMenuItem>

                                {onToggle3DMode && (
                                    <DropdownMenuItem
                                        onClick={onToggle3DMode}
                                        className={cn("flex items-center gap-2 cursor-pointer px-3 py-2", is3DMode && "text-indigo-600 dark:text-indigo-400 font-medium")}
                                    >
                                        {is3DMode ? <Globe className="w-4 h-4 opacity-70" /> : <Box className="w-4 h-4 opacity-70" />}
                                        <span>3D View</span>
                                    </DropdownMenuItem>
                                )}

                                <DropdownMenuItem
                                    onClick={onToggleOutline}
                                    className={cn("flex items-center gap-2 cursor-pointer px-3 py-2", showOutline && "text-primary font-medium")}
                                >
                                    <ListTree className="w-4 h-4 opacity-70" />
                                    <span>Outline</span>
                                </DropdownMenuItem>

                                {(collapseLevels.length > 0 || hasCollapsed) && <DropdownMenuSeparator />}
                                {collapseLevels.map(level => (
                                    <DropdownMenuItem
                                        key={level}
                                        onClick={() => onCollapseToLevel(level)}
                                        className="flex items-center gap-2 cursor-pointer px-3 py-2"
                                    >
                                        <ChevronsDownUp className="w-4 h-4 opacity-70" />
                                        <span>Show {level} {level === 1 ? 'Level' : 'Levels'}</span>
                                    </DropdownMenuItem>
                                ))}
                                {(collapseLevels.length > 0 || hasCollapsed) && (
                                    <DropdownMenuItem
                                        onClick={onExpandAll}
                                        disabled={!hasCollapsed}
                                        className="flex items-center gap-2 cursor-pointer px-3 py-2"
                                    >
                                        <ChevronsUpDown className="w-4 h-4 opacity-70" />
                                        <span>Expand All</span>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <button
                            onClick={toggleSnapshotPanel}
                            className={cn("flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap", showSnapshotPanel ? "bg-muted text-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground")}
                            title="Version History"
                        >
                            <History className="w-4 h-4" />
                            <span className={LABEL_WIDE}>History</span>
                        </button>
                    </div>
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                <div className="flex items-center gap-2">
                    <button
                        onClick={onSave}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap hover:bg-muted text-muted-foreground hover:text-foreground"
                        aria-label="Save"
                        title={withShortcut("Save", MOD_KEY, "S")}
                    >
                        <Save className="w-4 h-4" />
                        <span className={LABEL_WIDE}>Save</span>
                    </button>
                    <button
                        onClick={() => setShowSaveAsTemplate(true)}
                        className="flex items-center justify-center p-1.5 rounded transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Save as Template"
                    >
                        <BookmarkPlus className="w-4 h-4" />
                    </button>
                    <SaveAsTemplateDialog
                        open={showSaveAsTemplate}
                        onOpenChange={setShowSaveAsTemplate}
                        nodeCount={nodes.length}
                        onConfirm={async (name) => {
                            try {
                                await saveCustomTemplate(name, nodes, connectionStyle, drawings, boxAreas);
                                toast.success(`Saved "${name}" as a template`);
                            } catch {
                                toast.error('Failed to save the template. Your browser storage may be full.');
                            }
                        }}
                    />
                    <ExportMenu
                        onSaveToFile={onExportToFile}
                        onCopyImage={onCopyImage}
                        onExportPNG={onExportPNG}
                        onExportSVG={onExportSVG}
                        onExportPDF={onExportPDF}
                        onExportOutline={onExportOutline}
                        onImportBranch={onImportBranch}
                        isExporting={isExporting}
                        disableImageExport={is3DMode}
                    />
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowWhatsNew(true)}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="What's New"
                    >
                        <Newspaper className="w-4 h-4 min-[1600px]:hidden" />
                        <span className={LABEL_WIDE}>What's New</span>
                    </button>
                    <WhatsNewDialog open={showWhatsNew} onOpenChange={setShowWhatsNew} />

                    <button onClick={() => setShowShortcuts(true)} className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap" title="Keyboard Shortcuts (?)">
                        <CircleHelp className="w-4 h-4" />
                        <span className={LABEL_WIDE}>Shortcuts</span>
                    </button>
                    <ShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />

                    <ThemeToggle />
                </div>
            </div>
        </div>
    );
}


 