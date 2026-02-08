import { useState, useEffect } from 'react';
import { ArrowLeft, Save, LayoutGrid, Link, Undo2, Redo2, History, CircleHelp, Focus, Play, StopCircle, Box, Globe, Sparkles, PenTool, Eraser, Monitor, ChevronDown } from 'lucide-react';
import { MindMapNode, ConnectionStyle } from '@/types/mindmap';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LineTypeSelector } from './LineTypeSelector';
import { ExportMenu } from './ExportMenu';
import { SearchBar } from './SearchBar';
import { ShortcutsDialog } from './ShortcutsDialog';
import { autoLayoutNodes } from '@/utils/layoutUtils';
import { toast } from 'sonner';
import { WhatsNewDialog } from './WhatsNewDialog';

interface MindMapToolbarProps {
    mapName?: string;
    onNameChange?: (name: string) => void;
    nodes: MindMapNode[];
    selectedNodeIds: Set<string>;
    zoom: number;
    connectionStyle: ConnectionStyle;

    // Drawing Mode
    drawingMode: 'none' | 'pen' | 'eraser';
    setDrawingMode: (mode: 'none' | 'pen' | 'eraser') => void;

    // Actions
    onBack?: () => void;
    onSave: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;

    // Actions
    onAddRelation: () => void;

    // Global Settings
    onConnectionStyleChange: (style: ConnectionStyle) => void;
    setNodes: (nodes: MindMapNode[]) => void;
    onNodeSelect: (nodeId: string) => void;
    onHighlight: (nodeIds: string[]) => void;

    // UI States
    showSnapshotPanel: boolean;
    toggleSnapshotPanel: () => void;
    isFocusMode: boolean;
    toggleFocusMode: () => void;
    // Play Mode
    isPlaying: boolean;
    onTogglePlay: () => void;


    // Export
    onExportToFile: () => void;
    onExportPNG: () => void;
    onExportPDF: () => void;
    isExporting: boolean;

    // 3D Mode
    is3DMode?: boolean;
    onToggle3DMode?: () => void;
}

