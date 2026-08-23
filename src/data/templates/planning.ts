import { MindMapNode } from '@/types/mindmap';
import { Template } from '@/types/templates';

const customerJourneyNodes: MindMapNode[] = [
    { id: 'root', text: 'JOURNEY MAP', x: 0, y: -150, color: 'root', parentId: null },
    { id: 'aware', text: 'AWARENESS', x: -400, y: -50, color: 'blue', parentId: 'root' },
    { id: 'cons', text: 'CONSIDERATION', x: -200, y: -50, color: 'purple', parentId: 'root' },
    { id: 'purch', text: 'PURCHASE', x: 0, y: -50, color: 'orange', parentId: 'root' },
    { id: 'ret', text: 'RETENTION', x: 200, y: -50, color: 'green', parentId: 'root' },
    { id: 'adv', text: 'ADVOCACY', x: 400, y: -50, color: 'pink', parentId: 'root' },

    { id: 'a1', text: 'Ads', x: -400, y: 50, color: 'blue', parentId: 'aware' },
    { id: 'a2', text: 'Social', x: -400, y: 130, color: 'blue', parentId: 'aware' },

    { id: 'c1', text: 'Reviews', x: -200, y: 50, color: 'purple', parentId: 'cons' },
    { id: 'c2', text: 'Demo', x: -200, y: 130, color: 'purple', parentId: 'cons' },

    { id: 'p1', text: 'Checkout', x: 0, y: 50, color: 'orange', parentId: 'purch' },

    { id: 'r1', text: 'Onboarding', x: 200, y: 50, color: 'green', parentId: 'ret' },
    { id: 'r2', text: 'Support', x: 200, y: 130, color: 'green', parentId: 'ret' },

    { id: 'ad1', text: 'Referral', x: 400, y: 50, color: 'pink', parentId: 'adv' },
];

const vennDiagramNodes: MindMapNode[] = [
    { id: 'root', text: 'Venn Diagram', x: 0, y: -150, color: 'root', parentId: null },
    { id: 'a', text: 'SET A', x: -200, y: 0, color: 'blue', parentId: 'root' },
    { id: 'b', text: 'SET B', x: 200, y: 0, color: 'orange', parentId: 'root' },
    { id: 'ab', text: 'INTERSECTION', x: 0, y: 0, color: 'purple', parentId: 'root' },

    { id: 'a1', text: 'Unique A', x: -300, y: 100, color: 'blue', parentId: 'a' },
    { id: 'b1', text: 'Unique B', x: 300, y: 100, color: 'orange', parentId: 'b' },
    { id: 'ab1', text: 'Shared', x: 0, y: 100, color: 'purple', parentId: 'ab' },
];

const cycleDiagramNodes: MindMapNode[] = [
    { id: 'root', text: 'CYCLE', x: 0, y: 0, color: 'root', parentId: null },
    { id: 's1', text: '1. Plan', x: 0, y: -150, color: 'blue', parentId: 'root' },
    { id: 's2', text: '2. Do', x: 140, y: -50, color: 'green', parentId: 'root' },
    { id: 's3', text: '3. Check', x: 90, y: 120, color: 'orange', parentId: 'root' },
    { id: 's4', text: '4. Act', x: -90, y: 120, color: 'pink', parentId: 'root' },
    { id: 's5', text: '5. Review', x: -140, y: -50, color: 'purple', parentId: 'root' },
];

const eisenhowerBoxNodes: MindMapNode[] = [
    { id: 'root', text: 'Priorities', x: 0, y: 0, color: 'root', parentId: null },
    { id: 'do', text: 'DO FIRST', x: -200, y: -150, color: 'red', parentId: 'root' },
    { id: 'sched', text: 'SCHEDULE', x: 200, y: -150, color: 'blue', parentId: 'root' },
    { id: 'del', text: 'DELEGATE', x: -200, y: 150, color: 'orange', parentId: 'root' },
    { id: 'elim', text: 'ELIMINATE', x: 200, y: 150, color: 'grey', parentId: 'root' },

    { id: 'd1', text: 'Urgent & Import.', x: -200, y: -100, color: 'red', parentId: 'do' },
    { id: 's1', text: 'Import. Not Urgent', x: 200, y: -100, color: 'blue', parentId: 'sched' },
    { id: 'dl1', text: 'Urgent Not Import.', x: -200, y: 200, color: 'orange', parentId: 'del' },
    { id: 'e1', text: 'Neither', x: 200, y: 200, color: 'grey', parentId: 'elim' },
];

