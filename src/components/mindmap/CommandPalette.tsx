/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useMemo, useState } from 'react';
import { Command, defaultFilter } from 'cmdk';
import { FileText, Map as MapIcon, Search } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { COMMAND_GROUPS, EditorCommand, runnable } from '@/lib/editorCommands';
import { MindMapNode } from '@/types/mindmap';

export interface PaletteMap {
    id: string;
    name: string;
}

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    commands: EditorCommand[];
    nodes: MindMapNode[];
    onSelectNode: (id: string) => void;
    maps?: PaletteMap[];
    onOpenMap?: (id: string) => void;
}

const firstLine = (text: string) => text.split('\n')[0].trim();

const ID_SUFFIX_RE = /^((?:topic|map) [\s\S]*) \S+$/;
const filterWithoutIds = (value: string, search: string, keywords?: string[]) =>
    defaultFilter(value.replace(ID_SUFFIX_RE, '$1'), search, keywords);

const LIST_ALL_TOPICS = 300;
const MAX_TOPIC_MATCHES = 100;

const ITEM_CLASS = 'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm cursor-pointer select-none text-foreground '
    + 'data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground';
const GROUP_CLASS = '[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 '
    + '[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase '
    + '[&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground';

export const CommandPalette = ({ open, onOpenChange, commands, nodes, onSelectNode, maps = [], onOpenMap }: CommandPaletteProps) => {
    const choose = (action: () => void) => {
        setQuery('');
        onOpenChange(false);
        action();
    };
    const available = runnable(commands);
    const [query, setQuery] = useState('');
    const allTopics = useMemo(() => (open ? nodes.filter(node => firstLine(node.text)) : []), [open, nodes]);
    const topics = useMemo(() => {
        if (allTopics.length <= LIST_ALL_TOPICS) return allTopics;
        const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
        if (words.length === 0) return [];
        const matches: MindMapNode[] = [];
        for (const node of allTopics) {
            const text = `${firstLine(node.text)} ${(node.tags ?? []).join(' ')}`.toLowerCase();
            if (words.every(word => text.includes(word))) matches.push(node);
            if (matches.length === MAX_TOPIC_MATCHES) break;
        }
        return matches;
    }, [allTopics, query]);

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!next) setQuery(''); onOpenChange(next); }}>
            <DialogContent className="p-0 gap-0 overflow-hidden max-w-lg top-[20%] translate-y-0">
                <DialogTitle className="sr-only">Command palette</DialogTitle>
                <DialogDescription className="sr-only">Type to find a command, a topic or a map.</DialogDescription>
                <Command label="Command palette" loop filter={filterWithoutIds}>
                    <div className="flex items-center gap-2 border-b pl-3 pr-10">
                        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <Command.Input
                            autoFocus
                            value={query}
                            onValueChange={setQuery}
                            placeholder="Type a command, a topic or a map…"
                            className="flex-1 h-11 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                    </div>
                    <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto p-1.5">
                        <Command.Empty className="py-8 text-center text-sm text-muted-foreground">Nothing found.</Command.Empty>
                        {allTopics.length > LIST_ALL_TOPICS && !query.trim() && (
                            <p className="px-2.5 py-1.5 text-xs text-muted-foreground">Type to find one of the {allTopics.length} topics.</p>
                        )}

                        {COMMAND_GROUPS.map((group) => {
                            const inGroup = available.filter(command => command.group === group);
                            if (inGroup.length === 0) return null;
                            return (
                                <Command.Group key={group} heading={group} className={GROUP_CLASS}>
                                    {inGroup.map((command) => {
                                        const Icon = command.icon;
                                        return (
                                            <Command.Item
                                                key={command.id}
                                                value={`${command.group} ${command.label}`}
                                                keywords={command.keywords}
                                                onSelect={() => choose(command.run!)}
                                                className={ITEM_CLASS}
                                            >
                                                {Icon ? <Icon className="w-4 h-4 text-muted-foreground" /> : <span className="w-4" />}
                                                <span className="flex-1 truncate">{command.label}</span>
                                                {command.keys && (
                                                    <kbd className="text-[10px] font-mono text-muted-foreground bg-muted rounded px-1.5 py-0.5">{command.keys}</kbd>
                                                )}
                                            </Command.Item>
                                        );
                                    })}
                                </Command.Group>
                            );
                        })}

                        {topics.length > 0 && (
                            <Command.Group heading="Topics" className={GROUP_CLASS}>
                                {topics.map(node => (
                                    <Command.Item
                                        key={node.id}
                                        value={`topic ${firstLine(node.text)} ${node.id}`}
                                        keywords={node.tags}
                                        onSelect={() => choose(() => onSelectNode(node.id))}
                                        className={ITEM_CLASS}
                                    >
                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                        <span className="flex-1 truncate">{firstLine(node.text)}</span>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}

                        {onOpenMap && maps.length > 0 && (
                            <Command.Group heading="Open Map" className={GROUP_CLASS}>
                                {maps.map(map => (
                                    <Command.Item
                                        key={map.id}
                                        value={`map ${map.name} ${map.id}`}
                                        onSelect={() => choose(() => onOpenMap(map.id))}
                                        className={ITEM_CLASS}
                                    >
                                        <MapIcon className="w-4 h-4 text-muted-foreground" />
                                        <span className="flex-1 truncate">{map.name}</span>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        )}
                    </Command.List>
                </Command>
            </DialogContent>
        </Dialog>
    );
};
