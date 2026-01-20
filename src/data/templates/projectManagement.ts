import { MindMapNode } from '@/types/mindmap';
import { Template } from '@/types/templates';

// Product Launch Checklist - Clean Hierarchy
const productLaunchChecklistNodes: MindMapNode[] = [
    { id: 'root', text: 'Product Launch Checklist', x: 0, y: -250, color: 'teal', parentId: null },

    // Columns
    { id: 'legal', text: 'Legal', x: -450, y: -150, color: 'orange', parentId: 'root' },
    { id: 'landing', text: 'Landing Pages', x: -150, y: -150, color: 'purple', parentId: 'root' },
    { id: 'mkt', text: 'Marketing', x: 150, y: -150, color: 'pink', parentId: 'root' },
    { id: 'support', text: 'Support', x: 450, y: -150, color: 'blue', parentId: 'root' },

    // Legal Column
    { id: 'l1', text: 'Terms', x: -450, y: -50, color: 'orange', parentId: 'legal' },
    { id: 'l2', text: 'Privacy', x: -450, y: 40, color: 'orange', parentId: 'legal' },
    { id: 'l3', text: 'GDPR', x: -450, y: 130, color: 'orange', parentId: 'legal' },

    // Landing Column
    { id: 'p1', text: 'Copy', x: -150, y: -50, color: 'purple', parentId: 'landing' },
    { id: 'p2', text: 'SEO', x: -150, y: 40, color: 'purple', parentId: 'landing' },
    { id: 'p3', text: 'Images', x: -150, y: 130, color: 'purple', parentId: 'landing' },

    // Marketing Column
    { id: 'm1', text: 'Socials', x: 150, y: -50, color: 'pink', parentId: 'mkt' },
    { id: 'm2', text: 'Email', x: 150, y: 40, color: 'pink', parentId: 'mkt' },
    { id: 'm3', text: 'Ads', x: 150, y: 130, color: 'pink', parentId: 'mkt' },

    // Support Column
    { id: 's1', text: 'Docs', x: 450, y: -50, color: 'blue', parentId: 'support' },
    { id: 's2', text: 'Training', x: 450, y: 40, color: 'blue', parentId: 'support' },
    { id: 's3', text: 'FAQ', x: 450, y: 130, color: 'blue', parentId: 'support' },
];

// Product Launch Radial - Star
const productLaunchRadialNodes: MindMapNode[] = [
    { id: 'root', text: 'LAUNCH PLAN', x: 0, y: 0, color: 'root', parentId: null },
    { id: 'prod', text: 'PRODUCT', x: -300, y: -150, color: 'blue', parentId: 'root' },
    { id: 'kpi', text: "KPIs", x: -300, y: 150, color: 'purple', parentId: 'root' },
    { id: 'promo', text: 'PROMO', x: 300, y: -150, color: 'orange', parentId: 'root' },
    { id: 'stake', text: 'STAKEHOLDERS', x: 300, y: 150, color: 'green', parentId: 'root' },

    // Product Sub
    { id: 'p1', text: 'Pricing', x: -450, y: -200, color: 'blue', parentId: 'prod' },
    { id: 'p2', text: 'Specs', x: -450, y: -100, color: 'blue', parentId: 'prod' },

    // KPI Sub
    { id: 'k1', text: 'Traffic', x: -450, y: 100, color: 'purple', parentId: 'kpi' },
    { id: 'k2', text: 'Sales', x: -450, y: 200, color: 'purple', parentId: 'kpi' },

    // Promo Sub
    { id: 'pr1', text: 'Ads', x: 450, y: -200, color: 'orange', parentId: 'promo' },
    { id: 'pr2', text: 'Social', x: 450, y: -100, color: 'orange', parentId: 'promo' },

    // Stakeholder Sub
    { id: 'st1', text: 'Investors', x: 450, y: 100, color: 'green', parentId: 'stake' },
    { id: 'st2', text: 'Team', x: 450, y: 200, color: 'green', parentId: 'stake' },
];

