import { Download, FileJson, Image, FileText } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExportMenuProps {
    onSaveToFile: () => void;
    onExportPNG: () => void;
    onExportPDF: () => void;
    isExporting?: boolean;
}

export const ExportMenu = ({
    onSaveToFile,
    onExportPNG,
    onExportPDF,
    isExporting = false,
}: ExportMenuProps) => {
    return (
        <DropdownMenu>
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

                <DropdownMenuItem onClick={onExportPNG} className="cursor-pointer">
                    <Image className="w-4 h-4 mr-2" />
                    <div className="flex flex-col">
                        <span>Export as PNG</span>
                        <span className="text-xs text-muted-foreground">High-quality image</span>
                    </div>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={onExportPDF} className="cursor-pointer">
                    <FileText className="w-4 h-4 mr-2" />
                    <div className="flex flex-col">
                        <span>Export as PDF</span>
                        <span className="text-xs text-muted-foreground">Print-ready document</span>
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
