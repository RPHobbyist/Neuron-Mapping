/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { Download, FileJson, Image, FileText, ListTree, Copy, FileCode2, FilePlus2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OUTLINE_FORMATS, OutlineFormat } from '@/utils/exporters';
import { canCopyImages } from '@/utils/exportUtils';

interface ExportMenuProps {
    onSaveToFile: () => void;
    onCopyImage: () => void;
    onExportPNG: () => void;
    onExportSVG: () => void;
    onExportPDF: () => void;
    onExportOutline: (format: OutlineFormat) => void;
    onImportBranch: () => void;
    isExporting?: boolean;
    disableImageExport?: boolean;
}

export const ExportMenu = ({
    onSaveToFile,
    onCopyImage,
    onExportPNG,
    onExportSVG,
    onExportPDF,
    onExportOutline,
    onImportBranch,
    isExporting = false,
    disableImageExport = false,
}: ExportMenuProps) => {
    const imageHint = (hint: string) => (disableImageExport ? 'Switch to 2D view to export' : hint);
    const copySupported = canCopyImages();
    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <button
                    disabled={isExporting}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50"
                    title="Export options"
                >
                    <Download className="w-4 h-4" />
                    <span className="hidden xl:inline">
                        {isExporting ? 'Exporting...' : 'Export'}
                    </span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={onSaveToFile} className="cursor-pointer">
                    <FileJson className="w-4 h-4 mr-2" />
                    <div className="flex flex-col">
                        <span>Save to File</span>
                        <span className="text-xs text-muted-foreground">.nmm format (re-editable)</span>
                    </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={onCopyImage}
                    disabled={disableImageExport || !copySupported}
                    className="cursor-pointer"
                >
                    <Copy className="w-4 h-4 mr-2" />
                    <div className="flex flex-col">
                        <span>Copy image</span>
                        <span className="text-xs text-muted-foreground">
                            {copySupported ? imageHint('Paste the whole map anywhere') : 'Not supported by this browser'}
                        </span>
                    </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={onExportPNG}
                    disabled={disableImageExport}
                    className="cursor-pointer"
                >
                    <Image className="w-4 h-4 mr-2" />
                    <div className="flex flex-col">
                        <span>Export as PNG</span>
                        <span className="text-xs text-muted-foreground">{imageHint('High-quality image')}</span>
                    </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={onExportSVG}
                    disabled={disableImageExport}
                    className="cursor-pointer"
                >
                    <FileCode2 className="w-4 h-4 mr-2" />
                    <div className="flex flex-col">
                        <span>Export as SVG</span>
                        <span className="text-xs text-muted-foreground">{imageHint('Sharp at any zoom in a browser')}</span>
                    </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={onExportPDF}
                    disabled={disableImageExport}
                    className="cursor-pointer"
                >
                    <FileText className="w-4 h-4 mr-2" />
                    <div className="flex flex-col">
                        <span>Export as PDF…</span>
                        <span className="text-xs text-muted-foreground">{imageHint('One page, or paper to print')}</span>
                    </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer">
                        <ListTree className="w-4 h-4 mr-2" />
                        <div className="flex flex-col">
                            <span>Export as outline</span>
                            <span className="text-xs text-muted-foreground">Topics as text, to edit elsewhere</span>
                        </div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-60">
                        {OUTLINE_FORMATS.map(({ format, name, hint }) => (
                            <DropdownMenuItem key={format} onClick={() => onExportOutline(format)} className="cursor-pointer">
                                <div className="flex flex-col">
                                    <span>{name} (.{format})</span>
                                    <span className="text-xs text-muted-foreground">{hint}</span>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={onImportBranch} className="cursor-pointer">
                    <FilePlus2 className="w-4 h-4 mr-2" />
                    <div className="flex flex-col">
                        <span>Add a file as a branch…</span>
                        <span className="text-xs text-muted-foreground">Under the selected topic, or drop a file on one</span>
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
