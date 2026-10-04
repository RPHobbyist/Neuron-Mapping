/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import type { ConnectionStyle, MindMapNode, NodeColor } from '../types/mindmap';

export interface StressMapOptions {
    branching?: number;
    relationsRatio?: number;
    lineType?: ConnectionStyle;
    chain?: boolean;
}

const COLORS: NodeColor[] = ['orange', 'blue', 'cyan', 'yellow', 'grey', 'purple'];
const WORDS = ['plan', 'budget', 'review', 'launch', 'research', 'design', 'test', 'hire', 'ship', 'measure', 'draft', 'call'];

const random = (seed: number) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
};

export const generateStressMap = (count: number, options: StressMapOptions = {}): MindMapNode[] => {
    const { branching = 4, relationsRatio = 0, lineType, chain = false } = options;
    const next = random(42);
    const nodes: MindMapNode[] = [];
    const childrenOf: number[][] = [];

    for (let i = 0; i < count; i++) {
        const parent = i === 0 ? null : chain ? i - 1 : Math.floor((i - 1) / branching);
        const words = 1 + Math.floor(next() * 4);
        const text = Array.from({ length: words }, () => WORDS[Math.floor(next() * WORDS.length)]).join(' ');
        nodes.push({
            id: `n${i}`,
            text: i === 0 ? 'Stress test' : `${text} ${i}`,
            x: 0,
            y: 0,
            color: i === 0 ? 'root' : COLORS[i % COLORS.length],
            parentId: parent === null ? null : `n${parent}`,
            ...(lineType ? { lineType } : {}),
        });
        childrenOf[i] = [];
        if (parent !== null) childrenOf[parent].push(i);
    }

    let leafY = 0;
    const depth = new Array<number>(count).fill(0);
    const order: number[] = [];
    const stack = [0];
    while (stack.length > 0) {
        const i = stack.pop()!;
        order.push(i);
        const children = childrenOf[i];
        for (let c = children.length - 1; c >= 0; c--) {
            depth[children[c]] = depth[i] + 1;
            stack.push(children[c]);
        }
    }
    for (let k = order.length - 1; k >= 0; k--) {
        const i = order[k];
        const children = childrenOf[i];
        nodes[i].x = depth[i] * 260;
        if (children.length === 0) {
            nodes[i].y = leafY;
            leafY += 70;
        } else {
            nodes[i].y = (nodes[children[0]].y + nodes[children[children.length - 1]].y) / 2;
        }
    }

    if (relationsRatio > 0) {
        for (let i = 1; i < count; i++) {
            if (next() >= relationsRatio) continue;
            const target = 1 + Math.floor(next() * (count - 1));
            if (target === i || nodes[i].parentId === `n${target}` || nodes[target].parentId === `n${i}`) continue;
            nodes[i].relations = [{ targetId: `n${target}` }];
        }
    }
    return nodes;
};