const causeEffectNodes: MindMapNode[] = [
    { id: 'root', text: 'PROBLEM', x: 300, y: 0, color: 'red', parentId: null },

    { id: 'spine1', text: '', x: 100, y: 0, color: 'root', parentId: 'root' },
    { id: 'spine2', text: '', x: -100, y: 0, color: 'root', parentId: 'spine1' },
    { id: 'spine3', text: '', x: -300, y: 0, color: 'root', parentId: 'spine2' },

    { id: 'c3', text: 'People', x: 100, y: -120, color: 'blue', parentId: 'spine1' },
    { id: 'c2', text: 'Process', x: -100, y: -120, color: 'blue', parentId: 'spine2' },
    { id: 'c1', text: 'Equipment', x: -300, y: -120, color: 'blue', parentId: 'spine3' },

    { id: 'c6', text: 'Management', x: 100, y: 120, color: 'green', parentId: 'spine1' },
    { id: 'c5', text: 'Environment', x: -100, y: 120, color: 'green', parentId: 'spine2' },
    { id: 'c4', text: 'Materials', x: -300, y: 120, color: 'green', parentId: 'spine3' },
];

const layerStackingNodes: MindMapNode[] = [
    { id: 'root', text: 'Technology Stack', x: 0, y: -300, color: 'root', parentId: null, shape: 'isometric' },

    { id: 'presentation', text: 'Presentation Layer', x: 0, y: -150, color: 'blue', parentId: 'root', shape: 'isometric', width: 220, height: 120 },

    { id: 'api', text: 'API Gateway', x: 0, y: 0, color: 'purple', parentId: 'root', shape: 'isometric', width: 220, height: 120 },

    { id: 'services', text: 'Business Logic', x: 0, y: 150, color: 'orange', parentId: 'root', shape: 'isometric', width: 220, height: 120 },

    { id: 'data', text: 'Data Layer', x: 0, y: 300, color: 'green', parentId: 'root', shape: 'isometric', width: 220, height: 120 },
];

const okrPlanningNodes: MindMapNode[] = [
    { id: 'root', text: 'Objective', x: 0, y: -200, color: 'root', parentId: null },

    { id: 'kr1', text: 'Key Result 1', x: -300, y: -50, color: 'blue', parentId: 'root' },
    { id: 'kr2', text: 'Key Result 2', x: 0, y: -50, color: 'green', parentId: 'root' },
    { id: 'kr3', text: 'Key Result 3', x: 300, y: -50, color: 'orange', parentId: 'root' },

    { id: 'i1', text: 'Initiative A', x: -380, y: 100, color: 'blue', parentId: 'kr1' },
    { id: 'i2', text: 'Initiative B', x: -220, y: 100, color: 'blue', parentId: 'kr1' },
    { id: 'i3', text: 'Initiative C', x: -80, y: 100, color: 'green', parentId: 'kr2' },
    { id: 'i4', text: 'Initiative D', x: 80, y: 100, color: 'green', parentId: 'kr2' },
    { id: 'i5', text: 'Initiative E', x: 220, y: 100, color: 'orange', parentId: 'kr3' },
    { id: 'i6', text: 'Initiative F', x: 380, y: 100, color: 'orange', parentId: 'kr3' },
];

const fiveWhysNodes: MindMapNode[] = [
    { id: 'root', text: 'Problem', x: 0, y: -300, color: 'red', parentId: null },
    { id: 'why1', text: 'Why? #1', x: 0, y: -180, color: 'orange', parentId: 'root' },
    { id: 'why2', text: 'Why? #2', x: 0, y: -60, color: 'orange', parentId: 'why1' },
    { id: 'why3', text: 'Why? #3', x: 0, y: 60, color: 'orange', parentId: 'why2' },
    { id: 'why4', text: 'Why? #4', x: 0, y: 180, color: 'orange', parentId: 'why3' },
    { id: 'cause', text: 'Root Cause', x: 0, y: 300, color: 'green', parentId: 'why4' },
];

