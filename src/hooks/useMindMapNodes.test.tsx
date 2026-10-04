/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';

import { DETACHED_PARENT_ID } from '@/lib/constants';
import { BoxArea, MindMapNode, NodeColor } from '@/types/mindmap';

import { useMindMapNodes } from './useMindMapNodes';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const node = (id: string, parentId: string | null, x: number, y: number, color: NodeColor = 'blue'): MindMapNode => ({
    id, text: id, x, y, color, parentId, width: 150, height: 60,
});

const map = (): MindMapNode[] => [
    node('root', null, 0, 0, 'root'),
    node('A', 'root', 300, -60, 'orange'),
    node('B', 'root', 300, 60, 'blue'),
    node('A1', 'A', 600, -120, 'orange'),
    node('A2', 'A', 600, -30, 'orange'),
];

let unmount: (() => void) | undefined;
afterEach(() => {
    unmount?.();
    unmount = undefined;
});

const renderNodes = (initial: MindMapNode[], boxAreas: BoxArea[] = []) => {
    const result = { current: null as unknown as ReturnType<typeof useMindMapNodes> };
    const Probe = () => {
        result.current = useMindMapNodes(initial, 'curved', [], boxAreas);
        return null;
    };
    const root = createRoot(document.createElement('div'));
    act(() => root.render(<Probe />));
    unmount = () => act(() => root.unmount());
    return result;
};

const find = (nodes: MindMapNode[], id: string) => nodes.find(n => n.id === id)!;

describe('addSiblingNode', () => {
    it('adds a node under the same parent, below the one it was added from, and selects it', () => {
        const hook = renderNodes(map());
        let newId: string | null = null;
        act(() => { newId = hook.current.addSiblingNode('A2'); });

        const added = find(hook.current.nodes, newId!);
        expect(added).toMatchObject({ parentId: 'A', color: 'orange', x: 600, text: 'New Item' });
        expect(added.y).toBe(-30 + 60 + 30);
        expect([...hook.current.selectedNodeIds]).toEqual([newId]);

        act(() => hook.current.undo());
        expect(hook.current.nodes).toHaveLength(5);
    });

    it('goes past the siblings that are in the way, staying in their column', () => {
        const hook = renderNodes(map());
        let newId: string | null = null;
        act(() => { newId = hook.current.addSiblingNode('A1'); });

        const added = find(hook.current.nodes, newId!);
        expect(added.x).toBe(600);
        expect(added.y).toBeGreaterThanOrEqual(-30 + 60 + 30);
    });

    it('gives a branch of the root the next colour in turn', () => {
        const hook = renderNodes(map());
        let newId: string | null = null;
        act(() => { newId = hook.current.addSiblingNode('B'); });
        expect(find(hook.current.nodes, newId!)).toMatchObject({ parentId: 'root', color: 'cyan', x: 300 });
    });

    it('adds a child to a node that has no siblings: the root, or a detached node', () => {
        const hook = renderNodes([...map(), node('loose', DETACHED_PARENT_ID, 0, 500)]);
        let fromRoot: string | null = null;
        let fromLoose: string | null = null;
        act(() => { fromRoot = hook.current.addSiblingNode('root'); });
        act(() => { fromLoose = hook.current.addSiblingNode('loose'); });

        expect(find(hook.current.nodes, fromRoot!).parentId).toBe('root');
        expect(find(hook.current.nodes, fromLoose!).parentId).toBe('loose');
    });
});

