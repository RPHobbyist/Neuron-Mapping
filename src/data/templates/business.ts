import { MindMapNode } from '@/types/mindmap';
import { Template } from '@/types/templates';

// Order Fulfillment Process - Swimlane Flow
const orderFulfillmentNodes: MindMapNode[] = [
    { id: 'root', text: 'Order Fulfillment', x: 0, y: -350, color: 'teal', parentId: null },

    // Row 1 - Distributed symmetrically around 0
    // Col 1 (Start)
    { id: 'start', text: 'Start', x: -560, y: -200, color: 'purple', parentId: 'root' },
    // Col 2 (Place Order)
    { id: 'place', text: 'Place Order', x: -280, y: -200, color: 'purple', parentId: 'root' },
    // Col 3 (Manage Stock) - Center
    { id: 'manage', text: 'Manage Stock', x: 0, y: -200, color: 'blue', parentId: 'root' },
    // Col 4 (Pick Ticket)
    { id: 'pick', text: 'Pick Ticket', x: 280, y: -200, color: 'blue', parentId: 'root' },
    // Col 5 (Cargo Coord)
    { id: 'cargo', text: 'Cargo Coord', x: 560, y: -200, color: 'blue', parentId: 'root' },

    // Row 2
    // Col 1 Flow
    { id: 'prep', text: 'Prepare Ship', x: -560, y: 0, color: 'cyan', parentId: 'start' },

    // Col 2 Flow
    { id: 'weight', text: 'Weigh Pkg', x: -280, y: 0, color: 'blue', parentId: 'place' },

    // Col 3 Flow (From Weigh in Col 2)
    { id: 'label', text: 'Print Labels', x: 0, y: 0, color: 'blue', parentId: 'weight' },

    // Col 4 Flow
    { id: 'load', text: 'Load Trucks', x: 280, y: 0, color: 'orange', parentId: 'pick' },

    // Col 5 Flow
    { id: 'ship', text: 'Ship Order', x: 560, y: 0, color: 'blue', parentId: 'cargo' },

    // Row 3
    // Col 3 Continued
    { id: 'track', text: 'Tracking', x: 0, y: 200, color: 'orange', parentId: 'label' },

    // Col 4 Continued
    { id: 'invoice', text: 'Invoice', x: 280, y: 200, color: 'orange', parentId: 'load' },

    // Col 5 Continued
    { id: 'end', text: 'End', x: 560, y: 200, color: 'teal', parentId: 'ship' },
];

// Business Analyst - 4 Corners
const businessAnalystNodes: MindMapNode[] = [
    { id: 'root', text: 'BUSINESS ANALYST', x: 0, y: 0, color: 'root', parentId: null },
    { id: 'process', text: 'PROCESSES', x: -350, y: -180, color: 'purple', parentId: 'root' },
    { id: 'rules', text: 'RULES', x: 350, y: -180, color: 'blue', parentId: 'root' },
    { id: 'reqs', text: 'REQUIREMENTS', x: -350, y: 180, color: 'green', parentId: 'root' },
    { id: 'res', text: 'RESOURCES', x: 350, y: 180, color: 'orange', parentId: 'root' },

    // Sub-nodes
    { id: 'p1', text: 'Workflows', x: -350, y: -280, color: 'purple', parentId: 'process' },
    { id: 'p2', text: 'Analysis', x: -550, y: -180, color: 'purple', parentId: 'process' },

    { id: 'ru1', text: 'Compliance', x: 350, y: -280, color: 'blue', parentId: 'rules' },
    { id: 'ru2', text: 'Policies', x: 550, y: -180, color: 'blue', parentId: 'rules' },

    { id: 'rq1', text: 'Functional', x: -350, y: 280, color: 'green', parentId: 'reqs' },
    { id: 'rq2', text: 'Non-Func', x: -550, y: 180, color: 'green', parentId: 'reqs' },

    { id: 're1', text: 'Team', x: 350, y: 280, color: 'orange', parentId: 'res' },
    { id: 're2', text: 'Tools', x: 550, y: 180, color: 'orange', parentId: 'res' },
];

