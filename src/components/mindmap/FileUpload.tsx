/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState, useRef } from 'react';
import { Upload, Loader2, HelpCircle } from 'lucide-react';
import { autoLayoutNodes } from '@/utils/layoutUtils';
import { ImportFileError, readImportFile } from '@/utils/importFile';
import { MindMapNode, ConnectionStyle, Drawing, BoxArea } from '@/types/mindmap';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface FileUploadProps {
    onDataParsed: (nodes: MindMapNode[], meta?: { name?: string; connectionStyle?: ConnectionStyle; drawings?: Drawing[]; boxAreas?: BoxArea[]; isMapFile?: boolean }) => Promise<boolean> | boolean | void;
    onClose: () => void;
    mode?: 'map' | 'branch';
}

export const FileUpload = ({ onDataParsed, onClose, mode = 'map' }: FileUploadProps) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (file) await processFile(file);
    };

    const processFile = async (file: File) => {
        setIsParsing(true);
        try {
            const imported = await readImportFile(file);
            const nodes = mode === 'map' && !imported.isMapFile ? autoLayoutNodes(imported.nodes, 'horizontal') : imported.nodes;
            const { name, connectionStyle, drawings, boxAreas, isMapFile } = imported;
            const used = await onDataParsed(nodes, { name, connectionStyle, drawings, boxAreas, isMapFile });
            if (used === false) return;
            if (mode === 'map') {
                toast.success(isMapFile ? `Loaded "${name}"` : `Imported ${nodes.length} ${nodes.length === 1 ? 'topic' : 'topics'} from ${file.name}`);
            }
            onClose();
        } catch (error) {
            console.error(error);
            const message = error instanceof Error ? error.message : String(error);
            toast.error(error instanceof ImportFileError ? message : `Failed to parse file: ${message}`);
        } finally {
            setIsParsing(false);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => { if (!open && !isParsing) onClose(); }}>
            <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden bg-card sm:rounded-xl">
                <DialogHeader className="p-4 border-b space-y-0">
                    <div className="flex items-center gap-2">
                        <DialogTitle>{mode === 'branch' ? 'Add a File as a Branch' : 'Import from File'}</DialogTitle>
                        <Dialog>
                            <DialogTrigger asChild>
                                <button
                                    className="p-1 hover:bg-muted rounded-full transition-colors"
                                    title="Format Help"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>File Format Guide</DialogTitle>
                                    <DialogDescription>How each kind of file is read into a map.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 text-sm">
                                    <div>
                                        <h4 className="font-semibold text-base mb-2">
                                            Text File (.txt)
                                        </h4>
                                        <p className="text-muted-foreground mb-2">
                                            Use <strong>indentation</strong> (tabs or spaces) to define parent/child relationships:
                                        </p>
                                        <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                                            {`My Project
    Task 1
        Subtask 1.1
        Subtask 1.2
    Task 2
        Subtask 2.1`}
                                        </pre>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-base mb-2">
                                            Markdown (.md)
                                        </h4>
                                        <p className="text-muted-foreground mb-2">
                                            Use <strong>headers (#)</strong> or <strong>lists (-)</strong> with indentation:
                                        </p>
                                        <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                                            {`# Main Topic
## Subtopic 1
### Detail 1.1
## Subtopic 2

Or with lists:
- Item 1
  - Child 1.1
  - Child 1.2
- Item 2

Task lists work too:
- [ ] To do
- [x] Done`}
                                        </pre>
                                        <p className="text-muted-foreground mt-2 text-xs">
                                            Bold, italic, code and checkboxes are stripped from node text automatically. A link becomes the node's link, and paragraphs, quotes and code under a heading or item become its notes.
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-base mb-2">
                                            CSV File (.csv)
                                        </h4>
                                        <p className="text-muted-foreground mb-2">
                                            <strong>First column</strong> = parent node, <strong>other columns</strong> = child nodes:
                                        </p>
                                        <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                                            {`Fruits,Apple,Banana,Orange
Vegetables,Carrot,Broccoli,Spinach`}
                                        </pre>
                                        <p className="text-muted-foreground mt-2 text-xs">
                                            Every row becomes a branch, so leave out a header row. A row whose first column names a node from an earlier row adds to that node, so rows can build deeper levels. When all rows form one tree, its top node becomes the root.
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-base mb-2">
                                            XML File (.xml)
                                        </h4>
                                        <p className="text-muted-foreground mb-2">
                                            <strong>Nested elements</strong> define the hierarchy:
                                        </p>
                                        <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                                            {`<project>
  <phase name="Planning">
    <task>Research</task>
    <task>Design</task>
  </phase>
  <phase name="Development">
    <task>Coding</task>
  </phase>
</project>`}
                                        </pre>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-base mb-2">
                                            OPML File (.opml)
                                        </h4>
                                        <p className="text-muted-foreground mb-2">
                                            Standard format for outlines (used by many mind map apps):
                                        </p>
                                        <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                                            {`<opml version="1.0">
  <body>
    <outline text="Project">
      <outline text="Task A" />
      <outline text="Task B">
        <outline text="Subtask" />
      </outline>
    </outline>
  </body>
</opml>`}
                                        </pre>
                                        <p className="text-muted-foreground mt-2 text-xs">
                                            Notes in <code>_note</code> and links in <code>url</code> are kept.
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-base mb-2">
                                            JSON File (.json)
                                        </h4>
                                        <p className="text-muted-foreground mb-2">
                                            <strong>Nested objects/arrays</strong> define the hierarchy:
                                        </p>
                                        <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                                            {`{
  "Project": {
    "Phase 1": ["Task A", "Task B"],
    "Phase 2": {
      "SubPhase": ["Task C"]
    }
  }
}`}
                                        </pre>
                                        <p className="text-muted-foreground mt-2 mb-2 text-xs">
                                            Tree exports from other apps (with <code className="bg-muted px-1 rounded">name</code>/<code className="bg-muted px-1 rounded">text</code>/<code className="bg-muted px-1 rounded">title</code> + <code className="bg-muted px-1 rounded">children</code>) are also recognized directly:
                                        </p>
                                        <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                                            {`{
  "name": "Project",
  "children": [
    { "name": "Phase 1", "children": [
      { "name": "Task A" }
    ]}
  ]
}`}
                                        </pre>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-base mb-2">
                                            Other mind map apps
                                        </h4>
                                        <p className="text-muted-foreground text-xs">
                                            <strong>XMind (.xmind)</strong>, from XMind 8 and later: every sheet, with notes, links, labels (as tags), priority and task markers, pictures, floating topics and relationships.
                                        </p>
                                        <p className="text-muted-foreground text-xs mt-2">
                                            <strong>FreeMind and Freeplane (.mm)</strong>: topics with their formatted text, notes, links, attributes (added to the notes) and arrow links.
                                        </p>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <DialogDescription className="sr-only">
                        {mode === 'branch'
                            ? "Choose a file; its topics are added under the selected topic."
                            : 'Choose a file to open as a map.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8">
                    <div
                        className={cn(
                            "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer",
                            isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30",
                            isParsing && "opacity-50 pointer-events-none"
                        )}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            id="file-upload-input"
                            name="file-upload"
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".txt,.md,.markdown,.json,.csv,.xml,.opml,.nmm,.mm,.xmind"
                            onChange={handleFileSelect}
                        />

                        {isParsing ? (
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                <p className="text-sm text-muted-foreground">Reading the file…</p>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-6 h-6 text-muted-foreground mb-3" aria-hidden="true" />
                                <p className="font-medium mb-2">Drop a file here, or click to choose one</p>
                                <p className="text-sm text-muted-foreground max-w-xs">
                                    Text, Markdown, JSON, CSV, XML and OPML files work, and so do maps from XMind (.xmind),
                                    FreeMind and Freeplane (.mm).
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
 