describe('moveAmongSiblings', () => {
    it('trades places with the next sibling as one undo step, and does nothing at the end of the line', () => {
        const hook = renderNodes(map());
        act(() => hook.current.moveAmongSiblings('A1', 1));
        expect(find(hook.current.nodes, 'A1').y).toBe(-30);
        expect(find(hook.current.nodes, 'A2').y).toBe(-120);

        const revision = hook.current.revision;
        act(() => hook.current.moveAmongSiblings('A1', 1));
        expect(hook.current.revision).toBe(revision);

        act(() => hook.current.undo());
        expect(find(hook.current.nodes, 'A1').y).toBe(-120);
        expect(hook.current.canUndo).toBe(false);
    });

    it('takes a box area along with the branch inside it', () => {
        const box: BoxArea = { id: 'box', x: 200, y: 20, width: 200, height: 80, label: 'B', color: '#3b82f6' };
        const hook = renderNodes(map(), [box]);
        const before = find(hook.current.nodes, 'B').y;
        act(() => hook.current.moveAmongSiblings('B', -1));

        const moved = find(hook.current.nodes, 'B').y - before;
        expect(moved).toBeLessThan(0);
        expect(hook.current.boxAreas[0].y).toBe(box.y + moved);
    });
});

describe('insertParent, outdent and moveBranch', () => {
    it('inserts a parent as one undo step, and selects it', () => {
        const hook = renderNodes(map());
        let newId: string | null = null;
        act(() => { newId = hook.current.insertParent('A1'); });

        expect(find(hook.current.nodes, 'A1').parentId).toBe(newId);
        expect(find(hook.current.nodes, newId!).parentId).toBe('A');
        expect([...hook.current.selectedNodeIds]).toEqual([newId]);

        act(() => hook.current.undo());
        expect(hook.current.nodes).toEqual(map());
    });

    it("won't give the root a parent", () => {
        const hook = renderNodes(map());
        let newId: string | null = 'unset';
        act(() => { newId = hook.current.insertParent('root'); });
        expect(newId).toBeNull();
        expect(hook.current.canUndo).toBe(false);
    });

    it("moves a branch up a level as one undo step, and tells when it can't", () => {
        const hook = renderNodes(map());
        let moved = false;
        act(() => { moved = hook.current.outdent('A2'); });
        expect(moved).toBe(true);
        expect(find(hook.current.nodes, 'A2').parentId).toBe('root');

        act(() => hook.current.undo());
        expect(find(hook.current.nodes, 'A2').parentId).toBe('A');

        act(() => { moved = hook.current.outdent('A'); });
        expect(moved).toBe(false);
    });

    it('makes a drop part of the drag it ends, so one undo takes back both', () => {
        const hook = renderNodes(map());
        act(() => hook.current.checkpoint());
        act(() => hook.current.updateNodePosition('B', 600, 100));
        let moved = false;
        act(() => { moved = hook.current.moveBranch('B', 'A', { withinGesture: true }); });
        expect(moved).toBe(true);
        expect(find(hook.current.nodes, 'B').parentId).toBe('A');

        act(() => hook.current.undo());
        expect(find(hook.current.nodes, 'B')).toMatchObject({ parentId: 'root', x: 300, y: 60 });
        expect(hook.current.canUndo).toBe(false);
    });

    it("won't move a branch under itself", () => {
        const hook = renderNodes(map());
        let moved = true;
        act(() => { moved = hook.current.moveBranch('A', 'A1'); });
        expect(moved).toBe(false);
        expect(hook.current.nodes).toEqual(map());
    });
});

