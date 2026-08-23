import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

import { generateId, getDescendantIds } from '@/utils/common';
import { DEFAULT_RELATION_TYPE, DEFAULT_RELATION_COLOR } from '@/lib/constants';
import { MindMapNode, NodeColor, NodeShape, ConnectionStyle, NodePriority, Drawing } from '@/types/mindmap';

import { useHistory } from './useHistory';

export const useMindMapNodes = (
    initialNodes: MindMapNode[] = [],
    initialConnectionStyle: ConnectionStyle = 'curved',
    initialDrawings: Drawing[] = []
) => {
    interface MindMapHistoryState {
        nodes: MindMapNode[];
        connectionStyle: ConnectionStyle;
        drawings: Drawing[];
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
        connectionStyle: initialConnectionStyle,
        drawings: initialDrawings
    }, 20);

    const nodes = historyState.nodes;
    const connectionStyle = historyState.connectionStyle;
    const drawings = historyState.drawings;

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

    const mutateNodes = useCallback((action: MindMapNode[] | ((prev: MindMapNode[]) => MindMapNode[])) => {
        mutate((prev) => ({
            ...prev,
            nodes: typeof action === 'function' ? action(prev.nodes) : action
        }));
    }, [mutate]);

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

    const resetNodes = useCallback((newNodes: MindMapNode[], newConnectionStyle?: ConnectionStyle, newDrawings?: Drawing[]) => {
        reset({
            nodes: newNodes,
            connectionStyle: newConnectionStyle ?? connectionStyle,
            drawings: newDrawings ?? []
        });
    }, [reset, connectionStyle]);

    const restoreFullState = useCallback((newNodes: MindMapNode[], newConnectionStyle: ConnectionStyle, newDrawings: Drawing[]) => {
        set(() => ({ nodes: newNodes, connectionStyle: newConnectionStyle, drawings: newDrawings }));
    }, [set]);

    const updateNodeMeasurement = useCallback((id: string, width: number, height: number) => {
        mutateNodes((prev) => prev.map((node) => (
            node.id === id ? { ...node, measuredWidth: width, measuredHeight: height } : node
        )));
    }, [mutateNodes]);

    const setDrawings = useCallback((action: Drawing[] | ((prev: Drawing[]) => Drawing[])) => {
        set((prev) => ({
            ...prev,
            drawings: typeof action === 'function' ? action(prev.drawings) : action
        }));
    }, [set]);

    const replaceDrawings = useCallback((action: Drawing[] | ((prev: Drawing[]) => Drawing[])) => {
        replace((prev) => ({
            ...prev,
            drawings: typeof action === 'function' ? action(prev.drawings) : action
        }));
    }, [replace]);

    const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
    const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

    useEffect(() => {
        setSelectedNodeIds((prev) => {
            if (prev.size === 0) return prev;
            const filtered = new Set(Array.from(prev).filter((id) => nodes.some((n) => n.id === id)));
            return filtered.size === prev.size ? prev : filtered;
        });

        setSelectedLineId((prev) => {
            if (!prev) return prev;
            let stillValid: boolean;
            if (prev.startsWith('rel::')) {
                const [, sourceId, targetId] = prev.split('::');
                const source = nodes.find((n) => n.id === sourceId);
                stillValid = !!source?.relations?.some((r) => r.targetId === targetId);
            } else {
                const [parentId, childId] = prev.split('::');
                const child = nodes.find((n) => n.id === childId);
                stillValid = !!child && child.parentId === parentId;
            }
            return stillValid ? prev : null;
        });
    }, [nodes]);

    const saveSnapshot = useCallback(() => {
        set((prev) => prev);
    }, [set]);

    const addChildNode = useCallback((parentId: string, initialText: string = 'New Item') => {
        const newId = generateId();

        let added = false;
        setNodes((prev) => {
            const parent = prev.find((n) => n.id === parentId);
            if (!parent) return prev;

            added = true;
            const children = prev.filter((n) => n.parentId === parentId);
            const angle = (children.length * 50 - 100) * (Math.PI / 180);

            const parentW = parent.measuredWidth || parent.width || 150;
            const parentH = parent.measuredHeight || parent.height || 60;
            const sizeSlack = Math.max(0, (Math.max(parentW, parentH) - 150) / 2);
            const distance = 250 + sizeSlack;

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
                newNode.x = parent.x + (isRight ? 1 : -1) * (200 + sizeSlack);
                newNode.y = parent.y + (children.length * 60 - 100);
            }

            return [...prev, newNode];
        });
        if (added) {
            setSelectedNodeIds(new Set([newId]));
        }
        return added ? newId : null;
    }, [setNodes]);

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

    const replaceNodeText = useCallback((id: string, text: string) => {
        replaceNodes((prev) => prev.map((node) => (node.id === id ? { ...node, text } : node)));
    }, [replaceNodes]);

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
        drawings,
        setDrawings,
        replaceDrawings,
        setNodes,
        setConnectionStyle,
        applyGlobalConnectionStyle,
        replaceNodes,
        saveSnapshot,
        resetNodes,
        restoreFullState,
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
