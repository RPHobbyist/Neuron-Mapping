/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Send, ListPlus, ArrowRight } from 'lucide-react';
import { cn, isComposing } from '@/lib/utils';
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
        if (e.key === 'Enter' && !e.shiftKey && !isComposing(e)) {
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
                    className="fixed bottom-24 right-6 z-50 w-80 bg-card rounded-xl shadow-2xl border border-border flex flex-col overflow-hidden"
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
                        <div className="flex items-center gap-2">
                            <ListPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <h3 className="font-semibold text-sm">Smart Add</h3>
                        </div>
                        <button
                            onClick={onClose}
                            aria-label="Close Smart Add"
                            className="p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-2">
                        <p className="text-xs text-muted-foreground">
                            Type a topic and it's added under the one it matches best. You can see where before you press Enter.
                        </p>
                        <textarea
                            ref={inputRef}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="For example: hire a designer"
                            className="w-full min-h-[80px] p-3 text-sm bg-muted/50 border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-border transition-all font-medium"
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
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                        : "bg-muted text-muted-foreground cursor-not-allowed"
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
 