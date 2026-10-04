/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { MindMapNode } from '@/types/mindmap';

import { isOverdue } from './tasks';

export type RuleTone = 'done' | 'overdue' | 'urgent';

export const ruleToneOf = (node: Pick<MindMapNode, 'task' | 'dueDate' | 'priority'>, today: string): RuleTone | undefined => {
    if (node.task === 'done') return 'done';
    if (isOverdue(node, today)) return 'overdue';
    if (node.priority === 'high') return 'urgent';
    return undefined;
};

export const RULE_TONE_LABELS: Record<RuleTone, string> = {
    done: 'Done',
    overdue: 'Overdue',
    urgent: 'High priority',
};
