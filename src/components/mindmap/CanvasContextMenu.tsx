/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import * as ContextMenu from '@radix-ui/react-context-menu';
import { ReactNode } from 'react';

import { EditorCommand } from '@/lib/editorCommands';

export type MenuSection = EditorCommand[];

interface CanvasContextMenuProps {
    onTarget: (target: EventTarget | null) => void;
    sections: MenuSection[];
    children: ReactNode;
}

const ITEM_CLASS = 'flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm outline-none cursor-default select-none '
    + 'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground';

export const CanvasContextMenu = ({ onTarget, sections, children }: CanvasContextMenuProps) => {
    const shown = sections.filter(section => section.length > 0);
    return (
        <ContextMenu.Root modal={false}>
            <ContextMenu.Trigger asChild onContextMenu={e => onTarget(e.target)}>
                {children}
            </ContextMenu.Trigger>
            <ContextMenu.Portal>
                {shown.length > 0 && (
                    <ContextMenu.Content
                        className="z-[120] min-w-[220px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
                        data-testid="context-menu"
                    >
                        {shown.map((section, i) => (
                            <div key={i}>
                                {i > 0 && <ContextMenu.Separator className="-mx-1 my-1 h-px bg-muted" />}
                                {section.map((command) => {
                                    const Icon = command.icon;
                                    return (
                                        <ContextMenu.Item key={command.id} className={ITEM_CLASS} onSelect={() => command.run?.()}>
                                            {Icon ? <Icon className="w-4 h-4 opacity-70" /> : <span className="w-4" />}
                                            <span className="flex-1">{command.label}</span>
                                            {command.keys && <span className="ml-4 text-[11px] tracking-wide text-muted-foreground">{command.keys}</span>}
                                        </ContextMenu.Item>
                                    );
                                })}
                            </div>
                        ))}
                    </ContextMenu.Content>
                )}
            </ContextMenu.Portal>
        </ContextMenu.Root>
    );
};