describe('collapsing', () => {
    it('collapses and expands a branch as undo steps, and deselects what it hides', () => {
        const hook = renderNodes(map());
        act(() => hook.current.setSelectedNodeIds(new Set(['A1', 'B'])));
        act(() => hook.current.toggleCollapse(['A']));

        expect(find(hook.current.nodes, 'A').collapsed).toBe(true);
        expect([...hook.current.selectedNodeIds]).toEqual(['B']);

        act(() => hook.current.toggleCollapse(['A']));
        expect(find(hook.current.nodes, 'A').collapsed).toBeUndefined();
        act(() => hook.current.undo());
        expect(find(hook.current.nodes, 'A').collapsed).toBe(true);

        const revision = hook.current.revision;
        act(() => hook.current.toggleCollapse(['B']));
        expect(hook.current.revision).toBe(revision);
    });

    it('opens a collapsed node that gets a child, and the path to a node that must show', () => {
        const hook = renderNodes(map().map(n => (n.id === 'A' || n.id === 'root' ? { ...n, collapsed: true } : n)));
        act(() => { hook.current.addChildNode('A'); });
        expect(find(hook.current.nodes, 'A').collapsed).toBeUndefined();
        expect(find(hook.current.nodes, 'root').collapsed).toBe(true);

        act(() => hook.current.expandTo(['A1']));
        expect(find(hook.current.nodes, 'root').collapsed).toBeUndefined();
    });

    it('takes what a collapsed node hides along when the node is dragged', () => {
        const hook = renderNodes(map().map(n => (n.id === 'A' ? { ...n, collapsed: true } : n)));
        act(() => hook.current.checkpoint());
        act(() => hook.current.updateNodePosition('A', 350, -10));

        expect(find(hook.current.nodes, 'A')).toMatchObject({ x: 350, y: -10 });
        expect(find(hook.current.nodes, 'A1')).toMatchObject({ x: 650, y: -70 });
        expect(find(hook.current.nodes, 'A2')).toMatchObject({ x: 650, y: 20 });
        expect(find(hook.current.nodes, 'B')).toMatchObject({ x: 300, y: 60 });
    });

    it('shows the map down to a level, and everything again', () => {
        const hook = renderNodes([...map(), node('A1x', 'A1', 900, -120)]);
        act(() => hook.current.collapseBranchesToLevel(1));
        expect(hook.current.nodes.filter(n => n.collapsed).map(n => n.id)).toEqual(['A', 'A1']);
        act(() => hook.current.expandAllBranches());
        expect(hook.current.nodes.some(n => n.collapsed)).toBe(false);
    });
});

describe('pasteNodes', () => {
    it('detaches a pasted node whose parent was not copied', () => {
        const hook = renderNodes(map());
        act(() => hook.current.pasteNodes([find(hook.current.nodes, 'A1')]));

        const [copyId] = [...hook.current.selectedNodeIds];
        expect(find(hook.current.nodes, copyId)).toMatchObject({ text: 'A1', parentId: DETACHED_PARENT_ID });
    });

    it('keeps a duplicate under the original\'s parent, and a duplicated branch together', () => {
        const hook = renderNodes(map());
        act(() => hook.current.pasteNodes(
            [find(hook.current.nodes, 'A'), find(hook.current.nodes, 'A1')],
            { keepParents: true }
        ));

        const copies = hook.current.nodes.filter(n => hook.current.selectedNodeIds.has(n.id));
        const branchTop = copies.find(n => n.text === 'A')!;
        expect(branchTop.parentId).toBe('root');
        expect(copies.find(n => n.text === 'A1')!.parentId).toBe(branchTop.id);
        expect(hook.current.nodes).toHaveLength(7);
    });

    it('copies a collapsed node as collapsed only together with what it hides', () => {
        const hook = renderNodes(map().map(n => (n.id === 'A' ? { ...n, collapsed: true } : n)));
        act(() => hook.current.pasteNodes([find(hook.current.nodes, 'A')], { keepParents: true }));
        const [alone] = hook.current.nodes.filter(n => hook.current.selectedNodeIds.has(n.id));
        expect(alone.collapsed).toBeUndefined();

        act(() => hook.current.pasteNodes(hook.current.nodes.filter(n => ['A', 'A1', 'A2'].includes(n.id)), { keepParents: true }));
        const top = hook.current.nodes.filter(n => n.text === 'A' && n.collapsed);
        expect(top).toHaveLength(2);
    });

    it('detaches a duplicate of a node that was already detached', () => {
        const hook = renderNodes([...map(), node('loose', DETACHED_PARENT_ID, 0, 500)]);
        act(() => hook.current.pasteNodes([find(hook.current.nodes, 'loose')], { keepParents: true }));

        const [copyId] = [...hook.current.selectedNodeIds];
        expect(find(hook.current.nodes, copyId).parentId).toBe(DETACHED_PARENT_ID);
    });
});
