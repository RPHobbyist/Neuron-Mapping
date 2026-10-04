/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import type { LucideIcon } from 'lucide-react';

export type CommandGroup = 'Topic' | 'Arrange' | 'Tasks' | 'View' | 'Map';

export const COMMAND_GROUPS: CommandGroup[] = ['Topic', 'Arrange', 'Tasks', 'View', 'Map'];

export interface EditorCommand {
    id: string;
    label: string;
    group: CommandGroup;
    keys?: string;
    icon?: LucideIcon;
    keywords?: string[];
    run?: () => void;
}

export const runnable = (commands: EditorCommand[]): EditorCommand[] => commands.filter(command => command.run);

export const pickCommands = (commands: EditorCommand[], ids: string[]): EditorCommand[] => ids
    .map(id => commands.find(command => command.id === id))
    .filter((command): command is EditorCommand => !!command?.run);