// Market Research - Tree Left/Right
const marketResearchNodes: MindMapNode[] = [
    { id: 'root', text: 'Market Research', x: 0, y: 0, color: 'teal', parentId: null },
    // Left Side
    { id: 'purpose', text: 'Purpose', x: -250, y: -150, color: 'blue', parentId: 'root' },
    { id: 'procedure', text: 'Procedure', x: -250, y: 150, color: 'pink', parentId: 'root' },
    // Right Side
    { id: 'results', text: 'Results', x: 250, y: -150, color: 'orange', parentId: 'root' },
    { id: 'analysis', text: 'Analysis', x: 250, y: 150, color: 'green', parentId: 'root' },

    // Purpose Children
    { id: 'p1', text: 'Needs', x: -450, y: -230, color: 'blue', parentId: 'purpose' },
    { id: 'p2', text: 'Risks', x: -450, y: -150, color: 'blue', parentId: 'purpose' },
    { id: 'p3', text: 'Oppts', x: -450, y: -70, color: 'blue', parentId: 'purpose' },

    // Procedure Children
    { id: 'pr1', text: 'Survey', x: -450, y: 70, color: 'pink', parentId: 'procedure' },
    { id: 'pr2', text: 'Data', x: -450, y: 150, color: 'pink', parentId: 'procedure' },
    { id: 'pr3', text: 'Report', x: -450, y: 230, color: 'pink', parentId: 'procedure' },

    // Results Children
    { id: 'r1', text: 'Comparing', x: 450, y: -230, color: 'orange', parentId: 'results' },
    { id: 'r2', text: 'Features', x: 450, y: -150, color: 'orange', parentId: 'results' },
    { id: 'r3', text: 'Profit', x: 450, y: -70, color: 'orange', parentId: 'results' },

    // Analysis Children
    { id: 'a1', text: 'Pricing', x: 450, y: 70, color: 'green', parentId: 'analysis' },
    { id: 'a2', text: 'Demand', x: 450, y: 150, color: 'green', parentId: 'analysis' },
    { id: 'a3', text: 'Competition', x: 450, y: 230, color: 'green', parentId: 'analysis' },
];

// Purchase Requisition
const purchaseRequisitionNodes: MindMapNode[] = [
    { id: 'root', text: 'Purchase Request', x: -350, y: 0, color: 'root', parentId: null },
    { id: 'req', text: 'Requisition', x: -150, y: 0, color: 'teal', parentId: 'root' },
    { id: 'approv', text: 'Approval', x: 50, y: 0, color: 'orange', parentId: 'req' },
    { id: 'po', text: 'Purchase Order', x: 250, y: 0, color: 'blue', parentId: 'approv' },
    { id: 'receive', text: 'Receive Goods', x: 450, y: 0, color: 'green', parentId: 'po' },

    // Details
    { id: 'budget', text: 'Budget Check', x: 50, y: -120, color: 'pink', parentId: 'approv' },
    { id: 'stock', text: 'Stock Check', x: 50, y: 120, color: 'pink', parentId: 'approv' },
];

// SWOT - 2x2
const swotNodes: MindMapNode[] = [
    { id: 'root', text: 'SWOT', x: 0, y: 0, color: 'root', parentId: null },
    { id: 's', text: 'Strengths', x: -200, y: -150, color: 'green', parentId: 'root' },
    { id: 'w', text: 'Weaknesses', x: 200, y: -150, color: 'orange', parentId: 'root' },
    { id: 'o', text: 'Opportunities', x: -200, y: 150, color: 'blue', parentId: 'root' },
    { id: 't', text: 'Threats', x: 200, y: 150, color: 'red', parentId: 'root' },
];

