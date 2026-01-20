import { MindMapNode } from '@/types/mindmap';
import { Template } from '@/types/templates';

// Blank Mind Map - Balanced Radial Star
export const blankMindMapNodes: MindMapNode[] = [
    { id: 'root', text: 'Central Idea', x: 0, y: 0, color: 'root', parentId: null },
    { id: 'branch1', text: 'Topic 1', x: -250, y: -120, color: 'blue', parentId: 'root' },
    { id: 'branch2', text: 'Topic 2', x: 250, y: -120, color: 'teal', parentId: 'root' },
    { id: 'branch3', text: 'Topic 3', x: 250, y: 120, color: 'orange', parentId: 'root' },
    { id: 'branch4', text: 'Topic 4', x: -250, y: 120, color: 'purple', parentId: 'root' },
];

export const quickDiagramTemplates: Template[] = [
    {
        id: 'blank-mindmap',
        name: 'Blank mind map',
        category: 'quick-diagrams',
        description: 'Start with a central idea and branch out',
        nodes: blankMindMapNodes,
        preview: 'mindmap',
    },
];
