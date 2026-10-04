/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { Image, Link2, FileText, Smile, Bold, Italic, Underline, Strikethrough, RemoveFormatting, AArrowDown, AArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InlineFormatCommand, applyInlineFormat, applySelectionSize, clearSelectionFormatting, stepTextSize } from '@/utils/richText';
import { useEditorSelectionFormat } from '@/hooks/useEditorSelectionFormat';

interface NodeToolbarProps {
    onAddImage: () => void;
    onAddLink: () => void;
    onAddNotes?: () => void;
    onAddIcon?: () => void;
    hasIcon?: boolean;
    hasImage?: boolean;
    hasLink?: boolean;
    className?: string;
}

const toolbarButtonClass = (active?: boolean) => cn(
    "p-1.5 hover:bg-muted rounded hover:text-blue-600 dark:hover:text-blue-400 transition-colors",
    active ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
);

export const NodeToolbar = ({
    onAddImage,
    onAddLink,
    onAddNotes,
    onAddIcon,
    hasIcon,
    hasImage,
    hasLink,
    className
}: NodeToolbarProps) => {
    return (
        <div className={cn(
            "absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1",
            "bg-card rounded-lg shadow-md border px-1 py-1 z-50",
            "animate-in fade-in slide-in-from-bottom-2 duration-200",
            className
        )}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <button
                onClick={onAddIcon}
                className={toolbarButtonClass(hasIcon)}
                title={hasIcon ? 'Change or Remove Icon' : 'Add Icon'}
            >
                <Smile className="w-4 h-4" />
            </button>
            <button
                onClick={onAddImage}
                className={toolbarButtonClass(hasImage)}
                title={hasImage ? 'Change or Remove Image' : 'Add Image'}
            >
                <Image className="w-4 h-4" />
            </button>
            <button
                onClick={onAddLink}
                className={toolbarButtonClass(hasLink)}
                title={hasLink ? 'Edit or Remove Link' : 'Add Link'}
            >
                <Link2 className="w-4 h-4" />
            </button>

            {onAddNotes && (
                <button
                    onClick={onAddNotes}
                    className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Edit Notes"
                >
                    <FileText className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

const inlineFormatButtons: { command: InlineFormatCommand; key: 'bold' | 'italic' | 'underline' | 'strike'; label: string; icon: React.ReactNode }[] = [
    { command: 'bold', key: 'bold', label: 'Bold (Ctrl+B)', icon: <Bold className="w-4 h-4" /> },
    { command: 'italic', key: 'italic', label: 'Italic (Ctrl+I)', icon: <Italic className="w-4 h-4" /> },
    { command: 'underline', key: 'underline', label: 'Underline (Ctrl+U)', icon: <Underline className="w-4 h-4" /> },
    { command: 'strikeThrough', key: 'strike', label: 'Strikethrough (Ctrl+Shift+X)', icon: <Strikethrough className="w-4 h-4" /> },
];

const formatButtonClass = "p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-40 disabled:pointer-events-none";

export const TextFormatToolbar = ({ className }: { className?: string }) => {
    const selection = useEditorSelectionFormat();

    return (
        <div className={cn(
            "absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1",
            "bg-card rounded-lg shadow-md border px-1 py-1 z-50",
            "animate-in fade-in slide-in-from-bottom-2 duration-200",
            className
        )}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
        >
            {inlineFormatButtons.map((b) => (
                <button
                    key={b.command}
                    onClick={() => applyInlineFormat(b.command)}
                    className={cn(
                        "p-1.5 rounded transition-colors",
                        selection?.[b.key]
                            ? "bg-muted text-blue-600 dark:text-blue-400"
                            : "text-muted-foreground hover:bg-muted hover:text-blue-600 dark:hover:text-blue-400"
                    )}
                    title={b.label}
                >
                    {b.icon}
                </button>
            ))}
            <div className="w-px h-5 bg-border mx-0.5" />
            <button
                onClick={() => selection && applySelectionSize(stepTextSize(selection.size, -1))}
                disabled={!selection}
                className={formatButtonClass}
                title="Smaller text (select text first)"
            >
                <AArrowDown className="w-4 h-4" />
            </button>
            <button
                onClick={() => selection && applySelectionSize(stepTextSize(selection.size, 1))}
                disabled={!selection}
                className={formatButtonClass}
                title="Larger text (select text first)"
            >
                <AArrowUp className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-border mx-0.5" />
            <button
                onClick={clearSelectionFormatting}
                disabled={!selection}
                className={formatButtonClass}
                title="Clear formatting (select text first)"
            >
                <RemoveFormatting className="w-4 h-4" />
            </button>
        </div>
    );
};
 