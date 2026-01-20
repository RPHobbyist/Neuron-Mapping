import { MindMapNode } from '@/types/mindmap';
import { Template } from '@/types/templates';

// Customer Journey - Horizontal
const customerJourneyNodes: MindMapNode[] = [
    { id: 'root', text: 'JOURNEY MAP', x: 0, y: -150, color: 'root', parentId: null },
    { id: 'aware', text: 'AWARENESS', x: -400, y: -50, color: 'blue', parentId: 'root' },
    { id: 'cons', text: 'CONSIDERATION', x: -200, y: -50, color: 'purple', parentId: 'root' },
    { id: 'purch', text: 'PURCHASE', x: 0, y: -50, color: 'orange', parentId: 'root' },
    { id: 'ret', text: 'RETENTION', x: 200, y: -50, color: 'green', parentId: 'root' },
    { id: 'adv', text: 'ADVOCACY', x: 400, y: -50, color: 'pink', parentId: 'root' },

    // Details
    { id: 'a1', text: 'Ads', x: -400, y: 50, color: 'blue', parentId: 'aware' },
    { id: 'a2', text: 'Social', x: -400, y: 130, color: 'blue', parentId: 'aware' },

    { id: 'c1', text: 'Reviews', x: -200, y: 50, color: 'purple', parentId: 'cons' },
    { id: 'c2', text: 'Demo', x: -200, y: 130, color: 'purple', parentId: 'cons' },

    { id: 'p1', text: 'Checkout', x: 0, y: 50, color: 'orange', parentId: 'purch' },

    { id: 'r1', text: 'Onboarding', x: 200, y: 50, color: 'green', parentId: 'ret' },
    { id: 'r2', text: 'Support', x: 200, y: 130, color: 'green', parentId: 'ret' },

    { id: 'ad1', text: 'Referral', x: 400, y: 50, color: 'pink', parentId: 'adv' },
];

// Venn Diagram
const vennDiagramNodes: MindMapNode[] = [
    { id: 'root', text: 'Venn Diagram', x: 0, y: -150, color: 'root', parentId: null },
    { id: 'a', text: 'SET A', x: -200, y: 0, color: 'blue', parentId: 'root' },
    { id: 'b', text: 'SET B', x: 200, y: 0, color: 'orange', parentId: 'root' },
    { id: 'ab', text: 'INTERSECTION', x: 0, y: 0, color: 'purple', parentId: 'root' },

    { id: 'a1', text: 'Unique A', x: -300, y: 100, color: 'blue', parentId: 'a' },
    { id: 'b1', text: 'Unique B', x: 300, y: 100, color: 'orange', parentId: 'b' },
    { id: 'ab1', text: 'Shared', x: 0, y: 100, color: 'purple', parentId: 'ab' },
];

// Cycle Diagram - Radial Layout
const cycleDiagramNodes: MindMapNode[] = [
    { id: 'root', text: 'CYCLE', x: 0, y: 0, color: 'root', parentId: null },
    // All steps connect to root for clean radial layout
    { id: 's1', text: '1. Plan', x: 0, y: -150, color: 'blue', parentId: 'root' },
    { id: 's2', text: '2. Do', x: 140, y: -50, color: 'green', parentId: 'root' },
    { id: 's3', text: '3. Check', x: 90, y: 120, color: 'orange', parentId: 'root' },
    { id: 's4', text: '4. Act', x: -90, y: 120, color: 'pink', parentId: 'root' },
    { id: 's5', text: '5. Review', x: -140, y: -50, color: 'purple', parentId: 'root' },
];

// Eisenhower Box
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

// Cause Effect
const causeEffectNodes: MindMapNode[] = [
    { id: 'root', text: 'PROBLEM', x: 300, y: 0, color: 'red', parentId: null },

    // Spine Segments (Invisible Structural Nodes)
    // Connecting left-to-right towards the problem
    { id: 'spine1', text: '', x: 100, y: 0, color: 'root', parentId: 'root' },
    { id: 'spine2', text: '', x: -100, y: 0, color: 'root', parentId: 'spine1' },
    { id: 'spine3', text: '', x: -300, y: 0, color: 'root', parentId: 'spine2' },

    // Top Ribs (Angle upwards)
    { id: 'c3', text: 'People', x: 100, y: -120, color: 'blue', parentId: 'spine1' },
    { id: 'c2', text: 'Process', x: -100, y: -120, color: 'blue', parentId: 'spine2' },
    { id: 'c1', text: 'Equipment', x: -300, y: -120, color: 'blue', parentId: 'spine3' },

    // Bottom Ribs (Angle downwards)
    { id: 'c6', text: 'Management', x: 100, y: 120, color: 'green', parentId: 'spine1' },
    { id: 'c5', text: 'Environment', x: -100, y: 120, color: 'green', parentId: 'spine2' },
    { id: 'c4', text: 'Materials', x: -300, y: 120, color: 'green', parentId: 'spine3' },
];

// Layer Stacking - Tech Stack
const layerStackingNodes: MindMapNode[] = [
    // Root effectively acts as the title or top container concept
    { id: 'root', text: 'Technology Stack', x: 0, y: -300, color: 'root', parentId: null, shape: 'isometric' },

    // Layer 1: Presentation (Top)
    { id: 'presentation', text: 'Presentation Layer', x: 0, y: -150, color: 'blue', parentId: 'root', shape: 'isometric', width: 220, height: 120 },

    // Layer 2: API (Middle Top)
    { id: 'api', text: 'API Gateway', x: 0, y: 0, color: 'purple', parentId: 'root', shape: 'isometric', width: 220, height: 120 },

    // Layer 3: Services (Middle)
    { id: 'services', text: 'Business Logic', x: 0, y: 150, color: 'orange', parentId: 'root', shape: 'isometric', width: 220, height: 120 },

    // Layer 4: Data (Bottom)
    { id: 'data', text: 'Data Layer', x: 0, y: 300, color: 'green', parentId: 'root', shape: 'isometric', width: 220, height: 120 },
];

export const planningTemplates: Template[] = [
    {
        id: 'customer-journey',
        name: 'Customer Journey Map',
        category: 'planning',
        description: 'Awareness to Advocacy customer touchpoints',
        nodes: customerJourneyNodes,
        preview: 'customerJourney',
    },
    {
        id: 'venn-diagram',
        name: 'Venn Diagram',
        category: 'planning',
        description: 'Compare and contrast elements',
        nodes: vennDiagramNodes,
        preview: 'vennDiagram',
    },
    {
        id: 'cycle-diagram',
        name: 'Cycle Diagram',
        category: 'planning',
        description: '5-Step Process for Effective Time Management',
        nodes: cycleDiagramNodes,
        preview: 'cycleDiagram',
    },
    {
        id: 'eisenhower-box',
        name: 'Eisenhower Box',
        category: 'planning',
        description: 'Prioritize tasks: Do First, Schedule, Delegate, Eliminate',
        nodes: eisenhowerBoxNodes,
        preview: 'eisenhowerBox',
    },
    {
        id: 'cause-effect',
        name: 'Cause & Effect',
        category: 'planning',
        description: 'Trace causes to key problems and symptoms',
        nodes: causeEffectNodes,
        preview: 'fishbone',
    },
    {
        id: 'layer-stacking',
        name: 'Layer Stacking Layout',
        category: 'planning',
        description: 'Visualizing technology stack or architectural layers',
        nodes: layerStackingNodes,
        preview: 'layerStacking',
    },
];
