/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useEffect, useMemo, useRef } from 'react';
import { ChevronDown, ChevronRight, ListTree, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { MindMapNode } from '@/types/mindmap';
import { buildOutline, walkOutline } from '@/utils/exporters/outline';

interface OutlinePanelProps {
    isOpen: boolean;
    onClose: () => void;
    nodes: MindMapNode[];
    selectedNodeIds: Set<string>;
    onSelect: (id: string) => void;
    onTextEditStart: () => void;
    onTextChange: (id: string, text: string) => void;
    onAddSibling: (id: string) => string | null;
    onIndent: (id: string) => void;
    onOutdent: (id: string) => void;
    onMove: (id: string, direction: -1 | 1) => void;
    onToggleCollapse: (id: string) => void;
}

const hasFormatting = (node: MindMapNode) => node.text.includes('\n') || !!node.textRuns?.length;

export const OutlinePanel = ({
    isOpen, onClose, nodes, selectedNodeIds, onSelect, onTextEditStart, onTextChange,
    onAddSibling, onIndent, onOutdent, onMove, onToggleCollapse,
}: OutlinePanelProps) => {
    const rows = useMemo(() => {
        const list: { node: MindMapNode; depth: number; hasChildren: boolean; hidden: boolean }[] = [];
        let hiddenBelow = Infinity;
        walkOutline(buildOutline(nodes), (item, depth) => {
            if (depth <= hiddenBelow) hiddenBelow = Infinity;
            const hidden = depth > hiddenBelow;
            if (!hidden && item.node.collapsed) hiddenBelow = depth;
            list.push({ node: item.node, depth, hasChildren: item.children.length > 0, hidden });
        });
        return list.filter(row => !row.hidden);
    }, [nodes]);

    const focusIdRef = useRef<string | null>(null);
    const editingIdRef = useRef<string | null>(null);
    useEffect(() => {
        const id = focusIdRef.current;
        if (!id) return;
        const field = document.getElementById(`outline-${id}`) as HTMLInputElement | null;
        if (field) {
            focusIdRef.current = null;
            field.focus();
            field.select();
        }
    }, [rows]);

    if (!isOpen) return null;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, node: MindMapNode) => {
        if (e.nativeEvent.isComposing) return;
        const keep = (action: () => void) => {
            e.preventDefault();
            focusIdRef.current = node.id;
            action();
        };
        if (e.key === 'Enter') {
            e.preventDefault();
            const added = onAddSibling(node.id);
            if (added) focusIdRef.current = added;
        } else if (e.key === 'Tab') {
            keep(() => (e.shiftKey ? onOutdent(node.id) : onIndent(node.id)));
        } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            keep(() => onMove(node.id, e.key === 'ArrowUp' ? -1 : 1));
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const index = rows.findIndex(row => row.node.id === node.id) + (e.key === 'ArrowUp' ? -1 : 1);
            const next = rows[index];
            if (next) document.getElementById(`outline-${next.node.id}`)?.focus();
        }
    };

    return (
        <aside
            aria-label="Outline"
            className="fixed left-3 top-[68px] bottom-14 z-40 w-80 flex flex-col rounded-xl border bg-card/95 backdrop-blur-sm shadow-xl"
        >
            <div className="flex items-center justify-between px-3 py-2 border-b">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground/80 flex items-center gap-2">
                    <ListTree className="w-3.5 h-3.5" /> Outline
                </h2>
                <button onClick={onClose} aria-label="Close outline" className="p-1 rounded hover:bg-muted text-muted-foreground">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <p className="px-3 py-1.5 text-[10px] text-muted-foreground border-b">
                Enter adds a topic, Tab and Shift+Tab move it in and out, Alt+↑/↓ up and down.
            </p>
            <ul className="flex-1 overflow-y-auto py-1">
                {rows.map(({ node, depth, hasChildren }) => (
                    <li
                        key={node.id}
                        className={cn('flex items-center gap-1 pr-2', selectedNodeIds.has(node.id) && 'bg-primary/10')}
                        style={{ paddingLeft: 6 + depth * 16 }}
                    >
                        {hasChildren ? (
                            <button
                                onClick={() => onToggleCollapse(node.id)}
                                aria-label={node.collapsed ? `Expand ${node.text}` : `Collapse ${node.text}`}
                                className="p-0.5 rounded text-muted-foreground hover:bg-muted shrink-0"
                            >
                                {node.collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                        ) : <span className="w-[18px] shrink-0" />}
                        <input
                            id={`outline-${node.id}`}
                            value={node.text.replace(/\n/g, ' ')}
                            readOnly={hasFormatting(node)}
                            title={hasFormatting(node) ? 'Edit formatted or multi-line topics on the canvas' : undefined}
                            aria-label={`Topic: ${node.text}`}
                            onFocus={() => onSelect(node.id)}
                            onBlur={() => { editingIdRef.current = null; }}
                            onChange={(e) => {
                                if (editingIdRef.current !== node.id) {
                                    editingIdRef.current = node.id;
                                    onTextEditStart();
                                }
                                onTextChange(node.id, e.target.value);
                            }}
                            onKeyDown={(e) => handleKeyDown(e, node)}
                            className={cn(
                                'flex-1 min-w-0 bg-transparent text-sm py-1 px-1 rounded outline-none focus:bg-muted/60',
                                depth === 0 && 'font-semibold'
                            )}
                        />
                    </li>
                ))}
            </ul>
        </aside>
    );
};
