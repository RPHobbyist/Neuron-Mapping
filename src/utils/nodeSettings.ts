/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import type { NodeSettings } from '@/components/mindmap/LinePropertiesPanel';
import { MindMapNode } from '@/types/mindmap';

export const nodeSettingsOf = (node: MindMapNode): NodeSettings => ({
    color: node.color,
    shape: node.shape,
    priority: node.priority,
    status: node.status,
    task: node.task,
    dueDate: node.dueDate,
    lineType: node.lineType,
    linePattern: node.linePattern,
    lineArrowDirection: node.lineArrowDirection,
    nodeAnimation: node.nodeAnimation,
    icon: node.icon,
    iconStyle: node.iconStyle,
    textBold: node.textBold ?? node.parentId === null,
    textItalic: node.textItalic,
    textUnderline: node.textUnderline,
    textStrike: node.textStrike,
    textAlign: node.textAlign,
    textHeading: node.textHeading,
    textList: node.textList,
    textSize: node.textSize,
    textFont: node.textFont,
});

export const commonNodeSettings = (nodes: MindMapNode[]): { values: NodeSettings; mixed: Set<keyof NodeSettings> } => {
    const all = nodes.map(nodeSettingsOf);
    const values: NodeSettings = {};
    const mixed = new Set<keyof NodeSettings>();
    const keys = new Set(all.flatMap(settings => Object.keys(settings) as (keyof NodeSettings)[]));
    keys.forEach((key) => {
        const first = all[0]?.[key];
        if (all.every(settings => settings[key] === first)) {
            (values as Record<string, unknown>)[key] = first;
        } else {
            mixed.add(key);
        }
    });
    return { values, mixed };
};
