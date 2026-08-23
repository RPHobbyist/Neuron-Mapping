import { MindMapNode } from '@/types/mindmap';
import { Template } from '@/types/templates';

export const blankMindMapNodes: MindMapNode[] = [
    { id: 'root', text: 'Central Idea', x: 0, y: 0, color: 'root', parentId: null },
    { id: 'branch1', text: 'Topic 1', x: -250, y: -120, color: 'blue', parentId: 'root' },
    { id: 'branch2', text: 'Topic 2', x: 250, y: -120, color: 'teal', parentId: 'root' },
    { id: 'branch3', text: 'Topic 3', x: 250, y: 120, color: 'orange', parentId: 'root' },
    { id: 'branch4', text: 'Topic 4', x: -250, y: 120, color: 'purple', parentId: 'root' },
];

const simpleFlowchartNodes: MindMapNode[] = [
    { id: 'start', text: 'Start', x: 0, y: -250, color: 'green', parentId: null },
    { id: 'decision', text: 'Decision?', x: 0, y: -120, color: 'orange', parentId: 'start' },
    { id: 'yes', text: 'Yes Path', x: -200, y: 0, color: 'blue', parentId: 'decision' },
    { id: 'no', text: 'No Path', x: 200, y: 0, color: 'red', parentId: 'decision' },
    { id: 'end1', text: 'End', x: -200, y: 120, color: 'grey', parentId: 'yes' },
    { id: 'end2', text: 'End', x: 200, y: 120, color: 'grey', parentId: 'no' },
];

const simpleTimelineNodes: MindMapNode[] = [
    { id: 'root', text: 'Timeline', x: 0, y: -150, color: 'root', parentId: null },
    { id: 'm1', text: 'Milestone 1', x: -300, y: 0, color: 'blue', parentId: 'root' },
    { id: 'm2', text: 'Milestone 2', x: -100, y: 0, color: 'teal', parentId: 'm1' },
    { id: 'm3', text: 'Milestone 3', x: 100, y: 0, color: 'purple', parentId: 'm2' },
    { id: 'm4', text: 'Milestone 4', x: 300, y: 0, color: 'green', parentId: 'm3' },
];

export const quickDiagramTemplates: Template[] = [
    {
        id: 'blank-mindmap',
        name: 'Blank Canvas',
        category: 'quick-diagrams',
        description: 'Start with a central idea and branch out',
        nodes: blankMindMapNodes,
        tags: ['blank', 'brainstorm', 'freeform', 'starter', 'mindmap'],
        connectionStyle: 'curved',
    },
    {
        id: 'simple-flowchart',
        name: 'Simple Flowchart',
        category: 'quick-diagrams',
        description: 'Basic start-decision-end flowchart',
        nodes: simpleFlowchartNodes,
        tags: ['flowchart', 'process', 'decision', 'basic', 'diagram'],
        connectionStyle: 'orthogonal',
    },
    {
        id: 'simple-timeline',
        name: 'Timeline',
        category: 'quick-diagrams',
        description: 'Sequential milestones along a simple timeline',
        nodes: simpleTimelineNodes,
        tags: ['timeline', 'milestones', 'roadmap', 'schedule', 'history'],
        connectionStyle: 'straight',
    },
];
 