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

export const STYLE_FIELDS = [
    'color', 'shape', 'nodeAnimation',
    'textBold', 'textItalic', 'textUnderline', 'textStrike', 'textAlign', 'textHeading', 'textList', 'textSize', 'textFont',
    'lineType', 'lineThickness', 'lineColor', 'lineAnimated', 'lineGradient', 'lineTension',
    'lineAnimationDirection', 'lineAnimationType', 'lineArrowDirection',
] as const satisfies readonly (keyof MindMapNode)[];

export type NodeStyle = Pick<MindMapNode, typeof STYLE_FIELDS[number]>;

export const styleOf = (node: MindMapNode): NodeStyle => {
    const style = Object.fromEntries(STYLE_FIELDS.map(field => [field, node[field]])) as NodeStyle;
    if (node.parentId === null && style.textBold === undefined) style.textBold = true;
    return style;
};
