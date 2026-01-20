import { useState, useEffect } from 'react';
import { ArrowLeft, Save, LayoutGrid, Link, Undo2, Redo2, History, CircleHelp, Focus, Play, StopCircle, Box, Globe, Sparkles } from 'lucide-react';
import { MindMapNode, ConnectionStyle } from '@/types/mindmap';
import { cn } from '@/lib/utils';
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
    onToggle3DMode
}: MindMapToolbarProps & { showShortcuts: boolean; setShowShortcuts: (show: boolean) => void }) {
    const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
    const [showWhatsNew, setShowWhatsNew] = useState(false);
    const [localName, setLocalName] = useState(mapName);

    // Sync local name if mapName changes (e.g. after save)
    useEffect(() => {
        setLocalName(mapName);
    }, [mapName]);

    return (
        <div className="h-14 border-b bg-white flex items-center justify-between px-4 z-50 shrink-0 shadow-sm gap-4">
            <div className="flex items-center gap-4 min-w-0 shrink overflow-hidden">
                <button onClick={onBack} className="p-2 hover:bg-muted rounded text-muted-foreground transition-colors shrink-0">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                {/* Auto-sizing Input: Grid layout with hidden span mirroring content */}
                <div className="grid items-center min-w-0 max-w-[300px]">
                    <span
                        className="invisible col-start-1 row-start-1 font-semibold text-lg px-2 py-1 whitespace-pre min-w-[50px] truncate"
                        aria-hidden="true"
                    >
                        {mapName || 'Untitled Map'}
                    </span>
                    <input
                        type="text"
                        value={mapName || ''}
                        onChange={(e) => onNameChange?.(e.target.value)}
                        placeholder="Untitled Map"
                        className="col-start-1 row-start-1 w-full font-semibold text-lg bg-transparent border border-transparent hover:border-border hover:bg-muted/30 focus:bg-white focus:border-primary rounded px-2 py-1 outline-none transition-all truncate"
                        title="Rename Map"
                    />
                </div>
            </div>

            {/* Action Bar (Moved to Properties Panel) */}
            {/* Right Actions - Logically Grouped */}
            <div className="flex items-center gap-2 shrink-0">
                {/* 1. History Group */}
                <div className={cn("flex items-center gap-1", is3DMode && "opacity-50 pointer-events-none")}>
                    <button onClick={onUndo} disabled={!canUndo} className={cn("flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap", canUndo ? "hover:bg-muted text-muted-foreground hover:text-foreground" : "opacity-40 text-muted-foreground")} title="Undo">
                        <Undo2 className="w-4 h-4" />
                        <span className="hidden xl:inline">Undo</span>
                    </button>
                    <button onClick={onRedo} disabled={!canRedo} className={cn("flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap", canRedo ? "hover:bg-muted text-muted-foreground hover:text-foreground" : "opacity-40 text-muted-foreground")} title="Redo">
                        <Redo2 className="w-4 h-4" />
                        <span className="hidden xl:inline">Redo</span>
                    </button>
                    <button
                        onClick={toggleSnapshotPanel}
                        className={cn("flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap", showSnapshotPanel ? "bg-muted text-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground")}
                        title="Version History"
                    >
                        <History className="w-4 h-4" />
                        <span className="hidden xl:inline">History</span>
                    </button>
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                {/* 2. Tools Group (Connect, Line Type, Layout) */}
                <div className={cn("flex items-center gap-2", is3DMode && "opacity-50 pointer-events-none")}>
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
                        <span className="hidden lg:inline whitespace-nowrap">Node Loop</span>
                    </button>

                    <LineTypeSelector
                        currentStyle={connectionStyle}
                        onStyleChange={onConnectionStyleChange}
                        label="Canva Line Type"
                        showSubtext={true}
                    />

                    {/* Auto-layout */}
                    <div className="relative">
                        <button onClick={() => setIsLayoutMenuOpen(!isLayoutMenuOpen)} className={cn("flex items-center gap-2 px-2 py-1.5 text-xs font-medium hover:bg-muted rounded text-muted-foreground hover:text-foreground whitespace-nowrap", isLayoutMenuOpen && "bg-muted")} title="Auto-layout">
                            <LayoutGrid className="w-4 h-4" />
                            <span className="hidden lg:inline">Layout</span>
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
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                {/* 3. View & Search Group */}
                <div className="flex items-center gap-1">
                    <div className={cn("flex items-center gap-1", is3DMode && "opacity-50 pointer-events-none")}>
                        <SearchBar
                            nodes={nodes}
                            onNodeSelect={onNodeSelect}
                            onHighlight={onHighlight}
                        />

                        <button
                            onClick={toggleFocusMode}
                            className={cn("flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap", isFocusMode ? "bg-primary text-white" : "hover:bg-muted text-muted-foreground hover:text-foreground")}
                            title={isFocusMode ? "Exit Focus Mode" : "Focus Mode"}
                        >
                            <Focus className="w-4 h-4" />
                            <span className="hidden xl:inline">Focus</span>
                        </button>

                        <button
                            onClick={onTogglePlay}
                            className={cn(
                                "flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap",
                                isPlaying ? "bg-green-500 text-white hover:bg-green-600" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                            title={isPlaying ? "Stop Play Mode" : "Start Play Mode"}
                        >
                            {isPlaying ? <StopCircle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            <span className="hidden xl:inline">Play</span>
                        </button>
                    </div>

                    {onToggle3DMode && (
                        <button
                            onClick={onToggle3DMode}
                            className={cn(
                                "flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap",
                                is3DMode ? "bg-indigo-600 text-white hover:bg-indigo-700" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                            title={is3DMode ? "Exit 3D View" : "Enter 3D View"}
                        >
                            {is3DMode ? <Globe className="w-4 h-4" /> : <Box className="w-4 h-4" />}
                            <span className="hidden xl:inline">3D View</span>
                        </button>
                    )}
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                {/* 4. File Group */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onSave}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Save"
                    >
                        <Save className="w-4 h-4" />
                        <span className="hidden xl:inline">Save</span>
                    </button>
                    <ExportMenu
                        onSaveToFile={onExportToFile}
                        onExportPNG={onExportPNG}
                        onExportPDF={onExportPDF}
                        isExporting={isExporting}
                    />
                </div>

                <div className="w-px h-6 bg-border mx-1" />

                {/* 5. Info Group */}
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
                        <span className="hidden xl:inline">Shortcuts</span>
                    </button>
                    <ShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
                </div>
            </div>
        </div>
    );
}


