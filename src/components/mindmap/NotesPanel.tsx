/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { lazy, Suspense, useState, useEffect } from 'react';

const NotesMarkdown = lazy(() => import('./NotesMarkdown'));

interface NotesPanelProps {
    content: string;
    onUpdate: (content: string) => void;
    onClose: () => void;
    isOpen: boolean;
}

const tabClass = (active: boolean) => cn(
    'px-3 py-1 text-xs rounded-md transition-colors',
    active ? 'bg-card shadow-sm text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
);

export const NotesPanel = ({ content, onUpdate, onClose, isOpen }: NotesPanelProps) => {
    const [value, setValue] = useState(content);
    const [mode, setMode] = useState<'write' | 'preview'>(() => (content.trim() ? 'preview' : 'write'));

    useEffect(() => {
        setValue(content || '');
    }, [content]);

    if (!isOpen) return null;

    return (
        <div className={cn(
            "fixed right-0 top-0 bottom-0 w-80 bg-card shadow-xl border-l z-50 flex flex-col transition-transform duration-300",
            isOpen ? "translate-x-0" : "translate-x-full"
        )}>
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                    <FileText className="w-5 h-5" />
                    <h3>Node Notes</h3>
                </div>
                <button onClick={onClose} aria-label="Close notes" className="p-1 hover:bg-muted rounded text-muted-foreground transition-all hover:rotate-90 duration-300">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 p-4 flex flex-col gap-2 min-h-0">
                <div className="flex self-start rounded-lg bg-muted p-0.5" role="tablist" aria-label="Notes view">
                    <button role="tab" aria-selected={mode === 'write'} onClick={() => setMode('write')} className={tabClass(mode === 'write')}>
                        Write
                    </button>
                    <button role="tab" aria-selected={mode === 'preview'} onClick={() => setMode('preview')} className={tabClass(mode === 'preview')}>
                        Preview
                    </button>
                </div>

                {mode === 'write' ? (
                    <textarea
                        value={value}
                        autoFocus={!content.trim()}
                        onChange={(e) => {
                            setValue(e.target.value);
                            onUpdate(e.target.value);
                        }}
                        className="flex-1 w-full bg-muted/50 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-sm leading-relaxed font-mono"
                        placeholder={'Write detailed notes here, in Markdown if you like:\n**bold**, *italic*, - lists, - [ ] tasks, [links](https://example.com)'}
                        aria-label="Notes"
                    />
                ) : (
                    <div
                        className="flex-1 overflow-y-auto rounded-md border p-3"
                        onDoubleClick={() => setMode('write')}
                        title="Double-click to edit"
                    >
                        {value.trim() ? (
                            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
                                <NotesMarkdown text={value} />
                            </Suspense>
                        ) : (
                            <p className="text-sm text-muted-foreground">No notes yet.</p>
                        )}
                    </div>
                )}
                <p className="text-xs text-muted-foreground text-center">
                    Changes are auto-saved
                </p>
            </div>
        </div>
    );
};
