import { MindMapNode } from '@/types/mindmap';
import { Template } from '@/types/templates';

const employeeOnboardingNodes: MindMapNode[] = [
    { id: 'root', text: 'Onboarding', x: 0, y: -200, color: 'root', parentId: null },

    { id: 'hr', text: 'HR Prep', x: -300, y: -100, color: 'blue', parentId: 'root' },
    { id: 'it', text: 'IT Setup', x: -100, y: -100, color: 'purple', parentId: 'root' },
    { id: 'mgr', text: 'Manager Welcome', x: 100, y: -100, color: 'orange', parentId: 'root' },
    { id: 'day1', text: 'Day 1 Training', x: 300, y: -100, color: 'green', parentId: 'root' },

    { id: 'h1', text: 'Contracts', x: -300, y: 0, color: 'blue', parentId: 'hr' },
    { id: 'i1', text: 'Accounts', x: -100, y: 0, color: 'purple', parentId: 'it' },
    { id: 'i2', text: 'Hardware', x: -100, y: 110, color: 'purple', parentId: 'it' },
    { id: 'm1', text: 'Team Intro', x: 100, y: 0, color: 'orange', parentId: 'mgr' },
    { id: 'd1', text: 'Orientation', x: 300, y: 0, color: 'green', parentId: 'day1' },
];

const orgChartNodes: MindMapNode[] = [
    { id: 'root', text: 'CEO', x: 0, y: -250, color: 'root', parentId: null },

    { id: 'eng', text: 'VP Engineering', x: -300, y: -100, color: 'blue', parentId: 'root' },
    { id: 'sales', text: 'VP Sales', x: 0, y: -100, color: 'orange', parentId: 'root' },
    { id: 'ops', text: 'VP Operations', x: 300, y: -100, color: 'green', parentId: 'root' },

    { id: 'e1', text: 'Engineering Manager', x: -380, y: 50, color: 'blue', parentId: 'eng' },
    { id: 'e2', text: 'QA Lead', x: -220, y: 50, color: 'blue', parentId: 'eng' },

    { id: 's1', text: 'Sales Manager', x: -80, y: 50, color: 'orange', parentId: 'sales' },
    { id: 's2', text: 'Account Executive', x: 80, y: 50, color: 'orange', parentId: 'sales' },

    { id: 'o1', text: 'Operations Manager', x: 220, y: 50, color: 'green', parentId: 'ops' },
    { id: 'o2', text: 'Support Lead', x: 380, y: 50, color: 'green', parentId: 'ops' },
];

export const hrTemplates: Template[] = [
    {
        id: 'employee-onboarding',
        name: 'Employee Onboarding',
        category: 'hr',
        description: 'HR, IT, Manager, Day 1 Training swimlane workflow',
        nodes: employeeOnboardingNodes,
        tags: ['hr', 'onboarding', 'new hire', 'swimlane'],
        connectionStyle: 'orthogonal',
    },
    {
        id: 'org-chart',
        name: 'Org Chart',
        category: 'hr',
        description: 'Company reporting hierarchy from leadership to teams',
        nodes: orgChartNodes,
        tags: ['org chart', 'hierarchy', 'organization', 'hr', 'reporting structure'],
        connectionStyle: 'orthogonal',
    },
];