export function MindMapToolbar({
    mapName,
    onNameChange,
    nodes,
    selectedNodeIds,
    zoom,
    connectionStyle,
    onBack,
    onSave,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onAddRelation,
    onConnectionStyleChange,
    setNodes,
    onNodeSelect,
    onHighlight,
    showSnapshotPanel,
    toggleSnapshotPanel,
    isFocusMode,
    toggleFocusMode,
    isPlaying,
    onTogglePlay,
    onExportToFile,
    onExportPNG,
    onExportPDF,
    isExporting,
    showShortcuts,
    setShowShortcuts,
    is3DMode = false,
    onToggle3DMode,
    onSmartAdd,
}: MindMapToolbarProps & {
    showShortcuts: boolean;
    setShowShortcuts: (show: boolean) => void;
    onSmartAdd: () => void;
}) {
    const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
    const [showWhatsNew, setShowWhatsNew] = useState(false);


    return (
        <div className="h-14 border-b bg-white flex items-center justify-between px-4 z-50 shrink-0 shadow-sm gap-4">
            <div className="flex items-center gap-4 min-w-0 shrink overflow-hidden">
                <button onClick={onBack} className="p-2 hover:bg-muted rounded text-muted-foreground transition-colors shrink-0">
                    <ArrowLeft className="w-5 h-5" />
                </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {/* 1. Navigation & History Group */}
                <div className={cn("flex items-center gap-1", is3DMode && "opacity-50 pointer-events-none")}>
                    <button onClick={onUndo} disabled={!canUndo} className={cn("flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap", canUndo ? "hover:bg-muted text-muted-foreground hover:text-foreground" : "opacity-40 text-muted-foreground")} title="Undo">
                        <Undo2 className="w-4 h-4" />
                        <span>Undo</span>
                    </button>
                    <button onClick={onRedo} disabled={!canRedo} className={cn("flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap", canRedo ? "hover:bg-muted text-muted-foreground hover:text-foreground" : "opacity-40 text-muted-foreground")} title="Redo">
                        <Redo2 className="w-4 h-4" />
                        <span>Redo</span>
                    </button>
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                {/* 2. Creation Tools Group */}
                <div className={cn("flex items-center gap-2", is3DMode && "opacity-50 pointer-events-none")}>
                    {/* Smart Add Button */}
                    <button
                        onClick={onSmartAdd}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Smart Add (AI Placement)"
                    >
                        <span>Smart Add</span>
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
                        <span className="whitespace-nowrap">Node Loop</span>
                    </button>
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                {/* 3. Organization Group */}
                <div className={cn("flex items-center gap-2", is3DMode && "opacity-50 pointer-events-none")}>
                    {/* Auto-layout */}
                    <div className="relative">
                        <button onClick={() => setIsLayoutMenuOpen(!isLayoutMenuOpen)} className={cn("flex items-center gap-2 px-2 py-1.5 text-xs font-medium hover:bg-muted rounded text-muted-foreground hover:text-foreground whitespace-nowrap", isLayoutMenuOpen && "bg-muted")} title="Auto-layout">
                            <LayoutGrid className="w-4 h-4" />
                            <span>Layout</span>
                        </button>
                        {isLayoutMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsLayoutMenuOpen(false)} />
                                <div className="absolute top-full right-0 mt-1 bg-white border rounded-lg shadow-lg py-1 w-40 z-50">
                                    {[
                                        { label: 'Horizontal Map', type: 'horizontal' },
                                        { label: 'Tree Chart', type: 'vertical' },
                                        { label: 'Radial Map', type: 'radial' },
                                    ].map(opt => (
                                        <button
                                            key={opt.type}
                                            onClick={() => {
                                                const newNodes = autoLayoutNodes(nodes, opt.type as 'horizontal' | 'vertical' | 'radial');
                                                setNodes(newNodes);
                                                toast.success(`Applied ${opt.label}`);
                                                setIsLayoutMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 bg-white"
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <LineTypeSelector
                        currentStyle={connectionStyle}
                        onStyleChange={onConnectionStyleChange}
                        label="Canva Line Type"
                        showSubtext={true}
                    />
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                {/* 4. View & Retrieval Group */}
                <div className="flex items-center gap-1">
                    <div className={cn("flex items-center gap-1", is3DMode && "opacity-50 pointer-events-none")}>
                        <SearchBar
                            nodes={nodes}
                            onNodeSelect={onNodeSelect}
                            onHighlight={onHighlight}
                        />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                                    title="View Mode"
                                >
                                    <span>View Mode</span>
                                    <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 p-1">
                                <DropdownMenuItem
                                    onClick={toggleFocusMode}
                                    className={cn("flex items-center gap-2 cursor-pointer px-3 py-2", isFocusMode && "text-primary font-medium")}
                                >
                                    <Focus className="w-4 h-4 opacity-70" />
                                    <span>Focus Mode</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                    onClick={onTogglePlay}
                                    className={cn("flex items-center gap-2 cursor-pointer px-3 py-2", isPlaying && "text-green-600 font-medium")}
                                >
                                    {isPlaying ? <StopCircle className="w-4 h-4 opacity-70" /> : <Play className="w-4 h-4 opacity-70" />}
                                    <span>Play Mode</span>
                                </DropdownMenuItem>

                                {onToggle3DMode && (
                                    <DropdownMenuItem
                                        onClick={onToggle3DMode}
                                        className={cn("flex items-center gap-2 cursor-pointer px-3 py-2", is3DMode && "text-indigo-600 font-medium")}
                                    >
                                        {is3DMode ? <Globe className="w-4 h-4 opacity-70" /> : <Box className="w-4 h-4 opacity-70" />}
                                        <span>3D View</span>
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
                            <span>History</span>
                        </button>
                    </div>
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                {/* 5. Session actions Group */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onSave}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Save"
                    >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                    </button>
                    <ExportMenu
                        onSaveToFile={onExportToFile}
                        onExportPNG={onExportPNG}
                        onExportPDF={onExportPDF}
                        isExporting={isExporting}
                    />
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                {/* 6. Info Group */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowWhatsNew(true)}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="What's New"
                    >
                        What's New
                    </button>
                    <WhatsNewDialog open={showWhatsNew} onOpenChange={setShowWhatsNew} />

                    <button onClick={() => setShowShortcuts(true)} className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap" title="Keyboard Shortcuts (?)">
                        <CircleHelp className="w-4 h-4" />
                        <span>Shortcuts</span>
                    </button>
                    <ShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
                </div>
            </div>
        </div>
    );
}


