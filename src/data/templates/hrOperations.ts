import { MindMapNode } from '@/types/mindmap';
import { Template } from '@/types/templates';

// Employee Onboarding - Swimlane Layout
const employeeOnboardingNodes: MindMapNode[] = [
    { id: 'root', text: 'Onboarding', x: 0, y: -200, color: 'root', parentId: null },

    // Row 1 - All phases connect to root for clean horizontal layout
    { id: 'hr', text: 'HR Prep', x: -300, y: -100, color: 'blue', parentId: 'root' },
    { id: 'it', text: 'IT Setup', x: -100, y: -100, color: 'purple', parentId: 'root' },
    { id: 'mgr', text: 'Manager Welcome', x: 100, y: -100, color: 'orange', parentId: 'root' },
    { id: 'day1', text: 'Day 1 Training', x: 300, y: -100, color: 'green', parentId: 'root' },

    // Row 2 - Details connect vertically to their phase
    { id: 'h1', text: 'Contracts', x: -300, y: 0, color: 'blue', parentId: 'hr' },
    { id: 'i1', text: 'Accounts', x: -100, y: 0, color: 'purple', parentId: 'it' },
    { id: 'i2', text: 'Hardware', x: -100, y: 110, color: 'purple', parentId: 'it' },
    { id: 'm1', text: 'Team Intro', x: 100, y: 0, color: 'orange', parentId: 'mgr' },
    { id: 'd1', text: 'Orientation', x: 300, y: 0, color: 'green', parentId: 'day1' },
];

export const hrTemplates: Template[] = [
    {
        id: 'employee-onboarding',
        name: 'Employee Onboarding',
        category: 'hr',
        description: 'HR, IT, Manager, Acquisitions swimlane workflow',
        nodes: employeeOnboardingNodes,
        preview: 'organigram',
    },
];