// Product Development - Phases
const productDevelopmentNodes: MindMapNode[] = [
    { id: 'root', text: 'Development Cycle', x: 0, y: 0, color: 'root', parentId: null },
    { id: 'concept', text: '1. Concept', x: -300, y: -100, color: 'blue', parentId: 'root' },
    { id: 'design', text: '2. Design', x: -100, y: -100, color: 'purple', parentId: 'root' },
    { id: 'dev', text: '3. Develop', x: 100, y: -100, color: 'orange', parentId: 'root' },
    { id: 'test', text: '4. Test', x: 300, y: -100, color: 'pink', parentId: 'root' },
    { id: 'launch', text: '5. Launch', x: 0, y: 150, color: 'green', parentId: 'root' },

    // Concept Children
    { id: 'c1', text: 'Research', x: -350, y: -180, color: 'blue', parentId: 'concept' },
    { id: 'c2', text: 'Feasibility', x: -250, y: -180, color: 'blue', parentId: 'concept' },

    // Design Children
    { id: 'd1', text: 'UI/UX', x: -150, y: -180, color: 'purple', parentId: 'design' },
    { id: 'd2', text: 'Prototype', x: -50, y: -180, color: 'purple', parentId: 'design' },

    // Develop Children
    { id: 'dv1', text: 'Frontend', x: 50, y: -180, color: 'orange', parentId: 'dev' },
    { id: 'dv2', text: 'Backend', x: 150, y: -180, color: 'orange', parentId: 'dev' },

    // Test Children
    { id: 't1', text: 'QA', x: 250, y: -180, color: 'pink', parentId: 'test' },
    { id: 't2', text: 'UAT', x: 350, y: -180, color: 'pink', parentId: 'test' },

    // Launch Children
    { id: 'l1', text: 'Deploy', x: -150, y: 230, color: 'green', parentId: 'launch' },
    { id: 'l2', text: 'Marketing', x: 150, y: 230, color: 'green', parentId: 'launch' },
];

// Project Management - Flow
const projectManagementNodes: MindMapNode[] = [
    { id: 'root', text: 'Project Lifecycle', x: 0, y: -250, color: 'root', parentId: null },
    { id: 'init', text: 'Initiation', x: -300, y: -150, color: 'blue', parentId: 'root' },
    { id: 'plan', text: 'Planning', x: -100, y: -150, color: 'purple', parentId: 'root' },
    { id: 'exec', text: 'Execution', x: 100, y: -150, color: 'orange', parentId: 'root' },
    { id: 'close', text: 'Closure', x: 300, y: -150, color: 'green', parentId: 'root' },

    // Initiation
    { id: 'i1', text: 'Charter', x: -300, y: -50, color: 'blue', parentId: 'init' },
    { id: 'i2', text: 'Stakeholders', x: -300, y: 40, color: 'blue', parentId: 'init' },

    // Planning
    { id: 'p1', text: 'Scope', x: -100, y: -50, color: 'purple', parentId: 'plan' },
    { id: 'p2', text: 'Schedule', x: -100, y: 40, color: 'purple', parentId: 'plan' },
    { id: 'p3', text: 'Budget', x: -100, y: 130, color: 'purple', parentId: 'plan' },

    // Execution
    { id: 'e1', text: 'Deliverables', x: 100, y: -50, color: 'orange', parentId: 'exec' },
    { id: 'e2', text: 'QA', x: 100, y: 40, color: 'orange', parentId: 'exec' },

    // Closure
    { id: 'c1', text: 'Handover', x: 300, y: -50, color: 'green', parentId: 'close' },
    { id: 'c2', text: 'Review', x: 300, y: 40, color: 'green', parentId: 'close' },
];

export const projectTemplates: Template[] = [
    {
        id: 'product-launch-checklist',
        name: 'Product Launch Checklist',
        category: 'project-management',
        description: 'Complete checklist for product launches',
        nodes: productLaunchChecklistNodes,
        preview: 'productLaunchChecklist',
    },
    {
        id: 'product-launch-radial',
        name: 'Product Launch Plan',
        category: 'project-management',
        description: 'Radial view of product launch elements',
        nodes: productLaunchRadialNodes,
        preview: 'productLaunchRadial',
    },
    {
        id: 'product-development',
        name: 'Product Development',
        category: 'project-management',
        description: 'End-to-end product development with all phases',
        nodes: productDevelopmentNodes,
        preview: 'productDevelopment',
    },
    {
        id: 'project-management',
        name: 'Project Management',
        category: 'project-management',
        description: 'Board to Financial Director approval workflow',
        nodes: projectManagementNodes,
        preview: 'organigram',
    },
];
