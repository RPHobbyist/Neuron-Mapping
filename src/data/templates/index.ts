import { Template, TemplateCategory } from '@/types/templates';

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

export const templates: Template[] = [
    ...quickDiagramTemplates,
    ...businessTemplates,
    ...projectTemplates,
    ...hrTemplates,
    ...legalTemplates,
    ...planningTemplates,
    ...communicationTemplates,
];
