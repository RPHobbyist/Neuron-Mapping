import { MindMapNode } from '@/types/mindmap';
import { Template } from '@/types/templates';

// Legal Case - Vertical Flow
const legalCaseProcessNodes: MindMapNode[] = [
    { id: 'root', text: 'Legal Case', x: 0, y: -300, color: 'root', parentId: null },
    { id: 'start', text: 'Instructions', x: 0, y: -200, color: 'teal', parentId: 'root' },
    { id: 'bg', text: 'Background Check', x: 0, y: -110, color: 'teal', parentId: 'start' },
    { id: 'review', text: 'Review Case', x: 0, y: -20, color: 'teal', parentId: 'bg' },
    { id: 'doc', text: 'Documentation', x: 0, y: 70, color: 'teal', parentId: 'review' },
    { id: 'dispute', text: 'Dispute?', x: 0, y: 160, color: 'pink', parentId: 'doc' },

    // Branches
    { id: 'settle', text: 'Settle', x: -200, y: 250, color: 'green', parentId: 'dispute' },
    { id: 'proceed', text: 'Proceeding', x: 200, y: 250, color: 'orange', parentId: 'dispute' },

    { id: 'end1', text: 'Close', x: -200, y: 340, color: 'teal', parentId: 'settle' },
    { id: 'trial', text: 'Trial', x: 200, y: 340, color: 'orange', parentId: 'proceed' },
];

export const legalTemplates: Template[] = [
    {
        id: 'legal-case',
        name: 'Legal Case Process',
        category: 'legal',
        description: 'Legal case workflow with decision points',
        nodes: legalCaseProcessNodes,
        preview: 'fishbone',
    },
];
