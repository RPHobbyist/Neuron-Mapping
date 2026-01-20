import { Template, TemplateCategory } from '@/types/templates';
import { ConnectionStyle } from '@/types/mindmap';

import { quickDiagramTemplates } from './quickDiagrams';
import { businessTemplates } from './business';
import { projectTemplates } from './projectManagement';
import { hrTemplates } from './hrOperations';
import { legalTemplates } from './legal';
import { planningTemplates } from './planning';
import { communicationTemplates } from './communication';

export const categories: TemplateCategory[] = [
    { id: 'quick-diagrams', name: 'Quick Diagrams' },
    { id: 'business', name: 'Business' },
    { id: 'project-management', name: 'Project Management' },
    { id: 'hr', name: 'HR & Operations' },
    { id: 'legal', name: 'Legal' },
    { id: 'planning', name: 'Planning & Strategy' },
    { id: 'communication', name: 'Communication' },
];

export interface TemplateConfig {
    connectionStyle?: ConnectionStyle;
}

export const templateConfigs: Record<string, TemplateConfig> = {
    'order-fulfillment': { connectionStyle: 'orthogonal' },
    'product-launch-checklist': { connectionStyle: 'curved' },
    'product-launch-radial': { connectionStyle: 'curved' },
    'market-research': { connectionStyle: 'curved' },
    'business-analyst': { connectionStyle: 'orthogonal' },
    'product-development': { connectionStyle: 'curved' },
    'legal-case': { connectionStyle: 'orthogonal' },
    'employee-onboarding': { connectionStyle: 'orthogonal' },
    'project-management': { connectionStyle: 'orthogonal' },
    'purchase-requisition': { connectionStyle: 'orthogonal' },
    'customer-journey': { connectionStyle: 'curved' },
    'venn-diagram': { connectionStyle: 'curved' },
    'swot-analysis': { connectionStyle: 'curved' },
    'cycle-diagram': { connectionStyle: 'curved' },
    'six-thinking-hats': { connectionStyle: 'curved' },
    'argument-map': { connectionStyle: 'orthogonal' },
    'eisenhower-box': { connectionStyle: 'curved' },
    'supplier-evaluation': { connectionStyle: 'curved' },
    'porters-five-forces': { connectionStyle: 'curved' },
    'cause-effect': { connectionStyle: 'orthogonal' },
};

export const templates: Template[] = [
    ...quickDiagramTemplates,
    ...businessTemplates,
    ...projectTemplates,
    ...hrTemplates,
    ...legalTemplates,
    ...planningTemplates,
    ...communicationTemplates,
];
