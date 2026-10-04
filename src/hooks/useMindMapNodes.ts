/*
 * Neuron Mapping
 * Copyright (C) 2026 RP Hobbyist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { generateId, getAutoConnectionSides, getAncestorIds, findRootNode, isRootNode, areNodesConnected } from '@/utils/common';
import { autoLayoutNodes, layoutSubtree, moveBoxAreasWithNodes, LayoutDirection } from '@/utils/layoutUtils';
import { graftNodes, GraftOptions } from '@/utils/graft';
import { siblingLine, siblingsOf, swapWithSibling } from '@/utils/siblings';
import { carryHiddenBranches, collapseToLevel, expandAll, expandAncestorsOf, hiddenNodeIds, toggleCollapsed } from '@/utils/collapse';
import { canMoveBranchTo, insertParentNode, moveBranchTo, outdentBranch } from '@/utils/restructure';
import { withSmartText } from '@/utils/smartText';
import {
    DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT, NODE_PLACEMENT_GAP, getNodeSize, rectsOverlap, findClearPosition, findClearPositionAlong,
} from '@/utils/placement';
import { DEFAULT_RELATION_TYPE, DEFAULT_RELATION_COLOR, DETACHED_PARENT_ID } from '@/lib/constants';
import { MindMapNode, NodeColor, ConnectionStyle, Drawing, TextRun, BoxArea, Relation } from '@/types/mindmap';

import { useHistory } from './useHistory';

const MEASUREMENT_BATCH_MS = 120;
const ROOT_CHILD_COLORS: NodeColor[] = ['orange', 'blue', 'cyan', 'yellow', 'grey', 'purple'];

const sameValue = (a: unknown, b: unknown): boolean => {
    if (Object.is(a, b)) return true;
    if (Array.isArray(a) && Array.isArray(b)) {
        return a.length === b.length && a.every((item, i) => sameValue(item, b[i]));
    }
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
        const ra = a as Record<string, unknown>;
        const rb = b as Record<string, unknown>;
        const keysA = Object.keys(ra).filter((k) => ra[k] !== undefined);
        const keysB = Object.keys(rb).filter((k) => rb[k] !== undefined);
        return keysA.length === keysB.length && keysA.every((k) => sameValue(ra[k], rb[k]));
    }
    return false;
};

export const patchItems = <T extends object>(
    prev: T[],
    matches: (item: T) => boolean,
    updates: Partial<T>
): T[] => {
    const keys = Object.keys(updates) as (keyof T)[];
    let changed = false;
    const next = prev.map((item) => {
        if (!matches(item) || keys.every((key) => sameValue(item[key], updates[key]))) return item;
        changed = true;
        return { ...item, ...updates };
    });
    return changed ? next : prev;
};

const patchNodes = patchItems<MindMapNode>;

const clearConnectionSides = (node: MindMapNode): MindMapNode => {
    const { lineParentSide: _parentSide, lineChildSide: _childSide, ...rest } = node;
    return node.relations?.length
        ? { ...rest, relations: node.relations.map(({ sourceSide: _source, targetSide: _target, ...r }) => r) }
        : rest;
};

interface MindMapHistoryState {
    nodes: MindMapNode[];
    connectionStyle: ConnectionStyle;
    drawings: Drawing[];
    boxAreas: BoxArea[];
}

const updateField = <K extends keyof MindMapHistoryState>(
    key: K,
    action: MindMapHistoryState[K] | ((prev: MindMapHistoryState[K]) => MindMapHistoryState[K])
) => (prev: MindMapHistoryState): MindMapHistoryState => {
    const next = typeof action === 'function'
        ? (action as (prev: MindMapHistoryState[K]) => MindMapHistoryState[K])(prev[key])
        : action;
    return Object.is(next, prev[key]) ? prev : { ...prev, [key]: next };
};

const UNDO_STEPS = 100;
const UNDO_NODE_BUDGET = 300_000;
export const undoLimit = (state: { nodes: unknown[] }): number =>
    Math.max(20, Math.min(UNDO_STEPS, Math.floor(UNDO_NODE_BUDGET / Math.max(1, state.nodes.length))));

export const useMindMapNodes = (
    initialNodes: MindMapNode[] = [],
    initialConnectionStyle: ConnectionStyle = 'curved',
    initialDrawings: Drawing[] = [],
    initialBoxAreas: BoxArea[] = []
) => {

    const {
        state: historyState,
        set,
        replace,
        mutate,
        checkpoint,
        cancelGesture,
        undo,
        redo,
        reset,
        canUndo,
        canRedo,
        revision
    } = useHistory<MindMapHistoryState>({
        nodes: initialNodes,
        connectionStyle: initialConnectionStyle,
        drawings: initialDrawings,
        boxAreas: initialBoxAreas
    }, undoLimit);

    const stateRef = useRef(historyState);
    stateRef.current = historyState;

    const nodes = historyState.nodes;
    const connectionStyle = historyState.connectionStyle;
    const drawings = historyState.drawings;
    const boxAreas = historyState.boxAreas;

    const setNodes = useCallback((action: MindMapNode[] | ((prev: MindMapNode[]) => MindMapNode[])) => {
        set(updateField('nodes', action));
    }, [set]);

    const replaceNodes = useCallback((action: MindMapNode[] | ((prev: MindMapNode[]) => MindMapNode[])) => {
        replace(updateField('nodes', action));
    }, [replace]);

    const mutateNodes = useCallback((action: MindMapNode[] | ((prev: MindMapNode[]) => MindMapNode[])) => {
        mutate(updateField('nodes', action));
    }, [mutate]);

    const applyAutoLayout = useCallback((direction: LayoutDirection) => {
        set((prev) => {
            const laidOut = autoLayoutNodes(prev.nodes, direction).map(clearConnectionSides);
            return { ...prev, nodes: laidOut, boxAreas: moveBoxAreasWithNodes(prev.boxAreas, prev.nodes, laidOut) };
        });
    }, [set]);

    const applyBranchLayout = useCallback((topId: string, direction: LayoutDirection) => {
        set((prev) => {
            const laidOut = layoutSubtree(prev.nodes, topId, direction);
            if (laidOut === prev.nodes) return prev;
            return { ...prev, nodes: laidOut, boxAreas: moveBoxAreasWithNodes(prev.boxAreas, prev.nodes, laidOut) };
        });
    }, [set]);

    const setConnectionStyle = useCallback((style: ConnectionStyle) => {
        set((prev) => ({ ...prev, connectionStyle: style }));
    }, [set]);

    const applyGlobalConnectionStyle = useCallback((style: ConnectionStyle) => {
        set((prev) => ({
            ...prev,
            connectionStyle: style,
            nodes: prev.nodes.map(node => {
                const newNode = { ...node };
                if (newNode.lineType) delete newNode.lineType;
                if (newNode.relations) {
                    newNode.relations = newNode.relations.map(r => {
                        const newRel = { ...r };
                        if (newRel.type) delete newRel.type;
                        return newRel;
                    });
                }
                return newNode;
            })
        }));
    }, [set]);

    const resetNodes = useCallback((newNodes: MindMapNode[], newConnectionStyle?: ConnectionStyle, newDrawings?: Drawing[], newBoxAreas?: BoxArea[]) => {
        reset({
            nodes: newNodes,
            connectionStyle: newConnectionStyle ?? connectionStyle,
            drawings: newDrawings ?? [],
            boxAreas: newBoxAreas ?? []
        });
    }, [reset, connectionStyle]);

    const restoreFullState = useCallback((newNodes: MindMapNode[], newConnectionStyle: ConnectionStyle, newDrawings: Drawing[], newBoxAreas: BoxArea[]) => {
        set(() => ({ nodes: newNodes, connectionStyle: newConnectionStyle, drawings: newDrawings, boxAreas: newBoxAreas }));
    }, [set]);

    const pendingMeasurementsRef = useRef(new Map<string, { width: number; height: number }>());
    const measurementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => {
        if (measurementTimerRef.current !== null) clearTimeout(measurementTimerRef.current);
    }, []);
    const updateNodeMeasurement = useCallback((id: string, width: number, height: number) => {
        pendingMeasurementsRef.current.set(id, { width, height });
        if (measurementTimerRef.current !== null) return;
        measurementTimerRef.current = setTimeout(() => {
            measurementTimerRef.current = null;
            const measured = pendingMeasurementsRef.current;
            pendingMeasurementsRef.current = new Map();
            mutateNodes((prev) => prev.map((node) => {
                const size = measured.get(node.id);
                return size ? { ...node, measuredWidth: size.width, measuredHeight: size.height } : node;
            }));
        }, MEASUREMENT_BATCH_MS);
    }, [mutateNodes]);

    const setDrawings = useCallback((action: Drawing[] | ((prev: Drawing[]) => Drawing[])) => {
        set(updateField('drawings', action));
    }, [set]);

    const replaceDrawings = useCallback((action: Drawing[] | ((prev: Drawing[]) => Drawing[])) => {
        replace(updateField('drawings', action));
    }, [replace]);

    const addBoxArea = useCallback((box: BoxArea) => {
        set((prev) => ({ ...prev, boxAreas: [...prev.boxAreas, box] }));
    }, [set]);

    const updateBoxArea = useCallback((id: string, updates: Partial<BoxArea>) => {
        set(updateField('boxAreas', (prev) => patchItems(prev, (b) => b.id === id, updates)));
    }, [set]);

    const replaceBoxArea = useCallback((id: string, updates: Partial<BoxArea>) => {
        replace(updateField('boxAreas', (prev) => patchItems(prev, (b) => b.id === id, updates)));
    }, [replace]);

    const deleteBoxArea = useCallback((id: string) => {
        set((prev) => ({ ...prev, boxAreas: prev.boxAreas.filter((b) => b.id !== id) }));
    }, [set]);

    const moveBoxArea = useCallback((
        dx: number,
        dy: number,
        start: { boxes: Map<string, { x: number; y: number }>; nodes: Map<string, { x: number; y: number }> }
    ) => {
        replace((prev) => ({
            ...prev,
            boxAreas: prev.boxAreas.map((b) => {
                const origin = start.boxes.get(b.id);
                return origin ? { ...b, x: origin.x + dx, y: origin.y + dy } : b;
            }),
            nodes: start.nodes.size === 0 ? prev.nodes : carryHiddenBranches(prev.nodes, prev.nodes.map((n) => {
                const origin = start.nodes.get(n.id);
                return origin ? { ...n, x: origin.x + dx, y: origin.y + dy } : n;
            }))
        }));
    }, [replace]);

    const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
    const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
    const [selectedBoxAreaId, setSelectedBoxAreaId] = useState<string | null>(null);

    useEffect(() => {
        setSelectedBoxAreaId((prev) => (prev && !boxAreas.some((b) => b.id === prev) ? null : prev));
    }, [boxAreas]);

    useEffect(() => {
        const hidden = hiddenNodeIds(nodes);
        const ids = new Set(nodes.map((n) => n.id));
        const shows = (id: string) => !hidden.has(id) && ids.has(id);

        setSelectedNodeIds((prev) => {
            if (prev.size === 0) return prev;
            const filtered = new Set(Array.from(prev).filter(shows));
            return filtered.size === prev.size ? prev : filtered;
        });

        setSelectedLineId((prev) => {
            if (!prev) return prev;
            let stillValid: boolean;
            if (prev.startsWith('rel::')) {
                const [, sourceId, targetId] = prev.split('::');
                const source = nodes.find((n) => n.id === sourceId);
                stillValid = !!source?.relations?.some((r) => r.targetId === targetId) && shows(sourceId) && shows(targetId);
            } else {
                const [parentId, childId] = prev.split('::');
                const child = nodes.find((n) => n.id === childId);
                stillValid = !!child && child.parentId === parentId && shows(childId);
            }
            return stillValid ? prev : null;
        });
    }, [nodes]);

    const addChildNode = useCallback((parentId: string, initialText: string = 'New Item') => {
        if (!stateRef.current.nodes.some((n) => n.id === parentId)) return null;
        const newId = generateId();

        setNodes((prev) => {
            const parent = prev.find((n) => n.id === parentId);
            if (!parent) return prev;

            const children = prev.filter((n) => n.parentId === parentId);
            const angle = (children.length * 50 - 100) * (Math.PI / 180);

            const parentW = parent.measuredWidth || parent.width || DEFAULT_NODE_WIDTH;
            const parentH = parent.measuredHeight || parent.height || DEFAULT_NODE_HEIGHT;
            const sizeSlack = Math.max(0, (Math.max(parentW, parentH) - DEFAULT_NODE_WIDTH) / 2);
            const distance = 250 + sizeSlack;

            const parentIsRoot = isRootNode(parent);
            const newNode: MindMapNode = {
                id: newId,
                text: initialText,
                x: parent.x + Math.cos(angle) * distance,
                y: parent.y + Math.sin(angle) * distance,
                color: parentIsRoot ? ROOT_CHILD_COLORS[children.length % ROOT_CHILD_COLORS.length] : parent.color,
                parentId,
            };

            if (parentIsRoot) {
                const isRight = children.length % 2 === 0;
                newNode.x = parent.x + (isRight ? 1 : -1) * (200 + sizeSlack);
                newNode.y = parent.y + (children.length * 60 - 100);
            }

            const clearPos = findClearPosition(
                newNode.x, newNode.y,
                parent.x, parent.y,
                DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT,
                prev
            );
            newNode.x = clearPos.x;
            newNode.y = clearPos.y;

            return [...prev.map((n) => (n.id === parentId && n.collapsed ? { ...n, collapsed: undefined } : n)), newNode];
        });
        setSelectedNodeIds(new Set([newId]));
        return newId;
    }, [setNodes]);

    const addSiblingNode = useCallback((id: string, initialText: string = 'New Item') => {
        const current = stateRef.current.nodes;
        const node = current.find((n) => n.id === id);
        if (!node) return null;
        if (!siblingLine(node, current)) return addChildNode(id, initialText);
        const newId = generateId();

        setNodes((prev) => {
            const anchor = prev.find((n) => n.id === id);
            const line = anchor && siblingLine(anchor, prev);
            const parent = line && prev.find((n) => n.id === anchor.parentId);
            if (!anchor || !line || !parent) return prev;

            const size = getNodeSize(anchor);
            const past = NODE_PLACEMENT_GAP + (line.axis === 'y'
                ? (size.height + DEFAULT_NODE_HEIGHT) / 2
                : (size.width + DEFAULT_NODE_WIDTH) / 2);
            const startX = anchor.x + (line.axis === 'x' ? past : 0);
            const startY = anchor.y + (line.axis === 'y' ? past : 0);
            const position = findClearPositionAlong(startX, startY, line.axis, DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT, prev)
                ?? findClearPosition(startX, startY, anchor.x, anchor.y, DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT, prev);

            const siblingCount = prev.filter((n) => n.parentId === parent.id).length;
            return [...prev, {
                id: newId,
                text: initialText,
                x: position.x,
                y: position.y,
                color: isRootNode(parent) ? ROOT_CHILD_COLORS[siblingCount % ROOT_CHILD_COLORS.length] : parent.color,
                parentId: parent.id,
            }];
        });
        setSelectedNodeIds(new Set([newId]));
        return newId;
    }, [addChildNode, setNodes]);

    const toggleCollapse = useCallback((ids: Iterable<string>) => {
        const targets = [...ids];
        setNodes((prev) => toggleCollapsed(prev, targets));
    }, [setNodes]);

    const expandAllBranches = useCallback(() => setNodes(expandAll), [setNodes]);

    const collapseBranchesToLevel = useCallback((level: number) => {
        setNodes((prev) => collapseToLevel(prev, level));
    }, [setNodes]);

    const expandTo = useCallback((ids: string[]) => {
        setNodes((prev) => expandAncestorsOf(prev, ids));
    }, [setNodes]);

    const moveAmongSiblings = useCallback((id: string, direction: -1 | 1) => {
        set((prev) => {
            const moved = swapWithSibling(prev.nodes, id, direction);
            if (moved === prev.nodes) return prev;
            return { ...prev, nodes: moved, boxAreas: moveBoxAreasWithNodes(prev.boxAreas, prev.nodes, moved) };
        });
    }, [set]);

    const restructure = useCallback((change: (nodes: MindMapNode[]) => MindMapNode[], withinGesture = false) => {
        (withinGesture ? replace : set)((prev) => {
            const next = change(prev.nodes);
            if (next === prev.nodes) return prev;
            return { ...prev, nodes: next, boxAreas: moveBoxAreasWithNodes(prev.boxAreas, prev.nodes, next) };
        });
    }, [set, replace]);

    const insertParent = useCallback((id: string, initialText: string = 'New Item') => {
        const node = stateRef.current.nodes.find((n) => n.id === id);
        if (!node || isRootNode(node)) return null;
        const newId = generateId();
        restructure((prev) => insertParentNode(prev, id, { id: newId, text: initialText }) ?? prev);
        setSelectedNodeIds(new Set([newId]));
        return newId;
    }, [restructure]);

    const outdent = useCallback((id: string) => {
        const current = stateRef.current.nodes;
        if (outdentBranch(current, id) === current) return false;
        restructure((prev) => outdentBranch(prev, id));
        return true;
    }, [restructure]);

    const moveBranch = useCallback((id: string, targetId: string, { withinGesture = false } = {}) => {
        if (!canMoveBranchTo(stateRef.current.nodes, id, targetId)) return false;
        restructure((prev) => moveBranchTo(prev, id, targetId), withinGesture);
        return true;
    }, [restructure]);

    const indentNode = useCallback((id: string) => {
        const current = stateRef.current.nodes;
        const node = current.find((n) => n.id === id);
        if (!node) return;
        const siblings = siblingsOf(node, current);
        const before = siblings[siblings.findIndex((n) => n.id === id) - 1];
        if (before) moveBranch(id, before.id);
    }, [moveBranch]);

    const outdentNode = useCallback((id: string) => {
        outdent(id);
    }, [outdent]);

    const pasteNodes = useCallback((sourceNodes: MindMapNode[], { keepParents = false } = {}): string[] => {
        if (sourceNodes.length === 0) return [];

        const idMap = new Map(sourceNodes.map((source) => [source.id, generateId()]));

        setNodes((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const isGroupClearAt = (offset: number) => sourceNodes.every((source) => {
                const size = getNodeSize(source);
                return prev.every((n) => {
                    const other = getNodeSize(n);
                    return !rectsOverlap(source.x + offset, source.y + offset, size.width, size.height, n.x, n.y, other.width, other.height);
                });
            });

            let offset = 40;
            if (sourceNodes.length > 1) {
                for (let step = 1; step <= 50; step++) {
                    if (isGroupClearAt(40 * step)) { offset = 40 * step; break; }
                }
            }

            const placed = sourceNodes.map((source): MindMapNode => {
                const copiedParentId = source.parentId ? idMap.get(source.parentId) : undefined;
                const keptParentId = keepParents && source.parentId && existingIds.has(source.parentId) ? source.parentId : undefined;
                const keepsParent = !!(copiedParentId ?? keptParentId);
                let { x, y } = { x: source.x + offset, y: source.y + offset };
                if (sourceNodes.length === 1) {
                    const size = getNodeSize(source);
                    ({ x, y } = findClearPosition(x, y, x, y, size.width, size.height, prev));
                }
                const relations = source.relations
                    ?.filter((r) => idMap.has(r.targetId))
                    .map((r): Relation => ({ ...r, targetId: idMap.get(r.targetId)!, sourceId: undefined }));

                return {
                    ...source,
                    id: idMap.get(source.id)!,
                    x,
                    y,
                    collapsed: source.collapsed && sourceNodes.some((other) => other.parentId === source.id) ? true : undefined,
                    parentId: copiedParentId ?? keptParentId ?? DETACHED_PARENT_ID,
                    lineParentSide: keepsParent ? source.lineParentSide : undefined,
                    lineChildSide: keepsParent ? source.lineChildSide : undefined,
                    relations: relations?.length ? relations : undefined,
                    measuredWidth: undefined,
                    measuredHeight: undefined,
                };
            });

            return [...prev, ...placed];
        });

        setSelectedNodeIds(new Set(idMap.values()));
        return [...idMap.values()];
    }, [setNodes]);

    const graftBranch = useCallback((imported: MindMapNode[], targetId: string, options?: GraftOptions): string[] => {
        const current = stateRef.current.nodes;
        const target = current.find((n) => n.id === targetId);
        if (!target || imported.length === 0) return [];
        const { nodes: grafted, topIds } = graftNodes(imported, target, current, options);
        if (grafted.length === 0) return [];
        setNodes((prev) => [...prev.map((n) => (n.id === targetId && n.collapsed ? { ...n, collapsed: undefined } : n)), ...grafted]);
        setSelectedNodeIds(new Set(topIds));
        return grafted.map((n) => n.id);
    }, [setNodes]);

    const addRelation = useCallback(() => {
        if (selectedNodeIds.size !== 2) return;
        const [sourceId, targetId] = Array.from(selectedNodeIds);

        const current = stateRef.current.nodes;
        const source = current.find(n => n.id === sourceId);
        const target = current.find(n => n.id === targetId);
        if (!source || !target) return;
        if (areNodesConnected(source, target)) {
            toast.info('Those nodes are already connected');
            return;
        }

        setNodes((prev) => prev.map((node) => {
            if (node.id !== sourceId) return node;
            return {
                ...node,
                relations: [...(node.relations || []), { targetId, type: DEFAULT_RELATION_TYPE, color: DEFAULT_RELATION_COLOR }]
            };
        }));
        toast.success('Nodes connected');
    }, [selectedNodeIds, setNodes]);

    type LinkPin = Partial<Pick<MindMapNode, 'lineParentSide' | 'lineChildSide'>>;
    type RelationPin = Partial<Pick<Relation, 'sourceSide' | 'targetSide'>>;
    interface SidePins {
        links: Map<string, LinkPin>;
        relations: Map<string, Map<string, RelationPin>>;
    }
    const freshSidePinsRef = useRef<{ pins: SidePins; start: Map<string, { x: number; y: number }> } | null>(null);

    const applySidePins = useCallback((pins: SidePins, pin: boolean) => {
        if (pins.links.size === 0 && pins.relations.size === 0) return;
        const valueOrClear = <P extends object>(patch: P): P => (pin
            ? patch
            : Object.fromEntries(Object.keys(patch).map((key) => [key, undefined])) as P);

        mutateNodes((prev) => prev.map((node) => {
            const linkPin = pins.links.get(node.id);
            const relationPins = pins.relations.get(node.id);
            if (!linkPin && !relationPins) return node;

            let updated: MindMapNode = linkPin ? { ...node, ...valueOrClear(linkPin) } : node;
            if (relationPins && node.relations?.length) {
                updated = {
                    ...updated,
                    relations: node.relations.map((r) => {
                        const patch = relationPins.get(r.targetId);
                        return patch ? { ...r, ...valueOrClear(patch) } : r;
                    }),
                };
            }
            return updated;
        }));
    }, [mutateNodes]);

    const pinSidesForMove = useCallback((movingIds: ReadonlySet<string>): SidePins => {
        const current = stateRef.current.nodes;
        const byId = new Map(current.map(n => [n.id, n]));
        const pins: SidePins = { links: new Map(), relations: new Map() };

        current.forEach((node) => {
            const parent = node.parentId ? byId.get(node.parentId) : undefined;
            if (parent && movingIds.has(node.id) !== movingIds.has(parent.id) && (!node.lineParentSide || !node.lineChildSide)) {
                const auto = getAutoConnectionSides(parent, node);
                pins.links.set(node.id, {
                    ...(node.lineParentSide ? {} : { lineParentSide: auto.from }),
                    ...(node.lineChildSide ? {} : { lineChildSide: auto.to }),
                });
            }

            node.relations?.forEach((r) => {
                if (r.sourceSide && r.targetSide) return;
                const target = byId.get(r.targetId);
                if (!target || movingIds.has(node.id) === movingIds.has(target.id)) return;
                const auto = getAutoConnectionSides(node, target);
                if (!pins.relations.has(node.id)) pins.relations.set(node.id, new Map());
                pins.relations.get(node.id)!.set(r.targetId, {
                    ...(r.sourceSide ? {} : { sourceSide: auto.from }),
                    ...(r.targetSide ? {} : { targetSide: auto.to }),
                });
            });
        });

        applySidePins(pins, true);
        return pins;
    }, [applySidePins]);

    const pinConnectionSides = useCallback((nodeId: string) => {
        const movingIds = selectedNodeIds.has(nodeId) && selectedNodeIds.size > 1
            ? selectedNodeIds
            : new Set([nodeId]);
        const start = new Map(stateRef.current.nodes
            .filter(n => movingIds.has(n.id))
            .map(n => [n.id, { x: n.x, y: n.y }]));
        freshSidePinsRef.current = { pins: pinSidesForMove(movingIds), start };
    }, [selectedNodeIds, pinSidesForMove]);

    const unpinConnectionSides = useCallback(() => {
        const session = freshSidePinsRef.current;
        freshSidePinsRef.current = null;
        if (!session) return;
        const moved = stateRef.current.nodes.some((n) => {
            const origin = session.start.get(n.id);
            return origin && (origin.x !== n.x || origin.y !== n.y);
        });
        if (!moved) applySidePins(session.pins, false);
    }, [applySidePins]);

    const pinConnectionSidesForNodes = useCallback((nodeIds: Iterable<string>) => {
        pinSidesForMove(new Set(nodeIds));
    }, [pinSidesForMove]);

    const updateNodePosition = useCallback((id: string, x: number, y: number) => {
        replaceNodes((prev) => {
            const isMultiSelect = selectedNodeIds.has(id);
            if (!isMultiSelect) {
                return carryHiddenBranches(prev, prev.map((node) => (node.id === id ? { ...node, x, y } : node)));
            }

            const targetNode = prev.find(n => n.id === id);
            if (!targetNode) return prev;

            const dx = x - targetNode.x;
            const dy = y - targetNode.y;
            if (dx === 0 && dy === 0) return prev;

            return carryHiddenBranches(prev, prev.map(n => {
                if (selectedNodeIds.has(n.id)) {
                    return { ...n, x: n.x + dx, y: n.y + dy };
                }
                return n;
            }));
        });
    }, [selectedNodeIds, replaceNodes]);

    const updateNodeText = useCallback((id: string, text: string, textRuns?: TextRun[][]) => {
        setNodes((prev) => patchNodes(prev, (node) => node.id === id, { text, textRuns }));
    }, [setNodes]);

    const replaceNodeText = useCallback((id: string, text: string, textRuns?: TextRun[][]) => {
        replaceNodes((prev) => patchNodes(prev, (node) => node.id === id, { text, textRuns }));
    }, [replaceNodes]);

    const applySmartText = useCallback((id: string) => {
        replaceNodes((prev) => {
            const index = prev.findIndex((node) => node.id === id);
            if (index === -1) return prev;
            const smart = withSmartText(prev[index]);
            if (smart === prev[index]) return prev;
            const next = [...prev];
            next[index] = smart;
            return next;
        });
    }, [replaceNodes]);

    const replaceNode = useCallback((id: string, updates: Partial<MindMapNode>) => {
        replaceNodes((prev) => patchNodes(prev, (node) => node.id === id, updates));
    }, [replaceNodes]);

    const updateSelectedNodes = useCallback((updates: Partial<MindMapNode>) => {
        setNodes((prev) => prev.map((node) => (selectedNodeIds.has(node.id) ? { ...node, ...updates } : node)));
    }, [selectedNodeIds, setNodes]);

    const replaceSelectedNodes = useCallback((updates: Partial<MindMapNode>) => {
        replaceNodes((prev) => prev.map((node) => (selectedNodeIds.has(node.id) ? { ...node, ...updates } : node)));
    }, [selectedNodeIds, replaceNodes]);

    const updateSelectedTags = useCallback((change: (tags: string[] | undefined) => string[] | undefined) => {
        setNodes((prev) => {
            let changed = false;
            const next = prev.map((node) => {
                if (!selectedNodeIds.has(node.id)) return node;
                const tags = change(node.tags);
                if (tags === node.tags) return node;
                changed = true;
                return { ...node, tags };
            });
            return changed ? next : prev;
        });
    }, [selectedNodeIds, setNodes]);

    const removeNodesKeepingChildren = useCallback((prev: MindMapNode[], idsToDelete: Set<string>) => {
        const findSurvivingParentId = (parentId: string | null, seen = new Set<string>()): string | null => {
            if (parentId === null || !idsToDelete.has(parentId)) return parentId;
            if (seen.has(parentId)) return null;
            seen.add(parentId);
            const parentNode = prev.find(n => n.id === parentId);
            return findSurvivingParentId(parentNode ? parentNode.parentId : null, seen);
        };

        return prev
            .filter(n => !idsToDelete.has(n.id))
            .map(n => {
                let next = n;
                if (n.parentId !== null && idsToDelete.has(n.parentId)) {
                    next = { ...next, parentId: findSurvivingParentId(n.parentId) ?? DETACHED_PARENT_ID };
                }
                if (next.relations?.some(r => idsToDelete.has(r.targetId))) {
                    next = { ...next, relations: next.relations.filter(r => !idsToDelete.has(r.targetId)) };
                }
                return next;
            });
    }, []);

    const deleteSelectedNodes = useCallback(() => {
        setNodes((prev) => {
            const toDelete = new Set(selectedNodeIds);
            const root = findRootNode(prev);
            if (root) toDelete.delete(root.id);
            return toDelete.size === 0 ? prev : removeNodesKeepingChildren(prev, toDelete);
        });
        setSelectedNodeIds(new Set());
    }, [selectedNodeIds, removeNodesKeepingChildren, setNodes]);

    const deleteNode = useCallback((id: string) => {
        if (selectedNodeIds.has(id) && selectedNodeIds.size > 1) {
            deleteSelectedNodes();
            return;
        }
        if (findRootNode(stateRef.current.nodes)?.id === id) return;

        setNodes((prev) => removeNodesKeepingChildren(prev, new Set([id])));
        setSelectedNodeIds(new Set());
    }, [selectedNodeIds, deleteSelectedNodes, removeNodesKeepingChildren, setNodes]);

    const deleteRelation = useCallback((id: string) => {
        if (!id.startsWith('rel::')) return;
        const [, sourceId, targetId] = id.split('::');

        setNodes((prev) => prev.map((node) => {
            if (node.id === sourceId && node.relations) {
                return { ...node, relations: node.relations.filter(r => r.targetId !== targetId) };
            }
            return node;
        }));
        setSelectedLineId(null);
    }, [setNodes]);

    const reconnectRelation = useCallback((relationId: string, endpoint: 'from' | 'to', newNodeId: string | null) => {
        if (!relationId.startsWith('rel::')) return;
        const [, sourceId, targetId] = relationId.split('::');

        const sourceNode = nodes.find(n => n.id === sourceId);
        const relation = sourceNode?.relations?.find(r => r.targetId === targetId);
        if (!sourceNode || !relation) return;

        const finalSourceId = endpoint === 'from' ? newNodeId : sourceId;
        const finalTargetId = endpoint === 'to' ? newNodeId : targetId;

        const isNoOp = finalSourceId === sourceId && finalTargetId === targetId;
        const isSelfLoop = finalSourceId === finalTargetId;
        const finalSource = finalSourceId ? nodes.find(n => n.id === finalSourceId) : undefined;
        const finalTarget = finalTargetId ? nodes.find(n => n.id === finalTargetId) : undefined;
        const isDuplicate = !isNoOp && !isSelfLoop && !!finalSource && !!finalTarget
            && areNodesConnected(finalSource, finalTarget, { sourceId, targetId });

        if (isNoOp) return;

        if (!finalSourceId || !finalTargetId) {
            setNodes(prev => prev.map(n => n.id === sourceId
                ? { ...n, relations: (n.relations || []).filter(r => r.targetId !== targetId) }
                : n));
            setSelectedLineId(null);
            return;
        }

        if (isSelfLoop || isDuplicate) {
            toast.info(isSelfLoop ? "A node can't be connected to itself" : 'Those nodes are already connected');
            return;
        }

        setNodes(prev => prev.map(n => {
            const isOldSource = n.id === sourceId;
            const isNewSource = n.id === finalSourceId;
            if (!isOldSource && !isNewSource) return n;

            let relations = n.relations || [];
            if (isOldSource) {
                relations = relations.filter(r => r.targetId !== targetId);
            }
            if (isNewSource) {
                relations = [...relations, { ...relation, targetId: finalTargetId, sourceSide: undefined, targetSide: undefined }];
            }
            return { ...n, relations };
        }));
        setSelectedLineId(`rel::${finalSourceId}::${finalTargetId}`);
    }, [nodes, setNodes]);

    const updateNode = useCallback((id: string, updates: Partial<MindMapNode>) => {
        setNodes((prev) => patchNodes(prev, (node) => node.id === id, updates));
    }, [setNodes]);

    const getParentLinkDropExclusions = useCallback((parentId: string, childId: string, endpoint: 'from' | 'to'): Set<string> => {
        const current = stateRef.current.nodes;
        if (endpoint === 'from') {
            const excluded = new Set([childId]);
            const queue = [childId];
            while (queue.length > 0) {
                const id = queue.shift()!;
                current.forEach((n) => {
                    if (n.parentId === id && !excluded.has(n.id)) {
                        excluded.add(n.id);
                        queue.push(n.id);
                    }
                });
            }
            return excluded;
        }
        const excluded = getAncestorIds(parentId, current);
        excluded.add(parentId);
        excluded.add(childId);
        current.forEach((n) => { if (isRootNode(n)) excluded.add(n.id); });
        return excluded;
    }, []);

    const reconnectParentLink = useCallback((parentId: string, childId: string, endpoint: 'from' | 'to', targetId: string | null): string | null => {
        if (targetId === null) {
            updateNode(childId, { parentId: DETACHED_PARENT_ID, lineParentSide: undefined, lineChildSide: undefined });
            return null;
        }
        const unchanged = endpoint === 'from' ? targetId === parentId : targetId === childId;
        if (unchanged || getParentLinkDropExclusions(parentId, childId, endpoint).has(targetId)) {
            return `${parentId}::${childId}`;
        }
        if (endpoint === 'from') {
            setNodes((prev) => prev.map((node) => {
                if (node.id === childId) return { ...node, parentId: targetId, lineParentSide: undefined };
                if (node.id === targetId && node.collapsed) return { ...node, collapsed: undefined };
                return node;
            }));
            return `${targetId}::${childId}`;
        }
        setNodes((prev) => prev.map((node) => {
            if (node.id === targetId) return { ...node, parentId, lineParentSide: undefined, lineChildSide: undefined };
            if (node.id === childId) return { ...node, parentId: DETACHED_PARENT_ID, lineParentSide: undefined, lineChildSide: undefined };
            return node;
        }));
        return `${parentId}::${targetId}`;
    }, [getParentLinkDropExclusions, setNodes, updateNode]);

    const updateNodeSize = useCallback((id: string, width: number, height: number) => {
        replaceNodes((prev) => patchNodes(prev, (node) => node.id === id, { width, height }));
    }, [replaceNodes]);

    return {
        nodes,
        connectionStyle,
        drawings,
        setDrawings,
        replaceDrawings,
        boxAreas,
        addBoxArea,
        updateBoxArea,
        replaceBoxArea,
        deleteBoxArea,
        moveBoxArea,
        selectedBoxAreaId,
        setSelectedBoxAreaId,
        setNodes,
        setConnectionStyle,
        applyGlobalConnectionStyle,
        applyAutoLayout,
        applyBranchLayout,
        replaceNodes,
        checkpoint,
        cancelGesture,
        resetNodes,
        restoreFullState,
        undo,
        redo,
        canUndo,
        canRedo,
        revision,
        selectedNodeIds,
        setSelectedNodeIds,
        selectedLineId,
        setSelectedLineId,
        addChildNode,
        addSiblingNode,
        moveAmongSiblings,
        insertParent,
        outdent,
        moveBranch,
        toggleCollapse,
        indentNode,
        outdentNode,
        expandAllBranches,
        collapseBranchesToLevel,
        expandTo,
        pasteNodes,
        graftBranch,
        addRelation,
        pinConnectionSides,
        unpinConnectionSides,
        pinConnectionSidesForNodes,
        updateNodePosition,
        updateNodeText,
        replaceNodeText,
        applySmartText,
        replaceNode,
        updateNode,
        updateNodeMeasurement,
        updateNodeSize,
        updateSelectedNodes,
        replaceSelectedNodes,
        updateSelectedTags,
        deleteNode,
        deleteSelectedNodes,
        deleteRelation,
        reconnectRelation,
        reconnectParentLink,
        getParentLinkDropExclusions
    };
};
 