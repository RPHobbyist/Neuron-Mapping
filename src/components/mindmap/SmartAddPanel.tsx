import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Send, Wand2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { MindMapNode } from '@/types/mindmap';
import { findBestParent } from '@/utils/smartPlacement';
import { colorStyles } from '@/utils/nodeStyles';

interface SmartAddPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (text: string) => void;
    nodes: MindMapNode[];
    selectedNodeIds?: Set<string>;
}

const firstLine = (text: string) => {
    const line = text.split('\n')[0];
    return line.length > 28 ? `${line.substring(0, 28)}...` : line;
};

export const SmartAddPanel = ({ isOpen, onClose, onAdd, nodes, selectedNodeIds }: SmartAddPanelProps) => {
    const [text, setText] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setText('');
        }
    }, [isOpen]);

    const previewParent = useMemo(() => {
        if (!text.trim() || nodes.length === 0) return null;
        const parentId = findBestParent(nodes, text, selectedNodeIds);
        return nodes.find(n => n.id === parentId) ?? null;
    }, [text, nodes, selectedNodeIds]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!text.trim()) return;

        onAdd(text.trim());
        setText('');
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="fixed bottom-24 right-6 z-50 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-border flex flex-col overflow-hidden"
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2">
                            <Wand2 className="w-4 h-4 text-emerald-600" />
                            <h3 className="font-semibold text-sm">Smart Add</h3>
                        </div>
                        <button
                            onClick={onClose}
                            aria-label="Close Smart Add"
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-muted-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-2">
                        <p className="text-xs text-muted-foreground">
                            Type anything. We'll find the best place to add it to your map automatically.
                        </p>
                        <textarea
                            ref={inputRef}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="E.g., 'Project Timeline' or 'Budget Constraints'"
                            className="w-full min-h-[80px] p-3 text-sm bg-slate-50 dark:bg-slate-950 border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 transition-all font-medium"
                        />

                        <div className="min-h-[18px] flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            {previewParent && (
                                <>
                                    <ArrowRight className="w-3 h-3 shrink-0" />
                                    <span
                                        className={cn(
                                            "w-2 h-2 rounded-full shrink-0",
                                            (colorStyles[previewParent.color] || colorStyles.orange).bg
                                        )}
                                    />
                                    <span className="truncate">
                                        Attaches to <span className="font-medium text-foreground">{firstLine(previewParent.text)}</span>
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                            <span className="text-[10px] text-muted-foreground">Enter to add &middot; Shift+Enter for new line</span>
                            <button
                                type="submit"
                                disabled={!text.trim()}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0",
                                    text.trim()
                                        ? "bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                        : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
                                )}
                            >
                                <Send className="w-3.5 h-3.5" />
                                Add
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
