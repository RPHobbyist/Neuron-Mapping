import { X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

interface NotesPanelProps {
    content: string;
    onUpdate: (content: string) => void;
    onClose: () => void;
    isOpen: boolean;
}

export const NotesPanel = ({ content, onUpdate, onClose, isOpen }: NotesPanelProps) => {
    const [value, setValue] = useState(content);

    // Sync local state when prop changes (e.g. source node changed)
    useEffect(() => {
        setValue(content || '');
    }, [content]);

    if (!isOpen) return null;

    return (
        <div className={cn(
            "fixed right-0 top-0 bottom-0 w-80 bg-white shadow-xl border-l z-50 flex flex-col transition-transform duration-300",
            isOpen ? "translate-x-0" : "translate-x-full"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <FileText className="w-5 h-5" />
                    <h3>Node Notes</h3>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-all hover:rotate-90 duration-300">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 flex flex-col gap-2">
                <textarea
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        onUpdate(e.target.value);
                    }}
                    className="flex-1 w-full bg-slate-50 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-sm leading-relaxed"
                    placeholder="Write detailed notes here using Markdown..."
                />
                <p className="text-xs text-slate-400 text-center">
                    Changes are auto-saved
                </p>
            </div>
        </div>
    );
};
