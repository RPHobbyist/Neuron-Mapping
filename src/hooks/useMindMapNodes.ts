import { useState, useCallback } from 'react';
import { useHistory } from './useHistory';
import { MindMapNode, NodeColor, NodeShape, ConnectionStyle, NodePriority } from '@/types/mindmap';
import { toast } from 'sonner';
import { generateId, getDescendantIds } from '@/utils/common';

export const useMindMapNodes = (initialNodes: MindMapNode[] = []) => {
    // History & State
    interface MindMapHistoryState {
        nodes: MindMapNode[];
        connectionStyle: ConnectionStyle;
    }

    const {
        state: historyState,
        set,
        replace,
        undo,
        redo,
        reset,
        canUndo,
        canRedo
    } = useHistory<MindMapHistoryState>({
        nodes: initialNodes,
        connectionStyle: 'curved'
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

    const setConnectionStyle = useCallback((style: ConnectionStyle) => {
        set((prev) => ({ ...prev, connectionStyle: style }));
    }, [set]);

    const resetNodes = useCallback((newNodes: MindMapNode[]) => {
        reset({ nodes: newNodes, connectionStyle: 'curved' });
    }, [reset]);

    // Selection
    const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
    const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

    const saveSnapshot = useCallback(() => {
        set((prev) => prev); // Save current state to history
    }, [set]);

    // Actions
    const addChildNode = useCallback((parentId: string) => {
        const parent = nodes.find((n) => n.id === parentId);
        if (!parent) return;

        const children = nodes.filter((n) => n.parentId === parentId);
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
            id: generateId(),
            text: 'New Item',
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

        setNodes((prev) => [...prev, newNode]);
        setSelectedNodeIds(new Set([newNode.id]));
    }, [nodes, setNodes]);

    const addRelation = useCallback(() => {
        if (selectedNodeIds.size !== 2) return;
        const [sourceId, targetId] = Array.from(selectedNodeIds);

        setNodes((prev) => prev.map((node) => {
            if (node.id === sourceId) {
                const existing = node.relations || [];
                if (existing.some(r => r.targetId === targetId)) return node;
                return { ...node, relations: [...existing, { targetId }] };
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
        updateNode,
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