// Supplier Evaluation
const supplierEvaluationNodes: MindMapNode[] = [
    { id: 'root', text: 'Supplier Eval', x: 0, y: 0, color: 'root', parentId: null },
    { id: 'metrics', text: 'Metrics', x: -250, y: -100, color: 'blue', parentId: 'root' },
    { id: 'risks', text: 'Risks', x: 250, y: -100, color: 'red', parentId: 'root' },
    { id: 'cost', text: 'Cost', x: -250, y: 100, color: 'green', parentId: 'root' },
    { id: 'quality', text: 'Quality', x: 250, y: 100, color: 'purple', parentId: 'root' },

    { id: 'm1', text: 'On-time delivery', x: -450, y: -150, color: 'blue', parentId: 'metrics' },
    { id: 'r1', text: 'Financial stability', x: 450, y: -150, color: 'red', parentId: 'risks' },
    { id: 'c1', text: 'Unit Price', x: -450, y: 150, color: 'green', parentId: 'cost' },
    { id: 'q1', text: 'Defect Rate', x: 450, y: 150, color: 'purple', parentId: 'quality' },
];

// Five Forces
const portersFiveForces: MindMapNode[] = [
    { id: 'root', text: 'Rivalry', x: 0, y: 0, color: 'purple', parentId: null },
    { id: 'new', text: 'New Entrants', x: 0, y: -200, color: 'blue', parentId: 'root' },
    { id: 'sub', text: 'Substitutes', x: 0, y: 200, color: 'green', parentId: 'root' },
    { id: 'buy', text: 'Buyers', x: 300, y: 0, color: 'orange', parentId: 'root' },
    { id: 'supp', text: 'Suppliers', x: -300, y: 0, color: 'red', parentId: 'root' },

    { id: 'n1', text: 'Barriers', x: 0, y: -300, color: 'blue', parentId: 'new' },
    { id: 's1', text: 'Switch Costs', x: 0, y: 300, color: 'green', parentId: 'sub' },
    { id: 'b1', text: 'Volume', x: 300, y: 100, color: 'orange', parentId: 'buy' },
    { id: 'su1', text: 'Uniqueness', x: -300, y: 100, color: 'red', parentId: 'supp' },
];

export const businessTemplates: Template[] = [
    {
        id: 'order-fulfillment',
        name: 'Order Fulfillment Process',
        category: 'business',
        description: 'Swimlane flowchart for order processing workflow',
        nodes: orderFulfillmentNodes,
        preview: 'gantt',
    },
    {
        id: 'business-analyst',
        name: 'Business Analyst',
        category: 'business',
        description: 'Map business analyst responsibilities and relationships',
        nodes: businessAnalystNodes,
        preview: 'concept',
    },
    {
        id: 'market-research',
        name: 'Market Research',
        category: 'business',
        description: 'Comprehensive market research framework',
        nodes: marketResearchNodes,
        preview: 'marketResearch',
    },
    {
        id: 'purchase-requisition',
        name: 'Purchase Requisition',
        category: 'business',
        description: 'Requester to Purchases workflow with approval gates',
        nodes: purchaseRequisitionNodes,
        preview: 'gantt',
    },
    {
        id: 'swot-analysis',
        name: 'SWOT Analysis',
        category: 'business',
        description: 'Strengths, Weaknesses, Opportunities, Threats analysis',
        nodes: swotNodes,
        preview: 'swot',
    },
    {
        id: 'supplier-evaluation',
        name: 'Supplier Evaluation',
        category: 'business',
        description: 'Evaluate suppliers with requirements and monitoring',
        nodes: supplierEvaluationNodes,
        preview: 'supplierEvaluation',
    },
    {
        id: 'porters-five-forces',
        name: "Porter's Five Forces",
        category: 'business',
        description: 'Industry competitive analysis framework',
        nodes: portersFiveForces,
        preview: 'portersForces',
    },
];
