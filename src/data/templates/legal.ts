import { MindMapNode } from '@/types/mindmap';
import { Template } from '@/types/templates';

const legalCaseProcessNodes: MindMapNode[] = [
    { id: 'root', text: 'Legal Case', x: 0, y: -300, color: 'root', parentId: null },
    { id: 'start', text: 'Instructions', x: 0, y: -200, color: 'teal', parentId: 'root' },
    { id: 'bg', text: 'Background Check', x: 0, y: -110, color: 'teal', parentId: 'start' },
    { id: 'review', text: 'Review Case', x: 0, y: -20, color: 'teal', parentId: 'bg' },
    { id: 'doc', text: 'Documentation', x: 0, y: 70, color: 'teal', parentId: 'review' },
    { id: 'dispute', text: 'Dispute?', x: 0, y: 160, color: 'pink', parentId: 'doc' },

    { id: 'settle', text: 'Settle', x: -200, y: 250, color: 'green', parentId: 'dispute' },
    { id: 'proceed', text: 'Proceeding', x: 200, y: 250, color: 'orange', parentId: 'dispute' },

    { id: 'end1', text: 'Close', x: -200, y: 340, color: 'teal', parentId: 'settle' },
    { id: 'trial', text: 'Trial', x: 200, y: 340, color: 'orange', parentId: 'proceed' },
];

const complianceChecklistNodes: MindMapNode[] = [
    { id: 'root', text: 'Compliance Review', x: 0, y: -250, color: 'root', parentId: null },

    { id: 'privacy', text: 'Data Privacy', x: -350, y: -100, color: 'blue', parentId: 'root' },
    { id: 'contracts', text: 'Contracts', x: -120, y: -100, color: 'purple', parentId: 'root' },
    { id: 'regulatory', text: 'Regulatory', x: 120, y: -100, color: 'orange', parentId: 'root' },
    { id: 'employment', text: 'Employment', x: 350, y: -100, color: 'green', parentId: 'root' },

    { id: 'p1', text: 'GDPR / CCPA Audit', x: -350, y: 50, color: 'blue', parentId: 'privacy' },
    { id: 'c1', text: 'Vendor Agreements', x: -120, y: 50, color: 'purple', parentId: 'contracts' },
    { id: 'r1', text: 'Industry Standards', x: 120, y: 50, color: 'orange', parentId: 'regulatory' },
    { id: 'e1', text: 'Labor Law Review', x: 350, y: 50, color: 'green', parentId: 'employment' },
];

export const legalTemplates: Template[] = [
    {
        id: 'legal-case',
        name: 'Legal Case Process',
        category: 'legal',
        description: 'Legal case workflow with decision points',
        nodes: legalCaseProcessNodes,
        tags: ['legal', 'case', 'litigation', 'workflow'],
        connectionStyle: 'orthogonal',
    },
    {
        id: 'compliance-checklist',
        name: 'Compliance Review Checklist',
        category: 'legal',
        description: 'Audit data privacy, contracts, regulatory and employment compliance',
        nodes: complianceChecklistNodes,
        tags: ['legal', 'compliance', 'audit', 'gdpr', 'regulatory', 'checklist'],
        connectionStyle: 'orthogonal',
    },
];
 