const decisionTreeNodes: MindMapNode[] = [
    { id: 'root', text: 'Decision?', x: 0, y: -250, color: 'root', parentId: null },
    { id: 'yes', text: 'Yes', x: -250, y: -100, color: 'green', parentId: 'root' },
    { id: 'no', text: 'No', x: 250, y: -100, color: 'red', parentId: 'root' },

    { id: 'y1', text: 'Outcome A', x: -350, y: 50, color: 'green', parentId: 'yes' },
    { id: 'y2', text: 'Outcome B', x: -150, y: 50, color: 'green', parentId: 'yes' },
    { id: 'n1', text: 'Outcome C', x: 150, y: 50, color: 'red', parentId: 'no' },
    { id: 'n2', text: 'Outcome D', x: 350, y: 50, color: 'red', parentId: 'no' },
];

export const planningTemplates: Template[] = [
    {
        id: 'customer-journey',
        name: 'Customer Journey Map',
        category: 'planning',
        description: 'Awareness to Advocacy customer touchpoints',
        nodes: customerJourneyNodes,
        tags: ['ux', 'journey map', 'marketing', 'customer experience'],
        connectionStyle: 'curved',
    },
    {
        id: 'venn-diagram',
        name: 'Venn Diagram',
        category: 'planning',
        description: 'Compare and contrast elements',
        nodes: vennDiagramNodes,
        tags: ['compare', 'overlap', 'sets', 'contrast'],
        connectionStyle: 'curved',
    },
    {
        id: 'cycle-diagram',
        name: 'Cycle Diagram',
        category: 'planning',
        description: 'Plan-Do-Check-Act-Review continuous improvement cycle',
        nodes: cycleDiagramNodes,
        tags: ['pdca', 'process', 'continuous improvement', 'cycle'],
        connectionStyle: 'curved',
    },
    {
        id: 'eisenhower-box',
        name: 'Eisenhower Box',
        category: 'planning',
        description: 'Prioritize tasks: Do First, Schedule, Delegate, Eliminate',
        nodes: eisenhowerBoxNodes,
        tags: ['priority', 'time management', 'productivity', 'matrix'],
        connectionStyle: 'curved',
    },
    {
        id: 'cause-effect',
        name: 'Cause & Effect',
        category: 'planning',
        description: 'Trace causes to key problems and symptoms',
        nodes: causeEffectNodes,
        tags: ['fishbone', 'ishikawa', 'root cause', 'problem solving'],
        connectionStyle: 'orthogonal',
    },
    {
        id: 'layer-stacking',
        name: 'Layer Stacking Layout',
        category: 'planning',
        description: 'Visualizing technology stack or architectural layers',
        nodes: layerStackingNodes,
        tags: ['architecture', 'tech stack', 'layers', 'system design'],
        connectionStyle: 'straight',
    },
    {
        id: 'okr-planning',
        name: 'OKR Planning',
        category: 'planning',
        description: 'Objectives, Key Results, and supporting initiatives',
        nodes: okrPlanningNodes,
        tags: ['okr', 'objectives', 'key results', 'goals', 'strategy'],
        connectionStyle: 'curved',
    },
    {
        id: 'five-whys',
        name: '5 Whys Root Cause',
        category: 'planning',
        description: 'Drill from a problem to its root cause by asking "why" five times',
        nodes: fiveWhysNodes,
        tags: ['root cause', '5 whys', 'problem solving', 'rca'],
        connectionStyle: 'straight',
    },
    {
        id: 'decision-tree',
        name: 'Decision Tree',
        category: 'planning',
        description: 'Map a decision and its branching yes/no outcomes',
        nodes: decisionTreeNodes,
        tags: ['decision', 'tree', 'flowchart', 'logic'],
        connectionStyle: 'orthogonal',
    },
];
