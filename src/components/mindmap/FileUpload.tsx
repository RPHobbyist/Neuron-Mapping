import { useState, useRef } from 'react';
import { Upload, FileText, FileCode, FileType, X, Loader2, HelpCircle } from 'lucide-react';
import { parseFile } from '@/utils/parsers';
import { autoLayoutNodes } from '@/utils/layoutUtils';
import { MindMapNode } from '@/types/mindmap';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { MAX_FILE_SIZE } from '@/lib/constants';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface FileUploadProps {
    onDataParsed: (nodes: MindMapNode[]) => void;
    onClose: () => void;
}

export const FileUpload = ({ onDataParsed, onClose }: FileUploadProps) => {
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
        if (e.target.files && e.target.files.length > 0) {
            await processFile(e.target.files[0]);
        }
    };

    const processFile = async (file: File) => {
        if (file.size > MAX_FILE_SIZE) {
            toast.error(`File is too large. Maximum size is 100MB.`);
            return;
        }
        setIsParsing(true);
        try {
            const nodes = await parseFile(file);
            if (nodes.length === 0) {
                toast.error('No valid content found in file');
            } else {
                // Apply auto-layout immediately for a "very good" initial experience
                const layoutNodes = autoLayoutNodes(nodes, 'horizontal');
                toast.success(`Successfully parsed ${nodes.length} nodes from ${file.name}`);
                onDataParsed(layoutNodes);
                onClose();
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to parse file: ' + (error instanceof Error ? error.message : String(error)));
        } finally {
            setIsParsing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">Import from File</h3>
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
                                </DialogHeader>
                                <div className="space-y-6 text-sm">
                                    {/* TXT Format */}
                                    <div>
                                        <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                                            <FileText className="w-4 h-4" /> Text File (.txt)
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

                                    {/* MD Format */}
                                    <div>
                                        <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                                            <FileText className="w-4 h-4" /> Markdown (.md)
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
- Item 2`}
                                        </pre>
                                    </div>

                                    {/* CSV Format */}
                                    <div>
                                        <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                                            <FileType className="w-4 h-4" /> CSV File (.csv)
                                        </h4>
                                        <p className="text-muted-foreground mb-2">
                                            <strong>First column</strong> = parent node, <strong>other columns</strong> = child nodes:
                                        </p>
                                        <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                                            {`Category,Item 1,Item 2,Item 3
Fruits,Apple,Banana,Orange
Vegetables,Carrot,Broccoli,Spinach`}
                                        </pre>
                                    </div>

                                    {/* XML Format */}
                                    <div>
                                        <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                                            <FileCode className="w-4 h-4" /> XML File (.xml)
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

                                    {/* OPML Format */}
                                    <div>
                                        <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                                            <FileCode className="w-4 h-4" /> OPML File (.opml)
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
                                    </div>

                                    {/* JSON Format */}
                                    <div>
                                        <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                                            <FileCode className="w-4 h-4" /> JSON File (.json)
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
                                    </div>

                                    <div className="bg-black border border-gray-800 rounded-lg p-3">
                                        <p className="text-white text-xs">
                                            💡 <strong>Tip:</strong> After import, use the auto-layout feature to organize your mind map automatically.
                                        </p>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-muted rounded-full transition-all hover:rotate-90 duration-300"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

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
                            accept=".txt,.md,.markdown,.json,.csv,.xml,.opml"
                            onChange={handleFileSelect}
                        />

                        {isParsing ? (
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                <p className="text-sm text-muted-foreground">Parsing file content...</p>
                            </div>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                    <Upload className="w-8 h-8 text-primary" />
                                </div>
                                <h4 className="font-medium text-lg mb-2">Click or drag file to upload</h4>
                                <p className="text-sm text-muted-foreground max-w-xs mb-6">
                                    Support for .txt, .md, .json, .csv, .xml, and .opml files.
                                    Structure will be automatically generated.
                                </p>

                                <div className="flex gap-4 justify-center">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="p-2 bg-muted rounded">
                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">Text/MD</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="p-2 bg-muted rounded">
                                            <FileCode className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">JSON/OPML</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="p-2 bg-muted rounded">
                                            <FileType className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">CSV</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
