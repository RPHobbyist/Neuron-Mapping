import { useState, useCallback } from 'react';
import { toast } from 'sonner';

import { generateId, getDescendantIds } from '@/utils/common';
import { DEFAULT_RELATION_TYPE, DEFAULT_RELATION_COLOR } from '@/lib/constants';
import { MindMapNode, NodeColor, NodeShape, ConnectionStyle, NodePriority } from '@/types/mindmap';

import { useHistory } from './useHistory';

export const useMindMapNodes = (initialNodes: MindMapNode[] = [], initialConnectionStyle: ConnectionStyle = 'curved') => {
    // History & State
    interface MindMapHistoryState {
        nodes: MindMapNode[];
        connectionStyle: ConnectionStyle;
    }

    const {
        state: historyState,
        set,
        replace,
        mutate,
        undo,
        redo,
        reset,
        canUndo,
        canRedo
    } = useHistory<MindMapHistoryState>({
        nodes: initialNodes,
        connectionStyle: initialConnectionStyle
    }, 20);

    const nodes = historyState.nodes;
    const connectionStyle = historyState.connectionStyle;

    // Wrappers to maintain compatibility with existing logic which expects setNodes(nodes => ...)
    const setNodes = useCallback((action: MindMapNode[] | ((prev: MindMapNode[]) => MindMapNode[])) => {
        set((prev) => ({
            ...prev,
            nodes: typeof action === 'function' ? action(prev.nodes) : action
        }));
    }, [set]);

    const replaceNodes = useCallback((action: MindMapNode[] | ((prev: MindMapNode[]) => MindMapNode[])) => {
        replace((prev) => ({
            ...prev,
            nodes: typeof action === 'function' ? action(prev.nodes) : action
        }));
    }, [replace]);

    // For passive writes that must never appear in undo/redo (e.g. ResizeObserver
    // layout measurements) — does not push history and does not clear the redo stack.
    const mutateNodes = useCallback((action: MindMapNode[] | ((prev: MindMapNode[]) => MindMapNode[])) => {
        mutate((prev) => ({
            ...prev,
            nodes: typeof action === 'function' ? action(prev.nodes) : action
        }));
    }, [mutate]);

    const setConnectionStyle = useCallback((style: ConnectionStyle) => {
        set((prev) => ({ ...prev, connectionStyle: style }));
    }, [set]);

    // Applies a global connection style AND strips per-node/relation overrides
    // in a single history entry, so one Ctrl+Z fully reverts the change.
    const applyGlobalConnectionStyle = useCallback((style: ConnectionStyle) => {
        set((prev) => ({
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

    const resetNodes = useCallback((newNodes: MindMapNode[], newConnectionStyle?: ConnectionStyle) => {
        reset({ nodes: newNodes, connectionStyle: newConnectionStyle ?? connectionStyle });
    }, [reset, connectionStyle]);

    const updateNodeMeasurement = useCallback((id: string, width: number, height: number) => {
        mutateNodes((prev) => prev.map((node) => (
            node.id === id ? { ...node, measuredWidth: width, measuredHeight: height } : node
        )));
    }, [mutateNodes]);

    // Selection
    const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
    const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

    const saveSnapshot = useCallback(() => {
        set((prev) => prev); // Save current state to history
    }, [set]);

    // Actions
    const addChildNode = useCallback((parentId: string, initialText: string = 'New Item') => {
        // Quick existence check against the last-rendered state; the actual
        // position/color is computed from the functional updater's own `prev`
        // below so rapid repeated calls (e.g. auto-repeating Tab) each see the
        // most current sibling count instead of stacking new nodes on top of
        // each other at an identical, stale position.
        if (!nodes.some((n) => n.id === parentId)) return null;

        const newId = generateId();

        setNodes((prev) => {
            const parent = prev.find((n) => n.id === parentId);
            if (!parent) return prev;

            const children = prev.filter((n) => n.parentId === parentId);
            const angle = (children.length * 50 - 100) * (Math.PI / 180);
            const distance = 250;

            // Inherit color
            let newColor: NodeColor = 'orange';
            if (parent.id !== 'root') {
                newColor = parent.color;
            } else {
                const colors: NodeColor[] = ['orange', 'blue', 'cyan', 'yellow', 'grey', 'purple'];
                newColor = colors[children.length % colors.length];
            }

            const newNode: MindMapNode = {
                id: newId,
                text: initialText,
                x: parent.x + Math.cos(angle) * distance,
                y: parent.y + Math.sin(angle) * distance,
                color: newColor,
                parentId,
            };

            if (parent.id === 'root') {
                const isRight = children.length % 2 === 0;
                newNode.x = parent.x + (isRight ? 200 : -200);
                newNode.y = parent.y + (children.length * 60 - 100);
            }

            return [...prev, newNode];
        });
        setSelectedNodeIds(new Set([newId]));
        return newId;
    }, [nodes, setNodes]);

    const addRelation = useCallback(() => {
        if (selectedNodeIds.size !== 2) return;
        const [sourceId, targetId] = Array.from(selectedNodeIds);

        setNodes((prev) => prev.map((node) => {
            if (node.id === sourceId) {
                const existing = node.relations || [];
                if (existing.some(r => r.targetId === targetId)) return node;
                return {
                    ...node,
                    relations: [...existing, { targetId, type: DEFAULT_RELATION_TYPE, color: DEFAULT_RELATION_COLOR }]
                };
            }
            return node;
        }));
        toast.success('Nodes connected');
    }, [selectedNodeIds, setNodes]);

    const updateNodePosition = useCallback((id: string, x: number, y: number) => {
        replaceNodes((prev) => {
            const isMultiSelect = selectedNodeIds.has(id);
            if (!isMultiSelect) {
                return prev.map((node) => (node.id === id ? { ...node, x, y } : node));
            }

            const targetNode = prev.find(n => n.id === id);
            if (!targetNode) return prev;

            const dx = x - targetNode.x;
            const dy = y - targetNode.y;

            return prev.map(n => {
                if (selectedNodeIds.has(n.id)) {
                    return { ...n, x: n.x + dx, y: n.y + dy };
                }
                return n;
            });
        });
    }, [selectedNodeIds, replaceNodes]);

    const updateNodeText = useCallback((id: string, text: string) => {
        setNodes((prev) => prev.map((node) => (node.id === id ? { ...node, text } : node)));
    }, [setNodes]);

    // Use this during continuous text editing to avoid cluttering history
    const replaceNodeText = useCallback((id: string, text: string) => {
        replaceNodes((prev) => prev.map((node) => (node.id === id ? { ...node, text } : node)));
    }, [replaceNodes]);

    // Same non-history pattern as replaceNodeText, generalized to any field —
    // for continuous edits like typing in the Notes panel, where a caller
    // saves one snapshot when editing starts and then wants every keystroke
    // to update the live present state without each one pushing its own
    // undo entry.
    const replaceNode = useCallback((id: string, updates: Partial<MindMapNode>) => {
        replaceNodes((prev) => prev.map((node) => (node.id === id ? { ...node, ...updates } : node)));
    }, [replaceNodes]);

    const updateSelectedNodesColor = useCallback((color: NodeColor) => {
        setNodes((prev) => prev.map((node) => selectedNodeIds.has(node.id) ? { ...node, color } : node));
    }, [selectedNodeIds, setNodes]);

    const updateSelectedNodesShape = useCallback((shape: NodeShape) => {
        setNodes((prev) => prev.map((node) => selectedNodeIds.has(node.id) ? { ...node, shape } : node));
    }, [selectedNodeIds, setNodes]);

    const updateSelectedNodesLineType = useCallback((lineType: ConnectionStyle) => {
        setNodes((prev) => prev.map((node) => selectedNodeIds.has(node.id) ? { ...node, lineType } : node));
    }, [selectedNodeIds, setNodes]);

    const updateSelectedNodesPriority = useCallback((priority: NodePriority) => {
        setNodes((prev) => prev.map((node) => selectedNodeIds.has(node.id) ? { ...node, priority } : node));
    }, [selectedNodeIds, setNodes]);

    const deleteSelectedNodes = useCallback(() => {
        setNodes((prev) => {
            const toDelete = new Set<string>();

            selectedNodeIds.forEach(id => {
                if (id === 'root') return;
                getDescendantIds(id, prev).forEach(d => toDelete.add(d));
            });

            return prev
                .filter(n => !toDelete.has(n.id))
                .map(n => {
                    if (n.relations) return { ...n, relations: n.relations.filter(r => !toDelete.has(r.targetId)) };
                    return n;
                });
        });
        setSelectedNodeIds(new Set());
    }, [selectedNodeIds, setNodes]);

    const deleteNode = useCallback((id: string) => {
        if (selectedNodeIds.has(id) && selectedNodeIds.size > 1) {
            deleteSelectedNodes();
            return;
        }
        if (id === 'root') return;

        setNodes((prev) => {
            const toDelete = new Set(getDescendantIds(id, prev));

            return prev
                .filter(n => !toDelete.has(n.id))
                .map(n => {
                    if (n.relations) return { ...n, relations: n.relations.filter(r => !toDelete.has(r.targetId)) };
                    return n;
                });
        });
        setSelectedNodeIds(new Set());
    }, [selectedNodeIds, deleteSelectedNodes, setNodes]);

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

    const updateNode = useCallback((id: string, updates: Partial<MindMapNode>) => {
        setNodes((prev) => prev.map((node) => (node.id === id ? { ...node, ...updates } : node)));
    }, [setNodes]);

    const updateNodeSize = useCallback((id: string, width: number, height: number) => {
        replaceNodes((prev) => prev.map((node) => (node.id === id ? { ...node, width, height } : node)));
    }, [replaceNodes]);

    return {
        nodes,
        connectionStyle,
        setNodes,
        setConnectionStyle,
        applyGlobalConnectionStyle,
        replaceNodes,
        saveSnapshot,
        resetNodes,
        undo,
        redo,
        canUndo,
        canRedo,
        selectedNodeIds,
        setSelectedNodeIds,
        selectedLineId,
        setSelectedLineId,
        addChildNode,
        addRelation,
        updateNodePosition,
        updateNodeText,
        replaceNodeText,
        replaceNode,
        updateNode,
        updateNodeMeasurement,
        updateNodeSize,
        updateSelectedNodesColor,
        updateSelectedNodesShape,
        updateSelectedNodesLineType,
        updateSelectedNodesPriority,
        deleteNode,
        deleteSelectedNodes,
        deleteRelation
    };
};
